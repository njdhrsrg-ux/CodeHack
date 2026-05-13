import { RINGBOUND_ITEMS, RINGBOUND_RULE_GROUPS, RINGBOUND_RULES } from "./ringboundData.js";

const RING_COLORS = ["#ff4f8b", "#39d0ff", "#ffd23f"];

export const RINGBOUND_CONSTANTS = {
  ruleGroups: RINGBOUND_RULE_GROUPS,
  categories: Object.keys(RINGBOUND_RULES),
  maxRounds: 10
};

export function setupRingboundRoom(room, options = {}) {
  room.gameId = "ringbound";
  room.settings = {
    wordCategory: cleanCategory(options.wordCategory),
    ringCount: clamp(Number(options.ringCount || 3), 1, 3),
    masterMode: ["player", "game"].includes(options.masterMode) ? options.masterMode : "game"
  };
  room.ringbound = makeInitialRingboundState();
  return room;
}

export function normalizeRingboundRoom(room) {
  if (!room) return room;
  room.gameId = "ringbound";
  room.settings = {
    wordCategory: cleanCategory(room.settings?.wordCategory),
    ringCount: clamp(Number(room.settings?.ringCount || 3), 1, 3),
    masterMode: ["player", "game"].includes(room.settings?.masterMode) ? room.settings.masterMode : "game"
  };
  room.ringbound = {
    ...makeInitialRingboundState(),
    ...(room.ringbound || {}),
    rings: Array.isArray(room.ringbound?.rings) ? room.ringbound.rings : [],
    deck: Array.isArray(room.ringbound?.deck) ? room.ringbound.deck : [],
    placed: Array.isArray(room.ringbound?.placed) ? room.ringbound.placed : [],
    pending: room.ringbound?.pending || null,
    scores: room.ringbound?.scores || {},
    turnOrder: Array.isArray(room.ringbound?.turnOrder) ? room.ringbound.turnOrder : [],
    turnIndex: Number(room.ringbound?.turnIndex || 0)
  };
  return room;
}

export function ringboundPublicRoom(room, viewerId) {
  const viewer = room.players?.[viewerId];
  const isMaster = viewerId && viewerId === room.ringbound?.ringMasterId;
  const revealRules = isMaster || room.phase === "gameOver";
  const visible = {
    ...room,
    hasPassword: Boolean(room.password),
    viewerId,
    players: Object.values(room.players || {}),
    ringbound: {
      ...room.ringbound,
      deck: (room.ringbound?.deck || []).map((item) => ({ id: item.id, label: item.label })),
      placed: (room.ringbound?.placed || []).map(({ ruleCodes, ...item }) => item),
      pending: room.ringbound?.pending ? {
        ...room.ringbound.pending,
        item: room.ringbound.pending.item ? { id: room.ringbound.pending.item.id, label: room.ringbound.pending.item.label } : null
      } : null,
      rings: (room.ringbound?.rings || []).map((ring) => ({
        id: ring.id,
        color: ring.color,
        group: ring.group,
        groupLabel: RINGBOUND_RULE_GROUPS[ring.group] || ring.group,
        code: revealRules ? ring.code : undefined,
        label: revealRules ? ring.label : undefined
      }))
    }
  };
  delete visible.password;
  delete visible.departedPlayers;
  return visible;
}

export function updateRingboundSettings(room, playerId, settings = {}) {
  guardHost(room, playerId);
  if (room.phase !== "lobby") throw new Error("A partida ja comecou.");
  room.settings = {
    ...room.settings,
    wordCategory: cleanCategory(settings.wordCategory || room.settings?.wordCategory),
    ringCount: clamp(Number(settings.ringCount ?? room.settings?.ringCount ?? 3), 1, 3),
    masterMode: ["player", "game"].includes(settings.masterMode) ? settings.masterMode : room.settings?.masterMode || "game"
  };
  touch(room);
}

export function startRingboundGame(room, playerId) {
  guardHost(room, playerId);
  if (room.phase !== "lobby") throw new Error("A partida ja comecou.");
  const players = Object.values(room.players || {}).filter((player) => player.connected);
  if (!players.length) throw new Error("Nao ha jogadores na sala.");
  const category = cleanCategory(room.settings?.wordCategory);
  const selectedRules = shuffle(RINGBOUND_RULES[category]).slice(0, room.settings.ringCount);
  const rings = selectedRules.map((rule, index) => ({
    id: String.fromCharCode(65 + index),
    code: rule.code,
    label: rule.label,
    group: rule.group,
    color: RING_COLORS[index]
  }));
  const playableItems = shuffle(RINGBOUND_ITEMS[category].filter((item) => item[1].some((code) => selectedRules.some((rule) => rule.code === code)) || Math.random() > 0.45))
    .slice(0, RINGBOUND_CONSTANTS.maxRounds)
    .map(([label, ruleCodes]) => ({ id: makeId(), label, ruleCodes }));
  const ringMasterId = room.settings.masterMode === "player" ? players[Math.floor(Math.random() * players.length)].id : null;
  room.phase = "playing";
  room.ringbound = {
    rings,
    deck: playableItems,
    placed: [],
    pending: null,
    ringMasterId,
    turnOrder: players.map((player) => player.id),
    turnIndex: 0,
    round: 1,
    scores: Object.fromEntries(players.map((player) => [player.id, 0])),
    log: []
  };
  touch(room);
}

export function submitRingboundGuess(room, playerId, ringIds = []) {
  ensurePlaying(room);
  if (room.ringbound.pending) throw new Error("Aguarde a validacao do Mestre dos Aneis.");
  const currentPlayerId = currentTurnPlayerId(room);
  if (playerId !== currentPlayerId) throw new Error("Aguarde sua vez.");
  const item = room.ringbound.deck[0];
  if (!item) throw new Error("Nao ha item para posicionar.");
  const guess = normalizeRingIds(ringIds, room);
  const correct = correctRingIds(room, item);
  const autoMaster = room.settings.masterMode === "game";
  if (autoMaster) {
    placeRingboundItem(room, item, playerId, guess, correct, arraysEqual(guess, correct));
    return;
  }
  room.ringbound.pending = { item, playerId, guess, at: Date.now() };
  touch(room);
}

export function resolveRingboundGuess(room, playerId, ringIds = null) {
  ensurePlaying(room);
  if (playerId !== room.ringbound.ringMasterId) throw new Error("Apenas o Mestre dos Aneis pode validar.");
  const pending = room.ringbound.pending;
  if (!pending) throw new Error("Nao ha palpite pendente.");
  const correct = Array.isArray(ringIds) ? normalizeRingIds(ringIds, room) : correctRingIds(room, pending.item);
  placeRingboundItem(room, pending.item, pending.playerId, pending.guess, correct, arraysEqual(pending.guess, correct));
  room.ringbound.pending = null;
}

function placeRingboundItem(room, item, playerId, guess, correct, success) {
  room.ringbound.deck = room.ringbound.deck.slice(1);
  room.ringbound.placed.push({ ...item, playerId, guess, correct, success, at: Date.now() });
  room.ringbound.scores[playerId] = Number(room.ringbound.scores[playerId] || 0) + (success ? 1 : 0);
  room.ringbound.log.push({ item: item.label, playerId, guess, correct, success });
  room.ringbound.turnIndex = nextTurnIndex(room);
  room.ringbound.round = Number(room.ringbound.round || 1) + 1;
  if (!room.ringbound.deck.length) room.phase = "gameOver";
  touch(room);
}

function correctRingIds(room, item) {
  const rings = room.ringbound.rings || [];
  return rings.filter((ring) => item.ruleCodes.includes(ring.code)).map((ring) => ring.id).sort();
}

function normalizeRingIds(ringIds, room) {
  const valid = new Set((room.ringbound.rings || []).map((ring) => ring.id));
  return [...new Set((ringIds || []).map((id) => String(id || "").toUpperCase()).filter((id) => valid.has(id)))].sort();
}

function currentTurnPlayerId(room) {
  const order = (room.ringbound.turnOrder || []).filter((id) => room.players?.[id]?.connected && id !== room.ringbound.ringMasterId);
  if (!order.length) return null;
  return order[room.ringbound.turnIndex % order.length];
}

function nextTurnIndex(room) {
  const order = (room.ringbound.turnOrder || []).filter((id) => room.players?.[id]?.connected && id !== room.ringbound.ringMasterId);
  if (!order.length) return 0;
  return (room.ringbound.turnIndex + 1) % order.length;
}

function makeInitialRingboundState() {
  return { rings: [], deck: [], placed: [], pending: null, ringMasterId: null, turnOrder: [], turnIndex: 0, round: 0, scores: {}, log: [] };
}

function cleanCategory(category) {
  return RINGBOUND_RULES[category] ? category : "Geral";
}

function ensurePlaying(room) {
  if (room.gameId !== "ringbound" || room.phase !== "playing") throw new Error("Partida Ringbound nao esta em andamento.");
}

function guardHost(room, playerId) {
  if (room.hostId !== playerId) throw new Error("Apenas o host pode fazer isso.");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function touch(room) {
  room.updatedAt = Date.now();
}
