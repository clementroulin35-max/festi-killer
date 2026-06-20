import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useGame } from "../context/GameContext";
import { DEFAULT_ACTIONS } from "../services/gameEngine";
import { ShieldAlert, Eye, EyeOff, Loader2 } from "lucide-react";

const RARITY_CONFIG = {
  micro:      { label: "Micro-défi",   icon: "🟢", contractColor: "var(--neon-green)" },
  standard:   { label: "Standard",     icon: "🔵", contractColor: "var(--neon-blue)" },
  majeur:     { label: "Majeur",       icon: "🟣", contractColor: "var(--neon-purple)" },
  legendaire: { label: "Légendaire",   icon: "🔥", contractColor: "var(--neon-gold)" },
};

function getInitials(name) {
  return name ? name.slice(0, 2).toUpperCase() : "??";
}

export default function TargetCard({
  targetName,
  actionId,
  onDeclareHit,
  isZombie,
  hasPendingHit,
  onAbandonSwipe,
  onSkipSwipe,
  playerSkips = 0,
  playerScore = 0
}) {
  const { gameState } = useGame();
  const [isMasked, setIsMasked] = useState(false);
  const [dragDirTarget, setDragDirTarget] = useState(null); // 'left', 'right', or null
  const [dragDirMission, setDragDirMission] = useState(null);

  const topControls = useAnimation();
  const bottomControls = useAnimation();

  const canAbandon = (!isZombie || playerScore >= 50) && !hasPendingHit;
  const canSkip = playerSkips > 0 && !hasPendingHit;

  useEffect(() => {
    let timeoutId;
    let intervalId;

    const startHintSequence = () => {
      if (canAbandon) {
        topControls.start({
          x: [0, 15, -15, 0],
          transition: { duration: 0.8, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }
        });
      }

      timeoutId = setTimeout(() => {
        if (canSkip) {
          bottomControls.start({
            x: [0, -15, 15, 0],
            transition: { duration: 0.8, times: [0, 0.25, 0.75, 1], ease: "easeInOut" }
          });
        }
      }, 1500);
    };

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);

      timeoutId = setTimeout(() => {
        startHintSequence();
        intervalId = setInterval(startHintSequence, 8000);
      }, 6000);
    };

    resetInactivityTimer();

    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [canAbandon, canSkip, topControls, bottomControls]);

  const targetPlayer = gameState.players.find(p => p.name === targetName);
  const action = (gameState.actionPool || DEFAULT_ACTIONS).find(a => a.id === actionId);

  if (!action) {
    return (
      <div className="tarot-card-v2 rarity-standard">
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          Aucune mission assignée.
        </div>
      </div>
    );
  }

  const rarity = action.difficulty || "standard";
  const rarityConf = RARITY_CONFIG[rarity] || RARITY_CONFIG.standard;

  // Cosmetic contract number from actionId
  const contractNum = String(typeof actionId === "number" ? actionId : (parseInt(String(actionId).replace(/\D/g, "")) || 1)).padStart(3, "0");

  const handleTargetDrag = (e, info) => {
    if (info.offset.x > 35) {
      setDragDirTarget("right");
    } else if (info.offset.x < -35) {
      setDragDirTarget("left");
    } else {
      setDragDirTarget(null);
    }
  };

  const handleTargetDragEnd = (e, info) => {
    setDragDirTarget(null);
    if (Math.abs(info.offset.x) > 100) {
      onAbandonSwipe();
    }
  };

  const handleMissionDrag = (e, info) => {
    if (info.offset.x > 35) {
      setDragDirMission("right");
    } else if (info.offset.x < -35) {
      setDragDirMission("left");
    } else {
      setDragDirMission(null);
    }
  };

  const handleMissionDragEnd = (e, info) => {
    setDragDirMission(null);
    if (Math.abs(info.offset.x) > 100) {
      onSkipSwipe();
    }
  };

  // Build top drag active classes for indicator feedback
  const topContainerClass = [
    "tarot-card-top",
    dragDirTarget === "left" ? "drag-active-left" : "",
    dragDirTarget === "right" ? "drag-active-right" : ""
  ].filter(Boolean).join(" ");

  // Build bottom drag active classes
  const bottomContainerClass = [
    "tarot-card-bottom",
    dragDirMission === "left" ? "drag-active-left" : "",
    dragDirMission === "right" ? "drag-active-right" : ""
  ].filter(Boolean).join(" ");

  const isTargetZombie = targetPlayer?.isZombie;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 420 }}>
      <div className={`tarot-card-v2 rarity-${rarity} ${isMasked ? "card-blurred" : ""} ${hasPendingHit ? "hit-shattered" : ""}`}>
      {/* White flash on HIT shoot animation */}
      {hasPendingHit && <div className="tarot-hit-flash" />}

      {/* Broken glass overlay on pending hit */}
      {hasPendingHit && (
        <div className="tarot-broken-overlay" style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
          opacity: 0.8,
        }}>
          <svg viewBox="0 0 320 480" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
            <path d="M160,140 L120,90 L90,110 M120,90 L70,50 L30,60 M70,50 L60,10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M160,140 L210,100 L260,80 L300,90 M260,80 L280,30" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M160,140 L180,200 L210,250 L250,290 M210,250 L170,270 L140,320 L160,400 M140,320 L90,340 M160,400 L200,450" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M160,140 L130,170 L90,180 L50,220 L20,210 M90,180 L70,140 L40,150" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M0,80 L40,90 L60,120 M0,240 L30,230 L50,250 M320,180 L290,190 L270,170 M320,320 L280,330 M100,480 L120,440 L150,450" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" strokeLinecap="round" />
            <polygon points="155,135 158,132 154,130" fill="rgba(255,255,255,0.7)" />
            <polygon points="165,145 168,142 166,148" fill="rgba(255,255,255,0.7)" />
            <polygon points="145,150 148,155 142,152" fill="rgba(255,255,255,0.7)" />
          </svg>
        </div>
      )}

      {/* Hologram scanline */}
      <div className="hologram-overlay">
        <div className="hologram-scan-line" />
      </div>

      {/* Header MISSION de la carte */}
      <div className="tarot-card-header-v2">
        <span>MISSION</span>
      </div>

      {/* ============================================================ */}
      {/* 1. UPPER HALF: THE TARGET */}
      {/* ============================================================ */}
      <motion.div
        className={topContainerClass}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDrag={handleTargetDrag}
        onDragEnd={handleTargetDragEnd}
        animate={topControls}
        style={{ x: 0 }}
      >
        {/* Left/Right drag feedback labels */}
        <div className="tarot-indicator-left">Reroll Cible</div>
        <div className="tarot-indicator-right">Reroll Cible</div>

        {/* Label CIBLE rétro */}
        <div className="tarot-target-label-v2">CIBLE</div>

        {/* Target radar scope */}
        <div className={`tarot-target-scope ${hasPendingHit ? "hit-animation-active" : ""}`}>
          <div className="tarot-target-lines" />
          
          {/* Bullet impact hole */}
          {hasPendingHit && (
            <div className="bullet-hole-impact">
              <svg viewBox="0 0 100 100" style={{ width: 40, height: 40 }}>
                <circle cx="50" cy="50" r="8" fill="#111116" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <path d="M50 42 L50 20 M50 58 L50 80 M42 50 L20 50 M58 50 L80 50 M44 44 L32 32 M56 56 L68 68 M44 56 L32 68 M56 44 L68 32" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="50" cy="50" r="3" fill="#fff" />
              </svg>
            </div>
          )}

          <div className={isTargetZombie ? "zombie-avatar-crt" : ""}>
            {targetPlayer?.photo ? (
              <img
                src={targetPlayer.photo}
                alt={targetName}
                className={`tarot-target-avatar ${hasPendingHit ? "hit-animation-active" : ""}`}
              />
            ) : (
              <div className={`tarot-target-initials ${hasPendingHit ? "hit-animation-active" : ""}`}>
                {getInitials(targetName)}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="tarot-target-name">{targetName}</div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* CENTRAL DIVIDER */}
      {/* ============================================================ */}
      <div className="tarot-card-divider">
        <div className="tarot-divider-line" />
        <div 
          className={`tarot-divider-eye clickable-eye-btn ${isMasked ? "masked" : ""}`}
          onClick={() => setIsMasked(v => !v)}
          title={isMasked ? "Révéler la cible" : "Masquer la cible (Panic Mode)"}
          style={{ cursor: "pointer", zIndex: 15 }}
        >
          <span style={{ fontSize: "14px", transform: "scale(1.2)" }}>👁️</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. LOWER HALF: THE MISSION */}
      {/* ============================================================ */}
      <motion.div
        className={bottomContainerClass}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDrag={handleMissionDrag}
        onDragEnd={handleMissionDragEnd}
        animate={bottomControls}
        style={{ x: 0 }}
      >
        {/* Left/Right drag feedback labels */}
        <div className="tarot-indicator-left">Relancer Défi</div>
        <div className="tarot-indicator-right">Relancer Défi</div>

        <div className="tarot-mission-name">« {action.title} »</div>
        <p className="tarot-mission-desc">{action.description}</p>

        {/* Section Basse: Gains discrets et badge des Skips */}
        <div className="tarot-mission-footer-v2">
          {/* Récompenses discrètes */}
          <div className="tarot-rewards-discret-v2">
            <span className="reward-pts-v2">+{isZombie ? Math.floor(action.points / 2) : action.points} PTS</span>
            <span className="reward-dmg-v2">-{isZombie ? 0 : action.damage} HP</span>
          </div>
          
          {/* Badge jetons relance en bas à droite */}
          <div className="tarot-skips-badge-v2" title={`${playerSkips} relances disponibles`}>
            <span className="skips-icon-v2">🪙</span>
            <span className="skips-val-v2">{playerSkips}</span>
          </div>
        </div>
      </motion.div>

      </div>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE SEAL BUTTON (HIT RÉUSSI) */}
      {/* ============================================================ */}
      <div className="tarot-seal-hit-btn-container" style={{ paddingBottom: 20 }}>
        <AnimatePresence mode="wait">
          {hasPendingHit ? (
            <button key="pending" className="tarot-seal-hit-btn pending" style={{ borderRadius: "50px" }} disabled>
              <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} />
              Validation GM...
            </button>
          ) : (
            <div className="hit-button-wrapper-v2">
              {/* Flèche gauche animée */}
              <span className="hit-arrow-left-v2">❯❯</span>
              
              <motion.button
                key="hit"
                className="tarot-seal-hit-btn-circular"
                onClick={onDeclareHit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                HIT
              </motion.button>
              
              {/* Flèche droite animée */}
              <span className="hit-arrow-right-v2">❮❮</span>
            </div>
          )}
        </AnimatePresence>
      </div>
  </div>
);
}
