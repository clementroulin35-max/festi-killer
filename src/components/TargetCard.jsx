import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  onSkipSwipe
}) {
  const { gameState } = useGame();
  const [isMasked, setIsMasked] = useState(false);
  const [dragDirTarget, setDragDirTarget] = useState(null); // 'left', 'right', or null
  const [dragDirMission, setDragDirMission] = useState(null);

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
    <div className={`tarot-card-v2 rarity-${rarity} ${isMasked ? "card-blurred" : ""}`}>
      {/* White flash on HIT shoot animation */}
      {hasPendingHit && <div className="tarot-hit-flash" />}

      {/* Hologram scanline */}
      <div className="hologram-overlay">
        <div className="hologram-scan-line" />
      </div>

      {/* Panic toggle */}
      <motion.button
        className="panic-toggle-inline-btn"
        onClick={() => setIsMasked(v => !v)}
        title={isMasked ? "Révéler la cible" : "Masquer (Panic Mode)"}
        whileTap={{ scale: 0.9 }}
        style={{ top: 12, left: 12, zIndex: 12 }}
      >
        {isMasked ? <Eye size={15} /> : <EyeOff size={15} />}
      </motion.button>

      {/* Rarity small indicator */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 12, fontSize: 11, fontWeight: 800, color: rarityConf.contractColor }}>
        {rarityConf.icon} {rarityConf.label}
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
        style={{ x: 0 }}
      >
        {/* Left/Right drag feedback labels */}
        <div className="tarot-indicator-left">Reroll Cible</div>
        <div className="tarot-indicator-right">Reroll Cible</div>

        <div className="contract-header" style={{ marginBottom: 4, width: "100%", textAlign: "center" }}>
          <span className="contract-label" style={{ fontSize: 9, opacity: 0.6, letterSpacing: "0.15em" }}>◈ CONTRAT #{contractNum} ◈</span>
        </div>

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
          <div style={{ textAlign: "center", marginTop: 2 }}>
            <span className="tarot-target-status">🎯 Cible Verrouillée</span>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* CENTRAL DIVIDER */}
      {/* ============================================================ */}
      <div className="tarot-card-divider">
        <div className="tarot-divider-line" />
        <div className="tarot-divider-eye">
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
        style={{ x: 0 }}
      >
        {/* Left/Right drag feedback labels */}
        <div className="tarot-indicator-left">Relancer Défi</div>
        <div className="tarot-indicator-right">Relancer Défi</div>

        <span className="tarot-mission-title">Mission Secrète</span>
        <div className="tarot-mission-name">« {action.title} »</div>
        <p className="tarot-mission-desc">{action.description}</p>

        {/* Rewards */}
        <div className="tarot-rewards-row">
          <div className="tarot-reward-pill pts">
            <span>+{action.points} PTS</span>
          </div>
          <div className="tarot-reward-pill dmg">
            <span>-{action.damage} HP</span>
          </div>
        </div>

        {/* Zombie warning */}
        {isZombie && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "10px", color: "var(--neon-red)", opacity: 0.8, marginTop: 4 }}>
            <ShieldAlert size={12} />
            <span>Zombie : 0 dégât, points divisés par 2.</span>
          </div>
        )}
      </motion.div>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE SEAL BUTTON (HIT RÉUSSI) */}
      {/* ============================================================ */}
      <div className="tarot-seal-hit-btn-container" style={{ paddingBottom: 20 }}>
        <AnimatePresence mode="wait">
          {hasPendingHit ? (
            <button key="pending" className="tarot-seal-hit-btn pending" disabled>
              <Loader2 size={14} className="animate-spin" style={{ marginRight: 6 }} />
              Validation GM en cours...
            </button>
          ) : (
            <motion.button
              key="hit"
              className="tarot-seal-hit-btn"
              onClick={onDeclareHit}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              ☠️ Signer le contrat (Hit)
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
