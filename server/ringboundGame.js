import { RINGBOUND_ITEMS, RINGBOUND_RING_TYPES, RINGBOUND_RULES } from "./ringboundData.js";

const DEFAULT_RING_TYPES = ["attribute", "word", "place"];
const HAND_SIZE = 5;

export const RINGBOUND_CONSTANTS = {
  ringTypes: RINGBOUND_RING_TYPES,
  categories: Object.keys(RINGBOUND_RULES),
  handSize: HAND_SIZE
};

export function setupRingboundRoom(room, options = {}) {
  room.gameId = "ringbound";
  room.settings = {
    wordCategory: cleanCategory(options.wordCategory),
    ringTypes: cleanRingTypes(options.ringTypes || DEFAULT_RING_TYPES),
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
    ringTypes: cleanRingTypes(room.settings?.ringTypes || ringCountToTypes(room.settings?.ringCount)),
    masterMode: ["player", "game"].includes(room.settings?.masterMode) ? room.settings.masterMode : "game"
  };
  room.ringbound = {
    ...makeInitialRingboundState(),
    ...(room.ringbound || {}),
    rings: Array.isArray(room.ringbound?.rings) ? room.ringbound.rings : [],
    deck: Array.isArray(room.ringbound?.deck) ? room.ringbound.deck : [],
    hands: room.ringbound?.hands && typeof room.ringbound.hands === "object" ? room.ringbound.hands : {},
    placed: Array.isArray(room.ringbound?.placed) ? room.ringbound.placed : [],
    pending: room.ringbound?.pending || null,
    scores: room.ringbound?.scores || {},
    turnOrder: Array.isArray(room.ringbound?.turnOrder) ? room.ringbound.turnOrder : [],
    turnIndex: Number(room.ringbound?.turnIndex || 0),
    round: Number(room.ringbound?.round || 0)
  };
  return room;
}

export function ringboundPublicRoom(room, viewerId) {
  const isMaster = viewerId && viewerId === room.ringbound?.ringMasterId;
  const revealRules = isMaster || room.phase === "gameOver";
  const publicHands = {};
  Object.entries(room.ringbound?.hands || {}).forEach(([playerId, hand]) => {
    publicHands[playerId] = (hand || []).map((item) => (
      playerId === viewerId || revealRules
        ? { id: item.id, label: item.label }
        : { id: item.id, label: "Carta oculta" }
    ));
  });
  const visible = {
    ...room,
    hasPassword: Boolean(room.password),
    viewerId,
    players: Object.values(room.players || {}),
    ringbound: {
      ...room.ringbound,
      hands: publicHands,
      deck: (room.ringbound?.deck || []).map((item) => ({ id: item.id })),
      placed: (room.ringbound?.placed || []).map(({ ruleCodes, ...item }) => item),
      pending: room.ringbound?.pending ? {
        ...room.ringbound.pending,
        item: room.ringbound.pending.item ? { id: room.ringbound.pending.item.id, label: room.ringbound.pending.item.label } : null
      } : null,
      rings: (room.ringbound?.rings || []).map((ring) => ({
        id: ring.id,
        type: ring.type,
        color: ring.color,
        groupLabel: ring.groupLabel,
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
    ringTypes: cleanRingTypes(settings.ringTypes || room.settings?.ringTypes || DEFAULT_RING_TYPES),
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
  const ringTypes = cleanRingTypes(room.settings?.ringTypes || DEFAULT_RING_TYPES);
  const selectedRules = ringTypes.map((type) => ({ ...randomFrom(RINGBOUND_RULES[category][type]), type }));
  const rings = selectedRules.map((rule, index) => {
    const typeInfo = RINGBOUND_RING_TYPES[rule.type];
    return {
      id: String.fromCharCode(65 + index),
      type: rule.type,
      code: rule.code,
      label: rule.label,
      groupLabel: typeInfo.label,
      color: typeInfo.color
    };
  });
  const itemPool = RINGBOUND_ITEMS[category].map(([label, ruleCodes]) => ({ label, ruleCodes }));
  const deck = buildDeck(itemPool, players.length * HAND_SIZE + 30);
  const hands = {};
  players.forEach((player) => {
    hands[player.id] = [];
  });
  dealInitialHands(hands, deck);
  const ringMasterId = room.settings.masterMode === "player" && players.length > 1
    ? randomFrom(players.filter((player) => player.id !== playerId) || players).id
    : null;
  room.phase = "playing";
  room.ringbound = {
    rings,
    deck,
    hands,
    placed: [],
    pending: null,
    ringMasterId,
    turnOrder: players.filter((player) => player.id !== ringMasterId).map((player) => player.id),
    turnIndex: 0,
    round: 1,
    scores: Object.fromEntries(players.map((player) => [player.id, 0])),
    log: []
  };
  touch(room);
}

export function submitRingboundGuess(room, playerId, ringIds = [], itemId = "") {
  ensurePlaying(room);
  if (room.ringbound.pending) throw new Error("Aguarde a validacao do Mestre dos Aneis.");
  const currentPlayerId = currentTurnPlayerId(room);
  if (playerId !== currentPlayerId) throw new Error("Aguarde sua vez.");
  const hand = room.ringbound.hands[playerId] || [];
  const item = hand.find((card) => card.id === itemId) || hand[0];
  if (!item) throw new Error("Voce nao tem cartas na mao.");
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
  room.ringbound.hands[playerId] = (room.ringbound.hands[playerId] || []).filter((card) => card.id !== item.id);
  if (!success) drawCard(room, playerId);
  room.ringbound.placed.push({ ...item, playerId, guess, correct, success, at: Date.now() });
  room.ringbound.scores[playerId] = Number(room.ringbound.scores[playerId] || 0) + (success ? 1 : 0);
  room.ringbound.log.push({ item: item.label, playerId, guess, correct, success });
  if (!success) room.ringbound.turnIndex = nextTurnIndex(room);
  room.ringbound.round = Number(room.ringbound.round || 1) + 1;
  if (hasWinner(room)) room.phase = "gameOver";
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

function hasWinner(room) {
  const activeIds = (room.ringbound.turnOrder || []).filter((id) => id !== room.ringbound.ringMasterId);
  return activeIds.some((id) => (room.ringbound.hands[id] || []).length === 0);
}

function dealInitialHands(hands, deck) {
  for (let round = 0; round < HAND_SIZE; round += 1) {
    Object.keys(hands).forEach((playerId) => drawCard({ ringbound: { hands, deck } }, playerId));
  }
}

function drawCard(room, playerId) {
  const card = room.ringbound.deck.shift();
  if (card) room.ringbound.hands[playerId].push(card);
}

function buildDeck(itemPool, minimumSize) {
  const deck = [];
  while (deck.length < minimumSize) {
    shuffle(itemPool).forEach((item) => {
      deck.push({ id: makeId(), label: item.label, ruleCodes: item.ruleCodes });
    });
  }
  return deck;
}

function makeInitialRingboundState() {
  return { rings: [], deck: [], hands: {}, placed: [], pending: null, ringMasterId: null, turnOrder: [], turnIndex: 0, round: 0, scores: {}, log: [] };
}

function cleanCategory(category) {
  return RINGBOUND_RULES[category] ? category : "Geral";
}

function cleanRingTypes(types) {
  const clean = [...new Set((Array.isArray(types) ? types : DEFAULT_RING_TYPES).filter((type) => RINGBOUND_RING_TYPES[type]))];
  return clean.length ? clean.slice(0, 3) : ["attribute"];
}

function ringCountToTypes(count) {
  return DEFAULT_RING_TYPES.slice(0, clamp(Number(count || 3), 1, 3));
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

function randomFrom(values) {
  return values[Math.floor(Math.random() * values.length)];
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
