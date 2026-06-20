import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../context/GameContext";
import ZeldaHearts from "./ZeldaHearts";
import TargetCard from "./TargetCard";
import {
  AlertCircle, Loader2, HeartCrack, Coins, User, Flag, ShieldAlert
} from "lucide-react";
import heartImage from "../assets/heart_neon.png";
import tokenImage from "../assets/token_neon.png";
import suicidePreventImage from "../assets/suicide_prevent.png";

/* ============================================
   RANK SYSTEM (computed from score, exposed everywhere)
   ============================================ */
const RANKS = [
  { min: 3500, key: "alpha",    icon: "👑", label: "Alpha",          css: "rank-alpha" },
  { min: 2000, key: "legende",  icon: "💀", label: "Légende",        css: "rank-legende" },
  { min: 1000, key: "fantome",  icon: "👻", label: "Tueur Fantôme",  css: "rank-fantome" },
  { min: 450,  key: "predateur",icon: "🐺", label: "Prédateur",      css: "rank-predateur" },
  { min: 150,  key: "chasseur", icon: "🏹", label: "Chasseur",       css: "rank-chasseur" },
  { min: 0,    key: "civil",    icon: "⚔️", label: "Civil",          css: "rank-civil" },
];

export function getRank(score) {
  return RANKS.find(r => score >= r.min) || RANKS[RANKS.length - 1];
}

/* ============================================
   SUB-COMPONENTS
   ============================================ */
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
    <div className="animated-score-wrap" style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <AnimatePresence>
        {popDelta && (
          <motion.span
            key="pop"
            className="score-pop-float"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ position: "absolute", top: -20, left: 0, color: "var(--neon-green)", fontWeight: 900, fontSize: "16px" }}
          >
            {popDelta}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="score-val">{display}</span>
      <span className="score-lbl">points</span>
    </div>
  );
}

function TransmissionBanners({ hasPendingCounter, hasPendingSuggest }) {
  if (!hasPendingCounter && !hasPendingSuggest) return null;
  return (
    <div className="transmission-banner-list" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
      <AnimatePresence>
        {hasPendingCounter && (
          <motion.div
            key="counter"
            className="transmission-item counter"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
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

  const [confirmModal, setConfirmModal] = useState(null); // { type: 'skip' | 'abandon' }
  const [showTokenTooltip, setShowTokenTooltip] = useState(false);
  const [showSuicideAlert, setShowSuicideAlert] = useState(false);

  useEffect(() => {
    if (showTokenTooltip) {
      const timer = setTimeout(() => {
        setShowTokenTooltip(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showTokenTooltip]);

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
  };

  const handleSkipTrigger = () => {
    if (player.skips <= 0 || hasPendingHit) return;
    setConfirmModal({ type: "skip" });
  };

  const handleAbandonTrigger = () => {
    if (hasPendingHit) return;
    setConfirmModal({ type: "abandon" });
  };

  const handleConfirmAction = (costType) => {
    if (!confirmModal) return;
    if (confirmModal.type === "abandon") {
      if (costType === "lives" && player.lives <= 0.5) {
        setShowSuicideAlert(true);
        setConfirmModal(null);
        return;
      }
      abandonTargetInstant(playerName, costType);
    } else if (confirmModal.type === "skip") {
      skipAction(playerName);
    }
    setConfirmModal(null);
  };

  const scoreAbandonPossible = player.score >= 50;
  const isZombie = player.isZombie;
  const rank = getRank(player.score);

  // Dynamic XP calculation
  const currentIndex = RANKS.indexOf(rank);
  const nextRank = currentIndex > 0 ? RANKS[currentIndex - 1] : null;
  const progressPercent = nextRank
    ? Math.min(100, Math.max(0, ((player.score - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;

  const containerClass = [
    "player-dashboard",
    "animate-fade-in",
    isZombie ? "zombie-hud-tint" : "",
  ].filter(Boolean).join(" ");

  return (
    <motion.div
      className={containerClass}
      style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Zombie scanline overlay */}
      {isZombie && <div className="zombie-overlay" />}

      {/* 1. Transmission banners */}
      <TransmissionBanners
        hasPendingCounter={hasPendingCounter}
        hasPendingSuggest={hasPendingSuggest}
      />

      {/* 2. HUD Header V2 */}
      <motion.div className="hud-header-v2" layout transition={{ duration: 0.3 }}>
        <div className="hud-main-container-v2">
          {/* Bloc Gauche: Pseudo + Cœurs */}
          <div className="hud-left-column-v2">
            <span className="hud-pseudo-v2">{player.name}</span>
            <div className="hud-hearts-wrapper-v2">
              <ZeldaHearts lives={player.lives} />
            </div>
          </div>

          {/* Bloc Droite: Avatar + Vital Monitor + Badge Rang */}
          <div className="hud-right-column-v2">
            <div className="hud-avatar-wrapper-v2">
              <div className={isZombie ? "zombie-avatar-crt" : ""}>
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    onClick={onEditPhoto}
                    className="hud-avatar-v2"
                    title="Modifier ma photo"
                  />
                ) : (
                  <div onClick={onEditPhoto} className="hud-avatar-v2 placeholder" title="Modifier ma photo">
                    <User size={16} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
              </div>
              
              {/* Moniteur vital (ECG) en diagonale haut droite */}
              <div className={`hud-vital-monitor-v2 ${isZombie ? "zombie" : "alive"}`}>
                <div className="ecg-dot" />
                <svg viewBox="0 0 100 30" className="ecg-svg">
                  <path
                    className="ecg-path"
                    d="M0 15 h30 l4 -10 l4 20 l4 -15 l4 5 h54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            
            {/* Rang juste sous l'avatar */}
            <div className="hud-rank-wrapper-v2">
              <span className="hud-rank-label-v2">{rank.icon} {rank.label}</span>
            </div>
          </div>
        </div>

        {/* Section Médiane: XP Bar hachurée */}
        <div className="hud-xp-row-v2">
          <div className="xp-bar-container-v2">
            <div className="xp-bar-bg-v2">
              <div className="xp-bar-v2" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="xp-text-v2">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Section Basse: Score (centré) avec lignes de séparation */}
        <div className="hud-score-row-v2">
          <div className="hud-score-line" />
          <AnimatedScore score={player.score} />
          <div className="hud-score-line" />
        </div>
      </motion.div>

      {/* 3. Target card V2 (Tarot layout) */}
      {player.target ? (
        <div className={isZombie ? "zombie-mode-active" : ""} style={{ display: "flex", justifyContent: "center" }}>
          <TargetCard
            targetName={player.target}
            actionId={player.actionId}
            onDeclareHit={handleDeclareHit}
            isZombie={isZombie}
            hasPendingHit={hasPendingHit}
            onAbandonSwipe={handleAbandonTrigger}
            onSkipSwipe={handleSkipTrigger}
            playerSkips={player.skips}
            playerScore={player.score}
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
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
            Aucune cible disponible. Attendez le lancement par le GM.
          </p>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* 4. CONFIRMATION MODALS V2 (MINIMALIST TRANSLUCENT GLASS) */}
      {/* ============================================================ */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            className="confirm-modal-backdrop-v2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {confirmModal.type === "skip" && (
              <motion.div
                className="confirm-modal-v2"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <h3 className="confirm-modal-title-v2">Confirmer le changement de défi</h3>
                <p className="confirm-modal-body-v2">
                  Voulez-vous changer votre action actuelle ?<br />
                  Cette action consomme <strong style={{ color: "var(--neon-gold)" }}>1 jeton de Relance</strong>.<br />
                  (Solde disponible : {player.skips} relances)
                </p>

                <div className="confirm-action-btns-v2">
                  <button
                    className="confirm-btn-primary-v2"
                    style={{ backgroundColor: "var(--neon-gold)", color: "#121214" }}
                    onClick={() => handleConfirmAction()}
                  >
                    Changer le défi
                  </button>
                  <button className="confirm-btn-cancel-v2" onClick={() => setConfirmModal(null)}>
                    Annuler
                  </button>
                </div>
              </motion.div>
            )}

            {confirmModal.type === "abandon" && (
              <motion.div
                className="confirm-modal-v2 type-red"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <h3 className="confirm-modal-title-v2">Abandonner et changer de cible</h3>
                <p className="confirm-modal-body-v2" style={{ marginBottom: 4 }}>
                  Changer de cible entraîne une pénalité immédiate.<br />
                  Choisissez votre coût de relance :
                </p>

                <div className="confirm-options-v2">
                  {/* Option 1: Cœurs */}
                  <button
                    className={`confirm-opt-btn-v2 ${isZombie ? "disabled" : ""}`}
                    disabled={isZombie}
                    onClick={() => handleConfirmAction("lives")}
                  >
                    <HeartCrack size={20} style={{ color: "var(--neon-red)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>💔 Perdre 0.5 cœur</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Impacte votre santé (HP)</div>
                    </div>
                  </button>

                  {/* Option 2: Score */}
                  <button
                    className={`confirm-opt-btn-v2 ${!scoreAbandonPossible ? "disabled" : ""}`}
                    disabled={!scoreAbandonPossible}
                    onClick={() => handleConfirmAction("score")}
                  >
                    <Coins size={20} style={{ color: "var(--neon-gold)" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>🪙 Perdre 50 points</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Déduit 50 pts de votre score</div>
                    </div>
                  </button>

                  {!scoreAbandonPossible && (
                    <div style={{ fontSize: 10, color: "var(--neon-red)", opacity: 0.8, textAlign: "left", padding: "0 6px" }}>
                      ⚠️ Score insuffisant pour payer en points (minimum 50 pts requis).
                    </div>
                  )}
                </div>

                <div className="confirm-action-btns-v2">
                  <button className="confirm-btn-cancel-v2" style={{ width: "100%" }} onClick={() => setConfirmModal(null)}>
                    Retour au contrat
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {showSuicideAlert && (
          <motion.div
            className="confirm-modal-backdrop-v2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 11000 }}
          >
            <motion.div
              className="confirm-modal-v2 type-red"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "14px",
                maxWidth: "360px",
                padding: "24px 20px"
              }}
            >
              <img 
                src={suicidePreventImage} 
                alt="Suicide interdit" 
                style={{ 
                  width: "120px", 
                  height: "120px", 
                  borderRadius: "12px", 
                  border: "2px solid var(--neon-red)",
                  boxShadow: "0 0 15px rgba(255, 51, 102, 0.4)",
                  objectFit: "cover"
                }} 
              />
              <h3 className="confirm-modal-title-v2" style={{ color: "var(--neon-red)", margin: 0 }}>SUICIDE INTERDIT ! 🛑</h3>
              <p className="confirm-modal-body-v2" style={{ fontSize: "13.5px", lineHeight: "1.45", margin: 0 }}>
                Hé, champion ! Le règlement de la Psy Trance est formel : <strong>on ne s'élimine pas soi-même.</strong><br />
                Abandonner ce défi te coûterait ton tout dernier demi-cœur. Tu ne vas pas capituler comme ça et nourrir les zombies ! 🧠
              </p>
              
              <button 
                className="confirm-btn-primary-v2"
                style={{ backgroundColor: "var(--neon-red)", color: "#fff", width: "100%", height: "42px", marginTop: "6px" }}
                onClick={() => setShowSuicideAlert(false)}
              >
                Compris, je reste au combat ⚔️
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
