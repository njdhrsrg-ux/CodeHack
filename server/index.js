import express from "express";
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import {
  addPlayer,
  autoTeams,
  chooseTeam,
  CONSTANTS,
  confirmDecision,
  confirmFinal,
  confirmResult,
  confirmTiebreaker,
  hostReturnLobby,
  kickPlayer,
  makeRoom,
  movePlayer,
  publicRoom,
  removePlayer,
  roomJoinPreview,
  sendChatMessage,
  startGame,
  submitHints,
  updateGuess,
  updatePlayerAvatar,
  updateSettings,
  updateTiebreaker
} from "./game.js";
import {
  authUserByToken,
  changeUserPassword,
  createActiveMatch,
  discardActiveMatch,
  getProfile,
  loginUser,
  logoutUser,
  meFromToken,
  recordMatch,
  registerUser,
  updateUserProfile
} from "./auth.js";

loadLocalEnv();

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  maxHttpBufferSize: 5e6
});

const rooms = new Map();
const sessions = new Map();
const pendingDisconnects = new Map();
const imageCache = new Map();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true, rooms: rooms.size }));
app.get("/api/constants", (_req, res) => res.json(CONSTANTS));
app.get("/api/image", async (req, res) => {
  const query = String(req.query.q || "").trim();
  const category = String(req.query.category || "").trim();
  if (!query || query === "CRIPTOGRAFADA") return res.status(400).json({ error: "query required" });
  const cacheKey = `${category}:${query}`.toLocaleLowerCase();
  if (imageCache.has(cacheKey)) return res.json(imageCache.get(cacheKey));
  const pokemon = await pokemonImage(query);
  if (pokemon) return cacheImage(cacheKey, res, { url: pokemon, source: "pokeapi" });
  if (category === "Geral") {
    const pexels = await pexelsImage(query);
    if (pexels) return cacheImage(cacheKey, res, { url: pexels.url, source: "pexels", photographer: pexels.photographer, page: pexels.page });
  }
  if (category === "Filmes") {
    const poster = await omdbImage(query);
    if (poster) return cacheImage(cacheKey, res, { url: poster, source: "omdb" });
  }
  if (!/\bpokemon\b/i.test(query)) {
    const google = await googleImage(query);
    if (google) return cacheImage(cacheKey, res, { url: google, source: "google" });
  }
  const wiki = await wikiImage(query);
  if (wiki) return cacheImage(cacheKey, res, { url: wiki, source: "wikimedia" });
  cacheImage(cacheKey, res, { url: null, source: "fallback" });
});
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

io.on("connection", (socket) => {
  socket.emit("constants", CONSTANTS);
  socket.emit("rooms:update", publicRoomList());

  socket.on("rooms:list", (_payload, reply) => safe(reply, () => ({ rooms: publicRoomList() })));

  socket.on("auth:me", ({ token }, reply) => safe(reply, async () => ({ user: await meFromToken(token) })));
  socket.on("auth:register", (payload, reply) => safe(reply, () => registerUser(payload)));
  socket.on("auth:login", (payload, reply) => safe(reply, () => loginUser(payload)));
  socket.on("auth:logout", ({ token }, reply) => safe(reply, async () => {
    await logoutUser(token);
    return { ok: true };
  }));
  socket.on("auth:profile", ({ userId, username }, reply) => safe(reply, async () => ({ profile: await getProfile(userId || username) })));
  socket.on("auth:updateProfile", ({ token, displayName, avatar }, reply) => safe(reply, () => updateUserProfile(token, { displayName, avatar })));
  socket.on("auth:changePassword", ({ token, currentPassword, newPassword }, reply) => safe(reply, async () => {
    await changeUserPassword(token, { currentPassword, newPassword });
    return { ok: true };
  }));

  socket.on("room:create", ({ name, avatar, clientId, roomName, password, publicRoom: isPublicRoom, authToken }, reply) => safe(reply, async () => {
    clearPendingDisconnect(clientId);
    const user = await authUserByToken(authToken);
    const room = uniqueRoom(socket.id, user?.displayName || name, user?.avatar || avatar, clientId, { roomName, password: isPublicRoom === false ? "" : password, publicRoom: isPublicRoom });
    attachUser(room.players[socket.id], user);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    emitRoom(room);
    emitRoomList();
    return { room: publicRoom(room, socket.id), playerId: socket.id };
  }));

  socket.on("room:join", ({ code, name, avatar, clientId, role, password, authToken }, reply) => safe(reply, async () => {
    const room = getRoom(code);
    const user = await authUserByToken(authToken);
    validateRoomPassword(room, password);
    const allowActiveTakeover = clearPendingDisconnect(clientId);
    const join = addPlayer(room, socket.id, user?.displayName || name, user?.avatar || avatar, clientId, role, { allowActiveTakeover, userId: user?.id });
    if (join.needsRoleChoice) return { needsRoleChoice: true, preview: roomJoinPreview(room), name: join.playerName, code: room.code };
    attachUser(room.players[join.playerId], user);
    detachPreviousSocket(join.previousId, room.code);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    emitRoom(room);
    emitRoomList();
    if (join.eventType !== "resume") emitRoomEvent(room, socket.id, "join", room.players[join.playerId]);
    return { room: publicRoom(room, join.playerId), playerId: join.playerId };
  }));

  socket.on("room:resume", ({ code, name, avatar, clientId, role, authToken }, reply) => safe(reply, async () => {
    const room = getRoom(code);
    const user = await authUserByToken(authToken);
    const allowActiveTakeover = clearPendingDisconnect(clientId);
    const join = addPlayer(room, socket.id, user?.displayName || name, user?.avatar || avatar, clientId, role, { allowActiveTakeover, userId: user?.id });
    if (join.needsRoleChoice) return { needsRoleChoice: true, preview: roomJoinPreview(room), name: join.playerName, code: room.code };
    attachUser(room.players[join.playerId], user);
    detachPreviousSocket(join.previousId, room.code);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    emitRoom(room);
    emitRoomList();
    if (join.eventType !== "resume") emitRoomEvent(room, socket.id, "join", room.players[join.playerId]);
    return { room: publicRoom(room, join.playerId), playerId: join.playerId };
  }));

  socket.on("room:leave", (_payload, reply) => safe(reply, async () => {
    const room = currentRoom(socket);
    const code = room.code;
    const removed = removePlayer(room, socket.id);
    sessions.delete(socket.id);
    socket.leave(code);
    if (Object.keys(room.players).length === 0) {
      await discardActiveMatch(room);
      rooms.delete(code);
    }
    else {
      emitRoom(room);
      if (removed) emitRoomEvent(room, socket.id, "leave", removed);
    }
    emitRoomList();
    return { ok: true };
  }));

  socket.on("room:settings", (settings, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    updateSettings(room, socket.id, settings);
    emitRoom(room);
    emitRoomList();
    return { ok: true };
  }));

  socket.on("host:move", ({ playerId, team }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    movePlayer(room, socket.id, playerId, team);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("player:team", ({ team }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    chooseTeam(room, socket.id, team);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("player:avatar", ({ avatar, authToken }, reply) => safe(reply, async () => {
    const room = currentRoom(socket);
    const user = await authUserByToken(authToken);
    const updatedAvatar = user ? (await updateUserProfile(authToken, { avatar })).user.avatar : updatePlayerAvatar(room, socket.id, avatar);
    if (room.players[socket.id]) room.players[socket.id].avatar = updatedAvatar;
    io.to(room.code).emit("player:avatarUpdate", { playerId: socket.id, avatar: updatedAvatar });
    emitRoom(room);
    return { room: publicRoom(room, socket.id) };
  }));

  socket.on("host:kick", ({ playerId }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    kickPlayer(room, socket.id, playerId);
    io.to(playerId).emit("room:kicked");
    emitRoom(room);
    emitRoomList();
    return { ok: true };
  }));

  socket.on("host:returnLobby", (_payload, reply) => safe(reply, async () => {
    const room = currentRoom(socket);
    await discardActiveMatch(room);
    hostReturnLobby(room, socket.id);
    emitRoom(room);
    emitRoomList();
    return { ok: true };
  }));

  socket.on("host:autoTeams", (_payload, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    autoTeams(room, socket.id);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("chat:send", ({ scope, text }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    sendChatMessage(room, socket.id, scope, text);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:start", (_payload, reply) => safe(reply, async () => {
    const room = currentRoom(socket);
    startGame(room, socket.id);
    createActiveMatch(room).catch((error) => console.error("createMatch failed", error));
    emitRoom(room);
    emitRoomList();
    return { ok: true };
  }));

  socket.on("game:hints", ({ hints }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    submitHints(room, socket.id, hints);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:updateGuess", ({ kind, guess, targetTeam }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    updateGuess(room, socket.id, kind, guess, targetTeam);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmDecision", ({ kind, targetTeam }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    confirmDecision(room, socket.id, kind, targetTeam);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmResult", (_payload, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    confirmResult(room, socket.id);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:updateTiebreaker", ({ words }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    updateTiebreaker(room, socket.id, words);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmTiebreaker", (_payload, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    confirmTiebreaker(room, socket.id);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmFinal", (_payload, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    confirmFinal(room, socket.id);
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("disconnect", () => {
    const code = sessions.get(socket.id);
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code);
    const player = room.players[socket.id];
    const clientId = player?.clientId || socket.id;
    sessions.delete(socket.id);
    const timer = setTimeout(() => {
      pendingDisconnects.delete(clientId);
      if (!rooms.has(code)) return;
      const liveRoom = rooms.get(code);
      const removed = removePlayer(liveRoom, socket.id);
      if (!removed) return;
      if (Object.keys(liveRoom.players).length === 0) {
        discardActiveMatch(liveRoom).catch((error) => console.error("discardMatch failed", error));
        rooms.delete(code);
      }
      else {
        emitRoom(liveRoom);
        emitRoomEvent(liveRoom, socket.id, "leave", removed);
      }
      emitRoomList();
    }, 1500);
    pendingDisconnects.set(clientId, timer);
  });
});

function uniqueRoom(playerId, name, avatar, clientId, roomOptions) {
  let room = makeRoom(playerId, name, avatar, clientId, roomOptions);
  while (rooms.has(room.code)) room = makeRoom(playerId, name, avatar, clientId, roomOptions);
  rooms.set(room.code, room);
  return room;
}

function currentRoom(socket) {
  const code = sessions.get(socket.id);
  return getRoom(code);
}

function getRoom(code) {
  const room = rooms.get(String(code || "").trim().toUpperCase());
  if (!room) throw new Error("Sala nao encontrada.");
  return room;
}

function emitRoom(room) {
  recordMatch(room).catch((error) => console.error("recordMatch failed", error));
  Object.keys(room.players).forEach((playerId) => {
    io.to(playerId).emit("room:update", publicRoom(room, playerId));
  });
}

function attachUser(player, user) {
  if (!player || !user) return;
  player.userId = user.id;
  player.username = user.username;
  player.name = user.displayName;
  player.avatar = user.avatar || player.avatar || "";
}

function emitRoomList() {
  io.emit("rooms:update", publicRoomList());
}

function publicRoomList() {
  return Array.from(rooms.values())
    .filter((room) => room.publicRoom !== false)
    .map((room) => {
      const players = Object.values(room.players);
      const host = room.players[room.hostId] || players.find((player) => player.isHost);
      return {
        code: room.code,
        name: room.name || room.code,
        hostName: host?.name || "Host",
        playerCount: players.length,
        phase: room.phase,
        inGame: room.phase !== "lobby",
        hasPassword: Boolean(room.password),
        category: room.settings?.category || "Geral",
        updatedAt: room.updatedAt || room.createdAt || 0
      };
    });
}

function validateRoomPassword(room, password) {
  if (!room.password) return;
  if (String(password || "") !== room.password) throw new Error("Senha incorreta.");
}

function emitRoomEvent(room, exceptPlayerId, type, player) {
  io.to(room.code).except(exceptPlayerId).emit("room:event", {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    playerName: player?.name || "Jogador",
    sessionTag: player?.sessionTag || "",
    avatar: player?.avatar || "",
    team: player?.team || null,
    at: Date.now()
  });
}

function clearPendingDisconnect(clientId) {
  const key = String(clientId || "");
  const timer = pendingDisconnects.get(key);
  if (!timer) return false;
  clearTimeout(timer);
  pendingDisconnects.delete(key);
  return true;
}

function detachPreviousSocket(previousId, code) {
  if (!previousId) return;
  sessions.delete(previousId);
  io.sockets.sockets.get(previousId)?.leave(code);
}

function safe(reply, fn) {
  Promise.resolve()
    .then(fn)
    .then((result) => reply?.({ ok: true, ...result }))
    .catch((error) => reply?.({ ok: false, error: error.message || "Erro inesperado." }));
}

function cacheImage(key, res, payload) {
  imageCache.set(key, payload);
  return res.json(payload);
}

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator < 1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

async function googleImage(query) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return null;
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", "1");
  url.searchParams.set("safe", "active");
  url.searchParams.set("hl", "en");
  url.searchParams.set("lr", "lang_en");
  url.searchParams.set("q", query);
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.items?.[0]?.link || null;
  } catch {
    return null;
  }
}

async function pexelsImage(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "square");
  url.searchParams.set("locale", "en-US");
  try {
    const response = await fetch(url, { headers: { Authorization: key } });
    if (!response.ok) return null;
    const data = await response.json();
    const photo = data.photos?.[0];
    if (!photo?.src) return null;
    return {
      url: photo.src.medium || photo.src.large || photo.src.original,
      photographer: photo.photographer || "",
      page: photo.url || ""
    };
  } catch {
    return null;
  }
}

async function omdbImage(query) {
  const key = process.env.OMDB_API_KEY || "34925b28";
  const title = String(query || "")
    .trim()
    .replace(/\s+movie$/i, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
  if (!title) return null;
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("t", title);
  url.searchParams.set("apikey", key);
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.Poster && data.Poster !== "N/A" ? data.Poster : null;
  } catch {
    return null;
  }
}

async function pokemonImage(query) {
  if (!/\bpokemon\b/i.test(query)) return null;
  const name = query
    .replace(/\bpokemon\b/ig, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!name) return null;
  const aliases = new Map([
    ["mr-mime", "mr-mime"],
    ["ho-oh", "ho-oh"],
    ["nidoran", "nidoran-f"]
  ]);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${aliases.get(name) || name}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || null;
  } catch {
    return null;
  }
}

async function wikiImage(query) {
  for (const term of imageSearchTerms(query)) {
    const commons = new URL("https://commons.wikimedia.org/w/api.php");
    commons.searchParams.set("action", "query");
    commons.searchParams.set("generator", "search");
    commons.searchParams.set("gsrsearch", term);
    commons.searchParams.set("gsrnamespace", "6");
    commons.searchParams.set("gsrlimit", "1");
    commons.searchParams.set("prop", "imageinfo");
    commons.searchParams.set("iiprop", "url");
    commons.searchParams.set("format", "json");
    commons.searchParams.set("origin", "*");
    try {
      const response = await fetch(commons);
      if (response.ok) {
        const data = await response.json();
        const page = Object.values(data.query?.pages || {})[0];
        if (page?.imageinfo?.[0]?.url) return page.imageinfo[0].url;
      }
    } catch {
      // Keep the image lookup best-effort; gameplay should not depend on it.
    }
    const summary = new URL("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(term));
    try {
      const response = await fetch(summary);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.thumbnail?.source) return data.thumbnail.source;
    } catch {
      // Try the next term.
    }
  }
  return null;
}

function imageSearchTerms(query) {
  const trimmed = query.trim();
  const withoutCategory = trimmed.replace(/\s+(geral|anime|pokemon|filme|filmes|jogo|jogos|geek|famosos|movie|famous person|fictional character|video game character|anime character)$/i, "").trim();
  if (/\s+geral$/i.test(trimmed)) return [...new Set([withoutCategory, trimmed].filter(Boolean))];
  return [...new Set([trimmed, withoutCategory].filter(Boolean))];
}

httpServer.listen(PORT, () => {
  console.log(`Code Hack server listening on http://localhost:${PORT}`);
});
