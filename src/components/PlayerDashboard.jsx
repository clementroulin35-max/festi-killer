import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import ZeldaHearts from "./ZeldaHearts";
import TargetCard from "./TargetCard";
import {
  AlertCircle, Loader2, HeartCrack, Coins, User, Flag, Shuffle
} from "lucide-react";
import heartImage from "../assets/heart_neon.png";
import tokenImage from "../assets/token_neon.png";

/* ============================================
   RANK SYSTEM (Q2 — computed from score, exposed everywhere)
   ============================================ */
const RANKS = [
  { min: 5000, key: "alpha",    icon: "👑", label: "Alpha",          css: "rank-alpha" },
  { min: 3000, key: "legende",  icon: "💀", label: "Légende",        css: "rank-legende" },
  { min: 1500, key: "fantome",  icon: "👻", label: "Tueur Fantôme",  css: "rank-fantome" },
  { min: 750,  key: "predateur",icon: "🐺", label: "Prédateur",      css: "rank-predateur" },
  { min: 250,  key: "chasseur", icon: "🏹", label: "Chasseur",       css: "rank-chasseur" },
  { min: 0,    key: "civil",    icon: "⚔️", label: "Civil",          css: "rank-civil" },
];

export function getRank(score) {
  return RANKS.find(r => score >= r.min) || RANKS[RANKS.length - 1];
}

/* ============================================
   SUB-COMPONENTS
   ============================================ */
function RankBadge({ score }) {
  const rank = getRank(score);
  return (
    <motion.span
      className={`rank-badge ${rank.css}`}
      key={rank.key}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: "backOut" }}
    >
      {rank.icon} {rank.label}
    </motion.span>
  );
}

function AnimatedScore({ score }) {
  const [display, setDisplay] = useState(score);
  const [popDelta, setPopDelta] = useState(null);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score === prevScore.current) return;
    const delta = score - prevScore.current;
    prevScore.current = score;

    if (delta > 0) {
      setPopDelta(`+${delta}`);
      setTimeout(() => setPopDelta(null), 1300);
    }

    // Count-up animation
    const start = display;
    const end = score;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  return (
    <div className="animated-score-wrap">
      <AnimatePresence>
        {popDelta && (
          <motion.span
            key="pop"
            className="score-pop-float"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -60 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {popDelta}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="score-val">{display}</span>
      <span className="score-lbl" style={{ display: "block" }}>points</span>
    </div>
  );
}

function SkipTokens({ count }) {
  const MAX_DISPLAY = 5;
  const dots = Array.from({ length: Math.max(MAX_DISPLAY, count) }, (_, i) => i < count);
  const visible = dots.slice(0, MAX_DISPLAY);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <img src={tokenImage} alt="skip" style={{ width: 14, height: 14, mixBlendMode: "screen" }} />
      <div className="skip-tokens-display">
        {visible.map((filled, i) => (
          <motion.span
            key={i}
            className={`skip-token-dot ${filled ? "" : "empty"}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.04 }}
          />
        ))}
        {count > MAX_DISPLAY && (
          <span className="skip-count-label">+{count - MAX_DISPLAY}</span>
        )}
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--neon-gold)", marginLeft: 2 }}>
        {count}
      </span>
    </div>
  );
}

function TransmissionBanners({ hasPendingHit, hasPendingCounter, hasPendingSuggest }) {
  if (!hasPendingHit && !hasPendingCounter && !hasPendingSuggest) return null;
  return (
    <div className="transmission-banner-list">
      <AnimatePresence>
        {hasPendingHit && (
          <motion.div
            key="hit"
            className="transmission-item hit"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <span className="transmission-prefix">📡</span>
            <Loader2 size={11} className="animate-spin" style={{ flexShrink: 0 }} />
            TRANSMISSION ENVOYÉE · En attente de validation GM
          </motion.div>
        )}
        {hasPendingCounter && (
          <motion.div
            key="counter"
            className="transmission-item counter"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <span className="transmission-prefix">⚠️</span>
            <Loader2 size={11} className="animate-spin" style={{ flexShrink: 0 }} />
            DÉNONCIATION EN COURS · Jugement GM attendu
          </motion.div>
        )}
        {hasPendingSuggest && (
          <motion.div
            key="suggest"
            className="transmission-item suggest"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <span className="transmission-prefix">💡</span>
            <Loader2 size={11} className="animate-spin" style={{ flexShrink: 0 }} />
            PROPOSITION D'ACTION · En attente de validation
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================
   MAIN COMPONENT
   ============================================ */
export default function PlayerDashboard({ playerName, onEditPhoto }) {
  const { gameState, declareHit, skipAction, abandonTargetInstant } = useGame();

  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const player = gameState.players.find(p => p.name === playerName);

  if (!player) {
    return (
      <div className="player-dashboard error">
        <p>Joueur inexistant ou non initialisé.</p>
      </div>
    );
  }

  const hasPendingHit = gameState.history.some(
    h => h.status === "pending" && h.type === "hit_declaration" && h.killer === playerName
  );
  const hasPendingCounter = gameState.history.some(
    h => h.status === "pending" && h.type === "counter_attack" && h.target === playerName
  );
  const hasPendingSuggest = gameState.history.some(
    h => h.status === "pending" && h.type === "action_suggestion" && h.killer === playerName
  );

  const handleDeclareHit = () => {
    if (hasPendingHit) return;
    declareHit(playerName);
    setShowAbandonConfirm(false);
  };

  const handleSkip = () => {
    if (player.skips <= 0 || hasPendingHit) return;
    setConfirmModal({ type: "skip" });
  };

  const handleAbandonChoose = (costType) => {
    if (hasPendingHit) return;
    if (costType === "score" && player.score < 150) {
      alert("Score insuffisant pour payer en points (minimum 150 pts).");
      return;
    }
    setConfirmModal({ type: "abandon", costType });
  };

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === "abandon") {
      abandonTargetInstant(playerName, confirmModal.costType);
    } else if (confirmModal.type === "skip") {
      skipAction(playerName);
    }
    setConfirmModal(null);
    setShowAbandonConfirm(false);
  };

  const scoreAbandonPossible = player.score >= 150;
  const isZombie = player.isZombie;
  const rank = getRank(player.score);

  const containerClass = [
    "player-dashboard",
    "animate-fade-in",
    isZombie ? "zombie-hud-tint" : "",
  ].filter(Boolean).join(" ");

  return (
    <motion.div
      className={containerClass}
      style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Zombie scanline overlay */}
      {isZombie && <div className="zombie-overlay" />}

      {/* 1. Transmission banners */}
      <TransmissionBanners
        hasPendingHit={hasPendingHit}
        hasPendingCounter={hasPendingCounter}
        hasPendingSuggest={hasPendingSuggest}
      />

      {/* 2. HUD Header */}
      <motion.div
        className="hud-header"
        layout
        transition={{ duration: 0.3 }}
      >
        <div className="hud-top-row">
          {/* Avatar + identity */}
          <div className="hud-agent-info">
            {player.photo ? (
              <motion.img
                src={player.photo}
                alt={player.name}
                onClick={onEditPhoto}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 52, height: 52, borderRadius: "50%", objectFit: "cover",
                  border: `2px solid ${isZombie ? "var(--neon-red)" : "var(--neon-purple)"}`,
                  boxShadow: isZombie ? "0 0 12px rgba(255,51,102,0.4)" : "0 0 10px rgba(139,92,246,0.3)",
                  cursor: "pointer", flexShrink: 0,
                }}
                title="Modifier ma photo"
              />
            ) : (
              <motion.div
                onClick={onEditPhoto}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  border: "2px dashed var(--border-color)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", backgroundColor: "var(--bg-input)", flexShrink: 0,
                }}
              >
                <User size={20} style={{ color: "var(--text-muted)" }} />
              </motion.div>
            )}

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {player.name}
              </div>
              {isZombie ? (
                <motion.div
                  className="zombie-badge-title"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🧟 MODE ZOMBIE · 0 HP
                </motion.div>
              ) : (
                <RankBadge score={player.score} />
              )}
            </div>
          </div>

          {/* Score + skips */}
          <div className="hud-stats-right">
            <AnimatedScore score={player.score} />
          </div>
        </div>

        {/* Bottom row: hearts + skips */}
        <div className="hud-bottom-row">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={heartImage} alt="HP" style={{ width: 14, height: 14, mixBlendMode: "screen" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Santé :</span>
            <ZeldaHearts lives={player.lives} />
          </div>
          <SkipTokens count={player.skips} />
        </div>
      </motion.div>

      {/* 3. Target card */}
      {player.target ? (
        <div className={isZombie ? "zombie-mode-active" : ""}>
          <TargetCard
            targetName={player.target}
            actionId={player.actionId}
            onDeclareHit={handleDeclareHit}
            isZombie={isZombie}
            hasPendingHit={hasPendingHit}
          />
        </div>
      ) : (
        <motion.div
          className="no-target-alert"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "18px 16px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--border-radius-md)",
          }}
        >
          <AlertCircle size={24} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Aucune cible disponible. Attendez le lancement par le GM.
          </p>
        </motion.div>
      )}

      {/* 4. Tactical Action Bar */}
      <div className="tactical-bar">
        <motion.button
          className={`tactical-btn skip-tac ${player.skips <= 0 || hasPendingHit ? "disabled" : ""}`}
          onClick={handleSkip}
          disabled={player.skips <= 0 || hasPendingHit}
          whileHover={player.skips > 0 && !hasPendingHit ? { y: -2 } : {}}
          whileTap={player.skips > 0 && !hasPendingHit ? { scale: 0.97 } : {}}
        >
          <img src={tokenImage} alt="" style={{ width: 22, height: 22, mixBlendMode: "screen" }} />
          <span className="tactical-btn-label">Relance</span>
          <span className="tactical-btn-sub">Coût : 1 Skip</span>
        </motion.button>

        <motion.button
          className={`tactical-btn abandon-tac ${showAbandonConfirm ? "active-panel-btn" : ""} ${hasPendingHit ? "disabled" : ""}`}
          onClick={() => {
            if (hasPendingHit) return;
            const next = !showAbandonConfirm;
            setShowAbandonConfirm(next);
            if (next) {
              setTimeout(() => {
                const el = document.querySelector(".app-main-content");
                if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
              }, 80);
            }
          }}
          disabled={hasPendingHit}
          whileHover={!hasPendingHit ? { y: -2 } : {}}
          whileTap={!hasPendingHit ? { scale: 0.97 } : {}}
        >
          <Flag size={20} style={{ color: "var(--neon-red)", opacity: 0.8 }} />
          <span className="tactical-btn-label">Abandon</span>
          <span className="tactical-btn-sub">Choix pénalité</span>
        </motion.button>
      </div>

      {/* 5. Abandon choice panel */}
      <AnimatePresence>
        {showAbandonConfirm && (
          <motion.div
            className="counter-attack-form abandon-confirm-box"
            style={{ borderColor: "var(--neon-gold)", padding: "18px" }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h4 style={{ color: "var(--neon-gold)", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800 }}>
              <Flag size={15} /> Confirmer l'Abandon de Cible
            </h4>
            <p className="ca-help" style={{ fontSize: 13 }}>
              Votre action actuelle est conservée. Choisissez le coût :
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <motion.button
                type="button"
                onClick={() => handleAbandonChoose("lives")}
                className="abandon-cost-btn"
                whileHover={{ x: 2 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--bg-input)", border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-sm)", padding: "12px 14px",
                  color: "var(--text-primary)", cursor: "pointer", fontFamily: "var(--font-sans)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <HeartCrack size={18} color="var(--neon-red)" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>💔 Perdre 1.0 cœur</div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Impacte votre santé</span>
                  </div>
                </div>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => handleAbandonChoose("score")}
                disabled={!scoreAbandonPossible}
                className={`abandon-cost-btn ${!scoreAbandonPossible ? "disabled" : ""}`}
                whileHover={scoreAbandonPossible ? { x: 2 } : {}}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--bg-input)", border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-sm)", padding: "12px 14px",
                  color: scoreAbandonPossible ? "var(--text-primary)" : "var(--text-muted)",
                  cursor: scoreAbandonPossible ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-sans)", opacity: scoreAbandonPossible ? 1 : 0.4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Coins size={18} color="var(--neon-gold)" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>🪙 Perdre 150 points</div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Soustrait 150 pts du score</span>
                  </div>
                </div>
              </motion.button>

              {!scoreAbandonPossible && (
                <div className="error-message" style={{ margin: 0, padding: "8px 12px", fontSize: 11 }}>
                  <AlertCircle size={13} />
                  <span>Minimum 150 pts requis (solde : {player.score} pts)</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAbandonConfirm(false)}
              className="ca-submit-btn"
              style={{ background: "#27272a", color: "var(--text-primary)", marginTop: 8, padding: "10px", fontSize: 13 }}
            >
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Confirm modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            className="ux-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="ux-modal-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                borderColor: confirmModal.type === "skip"
                  ? "var(--neon-gold)"
                  : confirmModal.costType === "lives" ? "var(--neon-red)" : "var(--neon-gold)",
                boxShadow: confirmModal.type === "skip"
                  ? "0 0 20px rgba(245,158,11,0.4)"
                  : confirmModal.costType === "lives"
                    ? "0 0 20px rgba(255,51,102,0.4)"
                    : "0 0 20px rgba(245,158,11,0.4)",
              }}
            >
              <h3 className="modal-title" style={{
                color: confirmModal.type === "skip"
                  ? "var(--neon-gold)"
                  : confirmModal.costType === "lives" ? "var(--neon-red)" : "var(--neon-gold)",
                fontSize: 15, fontWeight: 800,
              }}>
                {confirmModal.type === "skip" ? "🎲 Confirmer le Reroll Action" : "🏳️ Confirmer le Reroll Cible"}
              </h3>

              <div className="modal-body" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                {confirmModal.type === "skip" ? (
                  <p>Changer d'action — coût : <strong style={{ color: "var(--neon-gold)" }}>1 jeton Skip</strong> (solde : {player.skips})</p>
                ) : confirmModal.costType === "lives" ? (
                  <>
                    <p>Changer de cible — sacrifice : <strong style={{ color: "var(--neon-red)" }}>1.0 cœur</strong></p>
                    {player.lives <= 1.0 && (
                      <motion.div
                        className="modal-warning-highlight"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{
                          background: "rgba(255,51,102,0.12)", border: "1px solid var(--neon-red)",
                          borderRadius: "var(--border-radius-sm)", padding: "10px 14px",
                          marginTop: 12, color: "#fff", fontSize: 12, fontWeight: 600,
                        }}
                      >
                        ⚠️ DANGER : Vous tombez à 0 HP → MODE ZOMBIE !
                      </motion.div>
                    )}
                  </>
                ) : (
                  <p>Changer de cible — déduction : <strong style={{ color: "var(--neon-gold)" }}>150 points</strong></p>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                <motion.button
                  onClick={handleConfirmAction}
                  className="ca-submit-btn"
                  whileTap={{ scale: 0.97 }}
                  style={{
                    margin: 0, padding: "9px 18px",
                    background: confirmModal.type === "skip"
                      ? "var(--neon-gold)"
                      : confirmModal.costType === "lives" ? "var(--neon-red)" : "var(--neon-gold)",
                    color: confirmModal.costType === "lives" && confirmModal.type !== "skip" ? "#fff" : "#121214",
                  }}
                >
                  Confirmer
                </motion.button>
                <motion.button
                  onClick={() => setConfirmModal(null)}
                  className="ca-submit-btn"
                  whileTap={{ scale: 0.97 }}
                  style={{ margin: 0, padding: "9px 18px", background: "#27272a", color: "var(--text-primary)" }}
                >
                  Annuler
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
