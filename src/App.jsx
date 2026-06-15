import React, { useState, useEffect } from "react";
import { GameProvider, useGame } from "./context/GameContext";
import GMDashboard from "./components/GMDashboard";
import PlayerDashboard from "./components/PlayerDashboard";
import Leaderboard from "./components/Leaderboard";
import PlayerSetup from "./components/PlayerSetup";
import CounterAttackTab from "./components/CounterAttackTab";
import SuggestActionTab from "./components/SuggestActionTab";
import { parseMessageToJSX } from "./utils/parseLogMessage";
import { 
  Skull, Users, Shield, Trophy, FileText, User, 
  ShieldAlert, Lightbulb, Award, Key, QrCode, LogOut, ArrowRight, Loader2
} from "lucide-react";

function MainAppContent() {
  const { 
    gameState, 
    currentUser, 
    setCurrentUser, 
    gameCode, 
    setGameCode,
    loading,
    createRoom,
    joinRoom,
    loginPlayer,
    loginGM,
    requestPinRecovery,
    resetGame 
  } = useGame();

  const [activeTab, setActiveTab] = useState("dashboard");

  // Theme toggle (dark / light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("fk_theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fk_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Authentication & salon states
  const [inputCode, setInputCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [pin, setPin] = useState("");
  const [loginRole, setLoginRole] = useState("player"); // player, gm
  const [error, setError] = useState("");
  const [joinStep, setJoinStep] = useState(() => {
    return localStorage.getItem("cookillers_game_code") ? "login" : "room";
  });

  // Check URL query parameters for direct join link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join") || params.get("game");
    if (joinCode) {
      setInputCode(joinCode.toUpperCase());
      joinRoom(joinCode)
        .then(() => {
          setJoinStep("login");
          setError("");
        })
        .catch(err => {
          setError(err.message);
        });
    }
  }, []);

  const handleCreateRoom = async (e) => {
    if (e) e.preventDefault();
    setError("");
    let code = inputCode.trim().toUpperCase();
    const gmPin = pin.trim();

    if (!gmPin) {
      setError("Veuillez saisir un code PIN secret pour le GM.");
      return;
    }
    if (gmPin.length !== 4 || isNaN(Number(gmPin))) {
      setError("Le code PIN GM doit comporter 4 chiffres.");
      return;
    }

    // Auto-generate random 4-letter room code if empty
    if (!code) {
      const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZ23456789";
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    try {
      await createRoom(code, gmPin);
      setCurrentUser("GM");
      setActiveTab("qrcode");
    } catch (err) {
      setError("Ce code de salon est déjà pris ou indisponible.");
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError("");
    if (!inputCode.trim()) return;

    try {
      await joinRoom(inputCode);
      setJoinStep("login");
      setPin("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (loginRole === "gm") {
      try {
        await loginGM(gameCode, pin);
        setActiveTab(gameState.started ? "arbitrage" : "qrcode");
      } catch (err) {
        setError(err.message);
      }
      return;
    }

    // Player login
    if (!nickname.trim()) {
      setError("Veuillez saisir un pseudo.");
      return;
    }
    if (pin.length !== 4 || isNaN(Number(pin))) {
      setError("Le code PIN doit comporter 4 chiffres.");
      return;
    }

    try {
      await loginPlayer(gameCode, nickname.trim(), pin);
      setActiveTab("dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPin = async () => {
    setError("");
    if (!nickname.trim()) {
      setError("Saisissez votre pseudo avant de demander de l'aide.");
      return;
    }
    try {
      await requestPinRecovery(gameCode, nickname.trim());
      setError("Demande d'aide envoyée au GM. Demandez-lui votre PIN !");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setGameCode(null);
    setJoinStep("room");
    setInputCode("");
    setNickname("");
    setPin("");
    setError("");
  };

  // Get current active player
  const currentPlayer = gameState.players.find(p => p.name === currentUser);
  const pendingEvents = gameState.history.filter((h) => h.status === "pending");

  // Render tab contents based on role and active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "leaderboard":
        return <Leaderboard players={gameState.players} history={gameState.history} />;
      case "counter":
        return <CounterAttackTab playerName={currentUser} />;
      case "suggest":
        return <SuggestActionTab playerName={currentUser} />;
      case "arbitrage":
        return <GMDashboard gmTab="arbitrage" />;
      case "gm_mode":
        return <GMDashboard gmTab="players" />;
      case "actions":
        return <GMDashboard gmTab="actions" />;
      case "logs":
        return <GMDashboard gmTab="history" />;
      case "qrcode":
        return <GMDashboard gmTab="qrcode" />;
      case "feed":
        const filteredHistory = currentUser === "GM"
          ? gameState.history
          : gameState.history.filter(evt => 
              evt.type !== "action_suggestion" &&
              evt.type !== "action_added" &&
              evt.type !== "action_edited" &&
              evt.type !== "action_deleted" &&
              evt.type !== "action_suggestion_rejection" &&
              evt.type !== "manual_edit" &&
              evt.type !== "skip" &&
              evt.type !== "abandon_validation"
            );

        return (
          <div className="activity-feed-view animate-fade-in">
            <h2 style={{ marginBottom: 12 }}>FIL D'ACTUALITÉ</h2>
            <div className="activity-feed">
              {filteredHistory.length === 0 ? (
                <div className="empty-feed">Aucun événement enregistré.</div>
              ) : (
                filteredHistory.map((evt) => (
                  <div key={evt.id} className="feed-item">
                    <span className="feed-time">
                      [{new Date(evt.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}]
                    </span>
                    <span className="feed-message"> {parseMessageToJSX(evt.message, gameState.players)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case "dashboard":
      default:
        if (currentUser === "GM") {
          return <GMDashboard gmTab={gameState.started ? "arbitrage" : "qrcode"} />;
        }

        // If player has no target assigned and game isn't started yet
        if (!gameState.started) {
          return (
            <div className="player-waiting-screen">
              <div className="waiting-card">
                <Skull size={48} className="glowing-icon-pink" />
                <h2>COOKI'LLERS</h2>
                <p>La partie n'est pas encore commencée.</p>
                <span className="waiting-sub">Attendez que le GameMaster lance le jeu au camp.</span>
              </div>
            </div>
          );
        }

        // If player has no photo set, force onboarding tutorial + photo initialization screen
        if (currentPlayer && !currentPlayer.photo) {
          return <PlayerSetup playerName={currentUser} />;
        }

        return <PlayerDashboard playerName={currentUser} />;
    }
  };

  // === NO SESSION ENTERED YET ===
  if (!gameCode || !currentUser) {
    return (
      <div className="app-container onboarding-carousel-view animate-fade-in" style={{ padding: "32px 16px" }}>
        <div className="admin-card setup-card" style={{ maxWidth: "100%", width: "100%", padding: "32px 20px" }}>
          
          <div className="setup-header" style={{ marginBottom: "24px" }}>
            <Skull size={54} className="glowing-icon-pink" style={{ marginBottom: "8px" }} />
            <h1 onClick={toggleTheme} style={{ fontSize: "28px", letterSpacing: "0.1em", fontWeight: 900, cursor: "pointer" }} title="Basculer thème jour/nuit">COOKI'LLERS</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Jeu d'assassinat en temps réel</p>
          </div>

          {joinStep === "create" ? (
            <div className="create-step animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Nom / Code du Salon (Optionnel) :
                </label>
                <input
                  type="text"
                  placeholder="Généré aléatoirement si vide"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="neon-input"
                  maxLength={15}
                  style={{ textAlign: "center", fontSize: "16px", fontWeight: "900", textTransform: "uppercase" }}
                />

                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Code PIN secret GM (4 chiffres) :
                </label>
                <input
                  type="password"
                  placeholder="Ex: 9876"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="neon-input"
                  maxLength={4}
                  style={{ textAlign: "center", letterSpacing: "0.5em" }}
                  required
                />

                <button type="submit" className="hit-success-btn" style={{ height: "46px", marginTop: "8px" }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "CRÉER ET ACCÉDER AU SALON"}
                </button>

                <button 
                  type="button" 
                  onClick={() => { setJoinStep("room"); setError(""); setInputCode(""); setPin(""); }} 
                  style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontWeight: 700, alignSelf: "center", marginTop: 4 }}
                >
                  ◀ Retour
                </button>
              </form>

              {error && <div className="error-message"><ShieldAlert size={16} />{error}</div>}
            </div>
          ) : joinStep === "room" ? (
            <div className="room-step animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                  Saisir le Code du Salon :
                </label>
                <input
                  type="text"
                  placeholder="EX: CAMP"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  className="neon-input"
                  maxLength={15}
                  style={{ textAlign: "center", fontSize: "20px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase" }}
                  required
                />
                <button type="submit" className="hit-success-btn" style={{ height: "46px" }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "REJOINDRE LE SALON"}
                </button>
              </form>

              {error && <div className="error-message"><ShieldAlert size={16} />{error}</div>}

              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0" }}>
                <hr style={{ flex: 1, borderColor: "var(--border-color)" }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: "600" }}>OU</span>
                <hr style={{ flex: 1, borderColor: "var(--border-color)" }} />
              </div>

              <button 
                type="button" 
                onClick={() => { setJoinStep("create"); setInputCode(""); setPin(""); setError(""); }} 
                className="panic-btn" 
                style={{ height: "46px", margin: 0, borderColor: "var(--neon-purple)", color: "var(--neon-purple)" }}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "CRÉER UN SALON (GAME MASTER)"}
              </button>
            </div>
          ) : (
            // JOIN STEP: LOGIN PLAYER / GM
            <div className="login-step animate-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span className="badge badge-player" style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "var(--neon-purple)", borderColor: "rgba(139, 92, 246, 0.2)" }}>
                  SALON : {gameCode}
                </span>
                <button 
                  onClick={() => { setJoinStep("room"); setError(""); setPin(""); }} 
                  style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
                >
                  ◀ Changer
                </button>
              </div>

              {/* Role selector */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button 
                  type="button" 
                  onClick={() => { setLoginRole("player"); setError(""); }}
                  className={`btn-approve ${loginRole === "player" ? "active-role" : ""}`}
                  style={{ 
                    flex: 1, 
                    height: 40, 
                    fontSize: 12, 
                    background: loginRole === "player" ? "var(--neon-green)" : "var(--bg-input)", 
                    color: loginRole === "player" ? "#121214" : "var(--text-secondary)",
                    border: loginRole === "player" ? "none" : "1px solid var(--border-color)"
                  }}
                >
                  <User size={14} style={{ marginRight: 6 }} /> Joueur
                </button>
                <button 
                  type="button" 
                  onClick={() => { setLoginRole("gm"); setError(""); }}
                  className={`btn-approve ${loginRole === "gm" ? "active-role" : ""}`}
                  style={{ 
                    flex: 1, 
                    height: 40, 
                    fontSize: 12, 
                    background: loginRole === "gm" ? "var(--neon-purple)" : "var(--bg-input)", 
                    color: loginRole === "gm" ? "#fff" : "var(--text-secondary)",
                    border: loginRole === "gm" ? "none" : "1px solid var(--border-color)"
                  }}
                >
                  <Shield size={14} style={{ marginRight: 6 }} /> GameMaster
                </button>
              </div>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {loginRole === "player" ? (
                  <>
                    <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                      Pseudo du joueur :
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Sophie"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="neon-input"
                      required
                    />

                    <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                      Code PIN secret (4 chiffres) :
                    </label>
                    <input
                      type="password"
                      placeholder="Ex: 1234"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="neon-input"
                      maxLength={4}
                      style={{ textAlign: "center", letterSpacing: "0.5em" }}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={handleForgotPin}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: "var(--neon-purple)", 
                        fontSize: 11, 
                        cursor: "pointer", 
                        fontWeight: 700, 
                        alignSelf: "flex-end", 
                        marginTop: -6 
                      }}
                    >
                      Code PIN oublié ?
                    </button>
                  </>
                ) : (
                  <>
                    <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                      Code d'accès GameMaster :
                    </label>
                    <input
                      type="password"
                      placeholder="Code PIN GM (0000 par défaut)"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="neon-input"
                      style={{ textAlign: "center", letterSpacing: "0.3em" }}
                      required
                    />
                  </>
                )}

                <button type="submit" className="hit-success-btn" style={{ height: "46px", marginTop: "8px" }} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "ACCÉDER À LA PARTIE"}
                </button>
              </form>

              {error && <div className="error-message" style={{ marginTop: 14 }}><ShieldAlert size={16} />{error}</div>}
            </div>
          )}

        </div>
      </div>
    );
  }

  // === SESSION CONNECTIONS ACTIVE ===
  return (
    <div className="app-container">
      
      {/* 2. App Header */}
      <header className="app-header">
        <div className="header-brand" onClick={toggleTheme} style={{ cursor: "pointer" }} title="Basculer thème jour/nuit">
          <Skull size={24} className="brand-logo" />
          <h1>COOKI'LLERS</h1>
        </div>
        <div className="user-indicator" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {currentUser === "GM" && <span className="badge badge-juge"><Shield size={12} /> GM</span>}
          {currentPlayer && currentPlayer.isZombie && (
            <span className="badge badge-zombie">
              💀 Zombie
            </span>
          )}
          
          <button 
            onClick={handleLogout}
            title="Quitter le salon"
            className="header-logout-btn"
          >
            <LogOut size={16} />
            <span>Quitter</span>
          </button>
        </div>
      </header>

      {/* 3. Main Dashboard Content */}
      <main className="app-main-content">
        {renderTabContent()}
      </main>

      {/* 4. Bottom Navigation Bar */}
      <nav className="bottom-nav">
        {/* Players waiting (not started) */}
        {!gameState.started && currentUser !== "GM" && (
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <Skull size={20} />
            <span>Mission</span>
          </button>
        )}

        {/* GM Bottom Tabs Navigation (available always once logged in) */}
        {currentUser === "GM" && (
          <>
            <button
              onClick={() => setActiveTab("logs")}
              className={`nav-item ${activeTab === "logs" ? "active" : ""}`}
            >
              <FileText size={20} />
              <span>Activités</span>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
            >
              <Trophy size={20} />
              <span>Classement</span>
            </button>

            <button
              onClick={() => setActiveTab("qrcode")}
              className={`nav-item ${activeTab === "qrcode" ? "active" : ""}`}
            >
              <QrCode size={20} />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setActiveTab("gm_mode")}
              className={`nav-item ${activeTab === "gm_mode" ? "active" : ""}`}
            >
              <Users size={20} />
              <span>Joueurs</span>
            </button>

            <button
              onClick={() => setActiveTab("arbitrage")}
              className={`nav-item ${activeTab === "arbitrage" ? "active" : ""}`}
              style={{ position: "relative" }}
            >
              <Shield size={20} />
              <span>Événements</span>
              {pendingEvents.length > 0 && (
                <span className="pending-badge-count" style={{ top: "4px", right: "20px" }}>
                  {pendingEvents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("actions")}
              className={`nav-item ${activeTab === "actions" ? "active" : ""}`}
            >
              <Award size={20} />
              <span>Défis</span>
            </button>
          </>
        )}

        {/* Players Bottom Tabs Navigation (only when started) */}
        {gameState.started && currentUser !== "GM" && (
          <>
            <button
              onClick={() => setActiveTab("feed")}
              className={`nav-item ${activeTab === "feed" ? "active" : ""}`}
            >
              <FileText size={20} />
              <span>Activités</span>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
            >
              <Trophy size={20} />
              <span>Classement</span>
            </button>

            <button
              onClick={() => setActiveTab("dashboard")}
              className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            >
              <Skull size={20} />
              <span>Mission</span>
            </button>

            <button
              onClick={() => setActiveTab("counter")}
              className={`nav-item ${activeTab === "counter" ? "active" : ""}`}
            >
              <ShieldAlert size={20} />
              <span>Dénoncer</span>
            </button>

            <button
              onClick={() => setActiveTab("suggest")}
              className={`nav-item ${activeTab === "suggest" ? "active" : ""}`}
            >
              <Lightbulb size={20} />
              <span>Idées</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainAppContent />
    </GameProvider>
  );
}
