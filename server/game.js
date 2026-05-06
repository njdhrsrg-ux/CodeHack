import { WORD_BANKS } from "./words.js";

const TEAMS = ["red", "blue"];
const TEAM_NAMES = { red: "Time Vermelho", blue: "Time Azul" };
const MAX_HINTS = 3;
const WIN_CORRECT = 3;
const WIN_INTERCEPTS = 2;
const STARTING_LIVES = 2;
const MAX_ROUNDS = 8;

export function makeRoom(hostId, hostName, hostAvatar = "", hostClientId = hostId, roomOptions = {}) {
  const code = makeCode();
  const host = makePlayer(hostId, hostName, true, hostAvatar, hostClientId);
  return {
    code,
    name: cleanRoomName(roomOptions.roomName, host.name),
    password: cleanRoomPassword(roomOptions.password),
    publicRoom: roomOptions.publicRoom !== false,
    hostId,
    players: { [hostId]: host },
    settings: {
      category: "Geral",
      customWords: [],
      wordCount: 4,
      startingLives: STARTING_LIVES,
      winIntercepts: WIN_INTERCEPTS,
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
    departedPlayers: {},
    chat: makeChatState(),
    log: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function makePlayer(id, name = "Operador", isHost = false, avatar = "", clientId = id) {
  return {
    id,
    clientId: cleanClientId(clientId) || id,
    name: cleanName(name),
    avatar: cleanAvatar(avatar),
    team: null,
    spectator: false,
    isHost,
    connected: true,
    joinedRound: null,
    joinedAt: Date.now()
  };
}

export function publicRoom(room, viewerId) {
  const viewer = room.players[viewerId];
  const { departedPlayers: _departedPlayers, password: _password, ...visibleRoom } = room;
  const players = Object.values(room.players);
  return {
    ...visibleRoom,
    hasPassword: Boolean(room.password),
    viewerId,
    players,
    avatars: Object.fromEntries(players.map((player) => [player.id, player.avatar || ""])),
    teams: {
      red: maskTeam(room, "red", viewer),
      blue: maskTeam(room, "blue", viewer)
    },
    current: maskCurrent(room, viewer),
    tiebreaker: maskTiebreaker(room, viewer),
    chat: maskChat(room, viewer),
    blocked: gameBlockReason(room)
  };
}

export function addPlayer(room, id, name, avatar = "", clientId = id, role = null, options = {}) {
  const cleaned = cleanName(name);
  const cleanedClientId = cleanClientId(clientId) || id;
  if (Object.keys(room.players).length >= 12) throw new Error("A sala ja atingiu o limite de 12 jogadores.");
  const existingByClient = Object.values(room.players).find((player) => player.clientId === cleanedClientId);
  if (existingByClient) {
    const previousId = existingByClient.id;
    if (previousId !== id && existingByClient.connected && !options.allowActiveTakeover) {
      throw new Error("Este jogador ja esta conectado nesta sala em outra aba.");
    }
    room.players[id] = {
      ...existingByClient,
      id,
      clientId: cleanedClientId,
      avatar: cleanAvatar(avatar) || existingByClient.avatar,
      connected: true,
      rejoinedAt: Date.now()
    };
    if (previousId !== id) {
      delete room.players[previousId];
      replacePlayerReference(room, previousId, id);
      if (room.hostId === previousId) room.hostId = id;
      syncHostFlags(room);
    }
    if (room.phase !== "lobby") refreshProgressAfterPlayerRemoval(room);
    touch(room);
    return { playerId: id, previousId, playerName: room.players[id].name, eventType: "resume" };
  }
  if (Object.values(room.players).some((player) => player.name === cleaned)) {
    throw new Error("Ja existe um jogador com esse nome nesta partida.");
  }
  const departed = room.phase !== "lobby"
    ? Object.values(room.departedPlayers || {}).find((player) => player.clientId === cleanedClientId || player.name === cleaned)
    : null;
  if (!departed && room.phase !== "lobby" && !["player", "spectator"].includes(role)) {
    return { needsRoleChoice: true, playerName: cleaned };
  }
  if (departed) {
    room.players[id] = {
      ...departed,
      id,
      clientId: cleanedClientId,
      avatar: cleanAvatar(avatar) || departed.avatar,
      isHost: false,
      connected: true,
      rejoinedAt: Date.now()
    };
    delete room.departedPlayers[departed.name];
    replacePlayerReference(room, departed.id, id);
  } else {
    const player = makePlayer(id, cleaned, false, avatar, cleanedClientId);
    if (room.phase !== "lobby") {
      if (role === "spectator") {
        player.team = null;
        player.spectator = true;
      } else {
        player.team = balancedJoinTeam(room);
        if (!TEAMS.includes(player.team)) throw new Error("Os times de jogadores estao cheios. Entre como espectador.");
      }
      player.joinedRound = room.round;
    }
    room.players[id] = player;
  }
  if (room.phase !== "lobby") refreshProgressAfterPlayerRemoval(room);
  touch(room);
  return { playerId: id, previousId: departed?.id || null, playerName: room.players[id].name, eventType: departed ? "rejoin" : "join" };
}

export function roomJoinPreview(room) {
  return {
    code: room.code,
    phase: room.phase,
    players: Object.values(room.players).map((player) => ({
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      team: player.team,
      spectator: player.spectator,
      isHost: player.isHost
    }))
  };
}

export function updatePlayerAvatar(room, playerId, avatar) {
  const player = room.players[playerId];
  if (!player) throw new Error("Jogador nao encontrado.");
  player.avatar = cleanAvatar(avatar);
  touch(room);
  return player.avatar;
}

export function sendChatMessage(room, playerId, scope, text) {
  const player = room.players[playerId];
  if (!player?.connected) throw new Error("Jogador nao encontrado.");
  const cleaned = String(text || "").trim().slice(0, 240);
  if (!cleaned) throw new Error("Digite uma mensagem.");
  if (!room.chat) room.chat = makeChatState();
  room.chat.global ||= [];
  room.chat.team ||= { red: [], blue: [] };
  room.chat.spectator ||= [];
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
    if (player.spectator) throw new Error("Espectadores nao enviam mensagens no chat da sala durante a partida.");
    room.chat.global.push(message);
    room.chat.global = room.chat.global.slice(-80);
  } else if (scope === "team") {
    if (player.spectator) throw new Error("Espectadores podem ler chats dos times, mas nao enviar mensagens neles.");
    if (room.phase === "lobby") throw new Error("Chat do time fica disponivel durante o jogo.");
    if (!TEAMS.includes(player.team)) throw new Error("Entre em um time para usar o chat do time.");
    room.chat.team[player.team].push(message);
    room.chat.team[player.team] = room.chat.team[player.team].slice(-80);
  } else if (scope === "spectator") {
    if (!isSpectatorViewer(room, player)) throw new Error("Apenas espectadores podem usar este chat.");
    if (room.phase === "lobby") throw new Error("Chat dos espectadores fica disponivel durante o jogo.");
    room.chat.spectator.push(message);
    room.chat.spectator = room.chat.spectator.slice(-80);
  } else {
    throw new Error("Canal de chat invalido.");
  }
  touch(room);
}

export function removePlayer(room, playerId, options = {}) {
  const player = room.players[playerId];
  if (!player) return null;
  if (options.archive !== false) archiveDepartedPlayer(room, player);
  delete room.players[playerId];
  if (room.hostId === playerId) transferHost(room);
  refreshProgressAfterPlayerRemoval(room);
  touch(room);
  return player;
}

export function setPlayerConnected(room, playerId, connected) {
  if (!room.players[playerId]) return;
  room.players[playerId].connected = connected;
  if (!connected && room.hostId === playerId) transferHost(room);
  touch(room);
}

export function updateSettings(room, playerId, settings) {
  guardHost(room, playerId);
  if (room.phase !== "lobby") throw new Error("A partida ja comecou.");
  room.settings = {
    ...room.settings,
    ...settings,
    wordCount: clamp(Number(settings.wordCount ?? room.settings.wordCount), 4, 6),
    startingLives: clamp(Number(settings.startingLives ?? room.settings.startingLives ?? STARTING_LIVES), 1, 5),
    winIntercepts: clamp(Number(settings.winIntercepts ?? room.settings.winIntercepts ?? WIN_INTERCEPTS), 1, 5),
    customWords: Array.isArray(settings.customWords) ? settings.customWords.map(cleanWord).filter(Boolean) : room.settings.customWords
  };
  if (settings.randomTeams === true) {
    Object.values(room.players).forEach((player) => {
      player.team = null;
    });
  }
  if (settings.startingLives !== undefined) {
    TEAMS.forEach((team) => {
      room.teams[team].score.lives = room.settings.startingLives;
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
  if (TEAMS.includes(team) && teamPlayers(room, team).filter((player) => player.id !== playerId).length >= 4) {
    throw new Error("Este time ja tem o limite de 4 jogadores.");
  }
  room.players[playerId].team = team;
  room.players[playerId].spectator = team === null;
  touch(room);
}

export function kickPlayer(room, hostId, playerId) {
  guardHost(room, hostId);
  if (playerId === room.hostId) throw new Error("O host atual nao pode se remover.");
  removePlayer(room, playerId, { archive: false });
}

export function autoTeams(room, hostId) {
  guardHost(room, hostId);
  assignRandomTeams(room);
  touch(room);
}

function assignRandomTeams(room) {
  const players = Object.values(room.players).filter((player) => !player.spectator).sort((a, b) => a.joinedAt - b.joinedAt);
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
    room.teams[team].score = { correct: 0, interceptions: 0, lives: room.settings.startingLives || STARTING_LIVES };
    const players = teamPlayers(room, team);
    room.teams[team].codexIndex = players.length ? Math.floor(Math.random() * players.length) - 1 : -1;
  });
  room.round = 0;
  room.log = [];
  room.tiebreaker = null;
  room.final = null;
  room.departedPlayers = {};
  room.chat = room.chat || makeChatState();
  room.chat.team = { red: [], blue: [] };
  room.chat.spectator = [];
  Object.values(room.players).forEach((player) => {
    player.joinedRound = null;
  });
  beginRound(room);
}

export function submitHints(room, playerId, hints) {
  if (room.phase !== "playing") throw new Error("Nao e hora de enviar dicas.");
  ensureGameCanContinue(room);
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
  ensureGameCanContinue(room);
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
  ensureGameCanContinue(room);
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
  if (room.players[playerId]?.spectator) throw new Error("Espectadores nao confirmam resultados.");
  ensureGameCanContinue(room);
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
  if (room.players[playerId]?.spectator) throw new Error("Espectadores nao confirmam resultados.");
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
  const players = teamPlayers(room, team).filter((player) => player.connected && player.joinedRound !== room.round);
  if (!players.length) {
    room.current.turns[team].coderId = null;
    return;
  }
  room.teams[team].codexIndex = (room.teams[team].codexIndex + 1) % players.length;
  room.current.turns[team].coderId = players[room.teams[team].codexIndex].id;
}

function maybeFinalizeProposal(room, targetTeam, kind) {
  if (room.phase !== "playing") return;
  if (gameBlockReason(room)) return;
  const proposal = room.current.turns[targetTeam].proposals[kind];
  const players = eligibleDecisionPlayers(room, kind, targetTeam);
  if (!players.length) return;
  const eligibleIds = new Set(players.map((player) => player.id));
  proposal.confirmedBy = proposal.confirmedBy.filter((id) => eligibleIds.has(id));
  if (proposal.confirmedBy.length < players.length) return;
  proposal.finalized = true;
  if (allDecisionsFinalized(room)) scoreRound(room);
}

function refreshProgressAfterPlayerRemoval(room) {
  if (gameBlockReason(room)) return;
  if (room.phase === "playing" && room.current) {
    TEAMS.forEach((team) => {
      ["team", "intercept"].forEach((kind) => {
        if (room.phase !== "playing") return;
        const proposal = room.current.turns[team].proposals[kind];
        if (isCompleteGuess(proposal.guess, room.settings.wordCount)) maybeFinalizeProposal(room, team, kind);
      });
    });
  }
  if (room.phase === "roundResult" && room.current && allConnectedConfirmed(room.current.resultConfirmedBy, room)) {
    advanceAfterRoundResult(room);
  }
  if (room.phase === "tiebreaker" && room.tiebreaker && TEAMS.every((team) => tiebreakerFinalizedOrReady(room, team))) {
    scoreTiebreaker(room);
  }
  if (room.phase === "gameOver" && room.final && allConnectedConfirmed(room.final.confirmedBy, room)) {
    returnToLobby(room);
  }
}

function isCompleteGuess(guess, wordCount) {
  try {
    normalizeGuess(guess, wordCount);
    return true;
  } catch {
    return false;
  }
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
  const teamByPlayer = Object.fromEntries(Object.values(room.players).map((player) => [player.id, player.team]));
  room.phase = "lobby";
  room.settings.randomTeams = false;
  room.round = 0;
  room.current = null;
  room.tiebreaker = null;
  room.final = null;
  if (room.chat) room.chat.team = { red: [], blue: [] };
  TEAMS.forEach((team) => {
    room.teams[team] = makeTeamState();
    room.teams[team].score.lives = room.settings.startingLives || STARTING_LIVES;
  });
  Object.values(room.players).forEach((player) => {
    player.team = teamByPlayer[player.id] ?? player.team ?? null;
    player.connected = true;
    player.joinedRound = null;
  });
  room.departedPlayers = {};
}

function archiveDepartedPlayer(room, player) {
  if (room.phase === "lobby") return;
  room.departedPlayers ||= {};
  room.departedPlayers[player.name] = {
    ...player,
    connected: false,
    isHost: false,
    leftAt: Date.now()
  };
}

function replacePlayerReference(room, oldId, newId) {
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
    return score.correct >= WIN_CORRECT || score.interceptions >= (room.settings.winIntercepts || WIN_INTERCEPTS) || rival.lives <= 0;
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
  const ownTeam = viewer?.team === team || isSpectatorViewer(room, viewer) || room.phase === "gameOver";
  const score = room.phase === "lobby"
    ? { ...room.teams[team].score, lives: room.settings.startingLives || STARTING_LIVES }
    : room.teams[team].score;
  return {
    ...room.teams[team],
    score,
    words: ownTeam ? room.teams[team].words : []
  };
}

function maskCurrent(room, viewer) {
  if (!room.current) return null;
  const spectator = isSpectatorViewer(room, viewer);
  const turns = {};
  TEAMS.forEach((team) => {
    const turn = room.current.turns[team];
    const canSeeCode = viewer?.id === turn.coderId || spectator || room.phase === "roundResult" || room.phase === "gameOver";
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
  if (isSpectatorViewer(room, viewer) && room.phase !== "lobby") {
    return {
      global: chat.global || [],
      spectator: chat.spectator || [],
      team: {
        red: chat.team?.red || [],
        blue: chat.team?.blue || []
      }
    };
  }
  const teamMessages = TEAMS.includes(viewer?.team) ? chat.team?.[viewer.team] || [] : [];
  return {
    global: chat.global || [],
    spectator: [],
    team: room.phase === "lobby" ? [] : teamMessages
  };
}

function isSpectatorViewer(room, viewer) {
  return Boolean(viewer && room.phase !== "lobby" && (viewer.spectator || !TEAMS.includes(viewer.team)));
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
  const players = Object.values(room.players).filter((player) => player.connected && !player.spectator);
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
  if (filled.some((value) => value < 1 || value > wordCount || Number.isNaN(value))) {
    throw new Error("O codigo precisa usar digitos validos.");
  }
  return code;
}

function normalizeGuess(guess, wordCount) {
  const code = normalizePartialGuess(guess, wordCount);
  if (code.some((value) => value === null)) throw new Error("O codigo precisa ter 3 digitos.");
  if (new Set(code).size !== code.length) throw new Error("O codigo precisa ter 3 digitos sem repeticao.");
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
    team: { red: [], blue: [] },
    spectator: []
  };
}

function cleanName(name) {
  return String(name || "Operador").trim().replace(/\s+/g, " ").slice(0, 18) || "Operador";
}

function cleanRoomName(name, hostName = "Operador") {
  return String(name || `Sala de ${hostName}`).trim().replace(/\s+/g, " ").slice(0, 36) || `Sala de ${hostName}`;
}

function cleanRoomPassword(password) {
  return String(password || "").trim().slice(0, 32);
}

function cleanClientId(clientId) {
  return String(clientId || "").trim().replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 80);
}

function cleanAvatar(avatar) {
  const value = String(avatar || "");
  if (!value) return "";
  if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(value)) return "";
  return value.length <= 5000000 ? value : "";
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

function gameBlockReason(room) {
  if (!["playing", "roundResult", "tiebreaker"].includes(room.phase)) return "";
  const counts = teamCounts(room);
  if (counts.red < 2 || counts.blue < 2) {
    return "A partida esta pausada: cada time precisa ter pelo menos dois jogadores conectados.";
  }
  if (room.phase === "playing" && room.current) {
    const missingCoder = TEAMS.find((team) => {
      const turn = room.current.turns[team];
      return turn && !turn.hints.length && (!turn.coderId || !room.players[turn.coderId]);
    });
    if (missingCoder) {
      return `A partida esta pausada: o comunicador do ${TEAM_NAMES[missingCoder]} saiu antes de enviar as dicas.`;
    }
  }
  return "";
}

function ensureGameCanContinue(room) {
  const reason = gameBlockReason(room);
  if (reason) throw new Error(reason);
}

function balancedJoinTeam(room) {
  const counts = teamCounts(room);
  if (counts.red >= 4 && counts.blue >= 4) return null;
  if (counts.red >= 4) return "blue";
  if (counts.blue >= 4) return "red";
  if (counts.red < counts.blue) return "red";
  if (counts.blue < counts.red) return "blue";
  return Math.random() < 0.5 ? "red" : "blue";
}

function teamPlayers(room, team) {
  return Object.values(room.players).filter((player) => player.team === team);
}

function transferHost(room) {
  const candidates = Object.values(room.players).filter((player) => player.connected);
  const next = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : Object.values(room.players)[0];
  room.hostId = next?.id || null;
  syncHostFlags(room);
  if (next) room.log.unshift({ system: `${next.name} assumiu como host.`, at: Date.now() });
}

function syncHostFlags(room) {
  Object.values(room.players).forEach((player) => {
    player.isHost = player.id === room.hostId;
  });
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
