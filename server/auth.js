import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import admin from "firebase-admin";

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const localSessions = new Map();
let firestore = null;
let schemaReady = false;

const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json";
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

function getFirestore() {
  if (firestore) return firestore;

  if (!admin.apps.length) {
    let credential;
    if (FIREBASE_SERVICE_ACCOUNT_JSON) {
      credential = admin.credential.cert(JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON));
    } else if (GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.applicationDefault();
    } else {
      const serviceAccount = JSON.parse(readFileSync(new URL(FIREBASE_SERVICE_ACCOUNT_PATH, import.meta.url), "utf8"));
      credential = admin.credential.cert(serviceAccount);
    }

    admin.initializeApp({ credential, projectId: FIREBASE_PROJECT_ID });
  }

  firestore = admin.firestore();
  return firestore;
}

function userCollection() {
  return getFirestore().collection("codehack_users");
}

function sessionCollection() {
  return getFirestore().collection("codehack_sessions");
}

async function ensureSchema() {
  if (schemaReady) return;
  getFirestore();
  schemaReady = true;
}

function cleanUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 24);
}

function cleanDisplayName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 18) || "Operador";
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return { salt, hash };
}

function makeStats() {
  return { wins: 0, losses: 0, draws: 0, abandoned: 0, decryptedWords: {}, interceptedWords: {} };
}

function rowToUser(row) {
  if (!row) return null;
  const data = typeof row.data === "function" ? row.data() : row;
  if (!data) return null;
  return {
    id: data.id || row.id,
    username: data.username,
    displayName: data.displayName || data.display_name,
    avatar: data.avatar || "",
    passwordSalt: data.passwordSalt || data.password_salt,
    passwordHash: data.passwordHash || data.password_hash,
    stats: normalizeStats(data.stats || {}),
    matches: data.matches || [],
    preferences: data.preferences || makeDefaultPreferences(),
    createdAt: Number(data.createdAt || data.created_at || 0)
  };
}

function visibleMatches(matches = []) {
  return (matches || []).filter((match) => match.status !== "active");
}

function makeDefaultPreferences() {
  return { soundMuted: false, matrixEnabled: true, customCategories: [] };
}

function publicUser(user, includePrivate = false) {
  if (!user) return null;
  const base = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar || "",
    stats: publicStats(user.stats),
    matches: visibleMatches(user.matches || []),
    preferences: user.preferences || makeDefaultPreferences()
  };
  return includePrivate ? { ...base, createdAt: user.createdAt } : base;
}

export async function authUserByToken(token) {
  const cleanToken = String(token || "");
  if (!cleanToken) return null;
  await ensureSchema();
  const now = Date.now();
  const sessionSnap = await sessionCollection().doc(cleanToken).get();
  if (!sessionSnap.exists) return null;
  const session = sessionSnap.data();
  if (!session?.userId || Number(session.expiresAt) <= now) {
    await sessionCollection().doc(cleanToken).delete().catch(() => {});
    return null;
  }
  await sessionCollection().doc(cleanToken).update({ expiresAt: now + SESSION_TTL });
  const userDoc = await userCollection().doc(session.userId).get();
  return rowToUser(userDoc);
}

export async function registerUser({ username, displayName, password }) {
  const clean = cleanUsername(username);
  if (clean.length < 3) throw new Error("Usuario precisa ter pelo menos 3 caracteres.");
  if (String(password || "").length < 4) throw new Error("Senha precisa ter pelo menos 4 caracteres.");
  await ensureSchema();

  const exists = await userCollection().where("username", "==", clean).limit(1).get();
  if (!exists.empty) throw new Error("Usuario ja existe.");

  const credentials = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    username: clean,
    displayName: cleanDisplayName(displayName || username),
    avatar: "",
    passwordSalt: credentials.salt,
    passwordHash: credentials.hash,
    stats: makeStats(),
    matches: [],
    preferences: makeDefaultPreferences(),
    createdAt: Date.now()
  };

  await userCollection().doc(user.id).set(user);
  return loginToken(user);
}

export async function loginUser({ username, password }) {
  const clean = cleanUsername(username);
  await ensureSchema();

  const query = await userCollection().where("username", "==", clean).limit(1).get();
  if (query.empty) throw new Error("Usuario ou senha incorretos.");

  const user = rowToUser(query.docs[0]);
  const credentials = hashPassword(password, user.passwordSalt);
  if (credentials.hash !== user.passwordHash) throw new Error("Usuario ou senha incorretos.");

  return loginToken(user);
}

export async function logoutUser(token) {
  const cleanToken = String(token || "");
  localSessions.delete(cleanToken);
  if (!cleanToken) return;
  await ensureSchema();
  await sessionCollection().doc(cleanToken).delete().catch(() => {});
}

export async function updateUserProfile(token, { displayName, avatar }) {
  const current = await authUserByToken(token);
  if (!current) throw new Error("Login necessario.");
  await ensureSchema();

  const nextName = displayName !== undefined ? cleanDisplayName(displayName) : current.displayName;
  const nextAvatar = avatar !== undefined ? String(avatar || "") : current.avatar;

  await userCollection().doc(current.id).update({ displayName: nextName, avatar: nextAvatar });
  const updated = await userCollection().doc(current.id).get();
  return { token, user: publicUser(rowToUser(updated), true) };
}

export async function updateUserPreferences(token, preferences) {
  const current = await authUserByToken(token);
  if (!current) throw new Error("Login necessario.");
  await ensureSchema();

  const merged = { ...makeDefaultPreferences(), ...current.preferences, ...preferences };
  await userCollection().doc(current.id).update({ preferences: merged });
  return { ok: true, preferences: merged };
}

export async function getUserPreferences(token) {
  const current = await authUserByToken(token);
  if (!current) throw new Error("Login necessario.");
  return { preferences: current.preferences || makeDefaultPreferences() };
}

export async function changeUserPassword(token, { currentPassword, newPassword }) {
  const current = await authUserByToken(token);
  if (!current) throw new Error("Login necessario.");
  if (String(newPassword || "").length < 4) throw new Error("Nova senha precisa ter pelo menos 4 caracteres.");
  await ensureSchema();

  const currentHash = hashPassword(currentPassword, current.passwordSalt);
  if (currentHash.hash !== current.passwordHash) throw new Error("Senha atual incorreta.");

  const next = hashPassword(newPassword);
  await userCollection().doc(current.id).update({ passwordSalt: next.salt, passwordHash: next.hash });
  return { ok: true };
}

export async function getProfile(userIdOrUsername) {
  const lookup = String(userIdOrUsername || "").trim();
  await ensureSchema();
  if (!lookup) throw new Error("Perfil nao encontrado.");

  const byId = await userCollection().doc(lookup).get();
  if (byId.exists) return publicUser(rowToUser(byId));

  const query = await userCollection().where("username", "==", cleanUsername(lookup)).limit(1).get();
  if (query.empty) throw new Error("Perfil nao encontrado.");
  return publicUser(rowToUser(query.docs[0]));
}

export async function meFromToken(token) {
  return publicUser(await authUserByToken(token), true);
}

export async function createActiveMatch(room) {
  const participants = Object.values(room.players)
    .filter((player) => player.userId && ["red", "blue"].includes(player.team) && !player.spectator)
    .map((player) => ({ userId: player.userId, playerId: player.id, team: player.team, name: player.name }));
  room.matchSession = {
    id: crypto.randomBytes(18).toString("hex"),
    startedAt: Date.now(),
    participantIds: participants.map((player) => player.userId),
    players: Object.fromEntries(participants.map((player) => [player.userId, player])),
    recordedRounds: [],
    cancelled: false,
    closed: false
  };
  if (!participants.length) return;
  const entry = makeMatchEntry(room, null, room.matchSession.id, null, false, "active");
  entry.startedAt = room.matchSession.startedAt;
  entry.finishedAt = null;
  entry.outcome = "active";
  for (const player of participants) {
    const user = await loadUserById(player.userId);
    if (!user) continue;
    const matches = upsertMatch(user.matches || [], { ...entry, playerTeam: player.team });
    await saveUserStatsAndMatches(user.id, normalizeStats(user.stats), matches);
  }
}

export async function syncActiveMatch(room) {
  if (!room.matchSession?.id || room.matchSession.closed || room.matchSession.cancelled) return;
  if (room.phase === "roundResult" && room.current?.result && !room.matchSession.recordedRounds.includes(room.round)) {
    await recordRoundStats(room);
    room.matchSession.recordedRounds.push(room.round);
  }
  await updateActiveMatchSnapshots(room);
  if (room.final && room.phase === "gameOver") await finalizeActiveMatch(room);
}

export async function discardActiveMatch(room) {
  if (!room.matchSession?.id || room.matchSession.closed) return;
  const ids = room.matchSession.participantIds || [];
  for (const userId of ids) {
    const user = await loadUserById(userId);
    if (!user) continue;
    const matches = (user.matches || []).filter((match) => match.id !== room.matchSession.id);
    await saveUserStatsAndMatches(user.id, normalizeStats(user.stats), matches);
  }
  room.matchSession.cancelled = true;
  room.matchSession.closed = true;
}

export async function recordMatch(room) {
  if (room.matchSession?.id) return syncActiveMatch(room);
  if (room.matchRecorded || !room.final?.winner) return;
  const players = Object.values(room.players).filter((player) => player.userId);
  if (!players.length) {
    room.matchRecorded = true;
    return;
  }

  const matchId = crypto.randomBytes(18).toString("hex");
  const finishedAt = Date.now();
  await ensureSchema();

  for (const player of players) {
    const user = await loadUserById(player.userId);
    if (!user) continue;
    const won = player.team === room.final.winner;
    const stats = user.stats || makeStats();
    if (won) stats.wins += 1;
    else stats.losses += 1;
    addWordStats(stats, room, player.team);
    const matches = [makeMatchEntry(room, player, matchId, finishedAt, won), ...(user.matches || [])].slice(0, 80);
    await saveUserStatsAndMatches(user.id, normalizeStats(stats), matches);
  }
  room.matchRecorded = true;
}

function addWordStats(stats, room, playerTeam) {
  if (!["red", "blue"].includes(playerTeam)) return;
  stats.decryptedWords ||= {};
  stats.interceptedWords ||= {};
  const rivalTeam = playerTeam === "red" ? "blue" : "red";
  const ownWords = room.teams[playerTeam].words || [];
  const rivalWords = room.teams[rivalTeam].words || [];
  (room.teams[playerTeam].hintHistory || []).forEach((entry) => {
    entry.code.forEach((number, slot) => {
      if (entry.teamGuess?.[slot] === number) bump(stats.decryptedWords, ownWords[number - 1]);
    });
  });
  (room.teams[rivalTeam].hintHistory || []).forEach((entry) => {
    entry.code.forEach((number, slot) => {
      if (entry.interceptGuess?.[slot] === number) bump(stats.interceptedWords, rivalWords[number - 1]);
    });
  });
}

async function recordRoundStats(room) {
  const participants = room.matchSession?.players || {};
  for (const participant of Object.values(participants)) {
    if (!["red", "blue"].includes(participant.team)) continue;
    const user = await loadUserById(participant.userId);
    if (!user) continue;
    const stats = normalizeStats(user.stats);
    recordTeamRoundWords(stats.decryptedWords, room, participant.team, "team");
    recordTeamRoundWords(stats.interceptedWords, room, participant.team, "intercept");
    await saveUserStatsAndMatches(user.id, stats, user.matches || []);
  }
}

function recordTeamRoundWords(target, room, playerTeam, kind) {
  const targetTeam = kind === "team" ? playerTeam : (playerTeam === "red" ? "blue" : "red");
  const result = room.current?.result?.[targetTeam];
  if (!result) return;
  const words = room.teams[targetTeam]?.words || [];
  const guess = kind === "team" ? result.teamGuess : result.interceptGuess;
  result.code.forEach((number, slot) => {
    if (!guess?.[slot]) return;
    bumpWordAttempt(target, words[number - 1], guess[slot] === number);
  });
}

async function updateActiveMatchSnapshots(room) {
  const ids = room.matchSession?.participantIds || [];
  for (const userId of ids) {
    const user = await loadUserById(userId);
    if (!user) continue;
    const participant = room.matchSession.players[userId];
    const matches = upsertMatch(user.matches || [], makeMatchEntry(room, participant, room.matchSession.id, null, false, "active"));
    await saveUserStatsAndMatches(user.id, normalizeStats(user.stats), matches);
  }
}

async function finalizeActiveMatch(room) {
  if (room.matchSession.closed) return;
  await updateActiveMatchSnapshots(room);
  const finishedAt = Date.now();
  const ids = room.matchSession.participantIds || [];
  for (const userId of ids) {
    const user = await loadUserById(userId);
    if (!user) continue;
    const participant = room.matchSession.players[userId];
    const stillHere = Object.values(room.players).some((player) => player.userId === userId && player.connected && player.team === participant.team);
    const outcome = stillHere ? (!room.final.winner ? "draw" : participant.team === room.final.winner ? "win" : "loss") : "abandoned";
    const stats = normalizeStats(user.stats);
    if (outcome === "win") stats.wins += 1;
    else if (outcome === "loss") stats.losses += 1;
    else if (outcome === "draw") stats.draws += 1;
    else stats.abandoned += 1;
    const matches = upsertMatch(user.matches || [], makeMatchEntry(room, participant, room.matchSession.id, finishedAt, outcome === "win", outcome));
    await saveUserStatsAndMatches(user.id, stats, matches);
  }
  room.matchSession.closed = true;
}

function bump(target, word) {
  const clean = String(word || "").trim();
  if (!clean) return;
  if (typeof target[clean] === "number") target[clean] = { correct: target[clean], attempts: target[clean] };
  target[clean] ||= { correct: 0, attempts: 0 };
  target[clean].correct += 1;
  target[clean].attempts += 1;
}

function bumpWordAttempt(target, word, correct) {
  const clean = String(word || "").trim();
  if (!clean) return;
  if (typeof target[clean] === "number") target[clean] = { correct: target[clean], attempts: target[clean] };
  target[clean] ||= { correct: 0, attempts: 0 };
  target[clean].attempts += 1;
  if (correct) target[clean].correct += 1;
}

function makeMatchEntry(room, player, matchId, finishedAt, won, outcome = null) {
  return {
    id: matchId,
    status: finishedAt ? "finished" : "active",
    startedAt: room.matchSession?.startedAt || room.createdAt,
    finishedAt,
    playerCount: Object.values(room.players).length,
    outcome: outcome || (won ? "win" : "loss"),
    playerTeam: player?.team || null,
    winner: room.final?.winner || null,
    finalScore: { red: room.teams.red.score, blue: room.teams.blue.score },
    teams: {
      red: { words: room.teams.red.words, hintHistory: room.teams.red.hintHistory },
      blue: { words: room.teams.blue.words, hintHistory: room.teams.blue.hintHistory }
    }
  };
}

function upsertMatch(matches, entry) {
  return [entry, ...(matches || []).filter((match) => match.id !== entry.id)].slice(0, 80);
}

function normalizeStats(stats = {}) {
  return {
    ...makeStats(),
    ...stats,
    decryptedWords: normalizeWordStats(stats.decryptedWords),
    interceptedWords: normalizeWordStats(stats.interceptedWords)
  };
}

function publicStats(stats = {}) {
  const normalized = normalizeStats(stats);
  return {
    ...normalized,
    decryptedWords: topWordStats(normalized.decryptedWords),
    interceptedWords: topWordStats(normalized.interceptedWords)
  };
}

function topWordStats(words = {}) {
  const score = (value) => Number(value?.correct || 0);
  const attempts = (value) => Number(value?.attempts || 0);
  return Object.fromEntries(Object.entries(words || {})
    .sort((left, right) => score(right[1]) - score(left[1]) || attempts(right[1]) - attempts(left[1]))
    .slice(0, 10));
}

function normalizeWordStats(words = {}) {
  return Object.fromEntries(Object.entries(words || {}).map(([word, value]) => {
    if (typeof value === "number") return [word, { correct: value, attempts: value }];
    return [word, { correct: Number(value?.correct || 0), attempts: Number(value?.attempts || 0) }];
  }));
}

async function loadUserById(userId) {
  if (!userId) return null;
  await ensureSchema();
  const userDoc = await userCollection().doc(userId).get();
  return rowToUser(userDoc);
}

async function saveUserStatsAndMatches(userId, stats, matches) {
  await ensureSchema();
  await userCollection().doc(userId).update({ stats: normalizeStats(stats), matches: matches || [] });
}

async function loginToken(user) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL;
  localSessions.set(token, { userId: user.id, expiresAt });
  await ensureSchema();
  await sessionCollection().doc(token).set({ userId: user.id, expiresAt });
  return { token, user: publicUser(user, true) };
}

