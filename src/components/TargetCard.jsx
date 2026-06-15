import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { DEFAULT_ACTIONS, GAME_CONFIG } from "../services/gameEngine";
import { ShieldAlert, Zap, Loader2, Eye, EyeOff } from "lucide-react";

export default function TargetCard({ targetName, actionId, onDeclareHit, isZombie, hasPendingHit, actionEphemeral }) {
  const { gameState } = useGame();
  const [isMasked, setIsMasked] = useState(false);
  const targetPlayer = gameState.players.find(p => p.name === targetName);
  const action = (gameState.actionPool || DEFAULT_ACTIONS).find((a) => a.id === actionId);
  const isEphemeral = actionEphemeral || (action ? !!action.isEphemeral : false);

  if (!action) {
    return (
      <div className="target-card error">
        <p>Aucune mission assignée.</p>
      </div>
    );
  }

  const getDifficultyLabel = (diff) => {
    switch (diff) {
      case "micro":
        return "Micro-défi";
      case "standard":
        return "Standard";
      case "majeur":
        return "Majeur";
      case "legendaire":
        return "Légendaire";
      default:
        return diff;
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "micro":
        return "#3b82f6";
      case "standard":
        return "#10b981";
      case "majeur":
        return "#f59e0b";
      case "legendaire":
        return "#ec4899";
      default:
        return "#a855f7";
    }
  };

  const getInitials = (name) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="target-card-container">
      <div className={`target-card ${hasPendingHit ? "pending-card-glow" : ""} ${isMasked ? "card-blurred" : ""}`}>
        <button 
          className="panic-toggle-inline-btn"
          onClick={() => setIsMasked(!isMasked)}
          title={isMasked ? "Révéler la cible" : "Masquer la cible (Panic)"}
        >
          {isMasked ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        <div className="target-card-inner-content">
          <div className="target-label">CIBLE SECRÈTE</div>
          
          <div className="avatar-outer">
            {targetPlayer?.photo ? (
              <img src={targetPlayer.photo} alt={targetName} className="avatar-img" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div className="avatar-inner">
                {getInitials(targetName)}
              </div>
            )}
          </div>

          <div className="target-name">{targetName}</div>

          <div className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(action.difficulty) }}>
            {getDifficultyLabel(action.difficulty)}
          </div>

          <div className="mission-box">
            <div className="mission-label">MISSION</div>
            <div className="mission-desc">« {action.description} »</div>
          </div>

          <div className="mission-stats">
            <div className="stat-item">
              <span className="stat-val">
                +{action.points + (isEphemeral ? GAME_CONFIG.BONUS_EPHEMERAL : 0)}
              </span>
              <span className="stat-lbl">Points</span>
            </div>
            <div className="stat-item">
              <span className="stat-val">-{action.damage}</span>
              <span className="stat-lbl">{action.damage > 1 ? "Cœurs" : "Cœur"}</span>
            </div>
          </div>

          {isZombie && (
            <div className="zombie-notice">
              <ShieldAlert size={16} />
              <span>Mode Zombie : Vos hits ne retirent pas de cœurs à votre cible, mais vous rapportent des points !</span>
            </div>
          )}

          {isEphemeral && (
            <div className="ephemeral-static-badge">
              <Zap size={14} fill="#f59e0b" color="#f59e0b" className="zap-glowing" />
              <span>BONUS ÉPHÉMÈRE ACTIF (+{GAME_CONFIG.BONUS_EPHEMERAL} PTS)</span>
            </div>
          )}

          <button
            className={`hit-success-btn ${hasPendingHit ? "pending" : ""}`}
            disabled={hasPendingHit}
            onClick={() => {
              onDeclareHit();
            }}
          >
            {hasPendingHit ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 8, display: "inline" }} />
                EN ATTENTE DU GM...
              </>
            ) : (
              "HIT RÉUSSI !"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
