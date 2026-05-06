import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { io } from "socket.io-client";
import {
  BadgeCheck,
  Check,
  ClipboardPaste,
  Copy,
  LogIn,
  LogOut,
  Pencil,
  Play,
  RadioTower,
  RotateCcw,
  Settings,
  Shuffle,
  Sparkles,
  Trash2,
  Users,
  Volume2,
  VolumeX,
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
const socket = io(socketUrl, { autoConnect: true });
const TEAMS = ["red", "blue"];
const DEFAULT_CONSTANTS = {
  WORD_BANKS: { Geral: [], Anime: [], Pokemon: [], Filmes: [], Jogos: [], Geek: [], Famosos: [] },
  TEAM_NAMES: { red: "Time Vermelho", blue: "Time Azul" },
  WIN_CORRECT: 3,
  WIN_INTERCEPTS: 2,
  STARTING_LIVES: 2,
  MAX_ROUNDS: 8
};

function hydrateRoom(nextRoom) {
  if (!nextRoom) return nextRoom;
  const avatars = nextRoom.avatars || {};
  return {
    ...nextRoom,
    players: (nextRoom.players || []).map((player) => ({
      ...player,
      avatar: player.avatar || avatars[player.id] || ""
    }))
  };
}

function App() {
  const clientIdRef = useRef(getGhostClientId());
  const [constants, setConstants] = useState(DEFAULT_CONSTANTS);
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [toast, setToast] = useState("");
  const [roomEvents, setRoomEvents] = useState([]);
  const [joinChoice, setJoinChoice] = useState(null);
  const [passwordJoin, setPasswordJoin] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [homeView, setHomeView] = useState("home");
  const [roomDirectory, setRoomDirectory] = useState([]);
  const [soundMuted, setSoundMuted] = useLocalState("codehack:soundMuted", false);
  const [matrixEnabled, setMatrixEnabled] = useLocalState("codehack:matrixEnabled", true);
  const [playerAvatar, setPlayerAvatar] = useLocalState("codehack:avatar", "");
  const [playerSettingsOpen, setPlayerSettingsOpen] = useState(false);
  const [roomCodeCopied, setRoomCodeCopied] = useState(false);
  const [draggedPlayerId, setDraggedPlayerId] = useState("");
  const [draggedPlayerSnapshot, setDraggedPlayerSnapshot] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const me = room?.players.find((p) => p.id === playerId);
  useGameSounds(room, playerId);

  const action = (event, payload = {}) => new Promise((resolve) => {
    const enrichedPayload = { ...payload, clientId: clientIdRef.current };
    socket.emit(event, enrichedPayload, (reply) => {
      if (!reply?.ok) setToast(reply?.error || "Falha de transmissao.");
      else setToast("");
      if (reply?.needsRoleChoice) {
        setJoinChoice({ ...reply, payload: enrichedPayload });
        resolve(reply);
        return;
      }
      if (reply?.playerId || reply?.room?.viewerId) setPlayerId(reply.playerId || reply.room.viewerId);
      if (reply?.room) {
        rememberSession(reply.room, enrichedPayload, clientIdRef.current);
        setRoom(hydrateRoom(reply.room));
      }
      resolve(reply);
    });
  });

  useEffect(() => {
    socket.on("constants", setConstants);
    socket.on("rooms:update", setRoomDirectory);
    socket.emit("rooms:list", {}, (reply) => {
      if (reply?.ok && Array.isArray(reply.rooms)) setRoomDirectory(reply.rooms);
    });
    socket.on("room:update", (nextRoom) => {
      if (nextRoom?.viewerId) setPlayerId(nextRoom.viewerId);
      setRoom(hydrateRoom(nextRoom));
    });
    socket.on("player:avatarUpdate", ({ playerId: updatedPlayerId, avatar }) => {
      setRoom((currentRoom) => {
        if (!currentRoom) return currentRoom;
        return {
          ...currentRoom,
          players: currentRoom.players.map((player) => (
            player.id === updatedPlayerId ? { ...player, avatar } : player
          ))
        };
      });
    });
    socket.on("room:kicked", () => {
      setRoom(null);
      clearActiveRoomSession();
      setToast("Voce foi removido da sala.");
    });
    socket.on("room:event", (event) => {
      setRoomEvents((events) => [...events, event].slice(-5));
      setTimeout(() => {
        setRoomEvents((events) => events.filter((item) => item.id !== event.id));
      }, 3300);
    });
    return () => {
      socket.off("constants");
      socket.off("rooms:update");
      socket.off("room:update");
      socket.off("player:avatarUpdate");
      socket.off("room:kicked");
      socket.off("room:event");
    };
  }, []);

  useEffect(() => {
    let restored = false;
    function restoreActiveRoom() {
      if (restored) return;
      const active = readActiveRoomSession();
      if (!active?.code || !active?.name || active.clientId !== clientIdRef.current) return;
      restored = true;
      socket.emit("room:resume", { ...active, avatar: playerAvatar }, (reply) => {
        if (!reply?.ok) {
          clearActiveRoomSession();
          setToast(reply?.error || "");
          return;
        }
        setToast("");
        if (reply?.playerId || reply?.room?.viewerId) setPlayerId(reply.playerId || reply.room.viewerId);
        if (reply?.room) setRoom(hydrateRoom(reply.room));
      });
    }
    if (socket.connected) restoreActiveRoom();
    socket.on("connect", restoreActiveRoom);
    return () => socket.off("connect", restoreActiveRoom);
  }, [playerAvatar]);

  function askConfirm(config) {
    setConfirmDialog(config);
  }

  async function confirmLeaveRoom() {
    const reply = await action("room:leave");
    if (reply?.ok) {
      clearActiveRoomSession();
      setRoom(null);
      setPlayerId("");
    }
  }

  return (
    <div className={`app-shell ${!room && homeView === "home" ? "home-screen" : ""} ${room?.phase === "lobby" ? "neutral" : me?.team || "neutral"}`}>
      {matrixEnabled && <MatrixRain />}
      {!room ? (
        homeView === "rooms" ? (
          <RoomDirectory
            rooms={roomDirectory}
            constants={constants}
            action={action}
            toast={toast}
            playerAvatar={playerAvatar}
            onBack={() => setHomeView("home")}
            onOpenSettings={() => setPlayerSettingsOpen(true)}
            onPasswordJoin={setPasswordJoin}
          />
        ) : (
          <main className="home-layout">
            <div className="home-logo-frame">
              <div className="home-logo" aria-label="Logo do jogo">
                <IconImg src={ICONS.logo} alt="Logo do jogo" className="home-logo-img" />
              </div>
            </div>
            <Home
              action={action}
              toast={toast}
              playerAvatar={playerAvatar}
              roomDirectory={roomDirectory}
              onOpenRooms={() => setHomeView("rooms")}
              onPasswordJoin={setPasswordJoin}
            />
          </main>
        )
      ) : (
        <>
          <header className="topbar">
          <div className="brand">
            <div className="logo-mark"><IconImg src={ICONS.logo} alt="Logo do jogo" className="logo-img" /></div>
          </div>
          <button
            className={`room-code-copy ${roomCodeCopied ? "copied" : ""}`}
            title="Copiar codigo da sala"
            onClick={() => {
              navigator.clipboard?.writeText(room.code);
              setRoomCodeCopied(true);
              setTimeout(() => setRoomCodeCopied(false), 2000);
            }}
          >
            <span>{room.code}</span>
            <Copy size={18} />
            <em>Copiado</em>
          </button>
          <div className="topbar-game-info">
            <div className="topbar-actions">
              <button onClick={() => askConfirm({
                title: "Voltar para a tela inicial?",
                text: "Voce sairá desta sala. Se a partida estiver em andamento, podera voltar usando o mesmo nome.",
                confirmLabel: "Voltar",
                onConfirm: confirmLeaveRoom
              })}><LogOut size={17} /> Menu principal</button>
              {room.hostId === playerId && room.phase !== "lobby" && (
                <button onClick={() => askConfirm({
                  title: "Voltar todos para o lobby?",
                  text: "A partida atual sera encerrada e todos os jogadores retornarão ao lobby da sala.",
                  confirmLabel: "Voltar ao lobby",
                  onConfirm: () => action("host:returnLobby")
                })}><RotateCcw size={17} /> Voltar ao lobby</button>
              )}
              <button className="icon-only" title="Configuracoes" aria-label="Configuracoes" onClick={() => setPlayerSettingsOpen(true)}>
                <Settings size={18} />
              </button>
            </div>
          </div>
          </header>

          <main
            onDrag={(event) => {
              if (draggedPlayerId && event.clientX && event.clientY) setDragPosition({ x: event.clientX, y: event.clientY });
            }}
            onDragOver={(event) => draggedPlayerId && event.preventDefault()}
            onDrop={(event) => {
              if (!draggedPlayerId || room?.phase !== "lobby" || room.hostId !== playerId) return;
              event.preventDefault();
              action("host:move", { playerId: draggedPlayerId, team: null });
              setDraggedPlayerId("");
              setDraggedPlayerSnapshot(null);
            }}
          >
            {room.phase === "lobby" ? (
              <Lobby room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
            ) : (
              <Game room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} />
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
      <RoomEventStack events={roomEvents} />
      {joinChoice && (
        <JoinChoiceModal
          joinChoice={joinChoice}
          onCancel={() => setJoinChoice(null)}
          onPick={async (role) => {
            const reply = await action("room:join", { ...joinChoice.payload, role });
            if (reply?.ok && !reply.needsRoleChoice) setJoinChoice(null);
          }}
        />
      )}
      {passwordJoin && (
        <PasswordJoinModal
          room={passwordJoin.room}
          toast={toast}
          onCancel={() => setPasswordJoin(null)}
          onJoin={async (password) => {
            const reply = await action("room:join", {
              code: passwordJoin.room.code,
              name: passwordJoin.name,
              avatar: playerAvatar,
              password
            });
            if (reply?.ok) setPasswordJoin(null);
          }}
        />
      )}
      {playerSettingsOpen && (
        <PlayerSettingsModal
          soundMuted={soundMuted}
          setSoundMuted={setSoundMuted}
          matrixEnabled={matrixEnabled}
          setMatrixEnabled={setMatrixEnabled}
          playerAvatar={playerAvatar}
          onAvatarChange={async (avatar) => {
            setPlayerAvatar(avatar);
            if (room) await action("player:avatar", { avatar });
          }}
          onClose={() => setPlayerSettingsOpen(false)}
        />
      )}
      {draggedPlayerSnapshot && (
        <div className={`drag-ghost player-card team-surface ${draggedPlayerSnapshot.team || ""}`} style={{ "--drag-x": `${dragPosition.x}px`, "--drag-y": `${dragPosition.y}px` }}>
          <PlayerIdentity player={draggedPlayerSnapshot} />
        </div>
      )}
    </div>
  );
}

function PlayerSettingsModal({ soundMuted, setSoundMuted, matrixEnabled, setMatrixEnabled, playerAvatar, onAvatarChange, onClose }) {
  async function pickAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const avatar = await resizeAvatar(file);
    await onAvatarChange(avatar);
  }

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="player-settings-modal">
        <div className="modal-title">
          <strong>Configuracoes</strong>
          <button className="icon-only" onClick={onClose} aria-label="Fechar configuracoes"><X size={18} /></button>
        </div>
        <div className="avatar-editor-block">
          <label className="avatar-editor" title="Alterar avatar">
            <span className="settings-avatar-preview">
              {playerAvatar ? <img src={playerAvatar} alt="Avatar atual" /> : <Users size={42} />}
            </span>
            <span className="avatar-edit-overlay"><Pencil size={30} /></span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} />
          </label>
          {playerAvatar && (
            <button className="avatar-remove-button" title="Remover avatar" aria-label="Remover avatar" onClick={() => onAvatarChange("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <SettingToggle
          icon={soundMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          title="Sons"
          checked={!soundMuted}
          onChange={(checked) => setSoundMuted(!checked)}
        />
        <SettingToggle
          icon={<RadioTower size={22} />}
          title="Efeitos"
          checked={matrixEnabled}
          onChange={setMatrixEnabled}
        />
      </div>
    </div>
  );
}

function SettingToggle({ icon, title, checked, onChange }) {
  return (
    <div className="setting-toggle-row">
      <div className="setting-toggle-copy">
        <span className="setting-toggle-icon">{icon}</span>
        <div>
          <strong>{title}</strong>
        </div>
      </div>
      <button className={`toggle-switch ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
        <span />
      </button>
    </div>
  );
}

function RetroSelect({ value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const items = options.map((option) => (
    typeof option === "string" ? { value: option, label: option } : option
  ));
  const selected = items.find((option) => option.value === value) || items[0];

  return (
    <div
      className={`retro-select ${open ? "open" : ""} ${disabled ? "disabled" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        className="retro-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label || "Selecionar"}</span>
        <i aria-hidden="true" />
      </button>
      {open && (
        <div className="retro-select-menu" role="listbox">
          {items.map((option) => (
            <button
              type="button"
              key={option.value}
              className={option.value === value ? "selected" : ""}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
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

function RoomEventStack({ events }) {
  if (!events.length) return null;
  return (
    <div className="room-event-stack" aria-live="polite">
      {events.map((event) => (
        <div className="room-event-card" key={event.id}>
          <span className="room-event-avatar">
            {event.avatar ? <img src={event.avatar} alt={`Avatar de ${event.playerName}`} /> : initials(event.playerName)}
          </span>
          <span className="room-event-text">
            <strong>{event.playerName}</strong>
            {event.type === "leave" ? (
              " saiu da partida."
            ) : (
              <>
                {" entrou no "}
                <em className={`team-name ${event.team || "neutral"}`}>{teamEventName(event.team)}</em>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function JoinChoiceModal({ joinChoice, onCancel, onPick }) {
  const players = joinChoice.preview?.players || [];
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal join-choice-modal">
        <strong>Entrar na partida</strong>
        <p>A partida ja esta em andamento. Escolha como deseja entrar.</p>
        <div className="join-preview-list">
          {["red", "blue", null].map((team) => {
            const list = players.filter((player) => player.team === team);
            return (
              <div className={`join-preview-team ${team ? `team-surface ${team}` : "spectator-preview"}`} key={team || "spectators"}>
                <span>{team ? teamLabel(team) : "Espectadores"}</span>
                {list.length ? list.map((player) => <PlayerIdentity key={player.id} player={player} />) : <small>Vazio</small>}
              </div>
            );
          })}
        </div>
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button onClick={() => onPick("spectator")}>Entrar como espectador</button>
          <button className="primary" onClick={() => onPick("player")}>Entrar como jogador</button>
        </div>
      </div>
    </div>
  );
}

function Home({ action, toast, playerAvatar, roomDirectory, onOpenRooms, onPasswordJoin }) {
  const [name, setName] = useLocalState("decrypto:name", "");
  const [code, setCode] = useLocalState("decrypto:lastRoomCode", "");
  const [createOpen, setCreateOpen] = useState(false);
  async function pasteRoomCode() {
    try {
      const text = await navigator.clipboard.readText();
      setCode(String(text || "").trim().toUpperCase().slice(0, 6));
    } catch {
      // Clipboard access depends on browser permission.
    }
  }

  async function joinByCode() {
    const normalizedCode = code.trim().toUpperCase();
    const listedRoom = roomDirectory.find((room) => room.code === normalizedCode);
    if (listedRoom?.hasPassword) {
      onPasswordJoin({ room: listedRoom, name });
      return;
    }
    await action("room:join", { code: normalizedCode, name, avatar: playerAvatar });
  }

  return (
    <section className="home-grid enter">
      <div className="console-panel">
        <label>Nome do operador</label>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={18} placeholder="Seu nome" />
        <button className="primary" onClick={() => setCreateOpen(true)}><Play size={18} /> Criar sala</button>
        <button onClick={onOpenRooms}><RadioTower size={18} /> Salas</button>
        <div className="join-row">
          <div className="paste-input-wrap">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" />
            <button type="button" className="input-icon-button" title="Colar codigo" aria-label="Colar codigo" onClick={pasteRoomCode}>
              <ClipboardPaste size={18} />
            </button>
          </div>
          <button onClick={joinByCode}><LogIn size={18} /> Entrar</button>
        </div>
        {toast && <p className="toast">{toast}</p>}
      </div>
      {createOpen && (
        <CreateRoomModal
          playerName={name}
          onCancel={() => setCreateOpen(false)}
          onCreate={async (settings) => {
            const reply = await action("room:create", { name, avatar: playerAvatar, ...settings });
            if (reply?.ok) setCreateOpen(false);
          }}
        />
      )}
    </section>
  );
}

function RoomDirectory({ rooms, constants, action, toast, playerAvatar, onBack, onOpenSettings, onPasswordJoin }) {
  const [name, setName] = useLocalState("decrypto:name", "");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [passwordFilter, setPasswordFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("name");
  const categories = Object.keys(constants.WORD_BANKS || {});
  const visibleRooms = [...rooms]
    .filter((room) => phaseFilter === "all" || (phaseFilter === "playing" ? room.inGame : !room.inGame))
    .filter((room) => passwordFilter === "all" || (passwordFilter === "with" ? room.hasPassword : !room.hasPassword))
    .filter((room) => categoryFilter === "all" || room.category === categoryFilter)
    .sort((left, right) => {
      if (sortMode === "players") return right.playerCount - left.playerCount || left.name.localeCompare(right.name);
      return left.name.localeCompare(right.name) || right.playerCount - left.playerCount;
    });

  async function joinRoom(room) {
    if (room.hasPassword) {
      onPasswordJoin({ room, name });
      return;
    }
    await action("room:join", { code: room.code, name, avatar: playerAvatar });
  }

  return (
    <main className="rooms-page">
      <header className="rooms-header panel">
        <button onClick={onBack}><LogOut size={17} /> Menu principal</button>
        <label>Nome do operador
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={18} placeholder="Seu nome" />
        </label>
        <button className="icon-only" title="Configuracoes" aria-label="Configuracoes" onClick={onOpenSettings}><Settings size={18} /></button>
      </header>

      <section className="panel rooms-filter-panel">
        <div className="rooms-filter-grid">
          <label>Status
            <RetroSelect
              value={phaseFilter}
              onChange={setPhaseFilter}
              options={[
                { value: "all", label: "Todas" },
                { value: "lobby", label: "Lobby" },
                { value: "playing", label: "Em andamento" }
              ]}
            />
          </label>
          <label>Senha
            <RetroSelect
              value={passwordFilter}
              onChange={setPasswordFilter}
              options={[
                { value: "all", label: "Todas" },
                { value: "with", label: "Com senha" },
                { value: "without", label: "Sem senha" }
              ]}
            />
          </label>
          <label>Categoria
            <RetroSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "Todas" },
                ...categories.map((category) => ({ value: category, label: category })),
                { value: "Personalizada", label: "Personalizada" }
              ]}
            />
          </label>
          <label>Ordenar
            <RetroSelect
              value={sortMode}
              onChange={setSortMode}
              options={[
                { value: "name", label: "Ordem alfabetica" },
                { value: "players", label: "Quantidade de jogadores" }
              ]}
            />
          </label>
        </div>
      </section>

      <section className="rooms-list-section">
        <div className="rooms-list-head">
          <strong>Salas disponiveis</strong>
          <span>{visibleRooms.length} / {rooms.length}</span>
        </div>
        {visibleRooms.length ? (
          <div className="room-card-grid">
            {visibleRooms.map((room) => (
              <button className="room-card" key={room.code} onClick={() => joinRoom(room)}>
                <span className="room-card-title">{room.name}</span>
                <span>Criada por {room.hostName}</span>
                <span className="room-card-meta">
                  <em><Users size={15} /> {room.playerCount}/12</em>
                  <em>{room.inGame ? "Em andamento" : "Lobby"}</em>
                  <em>{room.hasPassword ? "Com senha" : "Sem senha"}</em>
                </span>
                <span className="room-card-category">{room.category}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-rooms panel">
            <RadioTower size={24} />
            <p>Nenhuma sala publica encontrada.</p>
          </div>
        )}
        {toast && <p className="toast">{toast}</p>}
      </section>
    </main>
  );
}

function PasswordJoinModal({ room, toast, onCancel, onJoin }) {
  const [password, setPassword] = useState("");
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <strong>Senha da sala</strong>
        <p>{room.name}</p>
        <label>Senha
          <input value={password} maxLength={32} onChange={(event) => setPassword(event.target.value)} autoFocus />
        </label>
        {toast && <p className="toast">{toast}</p>}
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" onClick={() => onJoin(password)}><LogIn size={18} /> Entrar</button>
        </div>
      </div>
    </div>
  );
}

function CreateRoomModal({ playerName, onCancel, onCreate }) {
  const defaultName = `Sala de ${String(playerName || "Operador").trim() || "Operador"}`;
  const [roomName, setRoomName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [publicRoom, setPublicRoom] = useState(true);
  const valid = roomName.trim().length > 0;

  useEffect(() => {
    setRoomName((current) => current.trim() ? current : defaultName);
  }, [defaultName]);

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal create-room-modal">
        <strong>Criar sala</strong>
        <label>Nome da sala
          <input value={roomName} maxLength={36} onChange={(event) => setRoomName(event.target.value)} placeholder={defaultName} />
        </label>
        <label>Senha
          <input
            value={publicRoom ? password : ""}
            maxLength={32}
            disabled={!publicRoom}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={publicRoom ? "Opcional" : "Desativada em sala privada"}
          />
        </label>
        <div className="setting-toggle-row">
          <div className="setting-toggle-copy">
            <span className="setting-toggle-icon"><RadioTower size={18} /></span>
            <strong>{publicRoom ? "Sala publica" : "Sala privada"}</strong>
          </div>
          <button className={`toggle-switch ${publicRoom ? "on" : ""}`} onClick={() => setPublicRoom(!publicRoom)} aria-label="Alternar sala publica">
            <span />
          </button>
        </div>
        <div className="inline-actions">
          <button onClick={onCancel}>Cancelar</button>
          <button className="primary" disabled={!valid} onClick={() => onCreate({ roomName: roomName.trim(), password: publicRoom ? password.trim() : "", publicRoom })}><Play size={18} /> Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function Lobby({ room, playerId, constants, action, toast, playerAvatar, draggedPlayerId, setDraggedPlayerId, setDraggedPlayerSnapshot, setDragPosition }) {
  const me = room.players.find((p) => p.id === playerId);
  const isHost = room.hostId === playerId;
  const [customCategories, setCustomCategories] = useLocalState("decrypto:customCategories", []);
  const [customName, setCustomName] = useState("");
  const [customWords, setCustomWords] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
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
      <div className="lobby-grid">
        <div className="panel teams-panel">
          {!room.settings.randomTeams && (
            <>
              <TeamColumn team="red" room={room} playerId={playerId} isHost={isHost} action={action} playerAvatar={playerAvatar} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
              <TeamColumn team="blue" room={room} playerId={playerId} isHost={isHost} action={action} playerAvatar={playerAvatar} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
            </>
          )}
          <TeamColumn team={null} room={room} playerId={playerId} isHost={isHost} action={action} playerAvatar={playerAvatar} draggedPlayerId={draggedPlayerId} setDraggedPlayerId={setDraggedPlayerId} setDraggedPlayerSnapshot={setDraggedPlayerSnapshot} setDragPosition={setDragPosition} />
          {isHost && (
            <div className="host-actions">
              <button className={room.settings.randomTeams ? "active-toggle" : ""} onClick={() => action("room:settings", { randomTeams: !room.settings.randomTeams })}><Shuffle size={17} /> Times aleatorios</button>
              {toast && <p className="toast lobby-action-error">{toast}</p>}
              <button className="primary" onClick={() => action("game:start")}><Zap size={17} /> Iniciar</button>
            </div>
          )}
        </div>

        <div className="panel settings-panel">
          <label>Categoria</label>
          <RetroSelect
            disabled={!isHost}
            value={selectedCustom?.name || room.settings.category}
            onChange={applyCategory}
            options={categories.map((category) => ({ value: category, label: category }))}
          />
          <label>Dificuldade</label>
          <div className="segmented">
            {[4, 5, 6].map((count) => (
              <button key={count} disabled={!isHost} className={room.settings.wordCount === count ? "active" : ""} onClick={() => action("room:settings", { wordCount: count })}>{count} palavras</button>
            ))}
          </div>
          <div className="number-settings">
            <label>Vidas
              <NumberStepper
                value={room.settings.startingLives || constants.STARTING_LIVES}
                disabled={!isHost}
                onChange={(value) => action("room:settings", { startingLives: value })}
              />
            </label>
            <label>Interceptacoes
              <NumberStepper
                value={room.settings.winIntercepts || constants.WIN_INTERCEPTS}
                disabled={!isHost}
                onChange={(value) => action("room:settings", { winIntercepts: value })}
              />
            </label>
          </div>
          <div className={`custom-box collapsible ${customOpen ? "open" : ""}`}>
            <button className="custom-toggle" onClick={() => setCustomOpen(!customOpen)}>
              <strong>Categoria Personalizada</strong>
              <span>{customOpen ? "-" : "+"}</span>
            </button>
            {customOpen && (
              <div className="custom-content">
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nome da categoria" />
                <textarea value={customWords} onChange={(e) => setCustomWords(e.target.value)} placeholder="palavra, palavra, palavra..." />
                <button onClick={saveCustom}><BadgeCheck size={17} /> Salvar categoria</button>
              </div>
            )}
          </div>
          <ChatPanel room={room} playerId={playerId} action={action} scope="global" />
        </div>
      </div>
    </section>
  );
}

function NumberStepper({ value, onChange, disabled }) {
  const current = clampNumber(Number(value) || 1, 1, 5);
  return (
    <div className={`number-stepper ${disabled ? "disabled" : ""}`}>
      <button type="button" disabled={disabled || current <= 1} onClick={() => onChange(clampNumber(current - 1, 1, 5))}>-</button>
      <input
        type="number"
        min="1"
        max="5"
        disabled={disabled}
        value={current}
        onChange={(event) => onChange(clampNumber(Number(event.target.value) || 1, 1, 5))}
      />
      <button type="button" disabled={disabled || current >= 5} onClick={() => onChange(clampNumber(current + 1, 1, 5))}>+</button>
    </div>
  );
}

function TeamColumn({ team, room, playerId, isHost, action, playerAvatar, draggedPlayerId, setDraggedPlayerId, setDraggedPlayerSnapshot, setDragPosition }) {
  const players = room.players.filter((player) => player.team === team);
  const randomLocked = room.settings.randomTeams;
  const me = room.players.find((player) => player.id === playerId);
  const canChooseHere = !randomLocked && me?.team !== team && room.phase === "lobby";
  const canDropHere = isHost && !randomLocked && room.phase === "lobby";

  function chooseHere() {
    if (canChooseHere) action("player:team", { team });
  }

  function dropPlayer(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!canDropHere) return;
    const draggedPlayerId = event.dataTransfer.getData("text/player-id");
    if (draggedPlayerId) action("host:move", { playerId: draggedPlayerId, team });
    setDraggedPlayerId("");
    setDraggedPlayerSnapshot(null);
  }

  return (
    <div
      className={`team-box ${team ? `team-surface ${team}` : ""} ${team || "unassigned"} ${canChooseHere ? "clickable" : ""}`}
      onClick={chooseHere}
      onDragOver={(event) => canDropHere && event.preventDefault()}
      onDrop={dropPlayer}
    >
      <div className="team-header">
        <h3>{randomLocked && team === null ? "Times Aleatorios" : teamLabel(team)}</h3>
      </div>
      <div className="player-card-list">
        {players.length ? players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            playerId={playerId}
            isHost={isHost}
            randomLocked={randomLocked}
            action={action}
            localAvatar={playerAvatar}
            dragged={draggedPlayerId === player.id}
            dragEnabled={isHost && !randomLocked}
            setDraggedPlayerId={setDraggedPlayerId}
            setDraggedPlayerSnapshot={setDraggedPlayerSnapshot}
            setDragPosition={setDragPosition}
          />
        )) : <div className="empty-team">Time vazio</div>}
      </div>
    </div>
  );
}

function PlayerCard({ player, playerId, isHost, action, dragged, dragEnabled = false, marker = "", localAvatar = "", confirmState = "", setDraggedPlayerId, setDraggedPlayerSnapshot, setDragPosition }) {
  const isSelf = player.id === playerId;
  const visiblePlayer = isSelf && localAvatar ? { ...player, avatar: localAvatar } : player;
  return (
    <div
      className={`player-card team-surface ${player.team || ""} ${isSelf ? "self" : ""} ${confirmState ? `vote-${confirmState}` : ""} ${dragged ? "dragging" : ""} ${player.connected ? "" : "offline"}`}
      draggable={dragEnabled}
      onClick={(event) => event.stopPropagation()}
      onDragStart={(event) => {
        if (!dragEnabled) return;
        event.dataTransfer.setData("text/player-id", player.id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setDragImage(new Image(), 0, 0);
        setDragPosition({ x: event.clientX, y: event.clientY });
        setDraggedPlayerId(player.id);
        setDraggedPlayerSnapshot(player);
      }}
      onDrag={(event) => {
        if (dragEnabled && event.clientX && event.clientY) setDragPosition({ x: event.clientX, y: event.clientY });
      }}
      onDragEnd={() => {
        setDraggedPlayerId?.("");
        setDraggedPlayerSnapshot?.(null);
      }}
    >
      <PlayerIdentity player={visiblePlayer} marker={marker} />
      {isHost && player.id !== playerId && (
        <button className="icon-only naked-icon" title="Remover da sala" aria-label="Remover da sala" onClick={() => action("host:kick", { playerId: player.id })}><Trash2 size={17} /></button>
      )}
    </div>
  );
}

function PlayerIdentity({ player, marker = "" }) {
  return (
    <span className="player-identity">
      <span className="player-avatar">{player.avatar ? <img src={player.avatar} alt={`Avatar de ${player.name}`} /> : initials(player.name)}</span>
      <span className="player-copy">
        <span className="player-name">
          {player.name}
          {player.isHost && <IconImg src={ICONS.leader} alt="Lider da sala" className="leader-icon" />}
        </span>
        {marker && <small className="player-marker">{marker}</small>}
      </span>
    </span>
  );
}

function ChatPanel({ room, playerId, action, scope }) {
  const [draft, setDraft] = useState("");
  const listRef = useRef(null);
  const me = room.players.find((player) => player.id === playerId);
  const isTeamChat = scope === "team";
  const isSpectatorChat = scope === "spectator";
  const canUseTeamChat = isTeamChat && room.phase !== "lobby" && TEAMS.includes(me?.team);
  const canUseSpectatorChat = isSpectatorChat && isSpectatorPlayer(me, room);
  const messages = isSpectatorChat ? room.chat?.spectator || [] : isTeamChat ? room.chat?.team || [] : room.chat?.global || [];

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  if (isTeamChat && !canUseTeamChat) return null;
  if (isSpectatorChat && !canUseSpectatorChat) return null;

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const reply = await action("chat:send", { scope, text });
    if (reply?.ok) setDraft("");
  }

  return (
    <section className={`chat-panel ${isTeamChat ? `team-chat team-surface ${me?.team || ""}` : isSpectatorChat ? "spectator-chat" : "global-chat"}`}>
      <h2>{isTeamChat ? "Chat do time" : isSpectatorChat ? "Chat dos espectadores" : "Chat da sala"}</h2>
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
        <input value={draft} maxLength={240} onChange={(event) => setDraft(event.target.value)} placeholder={isTeamChat ? "Mensagem para seu time" : isSpectatorChat ? "Mensagem para espectadores" : "Mensagem para a sala"} />
        <button type="submit">Enviar</button>
      </form>
    </section>
  );
}

function Game({ room, playerId, constants, action, toast, playerAvatar }) {
  const me = room.players.find((p) => p.id === playerId);
  if (isSpectatorPlayer(me, room)) return <SpectatorGame room={room} playerId={playerId} constants={constants} action={action} toast={toast} playerAvatar={playerAvatar} />;
  const myTeam = me?.team;
  const rival = otherTeam(myTeam);
  const winner = getWinner(room, constants);

  return (
    <section className="game-page enter">
      <div className="game-grid">
        <aside className="left-rail">
          <RoundCounter room={room} constants={constants} compact />
          <WordsPanel team={myTeam} words={room.teams[myTeam]?.words || []} category={room.settings.category} />
          <ChatPanel room={room} playerId={playerId} action={action} scope="team" />
        </aside>

        <div className="play-panel">
          {room.blocked && <p className="toast game-blocker">{room.blocked}</p>}
          {room.phase === "playing" && <LiveRound room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "roundResult" && <RoundResult room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "tiebreaker" && <Tiebreaker room={room} playerId={playerId} constants={constants} action={action} />}
          {room.phase === "gameOver" && <GameOver room={room} playerId={playerId} constants={constants} winner={winner} action={action} />}
          {toast && <p className="toast">{toast}</p>}
        </div>

        <aside className="right-rail">
          <div className="side-panel scoreboard-panel">
            <ScoreBoard room={room} constants={constants} playerId={playerId} ordered />
          </div>
          <GamePlayersPanel room={room} playerId={playerId} constants={constants} action={action} playerAvatar={playerAvatar} />
        </aside>
      </div>
      <HintHistory room={room} constants={constants} playerId={playerId} />
    </section>
  );
}

function SpectatorGame({ room, playerId, constants, action, toast, playerAvatar }) {
  const winner = getWinner(room, constants);
  return (
    <section className="game-page spectator-page enter">
      <div className="spectator-game-grid">
        <div className="spectator-main">
          <RoundCounter room={room} constants={constants} compact />
          {room.blocked && <p className="toast game-blocker">{room.blocked}</p>}
          {room.phase === "playing" && <SpectatorRound room={room} playerId={playerId} constants={constants} />}
          {room.phase === "roundResult" && <RoundResult room={room} playerId={playerId} constants={constants} action={() => Promise.resolve({ ok: false })} />}
          {room.phase === "tiebreaker" && <StatusCard title="Desempate em andamento" text="Espectadores acompanham a decisao final sem confirmar." team="blue" />}
          {room.phase === "gameOver" && <GameOver room={room} playerId={playerId} constants={constants} winner={winner} action={() => Promise.resolve({ ok: false })} />}
          <SpectatorChats room={room} constants={constants} />
          {toast && <p className="toast">{toast}</p>}
        </div>
        <aside className="right-rail">
          <div className="side-panel scoreboard-panel">
            <ScoreBoard room={room} constants={constants} playerId={playerId} ordered />
          </div>
          <GamePlayersPanel room={room} playerId={playerId} constants={constants} action={() => Promise.resolve({ ok: false })} playerAvatar={playerAvatar} />
          <ChatPanel room={room} playerId={playerId} action={action} scope="spectator" />
        </aside>
      </div>
      <HintHistory room={room} constants={constants} playerId={playerId} />
    </section>
  );
}

function SpectatorRound({ room, playerId, constants }) {
  return (
    <div className="spectator-team-grid">
      {TEAMS.map((team) => (
        <div className={`spectator-team-column team-surface ${team}`} key={team}>
          <p className="eyebrow"><RadioTower size={16} /> {constants.TEAM_NAMES[team]}</p>
          <WordsPanel team={team} words={room.teams[team]?.words || []} category={room.settings.category} />
          <SpectatorHints hints={room.current?.turns?.[team]?.hints || []} />
          <GuessPhase room={room} playerId={playerId} kind="team" targetTeam={team} title="Descriptografia" hints={room.current?.turns?.[team]?.hints || []} action={() => Promise.resolve({ ok: false })} />
          <GuessPhase room={room} playerId={playerId} kind="intercept" targetTeam={team} title="Interceptacao" hints={room.current?.turns?.[team]?.hints || []} action={() => Promise.resolve({ ok: false })} />
        </div>
      ))}
    </div>
  );
}

function SpectatorHints({ hints }) {
  return (
    <div className={`spectator-round-section ${hints.length ? "" : "empty"}`}>
      <strong>Dicas</strong>
      {hints.length ? <HintsList hints={hints} /> : <p className="small">Aguardando dicas.</p>}
    </div>
  );
}

function SpectatorChats({ room, constants }) {
  const teamChat = room.chat?.team || {};
  return (
    <div className="spectator-chats">
      {TEAMS.map((team) => (
        <section className={`chat-panel team-chat team-surface ${team}`} key={team}>
          <h2>Chat do {constants.TEAM_NAMES[team]}</h2>
          <div className="chat-messages">
            {(teamChat[team] || []).map((message) => (
              <div className="chat-message" key={message.id}>
                <div className="chat-meta">
                  <strong>{message.playerName}</strong>
                </div>
                <p>{message.text}</p>
              </div>
            ))}
            {!(teamChat[team] || []).length && <p className="small">Nenhuma mensagem ainda.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}

function GamePlayersPanel({ room, playerId, constants, action, playerAvatar }) {
  const isHost = room.hostId === playerId;
  const me = room.players.find((player) => player.id === playerId);
  const visibleTeams = me?.team ? [me.team, otherTeam(me.team), null] : [...TEAMS, null];
  return (
    <div className={`side-panel players-panel team-surface ${me?.team || ""}`}>
      <h2><Users size={20} /> Jogadores</h2>
      {visibleTeams.map((team) => (
        <div className={`game-team-list ${team ? `team-surface ${team}` : "spectator-preview"}`} key={team || "spectators"}>
          <strong>{team ? constants.TEAM_NAMES[team] : "Espectadores"}</strong>
          <div className="player-card-list">
            {room.players.filter((player) => player.team === team).length ? room.players.filter((player) => player.team === team).map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                playerId={playerId}
                isHost={isHost}
                action={action}
                localAvatar={playerAvatar}
                marker={playerCardMarker(room, player)}
                confirmState={playerConfirmState(room, player)}
              />
            )) : <div className="empty-team">{team === null ? "Vazio" : "Time vazio"}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LiveRound({ room, playerId, constants, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const myTeam = me?.team;
  const rival = otherTeam(myTeam);
  const ownTurn = room.current?.turns?.[myTeam];
  const rivalTurn = room.current?.turns?.[rival];
  const isCoder = ownTurn?.coderId === playerId;
  if (!TEAMS.includes(myTeam) || !ownTurn) {
    return <StatusCard title="Sincronizando partida" text="Aguardando atribuicao de time e estado da rodada." team={myTeam} />;
  }

  return (
    <div className="live-stack">
      {isCoder && !ownTurn?.hints.length ? (
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
  const turn = room.current?.turns?.[targetTeam];
  const words = room.teams[targetTeam]?.words || [];

  useEffect(() => {
    if (reviewing) playConfirmCue();
  }, [reviewing]);

  return (
    <div className={`phase-card compact team-surface ${targetTeam}`}>
      <p className="eyebrow"><Zap size={16} /> codigo confidencial</p>
      <div className="secret-code">{turn?.code?.join("-") || "?"}</div>
      <div className="hint-grid">
        {(turn?.code || []).map((number, index) => (
          <label key={`${number}-${index}`}>Dica para {words[number - 1] || `#${number}`}
            <input value={hints[index]} onChange={(e) => setHints(hints.map((hint, i) => i === index ? e.target.value : hint))} placeholder="Digite uma pista curta" />
          </label>
        ))}
      </div>
      {!reviewing ? (
        <button className="primary pulse" disabled={Boolean(room.blocked) || hints.filter((hint) => hint.trim()).length !== 3} onClick={() => setReviewing(true)}><BadgeCheck size={18} /> Revisar dicas</button>
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
            <button className="primary" disabled={Boolean(room.blocked)} onClick={() => action("game:hints", { hints })}><BadgeCheck size={18} /> Enviar dicas</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GuessPhase({ room, playerId, kind, targetTeam, title, hints, action }) {
  const me = room.players.find((p) => p.id === playerId);
  const turn = room.current?.turns?.[targetTeam];
  const proposal = turn?.proposals?.[kind] || { guess: [], confirmedBy: [], finalized: false };
  const isOwnCoderGuess = kind === "team" && turn?.coderId === playerId;
  const expectedTeam = kind === "team" ? targetTeam : otherTeam(targetTeam);
  const canAct = !room.blocked && me?.team === expectedTeam && !isOwnCoderGuess && hints.length > 0 && !proposal?.finalized;
  const canViewSharedGuess = (me?.spectator || me?.team === expectedTeam) && hints.length > 0;
  const voters = room.players.filter((player) => !player.spectator && player.team === expectedTeam && player.connected && (kind !== "team" || player.id !== turn?.coderId));

  if (!turn) {
    return (
      <div className={`decision-card team-surface ${targetTeam || ""}`}>
        <p className="eyebrow"><RadioTower size={16} /> {title}</p>
        <p className="small">Sincronizando estado da rodada.</p>
      </div>
    );
  }

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
            <button className="primary" disabled={!isValidCode(proposal.guess || [])} onClick={() => action("game:confirmDecision", { kind, targetTeam })}><BadgeCheck size={18} /> Confirmar {displayGuess(proposal.guess)}</button>
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
              return (
                <button
                  key={number}
                  className={selected ? "active" : ""}
                  disabled={disabled}
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
  const voters = room.players.filter((player) => player.connected && !player.spectator);
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
      <ConfirmationRoster players={voters} confirmedBy={confirmed} />
      {me?.spectator ? <p className="small">Espectadores acompanham o resultado sem confirmar.</p> : (
        <button className="primary" disabled={confirmed.includes(playerId) || Boolean(room.blocked)} onClick={() => action("game:confirmResult")}><Play size={18} /> Confirmar resultado</button>
      )}
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
  const me = room.players.find((player) => player.id === playerId);
  const voters = room.players.filter((player) => player.connected && !player.spectator);
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
      <ConfirmationRoster players={voters} confirmedBy={confirmed} />
      {me?.spectator ? <p className="small">Espectadores aguardam os jogadores voltarem ao lobby.</p> : (
        <button className="primary" disabled={confirmed.includes(playerId)} onClick={() => action("game:confirmFinal")}><Play size={18} /> Voltar ao lobby</button>
      )}
    </div>
  );
}

function ScoreBoard({ room, constants, playerId, ordered = false }) {
  const me = room.players.find((player) => player.id === playerId);
  const teams = ordered && me?.team ? [me.team, otherTeam(me.team)] : TEAMS;
  return (
    <div className="scoreboard">
      {teams.map((team) => {
        const score = room.teams[team].score;
        return (
          <div className={`score team-surface ${team}`} key={team}>
            <span>{constants.TEAM_NAMES[team]}</span>
            <small>
              <IconImg src={ICONS.life} alt="Vidas" className="game-icon life-icon" /> {score.lives}/{startingLivesLimit(room, constants)}
              <IconImg src={ICONS.decrypt} alt="Descriptografias" className="game-icon decrypt-icon" /> {score.interceptions}/{winInterceptLimit(room, constants)}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function RoundCounter({ room, constants, compact = false }) {
  return (
    <div className={`round-counter ${compact ? "compact" : ""}`}>
      <span>Rodada</span>
      <strong>{room.round}/{constants.MAX_ROUNDS}</strong>
    </div>
  );
}

function WordsPanel({ team, words, category }) {
  return (
    <div className={`words-panel team-surface ${team || ""}`}>
      {words.map((word, index) => (
        <div className="word-card" key={`${category}-${word}-${index}`}>
          <WordImage word={word} index={index} category={category} />
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
  const [failed, setFailed] = useState(word === "CRIPTOGRAFADA");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [expanded, setExpanded] = useState(false);
  const url = category === "Pokemon" ? pokemonDbImageUrl(word) : remoteUrl;

  useEffect(() => {
    if (category === "Pokemon" || word === "CRIPTOGRAFADA") return;
    let active = true;
    setFailed(false);
    setRemoteUrl("");
    const controller = new AbortController();
    const query = category === "Geral" ? word : `${word} ${category || ""}`.trim();
    fetch(`/api/image?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        if (data?.url) setRemoteUrl(data.url);
        else setFailed(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      controller.abort();
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
    const turn = room.current?.turns?.[targetTeam];
    const proposal = turn?.proposals?.[kind];
    if (!proposal) return null;
    const votingTeam = kind === "team" ? targetTeam : otherTeam(targetTeam);
    if (votingTeam !== rival) return null;
    const voters = room.players.filter((player) => player.team === votingTeam && player.connected && (kind !== "team" || player.id !== turn?.coderId));
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

function playerCardMarker(room, player) {
  const labels = [];
  if (room.current && room.current.turns?.[player.team]?.coderId === player.id) labels.push("Comunicador");
  const state = playerConfirmState(room, player);
  if (state === "both") labels.push("Descriptografia e interceptacao confirmadas");
  else if (state === "team") labels.push("Descriptografia confirmada");
  else if (state === "intercept") labels.push("Interceptacao confirmada");
  return labels.join(" • ");
}

function playerConfirmState(room, player) {
  if (room.phase !== "playing" || !room.current || !TEAMS.includes(player.team)) return "";
  const ownTurn = room.current.turns[player.team];
  const rivalTurn = room.current.turns[otherTeam(player.team)];
  const teamConfirmed = ownTurn?.proposals?.team?.confirmedBy?.includes(player.id) || false;
  const interceptConfirmed = rivalTurn?.proposals?.intercept?.confirmedBy?.includes(player.id) || false;
  if (teamConfirmed && interceptConfirmed) return "both";
  if (teamConfirmed) return "team";
  if (interceptConfirmed) return "intercept";
  return "";
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
        <span><IconImg src={ICONS.life} alt="Vidas" className="game-icon life-icon" /> {score.lives}/{startingLivesLimit(room, constants)}</span>
        <span><IconImg src={ICONS.decrypt} alt="Descriptografias" className="game-icon decrypt-icon" /> {score.interceptions}/{winInterceptLimit(room, constants)}</span>
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
  const columns = useRef(null);
  if (!columns.current) {
    const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    columns.current = Array.from({ length: 34 }, (_, index) => ({
      text: Array.from({ length: 22 + (index % 8) }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join(""),
      flipped: index % 7 === 0 || index % 11 === 0,
      duration: `${4.2 + (index % 7) * 0.55}s`
    }));
  }
  return (
    <div className="matrix-bg" aria-hidden="true">
      {columns.current.map((column, i) => (
        <span
          className={column.flipped ? "flipped" : ""}
          key={i}
          style={{ "--i": i, "--d": column.duration }}
        >
          {column.text}
        </span>
      ))}
    </div>
  );
}

function IconImg({ src, alt, className = "" }) {
  return <img src={src} alt={alt} className={className} aria-hidden={alt === "" ? "true" : undefined} />;
}

function initials(name = "") {
  return String(name || "?").trim().slice(0, 1).toUpperCase() || "?";
}

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Arquivo invalido."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 160;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        const sourceSize = Math.min(image.width, image.height);
        const sx = (image.width - sourceSize) / 2;
        const sy = (image.height - sourceSize) / 2;
        context.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getWinner(room, constants) {
  if (room.final?.winner) return room.final.winner;
  return TEAMS.find((team) => {
    const score = room.teams[team].score;
    const rival = room.teams[otherTeam(team)].score;
    return score.correct >= constants.WIN_CORRECT || score.interceptions >= winInterceptLimit(room, constants) || rival.lives <= 0;
  }) || "red";
}

function setSlot(value, slot, number) {
  const next = [value[0], value[1], value[2]];
  next[slot] = number;
  return next;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function filledCount(values = []) {
  return values.filter(Boolean).length;
}

function isValidCode(values = []) {
  const filled = values.filter(Boolean);
  return filled.length === 3 && new Set(filled).size === 3;
}

function startingLivesLimit(room, constants) {
  return room.settings?.startingLives || constants.STARTING_LIVES;
}

function winInterceptLimit(room, constants) {
  return room.settings?.winIntercepts || constants.WIN_INTERCEPTS;
}

function displayGuess(values = []) {
  return filledCount(values) ? values.map((value) => value || "?").join("-") : "codigo";
}

function orderedHistory(history = []) {
  return [...history].sort((a, b) => a.round - b.round);
}

function pokemonDbImageUrl(word) {
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

function rememberSession(room, payload = {}, clientId = getGhostClientId()) {
  try {
    const name = String(payload.name || "").trim();
    if (name) localStorage.setItem("decrypto:name", JSON.stringify(name));
    if (room?.code) localStorage.setItem("decrypto:lastRoomCode", JSON.stringify(room.code));
    if (room?.code && name) {
      sessionStorage.setItem("codehack:activeRoom", JSON.stringify({
        code: room.code,
        name,
        clientId
      }));
    }
  } catch {
    // Local cache is a convenience only.
  }
}

function readActiveRoomSession() {
  try {
    return JSON.parse(sessionStorage.getItem("codehack:activeRoom") || "null");
  } catch {
    return null;
  }
}

function clearActiveRoomSession() {
  try {
    sessionStorage.removeItem("codehack:activeRoom");
  } catch {
    // Session cache is best-effort.
  }
}

function getGhostClientId() {
  try {
    const existing = localStorage.getItem("codehack:ghostClientId");
    if (existing) return existing;
    const generated = `ghost:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem("codehack:ghostClientId", generated);
    return generated;
  } catch {
    return `ghost:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 12)}`;
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
    if (isSoundMuted()) return;
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
        const proposal = room.current?.turns?.[team]?.proposals?.[kind];
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
    if (isSoundMuted()) return;
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

function isSoundMuted() {
  try {
    return JSON.parse(localStorage.getItem("codehack:soundMuted") || "false") === true;
  } catch {
    return false;
  }
}

function otherTeam(team) {
  return team === "red" ? "blue" : "red";
}

function isSpectatorPlayer(player, room) {
  return Boolean(player && room?.phase !== "lobby" && (player.spectator || !TEAMS.includes(player.team)));
}

function teamLabel(team) {
  if (team === null) return "Espectadores";
  return team === "red" ? "Time Vermelho" : "Time Azul";
}

function teamEventName(team) {
  if (team === "red") return "Time Vermelho";
  if (team === "blue") return "Time Azul";
  return "Espectadores";
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
