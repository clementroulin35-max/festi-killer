import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameProvider, useGame } from "./context/GameContext";
import GMDashboard from "./components/GMDashboard";
import PlayerDashboard from "./components/PlayerDashboard";
import Leaderboard from "./components/Leaderboard";
import PlayerSetup from "./components/PlayerSetup";
import CounterAttackTab from "./components/CounterAttackTab";
import SuggestActionTab from "./components/SuggestActionTab";
import PinPad from "./components/PinPad";
import {
  Skull, Users, Shield, Trophy, User,
  ShieldAlert, Lightbulb, Award, QrCode, LogOut, Loader2
} from "lucide-react";
import heroImage from "./assets/hero-removebg.png";

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
  const [editPhotoActive, setEditPhotoActive] = useState(false);

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

  // iOS Safari zoom reset on input blur
  useEffect(() => {
    const handleBlur = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) {
        window.scrollTo(document.body.scrollLeft, document.body.scrollTop);
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          const originalContent = viewport.content;
          viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
          setTimeout(() => {
            viewport.content = originalContent;
          }, 150);
        }
      }
    };

    document.addEventListener("blur", handleBlur, true);
    return () => {
      document.removeEventListener("blur", handleBlur, true);
    };
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
    if (e) e.preventDefault();
    setError("");

    if (loginRole === "gm") {
      try {
        await loginGM(gameCode, pin);
        setActiveTab(gameState.started ? "arbitrage" : "qrcode");
      } catch (err) {
        setError(err.message);
        setPin("");
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
      setPin("");
    }
  };

  // Auto-login when PIN is 4 digits
  useEffect(() => {
    if (pin.length === 4 && joinStep === "login") {
      if (loginRole === "player" && !nickname.trim()) {
        return;
      }
      handleLogin();
    }
  }, [pin, loginRole, nickname, joinStep]);


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
        return <CounterAttackTab playerName={currentUser} logo={heroImage} />;
      case "suggest":
        return <SuggestActionTab playerName={currentUser} />;
      case "arbitrage":
        return <GMDashboard gmTab="arbitrage" />;
      case "gm_mode":
        return <GMDashboard gmTab="players" />;
      case "actions":
        return <GMDashboard gmTab="actions" />;
      case "qrcode":
        return <GMDashboard gmTab="qrcode" />;
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

        // If player has no photo set or is actively editing it, force/redirect to onboarding
        if (currentPlayer && ((!currentPlayer.photo && currentPlayer.photo !== "skipped") || editPhotoActive)) {
          return <PlayerSetup playerName={currentUser} initialSlide={editPhotoActive ? 5 : 0} onComplete={() => setEditPhotoActive(false)} />;
        }

        return <PlayerDashboard playerName={currentUser} onEditPhoto={() => setEditPhotoActive(true)} />;
    }
  };

  // === NO SESSION ENTERED YET ===
  if (!gameCode || !currentUser) {
    const pageVariants = {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
      exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    };

    return (
      <div className="app-container" style={{ padding: 0, overflow: "hidden" }}>
        <div className={`auth-screen-layout ${
          joinStep === "create" ? "bg-create" :
          joinStep === "login" ? (loginRole === "gm" ? "bg-login-gm" : "bg-login-player") :
          "bg-room"
        }`}>
          <div className="auth-content-v2">
            
            {joinStep === "room" && (
              <div className="setup-header" style={{ marginBottom: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img 
                  src={heroImage} 
                  alt="Cooki'llers logo" 
                  onClick={toggleTheme}
                  className="floating-logo"
                  style={{ 
                    width: "100%", 
                    maxWidth: "280px", 
                    height: "auto", 
                    cursor: "pointer"
                  }} 
                  title="Basculer thème jour/nuit"
                />
              </div>
            )}

            <div className={`glass-card ${loginRole === "gm" ? "glass-card-gm-auth" : "glass-card-player-auth"}`}>
              <AnimatePresence mode="wait">
                {joinStep === "create" && (
                  <motion.div
                    key="create"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="create-step"
                    style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}
                  >
                    <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.05em", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Nom / Code du Salon (Optionnel) :
                      </label>
                      <input
                        type="text"
                        placeholder="Généré aléatoirement si vide"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        className="neon-input-premium"
                        maxLength={15}
                        style={{ fontSize: "15px", fontWeight: "800", textTransform: "uppercase" }}
                      />

                      <label style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.05em", color: "var(--text-secondary)", textTransform: "uppercase", marginTop: 4 }}>
                        Code PIN secret GM (4 chiffres) :
                      </label>
                      <PinPad value={pin} onChange={setPin} />

                      <button type="submit" className="hit-success-btn" style={{ height: "46px", marginTop: "12px", fontWeight: "800", letterSpacing: "0.05em" }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "CRÉER ET ACCÉDER AU SALON"}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setJoinStep("room"); setError(""); setInputCode(""); setPin(""); }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontWeight: 700, alignSelf: "center", marginTop: 8 }}
                      >
                        ◀ Retour
                      </button>
                    </form>

                    {error && (
                      <div className={error.includes("Demande d'aide envoyée") ? "info-message" : "error-message"} style={{ marginTop: 8 }}>
                        {error.includes("Demande d'aide envoyée") ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}

                {joinStep === "room" && (
                  <motion.div
                    key="room"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="room-step"
                    style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}
                  >
                    <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <label style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.05em", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Saisir le Code du Salon :
                      </label>
                      <input
                        type="text"
                        placeholder="EX: CAMP"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        className="neon-input-premium"
                        maxLength={15}
                        style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase" }}
                        required
                      />
                      <button type="submit" className="hit-success-btn" style={{ height: "46px", marginTop: "4px", fontWeight: "800", letterSpacing: "0.05em" }} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "REJOINDRE LE SALON"}
                      </button>
                    </form>

                    {error && <div className="error-message" style={{ marginTop: 4 }}><ShieldAlert size={16} />{error}</div>}

                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
                      <hr style={{ flex: 1, borderColor: "var(--border-color)", opacity: 0.5 }} />
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: "700" }}>OU</span>
                      <hr style={{ flex: 1, borderColor: "var(--border-color)", opacity: 0.5 }} />
                    </div>

                    <button
                      type="button"
                      onClick={() => { setJoinStep("create"); setInputCode(""); setPin(""); setError(""); }}
                      className="panic-btn"
                      style={{ height: "46px", margin: 0, borderColor: "var(--neon-purple)", color: "var(--neon-purple)", fontWeight: "800", letterSpacing: "0.05em" }}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : "CRÉER UN SALON (GM)"}
                    </button>
                  </motion.div>
                )}

                {joinStep === "login" && (
                  <motion.div
                    key="login"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="login-step"
                    style={{ width: "100%" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span className="badge badge-player" style={{ backgroundColor: "rgba(139, 92, 246, 0.12)", color: "var(--neon-purple)", borderColor: "rgba(139, 92, 246, 0.25)", padding: "4px 10px", fontSize: "11px", fontWeight: "800" }}>
                        SALON : {gameCode}
                      </span>
                      <button
                        onClick={() => { setJoinStep("room"); setError(""); setPin(""); }}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
                      >
                        ◀ Changer
                      </button>
                    </div>

                    {/* Role Avatar Badge */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px", marginTop: "4px" }}>
                      <AnimatePresence mode="wait">
                        {loginRole === "player" ? (
                          <motion.div
                            key="player"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              background: "rgba(139, 92, 246, 0.12)",
                              border: "2px solid var(--neon-purple)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 0 15px rgba(139, 92, 246, 0.35)",
                            }}
                          >
                            <User size={26} style={{ color: "var(--neon-purple)" }} />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="gm"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              background: "rgba(245, 158, 11, 0.12)",
                              border: "2px solid var(--neon-gold)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 0 15px rgba(245, 158, 11, 0.35)",
                            }}
                          >
                            <Shield size={26} style={{ color: "var(--neon-gold)" }} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Role selector slider */}
                    <div style={{
                      display: "flex",
                      position: "relative",
                      background: "rgba(10, 10, 12, 0.5)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "30px",
                      padding: "4px",
                      marginBottom: "18px",
                      width: "100%",
                      height: "42px",
                      alignItems: "center",
                      cursor: "pointer",
                      userSelect: "none"
                    }}>
                      <motion.div
                        style={{
                          position: "absolute",
                          left: loginRole === "player" ? "4px" : "calc(50% + 2px)",
                          width: "calc(50% - 6px)",
                          height: "32px",
                          background: loginRole === "player" 
                            ? "linear-gradient(135deg, var(--neon-purple), #a855f7)" 
                            : "linear-gradient(135deg, var(--neon-gold), #d97706)",
                          boxShadow: loginRole === "player" 
                            ? "0 0 10px rgba(139, 92, 246, 0.4)" 
                            : "0 0 10px rgba(245, 158, 11, 0.4)",
                          borderRadius: "26px",
                          zIndex: 1,
                        }}
                        layout
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />

                      <div 
                        onClick={() => { setLoginRole("player"); setError(""); }}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: "800",
                          color: loginRole === "player" ? "#121214" : "var(--text-muted)",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "color 0.2s"
                        }}
                      >
                        <User size={13} /> Joueur
                      </div>

                      <div 
                        onClick={() => { setLoginRole("gm"); setError(""); }}
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: "800",
                          color: loginRole === "gm" ? "#121214" : "var(--text-muted)",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          transition: "color 0.2s"
                        }}
                      >
                        <Shield size={13} /> GameMaster
                      </div>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 0", gap: 10 }}>
                          <Loader2 className="animate-spin" size={28} style={{ color: "var(--neon-purple)" }} />
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600" }}>Connexion en cours...</span>
                        </div>
                      ) : (
                        <>
                          {loginRole === "player" ? (
                            <>
                              <label style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                Pseudo du joueur :
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Sophie"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="neon-input-premium"
                                required
                                style={{ padding: "10px 14px", fontSize: "14px" }}
                              />

                              <label style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", marginTop: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                Code PIN secret (4 chiffres) :
                              </label>
                              <PinPad value={pin} onChange={setPin} />
                              
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
                                  marginTop: -2
                                }}
                              >
                                Code PIN oublié ?
                              </button>
                            </>
                          ) : (
                            <>
                              <label style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                Code d'accès GameMaster :
                              </label>
                              <PinPad value={pin} onChange={setPin} />
                            </>
                          )}
                        </>
                      )}
                    </form>

                    {error && (
                      <div className={error.includes("Demande d'aide envoyée") ? "info-message" : "error-message"} style={{ marginTop: 12 }}>
                        {error.includes("Demande d'aide envoyée") ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
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
              onClick={() => setActiveTab("leaderboard")}
              className={`nav-item ${activeTab === "leaderboard" ? "active" : ""}`}
            >
              <Trophy size={20} />
              <span>Classement</span>
            </button>

            <button
              onClick={() => setActiveTab("gm_mode")}
              className={`nav-item ${activeTab === "gm_mode" ? "active" : ""}`}
            >
              <Users size={20} />
              <span>Joueurs</span>
            </button>

            <button
              onClick={() => setActiveTab("qrcode")}
              className={`nav-item ${activeTab === "qrcode" ? "active" : ""}`}
            >
              <QrCode size={20} />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setActiveTab("arbitrage")}
              className={`nav-item ${activeTab === "arbitrage" ? "active" : ""}`}
              style={{ position: "relative" }}
            >
              <Shield size={20} />
              <span>Actions</span>
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
