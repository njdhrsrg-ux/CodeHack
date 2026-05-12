import fs from "node:fs";
import path from "node:path";

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

// Only load local .env in development, not in production (Vercel)
if (process.env.NODE_ENV !== "production") {
  loadLocalEnv();
}

import express from "express";
import { createServer } from "node:http";
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
  normalizeRoom,
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
  deleteRoom,
  discardActiveMatch,
  getProfile,
  getUserPreferences,
  listRooms,
  loadRoom,
  loginUser,
  logoutUser,
  meFromToken,
  recordMatch,
  registerUser,
  saveRoom,
  updateUserPreferences,
  updateUserProfile
} from "./auth.js";

console.log("Starting server with environment:", {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
  FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
  FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  VITE_SOCKET_URL: !!process.env.VITE_SOCKET_URL
});

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
const imageResolveJobs = new Set();
const TEAMS = ["red", "blue"];
const ROOM_INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
const ROOM_INACTIVITY_WARNING_MS = 5 * 60 * 1000;
const ROOM_CLEANUP_INTERVAL_MS = 30 * 1000;
const SERVER_WORD_ORIGINS = {
  Anime: {
    Happy: "Fairy Tail",
    "Natsu Dragneel": "Fairy Tail",
    "Lucy Heartfilia": "Fairy Tail",
    "Erza Scarlet": "Fairy Tail",
    "Gray Fullbuster": "Fairy Tail",
    "Jaden Yuki": "Yu-Gi-Oh!",
    "Yusei Fudo": "Yu-Gi-Oh!",
    "Elizabeth Liones": "The Seven Deadly Sins",
    King: "The Seven Deadly Sins",
    Hyakkimaru: "Dororo",
    Dororo: "Dororo",
    "Taiju Oki": "Dr. Stone",
    "Yuzuriha Ogawa": "Dr. Stone",
    "Kei Tsukishima": "Haikyuu!!",
    "Tetsuro Kuroo": "Haikyuu!!",
    "Kenma Kozume": "Haikyuu!!",
    "Kuroko Tetsuya": "Kuroko's Basketball",
    "Taiga Kagami": "Kuroko's Basketball",
    "Seijuro Akashi": "Kuroko's Basketball",
    "Rintaro Okabe": "Steins;Gate",
    "Kurisu Makise": "Steins;Gate",
    "Mayuri Shiina": "Steins;Gate",
    Holo: "Spice and Wolf",
    "Kraft Lawrence": "Spice and Wolf",
    "Kousei Arima": "Your Lie in April",
    "Kaori Miyazono": "Your Lie in April",
    "Tohru Honda": "Fruits Basket",
    "Kyo Soma": "Fruits Basket",
    "Yuki Soma": "Fruits Basket",
    "Nana Osaki": "Nana",
    "Nana Komatsu": "Nana",
    "Seras Victoria": "Hellsing",
    "Integra Hellsing": "Hellsing",
    Batou: "Ghost in the Shell",
    Nausicaa: "Nausicaa",
    San: "Princess Mononoke",
    "Chihiro Ogino": "Spirited Away",
    Haku: "Spirited Away",
    Kiki: "Kiki's Delivery Service",
    "Sophie Hatter": "Howl's Moving Castle",
    "Howl Jenkins": "Howl's Moving Castle",
    Ponyo: "Ponyo",
    "Ran Mouri": "Detective Conan",
    "Kogoro Mouri": "Detective Conan",
    "Kaito Kid": "Detective Conan",
    "Toru Amuro": "Detective Conan",
    "Shinji Matou": "Fate/stay night",
    Archer: "Fate/stay night",
    Lancer: "Fate/stay night",
    "Mikoto Misaka": "A Certain Scientific Railgun",
    "Toma Kamijo": "A Certain Magical Index",
    Kenshiro: "Fist of the North Star",
    Raoh: "Fist of the North Star",
    "Joe Yabuki": "Ashita no Joe",
    "Daisuke Jigen": "Lupin III",
    "Fujiko Mine": "Lupin III",
    "Goemon Ishikawa": "Lupin III",
    "Inspector Zenigata": "Lupin III",
    "Kaoru Kamiya": "Rurouni Kenshin",
    "Sanosuke Sagara": "Rurouni Kenshin",
    "Shishio Makoto": "Rurouni Kenshin",
    "Yusuke Urameshi": "Yu Yu Hakusho",
    "Kazuma Kuwabara": "Yu Yu Hakusho",
    Kurama: "Yu Yu Hakusho",
    Hiei: "Yu Yu Hakusho",
    Toguro: "Yu Yu Hakusho",
    Inuyasha: "Inuyasha",
    "Kagome Higurashi": "Inuyasha",
    Sesshomaru: "Inuyasha",
    Kikyo: "Inuyasha",
    Sango: "Inuyasha",
    Miroku: "Inuyasha",
    "Shinpachi Shimura": "Gintama",
    "Takasugi Shinsuke": "Gintama",
    Fuu: "Samurai Champloo",
    "Spike Spiegel": "Cowboy Bebop",
    "Jet Black": "Cowboy Bebop",
    "Faye Valentine": "Cowboy Bebop",
    Ed: "Cowboy Bebop",
    Vicious: "Cowboy Bebop",
    "Renton Thurston": "Eureka Seven",
    Eureka: "Eureka Seven",
    "Yoko Littner": "Gurren Lagann",
    "Nia Teppelin": "Gurren Lagann",
    "Mako Mankanshoku": "Kill la Kill",
    "Akko Kagari": "Little Witch Academia",
    "Lotte Jansson": "Little Witch Academia",
    "Sucy Manbavaran": "Little Witch Academia",
    Mob: "Mob Psycho 100",
    "Reigen Arataka": "Mob Psycho 100",
    "Ritsu Kageyama": "Mob Psycho 100",
    Dimple: "Mob Psycho 100",
    "Chika Fujiwara": "Kaguya-sama",
    "Ai Hayasaka": "Kaguya-sama",
    "Wakana Gojo": "My Dress-Up Darling",
    "Hitori Gotoh": "Bocchi the Rock!",
    "Nijika Ijichi": "Bocchi the Rock!",
    "Ryo Yamada": "Bocchi the Rock!",
    "Ikuyo Kita": "Bocchi the Rock!",
    "Eikichi Onizuka": "Great Teacher Onizuka",
    Onizuka: "Great Teacher Onizuka",
    "Saiki Kusuo": "The Disastrous Life of Saiki K.",
    "Riki Nendo": "The Disastrous Life of Saiki K.",
    "Kaidou Shun": "The Disastrous Life of Saiki K.",
    Korosensei: "Assassination Classroom",
    "Nagisa Shiota": "Assassination Classroom",
    "Karma Akabane": "Assassination Classroom",
    "Kiyotaka Ayanokoji": "Classroom of the Elite",
    "Suzune Horikita": "Classroom of the Elite",
    "Hachiman Hikigaya": "My Teen Romantic Comedy SNAFU",
    "Yukino Yukinoshita": "My Teen Romantic Comedy SNAFU",
    "Mai Sakurajima": "Rascal Does Not Dream of Bunny Girl Senpai",
    "Sakuta Azusagawa": "Rascal Does Not Dream of Bunny Girl Senpai",
    "Tomoya Okazaki": "Clannad",
    "Nagisa Furukawa": "Clannad",
    "Rikka Takanashi": "Love, Chunibyo & Other Delusions",
    "Yuuta Togashi": "Love, Chunibyo & Other Delusions"
  },
  Jogos: {
    "Melina": "Elden Ring",
    "Tarnished": "Elden Ring",
    "Artorias": "Dark Souls",
    "Ornstein": "Dark Souls",
    "Siegward": "Dark Souls",
    "Lady Maria": "Bloodborne",
    "Gehrman": "Bloodborne",
    "Hunter": "Bloodborne",
    "Isshin Ashina": "Sekiro",
    "Kuro": "Sekiro",
    "Genichiro Ashina": "Sekiro",
    "The Penitent One": "Blasphemous",
    "Isabelle": "Animal Crossing",
    "Tommy Angelo": "Mafia",
    "Vito Scaletta": "Mafia",
    "Clementine": "The Walking Dead",
    "Lee Everett": "The Walking Dead",
    "Bigby Wolf": "The Wolf Among Us",
    "Faith": "Mirror's Edge",
    "Faith Connors": "Mirror's Edge",
    "Commander Keen": "Commander Keen",
    "Duke Nukem": "Duke Nukem",
    "Cal Kestis": "Star Wars Jedi",
    "Merrin": "Star Wars Jedi",
    "BD-1": "Star Wars Jedi",
    "Kyle Katarn": "Star Wars Jedi Knight",
    "Revan": "Star Wars Knights of the Old Republic",
    "Bastila Shan": "Star Wars Knights of the Old Republic",
    "HK-47": "Star Wars Knights of the Old Republic",
    "Guybrush Threepwood": "Monkey Island",
    "LeChuck": "Monkey Island",
    "Elaine Marley": "Monkey Island",
    "Manny Calavera": "Grim Fandango",
    "Razputin Aquato": "Psychonauts",
    "Conker": "Conker's Bad Fur Day",
    "Joanna Dark": "Perfect Dark",
    "Eddie Riggs": "Brutal Legend",
    "Juliet Starling": "Lollipop Chainsaw",
    "Travis Touchdown": "No More Heroes",
    "Henry Stickmin": "Henry Stickmin",
    "Hat Kid": "A Hat in Time",
    "Madeline": "Celeste",
    "Theo": "Celeste",
    "Peppino Spaghetti": "Pizza Tower",
    "Commander Video": "Bit.Trip",
    "Nicole Brennan": "Dead Space",
    "Ellis": "Left 4 Dead",
    "Coach": "Left 4 Dead",
    "Nick Left 4 Dead": "Left 4 Dead",
    "Zoey": "Left 4 Dead",
    "Francis": "Left 4 Dead",
    "Bill Overbeck": "Left 4 Dead",
    "Heather Mason": "Silent Hill",
    "James Sunderland": "Silent Hill",
    "Alessa Gillespie": "Silent Hill",
    "Aya Brea": "Parasite Eve",
    "Alex Mercer": "Prototype",
    "Cole Phelps": "L.A. Noire",
    "Emily Kaldwin": "Dishonored",
    "Daud": "Dishonored",
    "Garrett": "Thief",
    "Faith Seed": "Far Cry 5",
    "Joseph Seed": "Far Cry 5",
    "Vaas Montenegro": "Far Cry 3",
    "Pagan Min": "Far Cry 4",
    "Handsome Jack": "Borderlands",
    "Tiny Tina": "Borderlands",
    "Claptrap": "Borderlands",
    "Moxxi": "Borderlands",
    "Lilith Borderlands": "Borderlands",
    "Rhys Strongfork": "Borderlands"
  },
  Geek: {
    Batman: "DC Comics",
    Superman: "DC Comics",
    "Wonder Woman": "DC Comics",
    Flash: "DC Comics",
    Aquaman: "DC Comics",
    Cyborg: "DC Comics",
    "Green Lantern": "DC Comics",
    Joker: "DC Comics",
    "Harley Quinn": "DC Comics",
    Catwoman: "DC Comics",
    Robin: "DC Comics",
    Batgirl: "DC Comics",
    Nightwing: "DC Comics",
    "Red Hood": "DC Comics",
    Deathstroke: "DC Comics",
    Riddler: "DC Comics",
    "Spider-Man": "Marvel Comics",
    "Iron Man": "Marvel Comics",
    "Captain America": "Marvel Comics",
    Thor: "Marvel Comics",
    Hulk: "Marvel Comics",
    "Black Widow": "Marvel Comics",
    "Doctor Strange": "Marvel Comics",
    "Black Panther": "Marvel Comics",
    Wolverine: "Marvel Comics",
    Deadpool: "Marvel Comics",
    Thanos: "Marvel Comics",
    Loki: "Marvel Comics",
    "Wanda Maximoff": "Marvel Comics",
    "Moon Knight": "Marvel Comics",
    Daredevil: "Marvel Comics",
    Punisher: "Marvel Comics",
    Venom: "Marvel Comics",
    Carnage: "Marvel Comics",
    "Miles Morales": "Marvel Comics",
    Homelander: "The Boys",
    "Billy Butcher": "The Boys",
    Eleven: "Stranger Things",
    "Mike Wheeler": "Stranger Things",
    "Dustin Henderson": "Stranger Things",
    "Wednesday Addams": "The Addams Family",
    "Darth Vader": "Star Wars",
    "Luke Skywalker": "Star Wars",
    "Leia Organa": "Star Wars",
    "Han Solo": "Star Wars",
    Chewbacca: "Star Wars",
    Yoda: "Star Wars",
    "Obi-Wan Kenobi": "Star Wars",
    "Ahsoka Tano": "Star Wars",
    Grogu: "Star Wars",
    "The Mandalorian": "Star Wars",
    "Din Djarin": "Star Wars",
    "Boba Fett": "Star Wars",
    "Anakin Skywalker": "Star Wars",
    "R2-D2": "Star Wars",
    Spock: "Star Trek",
    "Captain Kirk": "Star Trek",
    "Jean-Luc Picard": "Star Trek",
    Data: "Star Trek",
    Worf: "Star Trek",
    "Seven of Nine": "Star Trek",
    Frodo: "The Lord of the Rings",
    "Samwise Gamgee": "The Lord of the Rings",
    Gandalf: "The Lord of the Rings",
    Aragorn: "The Lord of the Rings",
    Legolas: "The Lord of the Rings",
    Gollum: "The Lord of the Rings",
    "Harry Potter": "Harry Potter",
    "Hermione Granger": "Harry Potter",
    "Ron Weasley": "Harry Potter",
    Dumbledore: "Harry Potter",
    Voldemort: "Harry Potter",
    "Severus Snape": "Harry Potter",
    "Rick Sanchez": "Rick and Morty",
    "Morty Smith": "Rick and Morty",
    "Homer Simpson": "The Simpsons",
    "Bart Simpson": "The Simpsons",
    "Lisa Simpson": "The Simpsons",
    "Marge Simpson": "The Simpsons",
    "SpongeBob SquarePants": "SpongeBob SquarePants",
    Finn: "Adventure Time",
    Jake: "Adventure Time",
    "Princess Bubblegum": "Adventure Time",
    Marceline: "Adventure Time",
    "Steven Universe": "Steven Universe",
    Garnet: "Steven Universe",
    Ametista: "Steven Universe",
    Pearl: "Steven Universe",
    Dexter: "Dexter's Laboratory",
    "Johnny Bravo": "Johnny Bravo",
    "Ben 10": "Ben 10",
    "Beast Boy": "Teen Titans",
    Raven: "Teen Titans",
    Starfire: "Teen Titans",
    "Kim Possible": "Kim Possible",
    Shego: "Kim Possible",
    Aang: "Avatar The Last Airbender",
    Katara: "Avatar The Last Airbender",
    Zuko: "Avatar The Last Airbender",
    Korra: "The Legend of Korra",
    Invincible: "Invincible",
    "Omni-Man": "Invincible",
    "Atom Eve": "Invincible",
    Bender: "Futurama",
    Fry: "Futurama",
    Leela: "Futurama",
    "Peter Griffin": "Family Guy",
    "Stewie Griffin": "Family Guy",
    "Rick Grimes": "The Walking Dead",
    "Daryl Dixon": "The Walking Dead",
    "Walter White": "Breaking Bad",
    "Jesse Pinkman": "Breaking Bad",
    "Saul Goodman": "Better Call Saul",
    "Daenerys Targaryen": "Game of Thrones",
    "Jon Snow": "Game of Thrones",
    "Tyrion Lannister": "Game of Thrones",
    "Arya Stark": "Game of Thrones",
    "Paul Atreides": "Dune",
    Chani: "Dune",
    "Buffy Summers": "Buffy the Vampire Slayer",
    "Sarah Connor": "Terminator",
    "T-800": "Terminator",
    "Ellen Ripley": "Alien",
    Neo: "The Matrix",
    Trinity: "The Matrix",
    Morpheus: "The Matrix",
    "Agent Smith": "The Matrix"
  }
};

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
  return res.json(await findImagePayload(query, category));
});
app.get("/api/image-proxy", async (req, res) => {
  const rawUrl = String(req.query.u || "");
  let target;
  try {
    target = new URL(rawUrl);
  } catch {
    return res.sendStatus(400);
  }
  if (!["http:", "https:"].includes(target.protocol)) return res.sendStatus(400);
  try {
    const response = await fetchWithTimeout(target, {
      headers: {
        "User-Agent": "CodeHackImageProxy/1.0",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    }, 15000);
    if (!response.ok) return res.sendStatus(502);
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().startsWith("image/")) return res.sendStatus(415);
    const bytes = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.end(bytes);
  } catch {
    return res.sendStatus(504);
  }
});
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

io.on("connection", (socket) => {
  socket.emit("constants", CONSTANTS);
  publicRoomList()
    .then((roomList) => socket.emit("rooms:update", roomList))
    .catch((error) => console.error("publicRoomList failed", error));

  socket.on("rooms:list", (_payload, reply) => safe(reply, async () => ({ rooms: await publicRoomList() })));

  socket.on("auth:me", ({ token }, reply) => safe(reply, async () => ({ user: await meFromToken(token) })));
  socket.on("auth:register", (payload, reply) => safe(reply, () => registerUser(payload)));
  socket.on("auth:login", (payload, reply) => safe(reply, () => loginUser(payload)));
  socket.on("auth:logout", ({ token }, reply) => safe(reply, async () => {
    await logoutUser(token);
    return { ok: true };
  }));
  socket.on("auth:profile", ({ userId, username }, reply) => safe(reply, async () => ({ profile: await getProfile(userId || username) })));
  socket.on("auth:updateProfile", ({ token, displayName, avatar }, reply) => safe(reply, () => updateUserProfile(token, { displayName, avatar })));
  socket.on("auth:getPreferences", ({ token }, reply) => safe(reply, async () => await getUserPreferences(token)));
  socket.on("auth:updatePreferences", ({ token, preferences }, reply) => safe(reply, async () => await updateUserPreferences(token, preferences)));
  socket.on("auth:changePassword", ({ token, currentPassword, newPassword }, reply) => safe(reply, async () => {
    await changeUserPassword(token, { currentPassword, newPassword });
    return { ok: true };
  }));

  socket.on("room:create", ({ name, avatar, clientId, roomName, password, publicRoom: isPublicRoom, authToken }, reply) => safe(reply, async () => {
    clearPendingDisconnect(clientId);
    const user = await authUserByToken(authToken);
    const room = await uniqueRoom(socket.id, user?.displayName || name, user?.avatar || avatar, clientId, { roomName, password: isPublicRoom === false ? "" : password, publicRoom: isPublicRoom });
    attachUser(room.players[socket.id], user);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    await emitRoom(room);
    await emitRoomList();
    return { room: publicRoom(room, socket.id), playerId: socket.id };
  }));

  socket.on("room:join", ({ code, name, avatar, clientId, role, password, authToken }, reply) => safe(reply, async () => {
    const room = await getRoom(code);
    const user = await authUserByToken(authToken);
    validateRoomPassword(room, password);
    const allowActiveTakeover = clearPendingDisconnect(clientId);
    const join = addPlayer(room, socket.id, user?.displayName || name, user?.avatar || avatar, clientId, role, { allowActiveTakeover, userId: user?.id });
    if (join.needsRoleChoice) return { needsRoleChoice: true, preview: roomJoinPreview(room), name: join.playerName, code: room.code };
    attachUser(room.players[join.playerId], user);
    detachPreviousSocket(join.previousId, room.code);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    await emitRoom(room);
    await emitRoomList();
    if (room.phase !== "lobby" && missingRoomImages(room).length) startRoomImageResolver(room.code);
    if (join.eventType !== "resume") emitRoomEvent(room, socket.id, "join", room.players[join.playerId]);
    return { room: publicRoom(room, join.playerId), playerId: join.playerId };
  }));

  socket.on("room:resume", ({ code, name, avatar, clientId, role, authToken }, reply) => safe(reply, async () => {
    const room = await getRoom(code);
    const user = await authUserByToken(authToken);
    const allowActiveTakeover = clearPendingDisconnect(clientId);
    const join = addPlayer(room, socket.id, user?.displayName || name, user?.avatar || avatar, clientId, role, { allowActiveTakeover, userId: user?.id });
    if (join.needsRoleChoice) return { needsRoleChoice: true, preview: roomJoinPreview(room), name: join.playerName, code: room.code };
    attachUser(room.players[join.playerId], user);
    detachPreviousSocket(join.previousId, room.code);
    sessions.set(socket.id, room.code);
    socket.join(room.code);
    await emitRoom(room);
    await emitRoomList();
    if (room.phase !== "lobby" && missingRoomImages(room).length) startRoomImageResolver(room.code);
    if (join.eventType !== "resume") emitRoomEvent(room, socket.id, "join", room.players[join.playerId]);
    return { room: publicRoom(room, join.playerId), playerId: join.playerId };
  }));

  socket.on("room:leave", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    const code = room.code;
    const removed = removePlayer(room, socket.id);
    sessions.delete(socket.id);
    socket.leave(code);
    if (onlyTestBots(room)) {
      await discardActiveMatch(room);
      await closeRoomForNoPlayers(room);
    }
    else if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
    }
    else {
      await emitRoom(room);
      if (removed) emitRoomEvent(room, socket.id, "leave", removed);
    }
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("room:activity", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("room:settings", (settings, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    updateSettings(room, socket.id, settings);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("host:move", ({ playerId, team }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    movePlayer(room, socket.id, playerId, team);
    if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
      return { ok: true };
    }
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("player:team", ({ team }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    chooseTeam(room, socket.id, team);
    if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
      return { ok: true };
    }
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("player:avatar", ({ avatar, authToken }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    const user = await authUserByToken(authToken);
    const updatedAvatar = user ? (await updateUserProfile(authToken, { avatar })).user.avatar : updatePlayerAvatar(room, socket.id, avatar);
    if (room.players[socket.id]) room.players[socket.id].avatar = updatedAvatar;
    io.to(room.code).emit("player:avatarUpdate", { playerId: socket.id, avatar: updatedAvatar });
    await emitRoom(room);
    return { room: publicRoom(room, socket.id) };
  }));

  socket.on("host:kick", ({ playerId }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    kickPlayer(room, socket.id, playerId);
    io.to(playerId).emit("room:kicked");
    if (shouldReturnSpectatorsToLobby(room)) {
      await returnSpectatorsToLobby(room);
      return { ok: true };
    }
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("host:returnLobby", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    await discardActiveMatch(room);
    hostReturnLobby(room, socket.id);
    await emitRoom(room);
    await emitRoomList();
    return { ok: true };
  }));

  socket.on("host:autoTeams", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    autoTeams(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("chat:send", ({ scope, text }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    sendChatMessage(room, socket.id, scope, text);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:start", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    startGame(structuredClone(room), socket.id);
    const liveRoom = await getRoom(room.code);
    if (liveRoom.phase !== "lobby") return { cancelled: true };
    startGame(liveRoom, socket.id);
    liveRoom.imageMap = {};
    await createActiveMatch(liveRoom);
    await emitRoom(liveRoom);
    await emitRoomList();
    startRoomImageResolver(liveRoom.code);
    return { ok: true };
  }));

  socket.on("game:hints", ({ hints }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    submitHints(room, socket.id, hints);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:updateGuess", ({ kind, guess, targetTeam }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    updateGuess(room, socket.id, kind, guess, targetTeam);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmDecision", ({ kind, targetTeam }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmDecision(room, socket.id, kind, targetTeam);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmResult", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmResult(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:updateTiebreaker", ({ words }, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    updateTiebreaker(room, socket.id, words);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmTiebreaker", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmTiebreaker(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("game:confirmFinal", (_payload, reply) => safe(reply, async () => {
    const room = await currentRoom(socket);
    confirmFinal(room, socket.id);
    await emitRoom(room);
    return { ok: true };
  }));

  socket.on("disconnect", () => {
    const code = sessions.get(socket.id);
    if (!code || !rooms.has(code)) return;
    const room = rooms.get(code);
    const player = room.players[socket.id];
    const clientId = player?.clientId || socket.id;
    sessions.delete(socket.id);
    const timer = setTimeout(async () => {
      pendingDisconnects.delete(clientId);
      const liveRoom = await getRoom(code).catch(() => null);
      if (!liveRoom) return;
      const removed = removePlayer(liveRoom, socket.id);
      if (!removed) return;
      if (onlyTestBots(liveRoom)) {
        await discardActiveMatch(liveRoom).catch((error) => console.error("discardMatch failed", error));
        await closeRoomForNoPlayers(liveRoom).catch((error) => console.error("closeRoom failed", error));
      }
      else if (shouldReturnSpectatorsToLobby(liveRoom)) {
        await returnSpectatorsToLobby(liveRoom).catch((error) => console.error("returnSpectators failed", error));
      }
      else {
        await emitRoom(liveRoom);
        emitRoomEvent(liveRoom, socket.id, "leave", removed);
      }
      await emitRoomList();
    }, 1500);
    pendingDisconnects.set(clientId, timer);
  });
});

async function uniqueRoom(playerId, name, avatar, clientId, roomOptions) {
  let room = makeRoom(playerId, name, avatar, clientId, roomOptions);
  while (rooms.has(room.code) || await loadRoom(room.code)) room = makeRoom(playerId, name, avatar, clientId, roomOptions);
  rooms.set(room.code, room);
  return room;
}

async function currentRoom(socket) {
  const code = sessions.get(socket.id);
  return getRoom(code);
}

async function getRoom(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  const localRoom = normalizeRoom(rooms.get(normalizedCode));
  const databaseRoom = normalizeRoom(await loadRoom(normalizedCode));
  const room = newestRoom(localRoom, databaseRoom);
  if (!room) throw new Error("Sala nao encontrada.");
  rooms.set(normalizedCode, room);
  return room;
}

async function emitRoom(room) {
  const hadInactivityWarning = Boolean(room.inactivityWarningAt);
  if (hadInactivityWarning) {
    room.inactivityWarningAt = null;
    room.inactivityClosesAt = null;
  }
  room.updatedAt = Date.now(); // Update timestamp for cleanup tracking
  await recordMatch(room).catch((error) => console.error("recordMatch failed", error));
  await saveRoom(room);
  rooms.set(room.code, room);
  if (hadInactivityWarning) io.to(room.code).emit("room:inactivityClear");
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

async function emitRoomList() {
  io.emit("rooms:update", await publicRoomList());
}

async function publicRoomList() {
  const databaseRooms = await listRooms();
  databaseRooms.forEach((room) => {
    room = normalizeRoom(room);
    if (!room?.code) return;
    const normalizedCode = String(room.code).trim().toUpperCase();
    rooms.set(normalizedCode, newestRoom(normalizeRoom(rooms.get(normalizedCode)), room));
  });
  return Array.from(rooms.values())
    .filter((room) => room.publicRoom !== false)
    .map(roomSummary);
}

function newestRoom(localRoom, databaseRoom) {
  if (!localRoom) return databaseRoom;
  if (!databaseRoom) return localRoom;
  const localUpdated = Number(localRoom.updatedAt || localRoom.createdAt || 0);
  const databaseUpdated = Number(databaseRoom.updatedAt || databaseRoom.createdAt || 0);
  return databaseUpdated >= localUpdated ? databaseRoom : localRoom;
}

function roomSummary(room) {
  const players = Object.values(room.players || {});
  const host = room.players?.[room.hostId] || players.find((player) => player.isHost);
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

function onlyTestBots(room) {
  const players = Object.values(room.players || {});
  return players.length > 0 && players.every((player) => player.testBot);
}

function hasActiveRoomPlayers(room) {
  return Object.values(room.players || {}).some((player) => (
    !player.spectator && TEAMS.includes(player.team) && !player.testBot
  ));
}

function shouldReturnSpectatorsToLobby(room) {
  return room && room.phase !== "lobby" && !hasActiveRoomPlayers(room) && Object.keys(room.players || {}).length > 0;
}

async function returnSpectatorsToLobby(room) {
  await discardActiveMatch(room).catch((error) => console.error("discardMatch failed", error));
  room.phase = "lobby";
  room.round = 0;
  room.current = null;
  room.tiebreaker = null;
  room.final = null;
  room.settings.randomTeams = false;
  TEAMS.forEach((team) => {
    room.teams[team].words = [];
    room.teams[team].hintHistory = [];
    room.teams[team].score = { correct: 0, interceptions: 0, lives: room.settings?.startingLives || CONSTANTS.STARTING_LIVES };
  });
  room.imageMap = {};
  room.chat ||= {};
  room.chat.team = { red: [], blue: [] };
  room.chat.spectator = [];
  Object.values(room.players || {}).forEach((player) => {
    player.team = null;
    player.spectator = true;
  });
  io.to(room.code).emit("room:inactiveClosed", { reason: "noPlayers" });
  await emitRoom(room);
  await emitRoomList();
}

async function closeRoomForNoPlayers(room) {
  const code = room.code;
  io.to(code).emit("room:inactiveClosed", { reason: "noPlayers" });
  Object.keys(room.players || {}).forEach((playerId) => {
    sessions.delete(playerId);
    io.sockets.sockets.get(playerId)?.leave(code);
  });
  rooms.delete(code);
  await deleteRoom(code).catch((error) => console.error("deleteRoom failed", error));
  await emitRoomList();
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheImage(key, payload) {
  const normalized = payload?.url ? { ...payload, url: proxiedImageUrl(payload.url) } : payload;
  imageCache.set(key, normalized);
  return normalized;
}

function emptyImagePayload() {
  return { url: null, source: "fallback" };
}

function proxiedImageUrl(url) {
  const value = String(url || "");
  if (!/^https?:\/\//i.test(value)) return value;
  return `/api/image-proxy?u=${encodeURIComponent(value)}`;
}

async function findImagePayload(query, category) {
  const cacheKey = `${category}:${query}`.toLocaleLowerCase();
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);
  const pokemon = await pokemonImage(query);
  if (await imageAvailable(pokemon)) return cacheImage(cacheKey, { url: pokemon, source: "pokeapi" });
  if (category === "Geral") {
    const pexels = await pexelsImage(query);
    if (pexels && await imageAvailable(pexels.url)) return cacheImage(cacheKey, { url: pexels.url, source: "pexels", photographer: pexels.photographer, page: pexels.page });
  }
  if (category === "Filmes") {
    const poster = await omdbImage(query);
    if (await imageAvailable(poster)) return cacheImage(cacheKey, { url: poster, source: "omdb" });
  }
  if (!/\bpokemon\b/i.test(query)) {
    for (const term of imageSearchTerms(query)) {
      const google = await googleImage(term);
      if (await imageAvailable(google)) return cacheImage(cacheKey, { url: google, source: "google" });
    }
  }
  const wiki = await wikiImage(query);
  if (await imageAvailable(wiki)) return cacheImage(cacheKey, { url: wiki, source: "wikimedia" });
  return emptyImagePayload();
}

async function resolveRoomImages(room) {
  const category = room.settings?.category || "";
  room.imageMap ||= {};
  const missing = missingRoomImages(room);
  for (const word of missing) {
    const key = imageCacheKey(word, category);
    const url = await resolveImageUrlForWord(word, category);
    if (url) room.imageMap[key] = url;
  }
  return room.imageMap;
}

async function startRoomImageResolver(code) {
  const roomCode = String(code || "").trim().toUpperCase();
  if (!roomCode || imageResolveJobs.has(roomCode)) return;
  imageResolveJobs.add(roomCode);
  try {
    let attempt = 0;
    while (true) {
      const room = await getRoom(roomCode).catch(() => null);
      if (!room || room.phase === "lobby") break;
      const before = JSON.stringify(room.imageMap || {});
      await resolveRoomImages(room);
      const after = JSON.stringify(room.imageMap || {});
      if (after !== before) await emitRoom(room);
      if (!missingRoomImages(room).length) break;
      attempt += 1;
      await sleep(Math.min(3000 + attempt * 1500, 15000));
    }
  } finally {
    imageResolveJobs.delete(roomCode);
  }
}

async function resolveImageUrlForWord(word, category) {
  if (category === "Pokemon") {
    const url = proxiedImageUrl(pokemonSpriteUrl(word));
    return await imageAvailable(pokemonSpriteUrl(word)) ? url : "";
  }
  const query = serverImageSearchQuery(word, category);
  const payload = await findImagePayload(query, category);
  return payload?.url || "";
}

function missingRoomImages(room) {
  const category = room.settings?.category || "";
  return TEAMS.flatMap((team) => room.teams?.[team]?.words || [])
    .filter((word) => !room.imageMap?.[imageCacheKey(word, category)]);
}

function imageCacheKey(word, category) {
  return `${category || ""}:${encodeURIComponent(String(word || "").trim().toLowerCase())}`;
}

function serverImageSearchQuery(word, category) {
  const cleanWord = String(word || "").trim();
  if (category === "Geral" || category === "Famosos") return cleanWord;
  const origin = SERVER_WORD_ORIGINS[category]?.[cleanWord];
  if (["Anime", "Jogos", "Geek"].includes(category) && origin) return `${cleanWord} ${origin}`;
  const suffix = {
    Anime: "anime character",
    Filmes: "movie",
    Jogos: "video game character",
    Geek: "fictional character"
  }[category] || category || "";
  return `${cleanWord} ${suffix}`.trim();
}

function pokemonSpriteUrl(word) {
  const slug = String(word || "")
    .replace(/^Mr\.?\s+(Mime|Rime)$/i, "mr$1")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug ? `https://projectpokemon.org/images/normal-sprite/${slug}.gif` : "";
}

async function googleImage(query) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return null;
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", "5");
  url.searchParams.set("safe", "active");
  url.searchParams.set("hl", "en");
  url.searchParams.set("lr", "lang_en");
  url.searchParams.set("q", query);
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    const data = await response.json();
    const links = (data.items || []).map((item) => item?.link).filter(Boolean);
    for (const link of links) {
      if (await imageAvailable(link)) return link;
    }
    return null;
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
    const response = await fetchWithTimeout(url, { headers: { Authorization: key } });
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
    const response = await fetchWithTimeout(url);
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
    const response = await fetchWithTimeout(`https://pokeapi.co/api/v2/pokemon/${aliases.get(name) || name}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function imageAvailable(url) {
  if (!url) return false;
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": "CodeHackImageProbe/1.0",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    }, 3500);
    if (!response.ok) return false;
    const contentType = response.headers.get("content-type") || "";
    return !contentType || contentType.toLowerCase().startsWith("image/");
  } catch {
    return false;
  }
}

async function wikiImage(query) {
  for (const term of imageSearchTerms(query)) {
    const summaryImage = await wikiSummaryImage(term);
    if (await imageAvailable(summaryImage)) return summaryImage;

    const commons = new URL("https://commons.wikimedia.org/w/api.php");
    commons.searchParams.set("action", "query");
    commons.searchParams.set("generator", "search");
    commons.searchParams.set("gsrsearch", term);
    commons.searchParams.set("gsrnamespace", "6");
    commons.searchParams.set("gsrlimit", "5");
    commons.searchParams.set("prop", "imageinfo");
    commons.searchParams.set("iiprop", "url");
    commons.searchParams.set("format", "json");
    commons.searchParams.set("origin", "*");
    try {
      const response = await fetchWithTimeout(commons);
      if (response.ok) {
        const data = await response.json();
        const pages = Object.values(data.query?.pages || {});
        for (const page of pages) {
          const url = page?.imageinfo?.[0]?.url;
          if (await imageAvailable(url)) return url;
        }
      }
    } catch {
      // Keep the image lookup best-effort; gameplay should not depend on it.
    }
    const summary = new URL("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(term));
    try {
      const response = await fetchWithTimeout(summary);
      if (!response.ok) continue;
      const data = await response.json();
      if (await imageAvailable(data.thumbnail?.source)) return data.thumbnail.source;
    } catch {
      // Try the next term.
    }
  }
  return null;
}

async function wikiSummaryImage(term) {
  const direct = await wikiSummaryThumbnail(term);
  if (direct) return direct;
  const search = new URL("https://en.wikipedia.org/w/api.php");
  search.searchParams.set("action", "query");
  search.searchParams.set("list", "search");
  search.searchParams.set("srsearch", term);
  search.searchParams.set("srlimit", "1");
  search.searchParams.set("format", "json");
  search.searchParams.set("origin", "*");
  try {
    const response = await fetchWithTimeout(search);
    if (!response.ok) return null;
    const data = await response.json();
    const title = data.query?.search?.[0]?.title;
    return title ? wikiSummaryThumbnail(title) : null;
  } catch {
    return null;
  }
}

async function wikiSummaryThumbnail(title) {
  const summary = new URL("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title));
  try {
    const response = await fetchWithTimeout(summary);
    if (!response.ok) return null;
    const data = await response.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

function imageSearchTerms(query) {
  const trimmed = query.trim();
  const withoutCategory = trimmed.replace(/\s+(geral|anime|pokemon|filme|filmes|jogo|jogos|geek|famosos|movie|famous person|fictional character|video game character|anime character)$/i, "").trim();
  const withoutParentheses = trimmed.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const firstWords = withoutCategory.split(/\s+/).slice(0, 2).join(" ");
  const firstWord = withoutCategory.split(/\s+/)[0] || "";
  if (/\s+(famosos|famous person)$/i.test(trimmed)) return uniqueSearchTerms([withoutCategory, firstWords, firstWord]);
  if (/\s+geral$/i.test(trimmed)) return uniqueSearchTerms([withoutCategory, firstWords, firstWord, trimmed]);
  return uniqueSearchTerms([trimmed, withoutParentheses, withoutCategory, firstWords, firstWord]);
}

function uniqueSearchTerms(terms) {
  return [...new Set(terms.map((term) => String(term || "").trim()).filter(Boolean))];
}

async function loadRoomsFromDatabase() {
  try {
    const roomsFromDb = await listRooms();
    if (roomsFromDb && Array.isArray(roomsFromDb)) {
      roomsFromDb.forEach((room) => {
        room = normalizeRoom(room);
        if (room && room.code) {
          rooms.set(room.code, room);
          if (room.phase !== "lobby" && missingRoomImages(room).length) startRoomImageResolver(room.code);
        }
      });
      console.log(`Loaded ${roomsFromDb.length} rooms from the database`);
    }
  } catch (error) {
    console.error("Failed to load rooms from database:", error.message);
  }
}

// Periodic cleanup of abandoned and inactive rooms.
async function cleanupAbandonedRooms() {
  try {
    const now = Date.now();
    const oneHourAgo = now - ROOM_INACTIVITY_LIMIT_MS;

    const databaseRooms = await listRooms().catch(() => []);
    databaseRooms.forEach((room) => {
      room = normalizeRoom(room);
      if (room?.code) rooms.set(room.code, newestRoom(normalizeRoom(rooms.get(room.code)), room));
    });

    for (const [code, roomValue] of rooms.entries()) {
      const room = normalizeRoom(roomValue);
      if (!room) continue;
      const players = Object.keys(room.players || {});
      const emptyRoom = players.length === 0;
      const noActivePlayers = !hasActiveRoomPlayers(room);
      const staleRoom = !room?.updatedAt || room.updatedAt < oneHourAgo;
      if (emptyRoom && staleRoom) {
        console.log(`Cleaning up abandoned room: ${code}`);
        rooms.delete(code);
        await deleteRoom(code).catch(() => {});
        continue;
      }
      if (shouldReturnSpectatorsToLobby(room)) {
        console.log(`Returning spectator-only match to lobby: ${code}`);
        await returnSpectatorsToLobby(room);
        continue;
      }
      if (emptyRoom) continue;
      const closesAt = Number(room.updatedAt || room.createdAt || now) + ROOM_INACTIVITY_LIMIT_MS;
      const warnAt = closesAt - ROOM_INACTIVITY_WARNING_MS;
      if (now >= closesAt) {
        console.log(`Closing inactive room: ${code}`);
        await closeInactiveRoom(room);
        continue;
      }
      if (now >= warnAt && !room.inactivityWarningAt) {
        room.inactivityWarningAt = now;
        room.inactivityClosesAt = closesAt;
        rooms.set(code, room);
        await saveRoom(room).catch(() => {});
        io.to(code).emit("room:inactivityWarning", {
          id: `inactivity-${code}`,
          type: "inactivity",
          closesAt,
          at: now
        });
      }
    }
  } catch (error) {
    console.error("Failed to cleanup abandoned rooms:", error.message);
  }
}

async function closeInactiveRoom(room) {
  const code = room.code;
  await discardActiveMatch(room).catch((error) => console.error("discardMatch failed", error));
  io.to(code).emit("room:inactiveClosed", { reason: "inactivity" });
  Object.keys(room.players || {}).forEach((playerId) => {
    sessions.delete(playerId);
    io.sockets.sockets.get(playerId)?.leave(code);
  });
  rooms.delete(code);
  await deleteRoom(code).catch((error) => console.error("deleteRoom failed", error));
  await emitRoomList();
}

setInterval(cleanupAbandonedRooms, ROOM_CLEANUP_INTERVAL_MS);

httpServer.listen(PORT, async () => {
  console.log(`Code Hack server listening on http://localhost:${PORT}`);
  await loadRoomsFromDatabase();
});
