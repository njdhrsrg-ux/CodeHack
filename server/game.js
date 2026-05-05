import { WORD_BANKS } from "./words.js";

const TEAMS = ["red", "blue"];
const TEAM_NAMES = { red: "Time Vermelho", blue: "Time Azul" };
const MAX_HINTS = 3;
const WIN_CORRECT = 3;
const WIN_INTERCEPTS = 2;
const STARTING_LIVES = 2;
const MAX_ROUNDS = 8;

export function makeRoom(hostId, hostName) {
  const code = makeCode();
  const host = makePlayer(hostId, hostName, true);
  return {
    code,
    hostId,
    players: { [hostId]: host },
    settings: {
      category: "Geral",
      customWords: [],
      wordCount: 4,
      randomTeams: false
    },
    phase: "lobby",
    teams: {
      red: makeTeamState(),
      blue: makeTeamState()
    },
    round: 0,
    current: null,
    tiebreaker: null,
    final: null,
    chat: makeChatState(),
    log: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function makePlayer(id, name = "Operador", isHost = false) {
  return {
    id,
    name: cleanName(name),
    team: null,
    isHost,
    connected: true,
    joinedAt: Date.now()
  };
}

export function publicRoom(room, viewerId) {
  const viewer = room.players[viewerId];
  return {
    ...room,
    players: Object.values(room.players),
    teams: {
      red: maskTeam(room, "red", viewer),
      blue: maskTeam(room, "blue", viewer)
    },
    current: maskCurrent(room, viewer),
    tiebreaker: maskTiebreaker(room, viewer),
    chat: maskChat(room, viewer)
  };
}

export function addPlayer(room, id, name) {
  const cleaned = cleanName(name);
  if (room.phase !== "lobby") {
    const existing = Object.values(room.players).find((player) => player.name === cleaned);
    if (!existing) throw new Error("Partida em andamento. Entre com o mesmo nome usado antes de sair.");
    if (existing.connected) throw new Error("Ja existe um jogador conectado com este nome nesta partida.");
    reconnectPlayer(room, existing.id, id);
    touch(room);
    return id;
  }
  if (Object.values(room.players).some((player) => player.name === cleaned)) {
    throw new Error("Ja existe um jogador com esse nome nesta partida.");
  }
  room.players[id] = makePlayer(id, cleaned, false);
  touch(room);
  return id;
}

export function sendChatMessage(room, playerId, scope, text) {
  const player = room.players[playerId];
  if (!player?.connected) throw new Error("Jogador nao encontrado.");
  const cleaned = String(text || "").trim().slice(0, 240);
  if (!cleaned) throw new Error("Digite uma mensagem.");
  if (!room.chat) room.chat = makeChatState();
  room.chat.global ||= [];
  room.chat.team ||= { red: [], blue: [] };
  TEAMS.forEach((team) => {
    room.chat.team[team] ||= [];
  });
  const message = {
    id: `${Date.now()}-${playerId}-${Math.random().toString(36).slice(2, 8)}`,
    playerId,
    playerName: player.name,
    team: player.team,
    text: cleaned,
    at: Date.now()
  };
  if (scope === "global") {
    if (room.phase !== "lobby") throw new Error("Chat da sala fica disponivel apenas no lobby.");
    room.chat.global.push(message);
    room.chat.global = room.chat.global.slice(-80);
  } else if (scope === "team") {
    if (room.phase === "lobby") throw new Error("Chat do time fica disponivel durante o jogo.");
    if (!TEAMS.includes(player.team)) throw new Error("Entre em um time para usar o chat do time.");
    room.chat.team[player.team].push(message);
    room.chat.team[player.team] = room.chat.team[player.team].slice(-80);
  } else {
    throw new Error("Canal de chat invalido.");
  }
  touch(room);
}

export function removePlayer(room, playerId) {
  const player = room.players[playerId];
  if (!player) return;
  delete room.players[playerId];
  if (room.hostId === playerId) transferHost(room);
  if (room.current) {
    TEAMS.forEach((team) => {
      if (room.current.turns[team]?.coderId === playerId) chooseCoder(room, team);
    });
  }
  touch(room);
}

export function setPlayerConnected(room, playerId, connected) {
  if (!room.players[playerId]) return;
  room.players[playerId].connected = connected;
  if (!connected && room.hostId === playerId) transferHost(room);
  if (!connected && room.current) {
    TEAMS.forEach((team) => {
      if (room.current.turns[team]?.coderId === playerId) chooseCoder(room, team);
    });
  }
  touch(room);
}

export function updateSettings(room, playerId, settings) {
  guardHost(room, playerId);
  if (room.phase !== "lobby") throw new Error("A partida ja comecou.");
  room.settings = {
    ...room.settings,
    ...settings,
    wordCount: clamp(Number(settings.wordCount ?? room.settings.wordCount), 4, 6),
    customWords: Array.isArray(settings.customWords) ? settings.customWords.map(cleanWord).filter(Boolean) : room.settings.customWords
  };
  if (settings.randomTeams === true) {
    Object.values(room.players).forEach((player) => {
      player.team = null;
    });
  }
  touch(room);
}

export function movePlayer(room, hostId, playerId, team) {
  guardHost(room, hostId);
  setPlayerTeam(room, playerId, team, true);
}

export function chooseTeam(room, playerId, team) {
  setPlayerTeam(room, playerId, team, false);
}

function setPlayerTeam(room, playerId, team, byHost) {
  if (room.phase !== "lobby") throw new Error("Times so podem ser alterados no lobby.");
  if (room.settings.randomTeams) throw new Error("Times aleatorios estao ativos.");
  if (!TEAMS.includes(team) && team !== null) throw new Error("Time invalido.");
  if (!room.players[playerId]) throw new Error("Jogador nao encontrado.");
  room.players[playerId].team = team;
  touch(room);
}

export function kickPlayer(room, hostId, playerId) {
  guardHost(room, hostId);
  if (playerId === room.hostId) throw new Error("O host atual nao pode se remover.");
  removePlayer(room, playerId);
}

export function autoTeams(room, hostId) {
  guardHost(room, hostId);
  assignRandomTeams(room);
  touch(room);
}

function assignRandomTeams(room) {
  const players = Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt);
  shuffle(players).forEach((player, index) => {
    player.team = index % 2 === 0 ? "red" : "blue";
  });
}

export function startGame(room, hostId) {
  guardHost(room, hostId);
  if (room.settings.randomTeams) assignRandomTeams(room);
  const counts = teamCounts(room);
  if (counts.red < 2 || counts.blue < 2) throw new Error("Cada time precisa de pelo menos dois jogadores.");
  const bank = getWordBank(room.settings);
  if (bank.length < room.settings.wordCount * 2) throw new Error("A categoria precisa ter palavras suficientes.");
  const words = shuffle(bank);
  room.teams.red.words = words.slice(0, room.settings.wordCount);
  room.teams.blue.words = words.slice(room.settings.wordCount, room.settings.wordCount * 2);
  TEAMS.forEach((team) => {
    room.teams[team].hintHistory = [];
    room.teams[team].score = { correct: 0, interceptions: 0, lives: STARTING_LIVES };
    room.teams[team].codexIndex = -1;
  });
  room.round = 0;
  room.log = [];
  room.tiebreaker = null;
  room.final = null;
  room.chat = room.chat || makeChatState();
  room.chat.team = { red: [], blue: [] };
  beginRound(room);
}

export function submitHints(room, playerId, hints) {
  if (room.phase !== "playing") throw new Error("Nao e hora de enviar dicas.");
  const player = room.players[playerId];
  const team = player?.team;
  const turn = room.current?.turns?.[team];
  if (!turn) throw new Error("Time invalido.");
  if (turn.coderId !== playerId) throw new Error("Apenas o codificador pode enviar dicas.");
  if (turn.hints.length) throw new Error("As dicas deste time ja foram enviadas.");
  const cleaned = hints.map((hint) => String(hint || "").trim()).filter(Boolean);
  if (cleaned.length !== turn.code.length) throw new Error("Envie uma dica para cada numero.");
  turn.hints = cleaned.slice(0, MAX_HINTS);
  touch(room);
}

export function updateGuess(room, playerId, kind, guess, targetTeam) {
  if (room.phase !== "playing") throw new Error("Acao fora da fase atual.");
  const target = normalizeTargetTeam(kind, room.players[playerId], targetTeam);
  const turn = room.current.turns[target];
  guardDecision(room, playerId, kind, target, turn);
  const proposal = getProposal(turn, kind);
  proposal.guess = normalizePartialGuess(guess, room.settings.wordCount);
  proposal.updatedBy = playerId;
  proposal.confirmedBy = [];
  proposal.finalized = false;
  touch(room);
}

export function confirmDecision(room, playerId, kind, targetTeam) {
  if (room.phase !== "playing") throw new Error("Confirmacao fora da fase atual.");
  const target = normalizeTargetTeam(kind, room.players[playerId], targetTeam);
  const turn = room.current.turns[target];
  guardDecision(room, playerId, kind, target, turn);
  const proposal = getProposal(turn, kind);
  normalizeGuess(proposal.guess, room.settings.wordCount);
  if (!proposal.confirmedBy.includes(playerId)) proposal.confirmedBy.push(playerId);
  maybeFinalizeProposal(room, target, kind);
  touch(room);
}

export function confirmResult(room, playerId) {
  if (room.phase !== "roundResult") throw new Error("Resultado nao esta em confirmacao.");
  if (!room.current.resultConfirmedBy.includes(playerId)) room.current.resultConfirmedBy.push(playerId);
  if (allConnectedConfirmed(room.current.resultConfirmedBy, room)) {
    advanceAfterRoundResult(room);
  }
  touch(room);
}

export function updateTiebreaker(room, playerId, words) {
  if (room.phase !== "tiebreaker") throw new Error("Desempate nao esta ativo.");
  const player = room.players[playerId];
  const entry = room.tiebreaker?.[player?.team];
  if (!entry) throw new Error("Time invalido.");
  entry.guess = normalizeWordGuess(words, room.settings.wordCount);
  entry.updatedBy = playerId;
  entry.confirmedBy = [];
  entry.finalized = false;
  touch(room);
}

export function confirmTiebreaker(room, playerId) {
  if (room.phase !== "tiebreaker") throw new Error("Desempate nao esta ativo.");
  const player = room.players[playerId];
  const entry = room.tiebreaker?.[player?.team];
  if (!entry) throw new Error("Time invalido.");
  if (entry.guess.length !== room.settings.wordCount || entry.guess.some((word) => !word.trim())) {
    throw new Error("Preencha todas as palavras adversarias.");
  }
  if (!entry.confirmedBy.includes(playerId)) entry.confirmedBy.push(playerId);
  if (TEAMS.every((team) => tiebreakerFinalizedOrReady(room, team))) {
    scoreTiebreaker(room);
  }
  touch(room);
}

export function confirmFinal(room, playerId) {
  if (room.phase !== "gameOver") throw new Error("Final de jogo nao esta ativo.");
  if (!room.final.confirmedBy.includes(playerId)) room.final.confirmedBy.push(playerId);
  if (allConnectedConfirmed(room.final.confirmedBy, room)) returnToLobby(room);
  touch(room);
}

export function hostReturnLobby(room, hostId) {
  guardHost(room, hostId);
  returnToLobby(room);
  touch(room);
}

function beginRound(room) {
  room.round += 1;
  room.phase = "playing";
  room.current = {
    id: `${room.round}-${Date.now()}`,
    turns: {
      red: makeTurn(room.settings.wordCount),
      blue: makeTurn(room.settings.wordCount)
    },
    result: null,
    resultConfirmedBy: [],
    nextPhase: "playing"
  };
  TEAMS.forEach((team) => chooseCoder(room, team));
  touch(room);
}

function chooseCoder(room, team) {
  if (!room.current) return;
  const players = teamPlayers(room, team).filter((player) => player.connected);
  if (!players.length) {
    room.current.turns[team].coderId = null;
    return;
  }
  room.teams[team].codexIndex = (room.teams[team].codexIndex + 1) % players.length;
  room.current.turns[team].coderId = players[room.teams[team].codexIndex].id;
}

function maybeFinalizeProposal(room, targetTeam, kind) {
  const proposal = room.current.turns[targetTeam].proposals[kind];
  const players = eligibleDecisionPlayers(room, kind, targetTeam);
  if (proposal.confirmedBy.length < players.length) return;
  proposal.finalized = true;
  if (allDecisionsFinalized(room)) scoreRound(room);
}

function scoreRound(room) {
  const results = {};
  TEAMS.forEach((team) => {
    const rival = otherTeam(team);
    const turn = room.current.turns[team];
    const teamGuess = turn.proposals.team.guess;
    const interceptGuess = turn.proposals.intercept.guess;
    const intercepted = sameCode(turn.code, interceptGuess);
    const teamCorrect = intercepted ? null : sameCode(turn.code, teamGuess);
    if (intercepted) room.teams[rival].score.interceptions += 1;
    else if (teamCorrect) room.teams[team].score.correct += 1;
    else room.teams[team].score.lives = Math.max(0, room.teams[team].score.lives - 1);
    room.teams[team].hintHistory.unshift({
      round: room.round,
      code: turn.code,
      hints: turn.hints,
      teamGuess,
      interceptGuess,
      coderId: turn.coderId,
      at: Date.now()
    });
    results[team] = { code: turn.code, teamGuess, interceptGuess, teamCorrect, intercepted, team, rivalTeam: rival, decryptionSkipped: intercepted };
  });
  room.current.result = results;
  room.current.resultConfirmedBy = [];
  room.current.nextPhase = decideNextPhase(room);
  room.log.unshift({ round: room.round, results, at: Date.now() });
  room.phase = "roundResult";
}

function decideNextPhase(room) {
  const immediateWinner = winner(room);
  if (immediateWinner) {
    room.final = { winner: immediateWinner, reason: "condicao", confirmedBy: [] };
    return "gameOver";
  }
  if (room.round >= MAX_ROUNDS) {
    const ranked = rankAfterMaxRounds(room);
    if (ranked) {
      room.final = { winner: ranked, reason: "rodadas", confirmedBy: [] };
      return "gameOver";
    }
    return "tiebreaker";
  }
  return "playing";
}

function advanceAfterRoundResult(room) {
  if (room.current.nextPhase === "playing") {
    beginRound(room);
  } else if (room.current.nextPhase === "tiebreaker") {
    beginTiebreaker(room);
  } else {
    room.phase = "gameOver";
  }
}

function beginTiebreaker(room) {
  room.phase = "tiebreaker";
  room.tiebreaker = {
    red: { targetTeam: "blue", guess: Array(room.settings.wordCount).fill(""), updatedBy: null, confirmedBy: [], finalized: false },
    blue: { targetTeam: "red", guess: Array(room.settings.wordCount).fill(""), updatedBy: null, confirmedBy: [], finalized: false }
  };
}

function scoreTiebreaker(room) {
  const scores = {};
  TEAMS.forEach((team) => {
    const entry = room.tiebreaker[team];
    const targetWords = room.teams[entry.targetTeam].words;
    scores[team] = entry.guess.filter((word, index) => normalizeWord(word) === normalizeWord(targetWords[index])).length;
    entry.finalized = true;
  });
  let winnerTeam = null;
  if (scores.red > scores.blue) winnerTeam = "red";
  if (scores.blue > scores.red) winnerTeam = "blue";
  if (!winnerTeam) winnerTeam = room.teams.red.score.interceptions >= room.teams.blue.score.interceptions ? "red" : "blue";
  room.final = { winner: winnerTeam, reason: "desempate", tiebreakerScores: scores, confirmedBy: [] };
  room.phase = "gameOver";
}

function returnToLobby(room) {
  room.phase = "lobby";
  room.round = 0;
  room.current = null;
  room.tiebreaker = null;
  room.final = null;
  if (room.chat) room.chat.team = { red: [], blue: [] };
  TEAMS.forEach((team) => {
    room.teams[team] = makeTeamState();
  });
}

function reconnectPlayer(room, oldId, newId) {
  const player = room.players[oldId];
  if (!player) throw new Error("Jogador nao encontrado para reconexao.");
  room.players[newId] = { ...player, id: newId, connected: true };
  delete room.players[oldId];
  replacePlayerReference(room, oldId, newId);
}

function replacePlayerReference(room, oldId, newId) {
  if (room.hostId === oldId) room.hostId = newId;
  if (room.current) {
    TEAMS.forEach((team) => {
      const turn = room.current.turns[team];
      if (turn.coderId === oldId) turn.coderId = newId;
      Object.values(turn.proposals).forEach((proposal) => {
        if (proposal.updatedBy === oldId) proposal.updatedBy = newId;
        proposal.confirmedBy = proposal.confirmedBy.map((id) => id === oldId ? newId : id);
      });
    });
    room.current.resultConfirmedBy = room.current.resultConfirmedBy.map((id) => id === oldId ? newId : id);
  }
  if (room.tiebreaker) {
    TEAMS.forEach((team) => {
      const entry = room.tiebreaker[team];
      if (entry.updatedBy === oldId) entry.updatedBy = newId;
      entry.confirmedBy = entry.confirmedBy.map((id) => id === oldId ? newId : id);
    });
  }
  if (room.final) {
    room.final.confirmedBy = room.final.confirmedBy.map((id) => id === oldId ? newId : id);
  }
  Object.values(room.players).forEach((player) => {
    player.isHost = player.id === room.hostId;
  });
}

function allDecisionsFinalized(room) {
  return TEAMS.every((team) => {
    const proposals = room.current.turns[team].proposals;
    return proposals.team.finalized && proposals.intercept.finalized;
  });
}

function winner(room) {
  const candidates = TEAMS.filter((team) => {
    const score = room.teams[team].score;
    const rival = room.teams[otherTeam(team)].score;
    return score.correct >= WIN_CORRECT || score.interceptions >= WIN_INTERCEPTS || rival.lives <= 0;
  });
  return candidates.length === 1 ? candidates[0] : null;
}

function rankAfterMaxRounds(room) {
  const redScore = room.teams.red.score;
  const blueScore = room.teams.blue.score;
  if (redScore.correct !== blueScore.correct) return redScore.correct > blueScore.correct ? "red" : "blue";
  if (redScore.lives !== blueScore.lives) return redScore.lives > blueScore.lives ? "red" : "blue";
  return null;
}

function maskTeam(room, team, viewer) {
  const ownTeam = viewer?.team === team || room.phase === "gameOver";
  return {
    ...room.teams[team],
    words: ownTeam ? room.teams[team].words : []
  };
}

function maskCurrent(room, viewer) {
  if (!room.current) return null;
  const turns = {};
  TEAMS.forEach((team) => {
    const turn = room.current.turns[team];
    const canSeeCode = viewer?.id === turn.coderId || room.phase === "roundResult" || room.phase === "gameOver";
    turns[team] = {
      ...turn,
      code: canSeeCode ? turn.code : turn.code.map(() => "?")
    };
  });
  return {
    ...room.current,
    turns,
    result: room.phase === "roundResult" || room.phase === "gameOver" ? room.current.result : null
  };
}

function maskTiebreaker(room, viewer) {
  if (!room.tiebreaker) return null;
  return {
    red: maskTiebreakerEntry(room, viewer, "red"),
    blue: maskTiebreakerEntry(room, viewer, "blue")
  };
}

function maskChat(room, viewer) {
  const chat = room.chat || makeChatState();
  const teamMessages = TEAMS.includes(viewer?.team) ? chat.team?.[viewer.team] || [] : [];
  return {
    global: chat.global || [],
    team: room.phase === "lobby" ? [] : teamMessages
  };
}

function maskTiebreakerEntry(room, viewer, team) {
  const entry = room.tiebreaker[team];
  const canSee = viewer?.team === team || room.phase === "gameOver";
  return {
    ...entry,
    guess: canSee ? entry.guess : Array(room.settings.wordCount).fill("")
  };
}

function guardDecision(room, playerId, kind, targetTeam, turn) {
  const player = room.players[playerId];
  if (!player || !turn) throw new Error("Jogador fora desta decisao.");
  if (!turn.hints.length) throw new Error("As dicas deste codigo ainda nao foram enviadas.");
  if (turn.proposals[kind].finalized) throw new Error("Esta decisao ja foi fechada.");
  if (kind === "team") {
    if (player.team !== targetTeam) throw new Error("Apenas o proprio time pode descriptografar.");
    if (playerId === turn.coderId) throw new Error("O codificador nao vota no proprio codigo.");
  } else if (player.team !== otherTeam(targetTeam)) {
    throw new Error("Apenas o adversario pode interceptar.");
  }
}

function eligibleDecisionPlayers(room, kind, targetTeam) {
  const team = kind === "team" ? targetTeam : otherTeam(targetTeam);
  return teamPlayers(room, team).filter((player) => (
    player.connected && (kind !== "team" || player.id !== room.current.turns[targetTeam].coderId)
  ));
}

function getProposal(turn, kind) {
  if (!turn.proposals[kind]) turn.proposals[kind] = makeProposal();
  return turn.proposals[kind];
}

function tiebreakerFinalizedOrReady(room, team) {
  const entry = room.tiebreaker[team];
  const players = teamPlayers(room, team).filter((player) => player.connected);
  if (entry.confirmedBy.length >= players.length) {
    entry.finalized = true;
    return true;
  }
  return false;
}

function allConnectedConfirmed(confirmedBy, room) {
  const players = Object.values(room.players).filter((player) => player.connected);
  return players.length > 0 && players.every((player) => confirmedBy.includes(player.id));
}

function normalizeTargetTeam(kind, player, targetTeam) {
  if (!player) throw new Error("Jogador nao encontrado.");
  const target = targetTeam || (kind === "team" ? player.team : otherTeam(player.team));
  if (!TEAMS.includes(target)) throw new Error("Time alvo invalido.");
  return target;
}

function getWordBank(settings) {
  if (settings.category === "Personalizada") return shuffle(settings.customWords.map(cleanWord).filter(Boolean));
  return shuffle(WORD_BANKS[settings.category] || WORD_BANKS.Geral);
}

function makeSecretCode(wordCount) {
  return shuffle(Array.from({ length: wordCount }, (_, i) => i + 1)).slice(0, MAX_HINTS);
}

function normalizePartialGuess(guess, wordCount) {
  const values = Array.isArray(guess) ? guess : [];
  const code = Array.from({ length: MAX_HINTS }, (_, index) => {
    const value = values[index];
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isInteger(number) ? number : NaN;
  });
  const filled = code.filter((value) => value !== null);
  const unique = new Set(filled);
  if (unique.size !== filled.length || filled.some((value) => value < 1 || value > wordCount || Number.isNaN(value))) {
    throw new Error("O codigo precisa usar digitos validos e sem repeticao.");
  }
  return code;
}

function normalizeGuess(guess, wordCount) {
  const code = normalizePartialGuess(guess, wordCount);
  if (code.some((value) => value === null)) throw new Error("O codigo precisa ter 3 digitos.");
  return code;
}

function normalizeWordGuess(words, wordCount) {
  const values = Array.isArray(words) ? words : [];
  return Array.from({ length: wordCount }, (_, index) => String(values[index] || "").trim().slice(0, 40));
}

function makeTeamState() {
  return { words: [], hintHistory: [], score: { correct: 0, interceptions: 0, lives: STARTING_LIVES }, codexIndex: -1 };
}

function makeTurn(wordCount) {
  return {
    code: makeSecretCode(wordCount),
    coderId: null,
    hints: [],
    proposals: {
      team: makeProposal(),
      intercept: makeProposal()
    }
  };
}

function makeProposal() {
  return { guess: [], updatedBy: null, confirmedBy: [], finalized: false };
}

function makeChatState() {
  return {
    global: [],
    team: { red: [], blue: [] }
  };
}

function cleanName(name) {
  return String(name || "Operador").trim().replace(/\s+/g, " ").slice(0, 18) || "Operador";
}

function cleanWord(word) {
  return String(word || "").trim().slice(0, 28);
}

function normalizeWord(word) {
  return String(word || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function teamCounts(room) {
  return {
    red: teamPlayers(room, "red").length,
    blue: teamPlayers(room, "blue").length
  };
}

function teamPlayers(room, team) {
  return Object.values(room.players).filter((player) => player.team === team);
}

function transferHost(room) {
  const candidates = Object.values(room.players).filter((player) => player.connected);
  const next = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : Object.values(room.players)[0];
  room.hostId = next?.id || null;
  Object.values(room.players).forEach((player) => {
    player.isHost = player.id === room.hostId;
  });
  if (next) room.log.unshift({ system: `${next.name} assumiu como host.`, at: Date.now() });
}

function guardHost(room, playerId) {
  if (room.hostId !== playerId) throw new Error("Apenas o host pode executar esta acao.");
}

function otherTeam(team) {
  return team === "red" ? "blue" : "red";
}

function sameCode(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value || min));
}

function touch(room) {
  room.updatedAt = Date.now();
}

export const CONSTANTS = { TEAM_NAMES, WIN_CORRECT, WIN_INTERCEPTS, STARTING_LIVES, MAX_ROUNDS, WORD_BANKS };
