import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import {
  BadgeCheck,
  Check,
  LogIn,
  LogOut,
  Play,
  RadioTower,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap
} from "lucide-react";
import "./styles.css";

const ICONS = {
  logo: "/icons/logo.png",
  life: "/icons/vida.png",
  decrypt: "/icons/descriptografia.png",
  confirmed: "/icons/confirmado.png",
  leader: "/icons/lider.png"
};
const socketUrl = import.meta.env.VITE_SOCKET_URL || (window.location.port === "5173" ? "http://localhost:3001" : window.location.origin);
const apiUrl = cleanBaseUrl(import.meta.env.VITE_API_URL || socketUrl);
const socket = io(socketUrl, { autoConnect: true });
const TEAMS = ["red", "blue"];
const DEFAULT_CONSTANTS = {
  WORD_BANKS: { Geral: [], Anime: [], "Pokemon": [], Filmes: [], Jogos: [] },
  TEAM_NAMES: { red: "Time Vermelho", blue: "Time Azul" },
  WIN_CORRECT: 3,
  WIN_INTERCEPTS: 2,
  STARTING_LIVES: 2,
  MAX_ROUNDS: 8
};

function App() {
  const [constants, setConstants] = useState(DEFAULT_CONSTANTS);
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [toast, setToast] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const me = room?.players.find((p) => p.id === playerId);
  useGameSounds(room, playerId);

  useEffect(() => {
    socket.on("constants", setConstants);
    socket.on("room:update", setRoom);
    socket.on("room:kicked", () => {
      setRoom(null);
      setToast("Voce foi removido da sala.");
    });
    return () => {
      socket.off("constants");
      socket.off("room:update");
      socket.off("room:kicked");
    };
  }, []);

  const action = (event, payload = {}) => new Promise((resolve) => {
    socket.emit(event, payload, (reply) => {
      if (!reply?.ok) setToast(reply?.error || "Falha de transmissao.");
      else setToast("");
      if (reply?.playerId) setPlayerId(reply.playerId);
      if (reply?.room) {
        rememberSession(reply.room, payload);
        setRoom(reply.room);
      }
      resolve(reply);
    });
  });

  function askConfirm(config) {
    setConfirmDialog(config);
  }

  async function confirmLeaveRoom() {
    const reply = await action("room:leave");
    if (reply?.ok) {
      setRoom(null);
      setPlayerId("");
    }
  }

  return (
    <div className={`app-shell ${!room ? "home-screen" : ""} ${me?.team || "neutral"}`}>
      <MatrixRain />
      {!room ? (
        <main className="home-layout">
          <div className="home-logo-frame">
            <div className="home-logo" aria-label="Logo do jogo">
              <IconImg src={ICONS.logo} alt="Logo do jogo" className="home-logo-img" />
            </div>
          </div>
          <Home action={action} toast={toast} />
        </main>
      ) : (
        <>
          <header className="topbar">
          <div className="brand">
            <div className="logo-mark"><IconImg src={ICONS.logo} alt="Logo do jogo" className="logo-img" /></div>
            <div>
              <strong>CODE HACK</strong>
              <span>combate de hackers</span>
            </div>
          </div>
          <div className="topbar-game-info">
            <div className="topbar-actions">
              <button onClick={() => askConfirm({
                title: "Voltar para a tela inicial?",
                text: "Voce sairá desta sala. Se a partida estiver em andamento, podera voltar usando o mesmo nome.",
                confirmLabel: "Voltar",
                onConfirm: confirmLeaveRoom
              })}><LogOut size={17} /> Tela inicial</button>
              {room.hostId === playerId && room.phase !== "lobby" && (
                <button onClick={() => askConfirm({
                  title: "Voltar todos para o lobby?",
                  text: "A partida atual sera encerrada e todos os jogadores retornarão ao lobby da sala.",
                  confirmLabel: "Voltar ao lobby",
                  onConfirm: () => action("host:returnLobby")
                })}><RotateCcw size={17} /> Voltar ao lobby</button>
              )}
            </div>
            {room.phase !== "lobby" && <RoundCounter room={room} constants={constants} />}
            <ScoreBoard room={room} constants={constants} />
          </div>
          </header>

          <main>
            {room.phase === "lobby" ? (
              <Lobby room={room} playerId={playerId} constants={constants} action={action} toast={toast} />
            ) : (
              <Game room={room} playerId={playerId} constants={constants} action={action} toast={toast} />
            )}
          </main>
        </>
      )}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={async () => {
            await confirmDialog.onConfirm?.();
            setConfirmDialog(null);
          }}
        />
      )}
    </div>
  );
}

function ConfirmDialog({ title, text, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <strong>{title}</strong>
        <p>{text}</p>
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" onClick={onConfirm}><BadgeCheck size={18} /> {confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Home({ action, toast }) {
  const [name, setName] = useLocalState("decrypto:name", "");
  const [code, setCode] = useLocalState("decrypto:lastRoomCode", "");
  return (
    <section className="home-grid enter">
      <div className="console-panel">
        <label>Nome do operador</label>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={18} placeholder="Seu nome" />
        <button className="primary" onClick={() => action("room:create", { name })}><Play size={18} /> Criar sala</button>
        <div className="join-row">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
          <button onClick={() => action("room:join", { code, name })}><LogIn size={18} /> Entrar</button>
        </div>
        {toast && <p className="toast">{toast}</p>}
      </div>
    </section>
  );
}

function Lobby({ room, playerId, constants, action, toast }) {
  const me = room.players.find((p) => p.id === playerId);
  const isHost = room.hostId === playerId;
  const [customCategories, setCustomCategories] = useLocalState("decrypto:customCategories", []);
  const [customName, setCustomName] = useState("");
  const [customWords, setCustomWords] = useState("");
  const categories = [...Object.keys(constants.WORD_BANKS), ...customCategories.map((cat) => cat.name), "Personalizada"];
  const selectedCustom = customCategories.find((cat) => cat.name === room.settings.category);

  function applyCategory(category) {
    const custom = customCategories.find((cat) => cat.name === category);
    action("room:settings", {
      category: custom ? "Personalizada" : category,
      customWords: custom ? custom.words : room.settings.customWords
    });
  }

  function saveCustom() {
    const words = customWords.split(",").map((word) => word.trim()).filter(Boolean);
    if (!customName.trim() || words.length < 12) return;
    setCustomCategories([...customCategories.filter((cat) => cat.name !== customName.trim()), { name: customName.trim(), words }]);
    setCustomName("");
    setCustomWords("");
  }

  return (
    <section className="lobby enter">
      <div className="room-banner">
        <div>
          <span>Sala</span>
          <strong>{room.code}</strong>
        </div>
        <div className="status-chip"><IconImg src={ICONS.leader} alt="Lider da sala" className="status-icon" /> Host: {room.players.find((p) => p.id === room.hostId)?.name}</div>
      </div>

      <div className="lobby-grid">
        <div className="panel">
          <h2><Users size={20} /> Tripulacao</h2>
          {!room.settings.randomTeams && (
            <>
              <TeamColumn team="red" room={room} playerId={playerId} isHost={isHost} action={action} />
              <TeamColumn team="blue" room={room} playerId={playerId} isHost={isHost} action={action} />
            </>
          )}
          <TeamColumn team={null} room={room} playerId={playerId} isHost={isHost} action={action} />
          {isHost && (
            <div className="host-actions">
              <button className={room.settings.randomTeams ? "active-toggle" : ""} onClick={() => action("room:settings", { randomTeams: !room.settings.randomTeams })}><Shuffle size={17} /> Times aleatorios</button>
              <button className="primary" onClick={() => action("game:start")}><Zap size={17} /> Iniciar</button>
            </div>
          )}
        </div>

        <div className="panel settings-panel">
          <h2><Sparkles size={20} /> Configuracoes</h2>
          <label>Categoria</label>
          <select disabled={!isHost} value={selectedCustom?.name || room.settings.category} onChange={(e) => applyCategory(e.target.value)}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <label>Dificuldade</label>
          <div className="segmented">
            {[4, 5, 6].map((count) => (
              <button key={count} disabled={!isHost} className={room.settings.wordCount === count ? "active" : ""} onClick={() => action("room:settings", { wordCount: count })}>{count} palavras</button>
            ))}
          </div>
          <div className="custom-box">
            <strong>Categoria local</strong>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nome da categoria" />
            <textarea value={customWords} onChange={(e) => setCustomWords(e.target.value)} placeholder="palavra, palavra, palavra..." />
            <button onClick={saveCustom}><BadgeCheck size={17} /> Salvar categoria</button>
          </div>
          <p className="small">Voce esta no {constants.TEAM_NAMES[me?.team] || "sem time"}.</p>
          {toast && <p className="toast">{toast}</p>}
        </div>
      </div>
      <ChatPanel room={room} playerId={playerId} action={action} scope="global" />
    </section>
  );
}

function TeamColumn({ team, room, playerId, isHost, action }) {
  const players = room.players.filter((player) => player.team === team);
  const randomLocked = room.settings.randomTeams;
  const me = room.players.find((player) => player.id === playerId);
  const headerAction = team === null
    ? { label: "Ficar sem time", nextTeam: null }
    : { label: `Entrar no ${teamLabel(team)}`, nextTeam: team };
  const canChooseHere = !randomLocked && me?.team !== team;
  return (
    <div className={`team-box ${team || "unassigned"}`}>
      <div className="team-header">
        <h3>{randomLocked && team === null ? "Times Aleatorios" : teamLabel(team)}</h3>
        {!randomLocked && (
          <button
            className={me?.team === team ? "team-join active" : "team-join"}
            disabled={!canChooseHere}
            onClick={() => action("player:team", { team: headerAction.nextTeam })}
          >
            {headerAction.label}
          </button>
        )}
      </div>
      {players.map((player) => (
        <div className="player-row" key={player.id}>
          <span className={player.connected ? "" : "offline"}>{player.isHost && <IconImg src={ICONS.leader} alt="Lider da sala" className="leader-icon" />} {player.name}</span>
          {isHost && !randomLocked && (
            <div className="row-actions">
              {[
                ["red", "Vermelho"],
                ["blue", "Azul"],
                [null, "Sem time"]
              ].map(([nextTeam, label]) => (
                <button
                  key={`${player.id}-${label}`}
                  className={player.team === nextTeam ? "active-choice" : ""}
                  title={`Mover para ${label}`}
                  onClick={() => action("host:move", { playerId: player.id, team: nextTeam })}
                >
                  {label}
                </button>
              ))}
              {player.id !== playerId && <button title="Remover da sala" onClick={() => action("host:kick", { playerId: player.id })}><Trash2 size={15} /></button>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ChatPanel({ room, playerId, action, scope }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const me = room.players.find((player) => player.id === playerId);
  const isTeamChat = scope === "team";
  const canUseTeamChat = isTeamChat && room.phase !== "lobby" && TEAMS.includes(me?.team);
  const messages = isTeamChat ? room.chat?.team || [] : room.chat?.global || [];

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  if (isTeamChat && !canUseTeamChat) return null;

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const reply = await action("chat:send", { scope, text });
    if (reply?.ok) setDraft("");
  }

  return (
    <section className={`chat-panel team-surface ${me?.team || ""} ${isTeamChat ? "team-chat" : "global-chat"}`}>
      <h2>{isTeamChat ? "Chat do time" : "Chat da sala"}</h2>
      <div className="chat-messages" ref={listRef}>
        {messages.length ? messages.map((message) => (
          <div className={`chat-message ${message.playerId === playerId ? "mine" : ""}`} key={message.id}>
            <div className="chat-meta">
              <strong>{message.playerName}</strong>
              {message.team && <span className={`chat-team ${message.team}`}>{teamLabel(message.team)}</span>}
            </div>
            <p>{message.text}</p>
          </div>
        )) : <p className="small">Nenhuma mensagem ainda.</p>}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input value={draft} maxLength={240} onChange={(event) => setDraft(event.target.value)} placeholder={isTeamChat ? "Mensagem para seu time" : "Mensagem para a sala"} />
        <button type="submit">Enviar</button>
      </form>
    </section>
  );
}

function Game({ room, playerId, constants, action, toast }) {
  const me = room.players.find((p) => p.id === playerId);
  const myTeam = me?.team;
  const rival = otherTeam(myTeam);
  const winner = getWinner(room, constants);

  return (
    <section className="game-page enter">
      <div className="game-grid">
        <aside className="left-rail">
          <WordsPanel title="Suas palavras" team={myTeam} words={room.teams[myTeam]?.words || []} category={room.settings.category} />
          <ChatPanel room={room} playerId={playerId} action={action} scope="team" />
        </aside>

        <div className="play-panel">
          {room.phase === "playing" && <LiveRound room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "roundResult" && <RoundResult room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "tiebreaker" && <Tiebreaker room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "gameOver" && <GameOver room={room} playerId={playerId} constants={constants} winner={winner} action={action} />}
          {toast && <p className="toast">{toast}</p>}
        </div>

        <aside className={`right-rail team-surface ${rival || ""}`}>
          <h2><BadgeCheck size={20} /> Confirmacoes adversarias</h2>
          <ConfirmPanel room={room} playerId={playerId} constants={constants} />
        </aside>
      </div>
      <HintHistory room={room} constants={constants} playerId={playerId} />
    </section>
  );
}

function LiveRound({ room, playerId, constants, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const myTeam = me?.team;
  const rival = otherTeam(myTeam);
  const ownTurn = room.current.turns[myTeam];
  const rivalTurn = room.current.turns[rival];
  const isCoder = ownTurn?.coderId === playerId;

  return (
    <div className="live-stack">
      {isCoder && !ownTurn.hints.length ? (
        <HintsPhase room={room} targetTeam={myTeam} action={action} />
      ) : (
        <StatusCard
          title={ownTurn?.hints.length ? "Suas dicas foram transmitidas" : "Aguardando seu codificador"}
          text={ownTurn?.hints.length ? "Seu time ja pode descriptografar e o adversario ja pode interceptar." : "Quando as dicas sairem, a descriptografia fica disponivel para seu time."}
          team={myTeam}
        />
      )}

      <div className="decision-grid">
        <GuessPhase
          room={room}
          playerId={playerId}
          kind="team"
          targetTeam={myTeam}
          title="Descriptografar seu codigo"
          hints={ownTurn?.hints || []}
          action={action}
        />
        <GuessPhase
          room={room}
          playerId={playerId}
          kind="intercept"
          targetTeam={rival}
          title={`Interceptar ${constants.TEAM_NAMES[rival]}`}
          hints={rivalTurn?.hints || []}
          action={action}
        />
      </div>
    </div>
  );
}

function StatusCard({ title, text, team }) {
  return (
    <div className={`status-card team-surface ${team || ""}`}>
      <p className="eyebrow"><RadioTower size={16} /> sincronizacao</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function HintsPhase({ room, targetTeam, action }) {
  const [hints, setHints] = useState(["", "", ""]);
  const [reviewing, setReviewing] = useState(false);
  const turn = room.current.turns[targetTeam];
  const words = room.teams[targetTeam]?.words || [];

  useEffect(() => {
    if (reviewing) playConfirmCue();
  }, [reviewing]);

  return (
    <div className={`phase-card compact team-surface ${targetTeam}`}>
      <p className="eyebrow"><Zap size={16} /> codigo confidencial</p>
      <div className="secret-code">{turn.code.join("-")}</div>
      <div className="hint-grid">
        {turn.code.map((number, index) => (
          <label key={`${number}-${index}`}>Dica para {words[number - 1] || `#${number}`}
            <input value={hints[index]} onChange={(e) => setHints(hints.map((hint, i) => i === index ? e.target.value : hint))} placeholder="Digite uma pista curta" />
          </label>
        ))}
      </div>
      {!reviewing ? (
        <button className="primary pulse" disabled={hints.filter((hint) => hint.trim()).length !== 3} onClick={() => setReviewing(true)}><BadgeCheck size={18} /> Revisar dicas</button>
      ) : (
        <div className="inline-confirm confirmation-alert">
          <div className="confirm-warning">
            <BadgeCheck size={32} />
            <div>
              <strong>Confirmacao final</strong>
              <span>Depois de enviar, as dicas ficam visiveis para todos os jogadores.</span>
            </div>
          </div>
          <HintsList hints={hints} />
          <div className="inline-actions">
            <button onClick={() => setReviewing(false)}>Editar</button>
            <button className="primary" onClick={() => action("game:hints", { hints })}><BadgeCheck size={18} /> Enviar dicas</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GuessPhase({ room, playerId, kind, targetTeam, title, hints, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const turn = room.current.turns[targetTeam];
  const proposal = turn.proposals[kind];
  const isOwnCoderGuess = kind === "team" && turn.coderId === playerId;
  const expectedTeam = kind === "team" ? targetTeam : otherTeam(targetTeam);
  const canAct = me?.team === expectedTeam && !isOwnCoderGuess && hints.length > 0 && !proposal?.finalized;
  const canViewSharedGuess = me?.team === expectedTeam && hints.length > 0;
  const voters = room.players.filter((player) => player.team === expectedTeam && player.connected && (kind !== "team" || player.id !== turn.coderId));

  function updateShared(nextGuess) {
    action("game:updateGuess", { kind, targetTeam, guess: nextGuess });
  }

  return (
    <div className={`decision-card team-surface ${targetTeam} ${canAct ? "ready" : ""}`}>
      <p className="eyebrow"><RadioTower size={16} /> {title}</p>
      {!hints.length && <p className="small">Aguardando dicas deste codigo.</p>}
      {canViewSharedGuess ? (
        <>
          {isOwnCoderGuess && (
            <div className="coder-code-reminder">
              <span>Codigo correto</span>
              <strong>{turn.code.join("-")}</strong>
            </div>
          )}
          <HintChoiceGrid hints={hints} value={proposal.guess || []} setValue={updateShared} wordCount={room.settings.wordCount} disabled={!canAct} />
          {canAct ? (
            <button className="primary" disabled={filledCount(proposal.guess || []) !== 3} onClick={() => action("game:confirmDecision", { kind, targetTeam })}><BadgeCheck size={18} /> Confirmar {displayGuess(proposal.guess)}</button>
          ) : (
            <p className="small">{isOwnCoderGuess ? "Codificador acompanha a escolha, mas nao participa da descriptografia do proprio codigo." : proposal?.finalized ? "Decisao fechada." : "Sem acao disponivel para voce agora."}</p>
          )}
        </>
      ) : (
        <p className="small">{isOwnCoderGuess ? "Codificador nao participa da descriptografia do proprio codigo." : proposal?.finalized ? "Decisao fechada." : "Sem acao disponivel para voce agora."}</p>
      )}
      <ConfirmationRoster players={voters} confirmedBy={proposal.confirmedBy || []} />
    </div>
  );
}

function HintChoiceGrid({ hints, value, setValue, wordCount, disabled = false }) {
  return (
    <div className="choice-wrap">
      {[0, 1, 2].map((slot) => (
        <div className="choice-slot" key={slot}>
          <span className="choice-hint">{hints[slot]}</span>
          <div className="choice-buttons">
            {Array.from({ length: wordCount }, (_, index) => index + 1).map((number) => {
              const selected = value[slot] === number;
              const usedElsewhere = value.includes(number) && !selected;
              return (
                <button
                  key={number}
                  className={selected ? "active" : ""}
                  disabled={disabled || usedElsewhere}
                  onClick={() => setValue(setSlot(value, slot, number))}
                >
                  {number}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmationRoster({ players, confirmedBy }) {
  return (
    <div className="confirm-roster">
      {players.map((player) => {
        const confirmed = confirmedBy.includes(player.id);
        return (
          <div className={`confirm-person ${confirmed ? "confirmed" : ""}`} key={player.id}>
            <IconImg src={ICONS.confirmed} alt={confirmed ? "Confirmado" : "Nao confirmado"} className="confirm-icon" />
            <span>{player.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function RoundResult({ room, playerId, constants, action }) {
  const results = room.current.result;
  const confirmed = room.current.resultConfirmedBy || [];
  const me = room.players.find((player) => player.id === playerId);
  const orderedTeams = me?.team ? [me.team, otherTeam(me.team)] : TEAMS;
  return (
    <div className="phase-card reveal">
      <p className="eyebrow"><Sparkles size={16} /> resultado simultaneo</p>
      <div className="result-grid two">
        {orderedTeams.map((team) => (
          <ResultTeamTile
            key={team}
            team={team}
            result={results[team]}
            constants={constants}
            viewerTeam={me?.team}
          />
        ))}
      </div>
      <ConfirmationRoster players={room.players.filter((player) => player.connected)} confirmedBy={confirmed} />
      <button className="primary" disabled={confirmed.includes(playerId)} onClick={() => action("game:confirmResult")}><Play size={18} /> Confirmar resultado</button>
    </div>
  );
}

function ResultTeamTile({ team, result, constants, viewerTeam }) {
  useResultSounds(result, team, viewerTeam);
  return (
    <div className={`result-tile team-surface ${team}`} key={team}>
            <span>{constants.TEAM_NAMES[team]}</span>
            <div className="result-code-list">
        <CodeLine values={result.code} tone="correct" />
        <CodeLine
          values={result.interceptGuess}
          tone={otherTeam(team)}
          status={result.intercepted}
          className="intercept-reveal"
        />
        {result.decryptionSkipped ? (
          <div className="result-code-line skipped decrypt-reveal">
            <strong>Descriptografia ignorada</strong>
          </div>
        ) : (
          <CodeLine
            values={result.teamGuess}
            tone={team}
            status={result.teamCorrect}
            className="decrypt-reveal"
          />
        )}
            </div>
          </div>
  );
}

function Tiebreaker({ room, playerId, constants, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const entry = room.tiebreaker?.[me?.team];
  const target = entry?.targetTeam;
  const [draft, setDraft] = useState(entry?.guess || []);

  useEffect(() => {
    setDraft(entry?.guess || []);
  }, [entry?.guess?.join("|")]);

  if (!entry) return null;
  return (
    <div className="phase-card reveal">
      <p className="eyebrow"><Sparkles size={16} /> desempate final</p>
      <h1>Adivinhe as palavras do {constants.TEAM_NAMES[target]}.</h1>
      <div className="word-guess-grid">
        {Array.from({ length: room.settings.wordCount }, (_, index) => (
          <input
            key={index}
            value={draft[index] || ""}
            onChange={(event) => {
              const next = [...draft];
              next[index] = event.target.value;
              setDraft(next);
              action("game:updateTiebreaker", { words: next });
            }}
            placeholder={`Palavra #${index + 1}`}
          />
        ))}
      </div>
      <ConfirmationRoster players={room.players.filter((player) => player.team === me.team && player.connected)} confirmedBy={entry.confirmedBy || []} />
      <button className="primary" onClick={() => action("game:confirmTiebreaker")}><BadgeCheck size={18} /> Confirmar palavras</button>
    </div>
  );
}

function GameOver({ room, playerId, constants, winner, action }) {
  const confirmed = room.final?.confirmedBy || [];
  useFinalSounds(room, winner, playerId);
  return (
    <div className={`phase-card reveal team-surface ${winner}`}>
      <p className="eyebrow"><IconImg src={ICONS.leader} alt="Vencedor" className="status-icon" /> fim de jogo</p>
      <h1>{constants.TEAM_NAMES[winner]} venceu.</h1>
      <div className="result-grid two">
        {TEAMS.map((team) => (
          <FinalScoreTile key={team} team={team} room={room} constants={constants} winner={winner} />
        ))}
      </div>
      <FinalWords room={room} constants={constants} />
      <ConfirmationRoster players={room.players.filter((player) => player.connected)} confirmedBy={confirmed} />
      <button className="primary" disabled={confirmed.includes(playerId)} onClick={() => action("game:confirmFinal")}><Play size={18} /> Voltar ao lobby</button>
    </div>
  );
}

function ScoreBoard({ room, constants }) {
  return (
    <div className="scoreboard">
      {TEAMS.map((team) => {
        const score = room.teams[team].score;
        return (
          <div className={`score team-surface ${team}`} key={team}>
            <span>{constants.TEAM_NAMES[team]}</span>
            <small>
              <IconImg src={ICONS.life} alt="Vidas" className="game-icon life-icon" /> {score.lives}/{constants.STARTING_LIVES}
              <IconImg src={ICONS.decrypt} alt="Descriptografias" className="game-icon decrypt-icon" /> {score.interceptions}/{constants.WIN_INTERCEPTS}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function RoundCounter({ room, constants }) {
  return (
    <div className="round-counter">
      <span>Rodada</span>
      <strong>{room.round}/{constants.MAX_ROUNDS}</strong>
    </div>
  );
}

function WordsPanel({ title, team, words, category }) {
  return (
    <div className={`words-panel team-surface ${team || ""}`}>
      <h2>{title}</h2>
      {words.map((word, index) => (
        <div className={category === "Geral" ? "word-card no-image" : "word-card"} key={`${word}-${index}`}>
          {category !== "Geral" && <WordImage word={word} index={index} category={category} />}
          <div>
            <strong><span className="word-number">#{index + 1} </span>{word}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function WordImage({ word, index, category }) {
  const seed = Array.from(word).reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 23;
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(word === "CRIPTOGRAFADA");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(word === "CRIPTOGRAFADA");
    setUrl("");
    if (word === "CRIPTOGRAFADA") return undefined;
    const imageQuery = [word, imageCategoryTerm(category)].filter(Boolean).join(" ");
    fetch(`${apiUrl}/api/image?q=${encodeURIComponent(imageQuery)}`)
      .then((response) => response.json())
      .then((data) => {
        if (alive && data.url) setUrl(data.url);
        else if (alive) setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [word, category]);

  if (failed || !url) return <div className="mock-image" style={{ "--hue": seed % 360 }} aria-label={`Imagem relacionada a ${word}`}>{word.slice(0, 2).toUpperCase()}</div>;
  return (
    <>
      <button className="word-image-button" type="button" onClick={() => setExpanded(true)} aria-label={`Ampliar imagem relacionada a ${word}`}>
        <img className="word-image" src={url} alt={`Imagem relacionada a ${word}`} loading="lazy" onError={() => setFailed(true)} />
      </button>
      {expanded && createPortal((
        <div className="image-zoom-overlay" role="presentation" onClick={() => setExpanded(false)}>
          <img className="image-zoom" src={url} alt={`Imagem ampliada relacionada a ${word}`} />
        </div>
      ), document.body)}
    </>
  );
}

function HintsList({ hints }) {
  return <div className="hints-list">{hints.map((hint, index) => <div className="hint" key={index}>{hint}</div>)}</div>;
}

function ConfirmPanel({ room, playerId, constants }) {
  if (room.phase !== "playing") return <p className="small">Sem votacao em aberto.</p>;
  const me = room.players.find((player) => player.id === playerId);
  const rival = otherTeam(me?.team);
  const entries = TEAMS.flatMap((targetTeam) => ["team", "intercept"].map((kind) => {
    const proposal = room.current.turns[targetTeam].proposals[kind];
    if (!proposal) return null;
    const votingTeam = kind === "team" ? targetTeam : otherTeam(targetTeam);
    if (votingTeam !== rival) return null;
    const voters = room.players.filter((player) => player.team === votingTeam && player.connected && (kind !== "team" || player.id !== room.current.turns[targetTeam].coderId));
    return { targetTeam, kind, proposal, voters };
  })).filter(Boolean);
  if (!entries.length) return <p className="small">A equipe adversaria ainda nao iniciou uma confirmacao.</p>;
  return (
    <div className="confirm-list">
      {entries.map(({ targetTeam, kind, proposal, voters }) => (
          <div className={`confirm-box team-surface ${rival}`} key={`${targetTeam}-${kind}`}>
            <strong>{kind === "team" ? "Descriptografia" : "Interceptacao"}</strong>
            <ConfirmationRoster players={voters} confirmedBy={proposal.confirmedBy || []} />
          </div>
      ))}
    </div>
  );
}

function HintHistory({ room, constants, playerId }) {
  const me = room.players.find((player) => player.id === playerId);
  return (
    <div className={`history-section team-surface ${me?.team || ""}`}>
      <h2><RadioTower size={20} /> Historico de dicas</h2>
      <div className="history-grid">
        {TEAMS.map((team) => (
          <div className={`hint-board team-surface ${team}`} key={team}>
            <strong>{constants.TEAM_NAMES[team]}</strong>
            <div className="hint-board-grid" style={{ "--cols": room.settings.wordCount }}>
              {Array.from({ length: room.settings.wordCount }, (_, column) => (
              <div className="hint-column" key={column}>
                <span>#{column + 1}</span>
                  {orderedHistory(room.teams[team].hintHistory).map((entry) => {
                    const hintIndex = entry.code.indexOf(column + 1);
                    return hintIndex >= 0 ? <p key={`${entry.round}-${column}`}>{entry.hints[hintIndex]}</p> : null;
                  })}
                </div>
            ))}
          </div>
          <div className="history-rounds">
            {orderedHistory(room.teams[team].hintHistory).map((entry) => (
              <div className={`history-round team-surface ${team}`} key={`codes-${team}-${entry.round}`}>
                <strong>Rodada {entry.round}</strong>
                <div className="round-code-list">
                  {[0, 1, 2].map((slot) => (
                    <div className="round-code-row" key={`${entry.round}-${slot}`}>
                      <span className="round-hint">{entry.hints[slot]}</span>
                      <span className="code-chip correct-code">{entry.code[slot] || "?"}</span>
                      <span className={`code-chip ${team}`}>{entry.teamGuess?.[slot] || "?"}</span>
                      <span className={`code-chip ${otherTeam(team)}`}>{entry.interceptGuess?.[slot] || "?"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}

function ResultTile({ label, value, good, team }) {
  return <div className={`result-tile team-surface ${team || ""} ${good ? "good" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function FinalScoreTile({ team, room, constants, winner }) {
  const score = room.teams[team].score;
  return (
    <div className={`result-tile final-score team-surface ${team} ${team === winner ? "good" : ""}`}>
      <span>{constants.TEAM_NAMES[team]}</span>
      <div className="final-score-row">
        <span><IconImg src={ICONS.life} alt="Vidas" className="game-icon life-icon" /> {score.lives}/{constants.STARTING_LIVES}</span>
        <span><IconImg src={ICONS.decrypt} alt="Descriptografias" className="game-icon decrypt-icon" /> {score.interceptions}/{constants.WIN_INTERCEPTS}</span>
      </div>
    </div>
  );
}

function FinalWords({ room, constants }) {
  const hasTiebreaker = Boolean(room.tiebreaker && room.final?.reason === "desempate");
  return (
    <div className="final-words-grid">
      {TEAMS.map((team) => {
        const guesser = otherTeam(team);
        const guesses = room.tiebreaker?.[guesser]?.guess || [];
        return (
          <div className={`final-words team-surface ${team}`} key={`final-words-${team}`}>
            <strong>{constants.TEAM_NAMES[team]}</strong>
            <div className="final-word-list">
              {(room.teams[team].words || []).map((word, index) => {
                const guess = guesses[index] || "";
                const right = hasTiebreaker && normalizeWordText(guess) === normalizeWordText(word);
                return (
                  <div className="final-word-card" key={`${team}-${word}-${index}`}>
                    <span><span className="word-number">#{index + 1} </span>{word}</span>
                    {hasTiebreaker && (
                      <small className={right ? "guess-ok" : "guess-bad"}>
                        {guess || "sem palpite"} {right ? <Check size={15} /> : <X size={15} />}
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CodeLine({ values = [], tone, status, className = "" }) {
  return (
    <div className={`result-code-line ${tone} ${className}`}>
      <strong>{displayGuess(values)}</strong>
      {typeof status === "boolean" && (
        <span className={status ? "result-mark ok" : "result-mark bad"} aria-label={status ? "correto" : "incorreto"}>
          {status ? <Check size={18} /> : <X size={18} />}
        </span>
      )}
    </div>
  );
}

function MatrixRain() {
  return <div className="matrix-bg" aria-hidden="true">{Array.from({ length: 34 }).map((_, i) => <span key={i} style={{ "--i": i, "--d": `${3 + (i % 7)}s` }}>10110011</span>)}</div>;
}

function IconImg({ src, alt, className = "" }) {
  return <img src={src} alt={alt} className={className} aria-hidden={alt === "" ? "true" : undefined} />;
}

function getWinner(room, constants) {
  if (room.final?.winner) return room.final.winner;
  return TEAMS.find((team) => {
    const score = room.teams[team].score;
    const rival = room.teams[otherTeam(team)].score;
    return score.correct >= constants.WIN_CORRECT || score.interceptions >= constants.WIN_INTERCEPTS || rival.lives <= 0;
  }) || "red";
}

function setSlot(value, slot, number) {
  const next = [value[0], value[1], value[2]];
  next[slot] = number;
  return next;
}

function filledCount(values = []) {
  return values.filter(Boolean).length;
}

function displayGuess(values = []) {
  return filledCount(values) ? values.map((value) => value || "?").join("-") : "codigo";
}

function orderedHistory(history = []) {
  return [...history].sort((a, b) => a.round - b.round);
}

function imageCategoryTerm(category) {
  const terms = {
    Anime: "anime",
    Pokemon: "pokemon",
    Filmes: "filme",
    Jogos: "jogo"
  };
  return terms[category] || category || "";
}

function cleanBaseUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

function rememberSession(room, payload = {}) {
  try {
    const name = String(payload.name || "").trim();
    if (name) localStorage.setItem("decrypto:name", JSON.stringify(name));
    if (room?.code) localStorage.setItem("decrypto:lastRoomCode", JSON.stringify(room.code));
  } catch {
    // Local cache is a convenience only.
  }
}

function normalizeWordText(word) {
  return String(word || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function playConfirmCue() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    gain.connect(context.destination);
    [740, 980].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.08);
      oscillator.stop(context.currentTime + 0.12 + index * 0.08);
    });
    window.setTimeout(() => context.close(), 360);
  } catch {
    // Audio feedback is optional; the visual confirmation remains.
  }
}

function useGameSounds(room, playerId) {
  const previousSignature = useRef("");
  useEffect(() => {
    if (!room || !playerId) return;
    const entries = collectConfirmationEntries(room);
    const signature = entries.map((entry) => `${entry.key}:${entry.count}`).join("|");
    if (previousSignature.current) {
      const previous = new Map(previousSignature.current.split("|").filter(Boolean).map((part) => {
        const [key, count] = part.split(":");
        return [key, Number(count)];
      }));
      if (entries.some((entry) => entry.count > (previous.get(entry.key) || 0))) {
        playTone("ready");
      }
    }
    previousSignature.current = signature;
  }, [room, playerId]);
}

function collectConfirmationEntries(room) {
  const entries = [];
  if (room.phase === "playing" && room.current?.turns) {
    TEAMS.forEach((team) => {
      ["team", "intercept"].forEach((kind) => {
        const proposal = room.current.turns[team].proposals[kind];
        entries.push({ key: `play-${team}-${kind}`, count: proposal?.confirmedBy?.length || 0 });
      });
    });
  }
  if (room.phase === "roundResult") {
    entries.push({ key: "round-result", count: room.current?.resultConfirmedBy?.length || 0 });
  }
  if (room.phase === "tiebreaker" && room.tiebreaker) {
    TEAMS.forEach((team) => entries.push({ key: `tie-${team}`, count: room.tiebreaker[team]?.confirmedBy?.length || 0 }));
  }
  if (room.phase === "gameOver") {
    entries.push({ key: "final", count: room.final?.confirmedBy?.length || 0 });
  }
  return entries;
}

function useResultSounds(result, team, viewerTeam) {
  const playedKey = useRef("");
  useEffect(() => {
    if (!result || team !== viewerTeam) return;
    const key = `${team}-${result.intercepted}-${result.teamCorrect}-${result.code.join("-")}`;
    if (playedKey.current === key) return;
    playedKey.current = key;
    window.setTimeout(() => playTone(result.intercepted ? "intercepted" : "notIntercepted"), 450);
    if (!result.intercepted) {
      window.setTimeout(() => playTone(result.teamCorrect ? "decryptOk" : "decryptBad"), 1700);
    }
  }, [result, team, viewerTeam]);
}

function useFinalSounds(room, winner, playerId) {
  const playedKey = useRef("");
  useEffect(() => {
    if (room.phase !== "gameOver" || !winner) return;
    const me = room.players.find((player) => player.id === playerId);
    const key = `${room.final?.reason}-${winner}-${me?.team}`;
    if (playedKey.current === key) return;
    playedKey.current = key;
    playTone(me?.team === winner ? "win" : "lose");
  }, [room, winner, playerId]);
}

function playTone(kind) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const recipes = {
      ready: { volume: 0.025, type: "sine", notes: [[660, 0, 0.07]] },
      intercepted: { volume: 0.1, type: "square", notes: [[190, 0, 0.16], [140, 0.12, 0.2]] },
      notIntercepted: { volume: 0.07, type: "triangle", notes: [[420, 0, 0.12], [560, 0.1, 0.14]] },
      decryptOk: { volume: 0.09, type: "square", notes: [[620, 0, 0.1], [820, 0.1, 0.14]] },
      decryptBad: { volume: 0.08, type: "sawtooth", notes: [[260, 0, 0.12], [210, 0.1, 0.16]] },
      win: { volume: 0.1, type: "square", notes: [[520, 0, 0.12], [680, 0.1, 0.12], [920, 0.2, 0.2]] },
      lose: { volume: 0.08, type: "triangle", notes: [[320, 0, 0.18], [240, 0.15, 0.22]] }
    };
    const recipe = recipes[kind] || recipes.ready;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(recipe.volume, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.55);
    gain.connect(context.destination);
    recipe.notes.forEach(([frequency, start, duration]) => {
      const oscillator = context.createOscillator();
      oscillator.type = recipe.type;
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + duration);
    });
    window.setTimeout(() => context.close(), 800);
  } catch {
    // Sound is a flourish; gameplay and visual feedback continue without it.
  }
}

function otherTeam(team) {
  return team === "red" ? "blue" : "red";
}

function teamLabel(team) {
  if (team === null) return "Sem time";
  return team === "red" ? "Time Vermelho" : "Time Azul";
}

function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

createRoot(document.getElementById("root")).render(<App />);
