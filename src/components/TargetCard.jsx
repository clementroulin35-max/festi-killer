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

export default function TargetCard({ targetName, actionId, onDeclareHit, isZombie, hasPendingHit }) {
  const { gameState } = useGame();
  const [isMasked, setIsMasked] = useState(false);

  const targetPlayer = gameState.players.find(p => p.name === targetName);
  const action = (gameState.actionPool || DEFAULT_ACTIONS).find(a => a.id === actionId);

  if (!action) {
    return (
      <div className="target-card-v2 rarity-standard">
        <div className="target-card-content">
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Aucune mission assignée.</p>
        </div>
      </div>
    );
  }

  const rarity = action.difficulty || "standard";
  const rarityConf = RARITY_CONFIG[rarity] || RARITY_CONFIG.standard;

  // Cosmetic contract number from actionId
  const contractNum = String(typeof actionId === "number" ? actionId : (parseInt(String(actionId).replace(/\D/g, "")) || 1)).padStart(3, "0");

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  };

  const hitBtnVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.15 } },
    tap: { scale: 0.96, transition: { duration: 0.1 } },
  };

  return (
    <motion.div
      className={`target-card-v2 rarity-${rarity} ${isMasked ? "card-blurred" : ""}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      {/* Hologram scan overlay */}
      <div className="hologram-overlay">
        <div className="hologram-scan-line" />
      </div>

      {/* Corner brackets */}
      <div className="corner-bracket tl" />
      <div className="corner-bracket tr" />
      <div className="corner-bracket bl" />
      <div className="corner-bracket br" />

      {/* Panic toggle */}
      <motion.button
        className="panic-toggle-inline-btn"
        onClick={() => setIsMasked(v => !v)}
        title={isMasked ? "Révéler la cible" : "Masquer (Panic Mode)"}
        whileTap={{ scale: 0.9 }}
        style={{ top: 14, left: 14 }}
      >
        {isMasked ? <Eye size={16} /> : <EyeOff size={16} />}
      </motion.button>

      {/* Inner content */}
      <div className="target-card-content">

        {/* Contract ID + target label */}
        <div className="contract-header">
          <span className="contract-label">◈ CONTRAT</span>
          <span className="contract-id" style={{ color: rarityConf.contractColor }}>
            #{contractNum}
          </span>
          <div className="target-locked-label" style={{ color: rarityConf.contractColor }}>
            🎯 CIBLE VERROUILLÉE
          </div>
        </div>

        {/* Avatar ring */}
        <motion.div
          className={`avatar-outer-v2 rarity-${rarity}`}
          animate={rarity === "majeur" || rarity === "legendaire"
            ? { rotate: [0, 360] }
            : {}}
          transition={rarity === "majeur" || rarity === "legendaire"
            ? { duration: rarity === "legendaire" ? 4 : 8, repeat: Infinity, ease: "linear" }
            : {}}
        >
          <div className="avatar-inner-v2">
            {targetPlayer?.photo ? (
              <img
                src={targetPlayer.photo}
                alt={targetName}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              getInitials(targetName)
            )}
          </div>
        </motion.div>

        {/* Target name */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "900",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
            }}
          >
            {targetName}
          </div>
          <div style={{ fontSize: "11px", color: "var(--neon-green)", fontWeight: "700", marginTop: 2 }}>
            🟢 VIVANT · EN CHASSE
          </div>
        </div>

        {/* Rarity badge */}
        <span className={`rarity-badge-v2 ${rarity}`}>
          {rarityConf.icon} {rarityConf.label}
        </span>

        {/* Mission box */}
        <div className="mission-box-v2">
          <div className="mission-title-lbl">◈ MISSION SECRÈTE</div>
          {action.title && (
            <div className="mission-name">« {action.title} »</div>
          )}
          <div className="mission-desc-v2">
            {action.description}
          </div>
        </div>

        {/* Stats pills */}
        <div className="mission-stats-v2">
          <div className="stat-pill pts">
            <span className="stat-pill-val">+{action.points}</span>
            <span className="stat-pill-lbl">Points</span>
          </div>
          <div className="stat-pill dmg">
            <span className="stat-pill-val">-{action.damage}</span>
            <span className="stat-pill-lbl">{action.damage > 1 ? "Cœurs" : "Cœur"}</span>
          </div>
        </div>

        {/* Zombie notice */}
        {isZombie && (
          <motion.div
            className="zombie-notice"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ShieldAlert size={16} />
            <span>Mode Zombie : 0 dégât à la cible, points divisés par 2.</span>
          </motion.div>
        )}

        {/* HIT button */}
        <AnimatePresence mode="wait">
          {hasPendingHit ? (
            <motion.button
              key="pending"
              className="hit-success-btn pending"
              disabled
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 size={16} className="animate-spin" style={{ marginRight: 8, display: "inline" }} />
              EN ATTENTE DU GM...
            </motion.button>
          ) : (
            <motion.button
              key="hit"
              className="hit-success-btn"
              variants={hitBtnVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={onDeclareHit}
            >
              ☠️ HIT RÉUSSI !
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
