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
  sendChatMessage,
  setPlayerConnected,
  startGame,
  submitHints,
  updateGuess,
  updateSettings,
  updateTiebreaker
} from "./game.js";

loadLocalEnv();

const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const rooms = new Map();
const sessions = new Map();
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
  if (!query || query === "CRIPTOGRAFADA") return res.status(400).json({ error: "query required" });
  const cacheKey = query.toLocaleLowerCase();
  if (imageCache.has(cacheKey)) return res.json(imageCache.get(cacheKey));
  const google = await googleImage(query);
  if (google) return cacheImage(cacheKey, res, { url: google, source: "google" });
  const pokemon = await pokemonImage(query);
  if (pokemon) return cacheImage(cacheKey, res, { url: pokemon, source: "pokeapi" });
  const wiki = await wikiImage(query);
  if (wiki) return cacheImage(cacheKey, res, { url: wiki, source: "wikimedia" });
  cacheImage(cacheKey, res, { url: null, source: "fallback" });
});
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

io.on("connection", (socket) => {
  socket.emit("constants", CONSTANTS);

  socket.on("room:create", ({ name }, reply) => safe(reply, () => {
    const room = uniqueRoom(socket.id, name);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    emitRoom(room);
    return { room: publicRoom(room, socket.id), playerId: socket.id };
  }));

  socket.on("room:join", ({ code, name }, reply) => safe(reply, () => {
    const room = getRoom(code);
    const joinedId = addPlayer(room, socket.id, name);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    emitRoom(room);
    return { room: publicRoom(room, joinedId), playerId: joinedId };
  }));

  socket.on("room:leave", (_payload, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    const code = room.code;
    if (room.phase === "lobby") removePlayer(room, socket.id);
    else setPlayerConnected(room, socket.id, false);
    sessions.delete(socket.id);
    socket.leave(code);
    if (Object.keys(room.players).length === 0) rooms.delete(code);
    else emitRoom(room);
    return { ok: true };
  }));

  socket.on("room:settings", (settings, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    updateSettings(room, socket.id, settings);
    emitRoom(room);
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

  socket.on("host:kick", ({ playerId }, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    kickPlayer(room, socket.id, playerId);
    io.to(playerId).emit("room:kicked");
    emitRoom(room);
    return { ok: true };
  }));

  socket.on("host:returnLobby", (_payload, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    hostReturnLobby(room, socket.id);
    emitRoom(room);
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

  socket.on("game:start", (_payload, reply) => safe(reply, () => {
    const room = currentRoom(socket);
    startGame(room, socket.id);
    emitRoom(room);
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
    setPlayerConnected(room, socket.id, false);
    emitRoom(room);
    setTimeout(() => {
      const latest = rooms.get(code);
      if (!latest) return;
      if (latest && latest.phase !== "lobby") return;
      if (!latest?.players[socket.id]?.connected) {
        removePlayer(latest, socket.id);
        if (Object.keys(latest.players).length === 0) rooms.delete(code);
        else emitRoom(latest);
      }
    }, 30000);
  });
});

function uniqueRoom(playerId, name) {
  let room = makeRoom(playerId, name);
  while (rooms.has(room.code)) room = makeRoom(playerId, name);
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
  Object.keys(room.players).forEach((playerId) => {
    io.to(playerId).emit("room:update", publicRoom(room, playerId));
  });
}

function safe(reply, fn) {
  try {
    reply?.({ ok: true, ...fn() });
  } catch (error) {
    reply?.({ ok: false, error: error.message || "Erro inesperado." });
  }
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
  const withoutCategory = trimmed.replace(/\s+(geral|anime|pokemon|filme|filmes|jogo|jogos)$/i, "").trim();
  if (/\s+geral$/i.test(trimmed)) return [...new Set([withoutCategory, trimmed].filter(Boolean))];
  return [...new Set([trimmed, withoutCategory].filter(Boolean))];
}

httpServer.listen(PORT, () => {
  console.log(`Code Hack server listening on http://localhost:${PORT}`);
});
