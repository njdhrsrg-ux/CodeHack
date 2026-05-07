import crypto from "node:crypto";
import pg from "pg";

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const localSessions = new Map();
let pool = null;
let schemaReady = false;

function getPool() {
  if (pool) return pool;
  const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING || process.env.DB_URL || "";
  if (!databaseUrl) {
    const knownEnv = {
      SUPABASE_DATABASE_URL: !!process.env.SUPABASE_DATABASE_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      PG_CONNECTION_STRING: !!process.env.PG_CONNECTION_STRING,
      DB_URL: !!process.env.DB_URL,
      VERCEL_ENV: process.env.VERCEL_ENV
    };
    throw new Error(`SUPABASE_DATABASE_URL or DATABASE_URL is required for data persistence. Env status: ${JSON.stringify(knownEnv)}`);
  }
  pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  return pool;
}

async function ensureSchema() {
  const pool = getPool();
  if (schemaReady) return;
  await pool.query(`
    create table if not exists codehack_users (
      id uuid primary key,
      username text unique not null,
      display_name text not null,
      avatar text default '',
      password_salt text not null,
      password_hash text not null,
      stats jsonb not null default '{"wins":0,"losses":0,"decryptedWords":{},"interceptedWords":{}}'::jsonb,
      matches jsonb not null default '[]'::jsonb,
      preferences jsonb not null default '{"soundMuted":false,"matrixEnabled":true,"customCategories":[]}'::jsonb,
      created_at bigint not null
    );
    create table if not exists codehack_sessions (
      token text primary key,
      user_id uuid not null references codehack_users(id) on delete cascade,
      expires_at bigint not null
    );
  `);
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

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatar: row.avatar || "",
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    stats: normalizeStats(row.stats),
    matches: row.matches || [],
    preferences: row.preferences || makeDefaultPreferences(),
    createdAt: Number(row.created_at)
  };
}

export async function authUserByToken(token) {
  const cleanToken = String(token || "");
  if (!cleanToken) return null;
  await ensureSchema();
  const pool = getPool();
  const now = Date.now();
  const { rows } = await pool.query(`
    select u.* from codehack_sessions s
    join codehack_users u on u.id = s.user_id
    where s.token = $1 and s.expires_at > $2
  `, [cleanToken, now]);
  if (!rows[0]) return null;
  await pool.query("update codehack_sessions set expires_at = $2 where token = $1", [cleanToken, now + SESSION_TTL]);
  return rowToUser(rows[0]);
}

export async function registerUser({ username, displayName, password }) {
  const clean = cleanUsername(username);
  if (clean.length < 3) throw new Error("Usuario precisa ter pelo menos 3 caracteres.");
  if (String(password || "").length < 4) throw new Error("Senha precisa ter pelo menos 4 caracteres.");
  await ensureSchema();
  const pool = getPool();
  const exists = await pool.query("select id from codehack_users where username = $1", [clean]);
  if (exists.rows.length) throw new Error("Usuario ja existe.");
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
  try {
    await pool.query(`
      insert into codehack_users (id, username, display_name, avatar, password_salt, password_hash, stats, matches, preferences, created_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [user.id, user.username, user.displayName, user.avatar, user.passwordSalt, user.passwordHash, user.stats, user.matches, user.preferences, user.createdAt]);
  } catch (error) {
    if (error?.code === "23505") throw new Error("Usuario ja existe.");
    throw error;
  }
  return loginToken(user);
}

export async function loginUser({ username, password }) {
  const clean = cleanUsername(username);
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query("select * from codehack_users where username = $1", [clean]);
  const user = rowToUser(rows[0]);
  if (!user) throw new Error("Usuario ou senha incorretos.");
  const credentials = hashPassword(password, user.passwordSalt);
  if (credentials.hash !== user.passwordHash) throw new Error("Usuario ou senha incorretos.");
  return loginToken(user);
}

export async function logoutUser(token) {
  const cleanToken = String(token || "");
  localSessions.delete(cleanToken);
  if (!cleanToken) return;
  await ensureSchema();
  const pool = getPool();
  await pool.query("delete from codehack_sessions where token = $1", [cleanToken]);
}

export async function updateUserProfile(token, { displayName, avatar }) {
  const current = await authUserByToken(token);
  if (!current) throw new Error("Login necessario.");
  await ensureSchema();
  const pool = getPool();
  const nextName = displayName !== undefined ? cleanDisplayName(displayName) : current.displayName;
  const nextAvatar = avatar !== undefined ? String(avatar || "") : current.avatar;
  const { rows } = await pool.query(
    "update codehack_users set display_name = $2, avatar = $3 where id = $1 returning *",
    [current.id, nextName, nextAvatar]
  );
  return { token, user: publicUser(rowToUser(rows[0]), true) };
}

export async function updateUserPreferences(token, preferences) {
  const current = await authUserByToken(token);
  if (!current) throw new Error("Login necessario.");
  await ensureSchema();
  const pool = getPool();
  const merged = { ...makeDefaultPreferences(), ...current.preferences, ...preferences };
  const { rows } = await pool.query(
    "update codehack_users set preferences = $2 where id = $1 returning *",
    [current.id, merged]
  );
  return { ok: true, preferences: rowToUser(rows[0]).preferences };
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
  const pool = getPool();
  const currentHash = hashPassword(currentPassword, current.passwordSalt);
  if (currentHash.hash !== current.passwordHash) throw new Error("Senha atual incorreta.");
  const next = hashPassword(newPassword);
  await pool.query("update codehack_users set password_salt = $2, password_hash = $3 where id = $1", [current.id, next.salt, next.hash]);
  return { ok: true };
}

export async function getProfile(userIdOrUsername) {
  const lookup = String(userIdOrUsername || "").trim();
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query("select * from codehack_users where id::text = $1 or username = $2", [lookup, cleanUsername(lookup)]);
  const user = rowToUser(rows[0]);
  if (!user) throw new Error("Perfil nao encontrado.");
  return publicUser(user);
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
  const pool = getPool();
  for (const player of players) {
    const { rows } = await pool.query("select * from codehack_users where id = $1", [player.userId]);
    const user = rowToUser(rows[0]);
    if (!user) continue;
    const won = player.team === room.final.winner;
    const stats = user.stats || makeStats();
    if (won) stats.wins += 1;
    else stats.losses += 1;
    addWordStats(stats, room, player.team);
    const matches = [makeMatchEntry(room, player, matchId, finishedAt, won), ...(user.matches || [])].slice(0, 80);
    await pool.query("update codehack_users set stats = $2, matches = $3 where id = $1", [user.id, stats, matches]);
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
  const pool = getPool();
  const { rows } = await pool.query("select * from codehack_users where id = $1", [userId]);
  return rowToUser(rows[0]);
}

async function saveUserStatsAndMatches(userId, stats, matches) {
  await ensureSchema();
  const pool = getPool();
  await pool.query("update codehack_users set stats = $2, matches = $3 where id = $1", [userId, normalizeStats(stats), matches || []]);
}

async function loginToken(user) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL;
  localSessions.set(token, { userId: user.id, expiresAt });
  await ensureSchema();
  const pool = getPool();
  await pool.query("insert into codehack_sessions (token, user_id, expires_at) values ($1,$2,$3)", [token, user.id, expiresAt]);
  return { token, user: publicUser(user, true) };
}

