import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { DEFAULT_ACTIONS } from "../services/gameEngine";
import ZeldaHearts from "./ZeldaHearts";
import TargetCard from "./TargetCard";
import { EyeOff, Eye, Shuffle, Flag, ShieldAlert, AlertCircle, Lightbulb, Loader2, Coins, HeartCrack } from "lucide-react";

export default function PlayerDashboard({ playerName }) {
  const {
    gameState,
    declareHit,
    skipAction,
    abandonTargetInstant,
  } = useGame();

  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // null or { type: 'abandon', costType: 'lives' | 'score' } or { type: 'skip' }

  const player = gameState.players.find((p) => p.name === playerName);

  if (!player) {
    return (
      <div className="player-dashboard error">
        <p>Joueur inexistant ou non initialisé.</p>
      </div>
    );
  }

  // Calculate pending events
  const hasPendingHit = gameState.history.some(
    (h) => h.status === "pending" && h.type === "hit_declaration" && h.killer === playerName
  );
  const hasPendingCounter = gameState.history.some(
    (h) => h.status === "pending" && h.type === "counter_attack" && h.target === playerName
  );
  const hasPendingSuggest = gameState.history.some(
    (h) => h.status === "pending" && h.type === "action_suggestion" && h.killer === playerName
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
      alert("Votre score est insuffisant pour payer en points (minimum 150 points).");
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

  return (
    <div className="player-dashboard animate-fade-in">
      {/* 1. Alerts Banners for pending decisions */}
      {(hasPendingHit || hasPendingCounter || hasPendingSuggest) && (
        <div className="pending-status-banner-list">
          {hasPendingHit && (
            <div className="pending-status-item hit animate-slide-down">
              <Loader2 size={12} className="animate-spin" />
              <span>Hit déclaré ! En attente de validation discrète par le GM.</span>
            </div>
          )}
          {hasPendingCounter && (
            <div className="pending-status-item counter animate-slide-down">
              <Loader2 size={12} className="animate-spin" />
              <span>Dénonciation envoyée ! En attente de jugement du GM.</span>
            </div>
          )}
          {hasPendingSuggest && (
            <div className="pending-status-item suggest animate-slide-down">
              <Loader2 size={12} className="animate-spin" />
              <span>Proposition d'action envoyée ! En attente de validation.</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Player Info Header */}
      <div className="player-header-card">
        <div className="player-header-row">
          <div>
            <h2 className="p-nickname">{player.name}</h2>
            {player.isZombie ? (
              <span className="zombie-badge-title">MODE ZOMBIE (💀 0 HP)</span>
            ) : (
              <span className="status-label">STATUT : VIVANT</span>
            )}
          </div>
          <div className="score-display">
            <span className="score-val">{player.score}</span>
            <span className="score-lbl">points</span>
          </div>
        </div>

        {/* Hearts & Skips */}
        <div className="player-stats-row">
          <div className="hearts-block">
            <span className="stat-row-lbl">Énergie (Vies) :</span>
            <ZeldaHearts lives={player.lives} />
          </div>
          <div className="skips-block">
            <span className="stat-row-lbl">Skips :</span>
            <span className="skips-count">{player.skips} 🎲</span>
          </div>
        </div>

      </div>

      {/* 3. Secret Target Card */}
      {player.target ? (
        <TargetCard
          targetName={player.target}
          actionId={player.actionId}
          onDeclareHit={handleDeclareHit}
          isZombie={player.isZombie}
          hasPendingHit={hasPendingHit}
          actionEphemeral={player.actionEphemeral}
        />
      ) : (
        <div className="no-target-alert">
          <AlertCircle size={24} />
          <p>Aucune cible disponible. Attendez le lancement par le GM.</p>
        </div>
      )}

      {/* 4. Action Panel */}
      <div className="actions-panel">
        <h3>Actions Tactiques</h3>
        <div className="actions-grid">
          <button
            onClick={handleSkip}
            disabled={player.skips <= 0 || hasPendingHit}
            className={`action-btn-tactical skip-btn ${
              player.skips <= 0 || hasPendingHit ? "disabled" : ""
            }`}
          >
            <Shuffle size={18} />
            <div className="btn-text-wrap">
              <strong>Relancer Action</strong>
              <span>Coût : 1 Skip</span>
            </div>
          </button>

          <button
            onClick={() => {
              if (hasPendingHit) return;
              setShowAbandonConfirm(!showAbandonConfirm);
            }}
            disabled={hasPendingHit}
            className={`action-btn-tactical abandon-btn ${showAbandonConfirm ? "active-panel-btn" : ""} ${hasPendingHit ? "disabled" : ""}`}
          >
            <Flag size={18} />
            <div className="btn-text-wrap">
              <strong>Abandonner Cible</strong>
              <span>Choix pénalité</span>
            </div>
          </button>
        </div>

        {/* Target Abandon confirmation choices */}
        {showAbandonConfirm && (
          <div className="counter-attack-form abandon-confirm-box animate-slide-down" style={{ borderColor: "var(--neon-gold)" }}>
            <h4 style={{ color: "var(--neon-gold)", display: "flex", alignItems: "center", gap: 6 }}>
              <Flag size={14} /> Confirmer l'Abandon de Cible
            </h4>
            <p className="ca-help">
              Vous allez changer de cible (votre action actuelle sera conservée).
              Choisissez le coût à payer :
            </p>

            <div className="abandon-options-flex" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {/* Option A: Lives */}
              <button
                type="button"
                onClick={() => handleAbandonChoose("lives")}
                className="abandon-cost-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "10px 12px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <HeartCrack size={16} color="var(--neon-red)" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>💔 Perdre 1.0 cœur</div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Impacte directement votre énergie</span>
                  </div>
                </div>
              </button>

              {/* Option B: Points */}
              <button
                type="button"
                onClick={() => handleAbandonChoose("score")}
                disabled={!scoreAbandonPossible}
                className={`abandon-cost-btn ${!scoreAbandonPossible ? "disabled" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "10px 12px",
                  color: scoreAbandonPossible ? "var(--text-primary)" : "var(--text-muted)",
                  cursor: scoreAbandonPossible ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-sans)",
                  opacity: scoreAbandonPossible ? 1 : 0.4
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Coins size={16} color="var(--neon-gold)" />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>🪙 Perdre 150 points</div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Soustraira 150 pts de votre score</span>
                  </div>
                </div>
              </button>

              {!scoreAbandonPossible && (
                <div className="error-message" style={{ margin: 0, padding: "6px 10px", fontSize: 10 }}>
                  <AlertCircle size={12} />
                  <span>Changement par points impossible (minimum 150 pts requis, solde actuel : {player.score} pts)</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAbandonConfirm(false)}
              className="ca-submit-btn"
              style={{ backgroundColor: "#27272a", color: "var(--text-primary)", marginTop: 4 }}
            >
              Annuler
            </button>
          </div>
        )}

        {/* Dénonciations et suggestions de défis déplacées vers les onglets dédiés */}
      </div>

      {/* 5. Custom Overlay Confirm Modal for Instant Actions */}
      {confirmModal && (
        <div className="ux-modal-backdrop animate-fade-in">
          <div className="ux-modal-container animate-slide-down" style={{
            borderColor: confirmModal.type === "skip" 
              ? "var(--neon-gold)" 
              : confirmModal.costType === "lives" ? "var(--neon-red)" : "var(--neon-gold)",
            boxShadow: confirmModal.type === "skip" 
              ? "0 0 20px rgba(245, 158, 11, 0.4)" 
              : confirmModal.costType === "lives" 
                ? "0 0 20px rgba(255, 51, 102, 0.4)" 
                : "0 0 20px rgba(245, 158, 11, 0.4)"
          }}>
            <h3 className="modal-title" style={{
              color: confirmModal.type === "skip" 
                ? "var(--neon-gold)" 
                : confirmModal.costType === "lives" ? "var(--neon-red)" : "var(--neon-gold)"
            }}>
              {confirmModal.type === "skip" ? "🎲 Confirmer le Reroll Action" : "🏳️ Confirmer le Reroll Cible"}
            </h3>
            
            <div className="modal-body" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>
              {confirmModal.type === "skip" ? (
                <p>
                  Voulez-vous vraiment changer d'action ? Cela vous coûtera <strong>1 jeton Skip</strong> (Solde actuel : {player.skips} skips).
                </p>
              ) : confirmModal.costType === "lives" ? (
                <>
                  <p>Voulez-vous vraiment changer de cible en sacrifiant <strong>1.0 cœur</strong> d'énergie ?</p>
                  {player.lives <= 1.0 && (
                    <div className="modal-warning-highlight animate-pulse" style={{
                      backgroundColor: "rgba(255, 51, 102, 0.15)",
                      border: "1px solid var(--neon-red)",
                      borderRadius: "var(--border-radius-sm)",
                      padding: "10px 14px",
                      marginTop: "12px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      ⚠️ ATTENTION : Vous n'avez plus qu'un cœur ou moins ({player.lives} cœur restants). Valider cette action entraînera votre DÉCÈS immédiat et votre passage en MODE ZOMBIE !
                    </div>
                  )}
                </>
              ) : (
                <p>
                  Voulez-vous vraiment changer de cible en déduisant <strong>150 points</strong> de votre score ?
                </p>
              )}
            </div>
            
            <div className="modal-actions" style={{
              display: "flex",
              gap: 10,
              marginTop: 20,
              justifyContent: "flex-end"
            }}>
              <button 
                onClick={handleConfirmAction} 
                className="ca-submit-btn" 
                style={{
                  margin: 0,
                  backgroundColor: confirmModal.type === "skip" 
                    ? "var(--neon-gold)" 
                    : confirmModal.costType === "lives" ? "var(--neon-red)" : "var(--neon-gold)",
                  color: confirmModal.type === "skip" 
                    ? "#121214" 
                    : confirmModal.costType === "lives" ? "#fff" : "#121214",
                  padding: "8px 16px"
                }}
              >
                Confirmer
              </button>
              <button 
                onClick={() => setConfirmModal(null)} 
                className="ca-submit-btn" 
                style={{
                  margin: 0,
                  backgroundColor: "#27272a",
                  color: "var(--text-primary)",
                  padding: "8px 16px"
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
