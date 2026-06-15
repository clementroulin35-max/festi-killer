import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function CounterAttackTab({ playerName }) {
  const { gameState, counterAttack } = useGame();
  const [suspect, setSuspect] = useState("");
  const [accusedActionText, setAccusedActionText] = useState("");
  const [caMessage, setCaMessage] = useState("");

  const player = gameState.players.find(p => p.name === playerName);
  if (!player) return null;

  const hasPendingCounter = gameState.history.some(
    (h) => h.status === "pending" && h.type === "counter_attack" && h.target === playerName
  );

  const handleCounterAttackSubmit = (e) => {
    e.preventDefault();
    if (hasPendingCounter) return;
    if (!suspect) {
      setCaMessage("Veuillez sélectionner un suspect.");
      return;
    }
    counterAttack(playerName, suspect, accusedActionText.trim());
    setSuspect("");
    setAccusedActionText("");
    setCaMessage("");
  };

  const otherPlayers = gameState.players.filter((p) => p.name !== playerName);

  if (hasPendingCounter) {
    return (
      <div className="player-waiting-screen animate-fade-in">
        <div className="waiting-card" style={{ borderColor: "var(--neon-red)", boxShadow: "0 0 15px rgba(255, 51, 102, 0.2)" }}>
          <Loader2 size={48} className="animate-spin" style={{ color: "var(--neon-red)" }} />
          <h2 style={{ color: "var(--neon-red)", fontSize: "20px", fontWeight: "800", textTransform: "uppercase" }}>Dénonciation en cours</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center", lineHeight: "1.5" }}>
            Votre accusation a été transmise. Le GameMaster étudie la situation pour déterminer si votre paranoïa est justifiée !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="counter-attack-tab-view animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2>CONTRE-ATTAQUE</h2>
      <form onSubmit={handleCounterAttackSubmit} className="counter-attack-form" style={{ border: "1px solid rgba(255, 51, 102, 0.3)", backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "var(--border-radius-md)" }}>
        <h3 style={{ color: "var(--neon-red)", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", textTransform: "uppercase", fontWeight: "800", marginBottom: "12px" }}>
          <ShieldAlert size={18} /> Accuser mon tueur
        </h3>
        <p className="ca-help" style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "16px" }}>
          Si tu suspectes quelqu'un de vouloir te faire faire une action, dénonce-le.
          <br />
          <strong>Correct :</strong> Son action est brûlée, il perd 25 pts.
          <br />
          <strong>Incorrect :</strong> Tu perds 0.5 cœur pour paranoïa.
        </p>

        {caMessage && <div className="ca-error-msg" style={{ color: "var(--neon-red)", fontSize: "12px", marginBottom: "12px" }}>{caMessage}</div>}

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "16px" }}>
          Je suspecte :
          <select value={suspect} onChange={(e) => setSuspect(e.target.value)} required style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "var(--border-radius-sm)", outline: "none", fontSize: "14px" }}>
            <option value="">-- Choisir un joueur --</option>
            {otherPlayers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "20px" }}>
          Défi suspecté (facultatif) :
          <input
            type="text"
            placeholder="Ex: Te faire chanter une chanson..."
            value={accusedActionText}
            onChange={(e) => setAccusedActionText(e.target.value)}
            className="neon-input"
            style={{ padding: "10px 12px", fontSize: "14px", backgroundColor: "var(--bg-input)" }}
          />
        </label>

        <button type="submit" className="ca-submit-btn" style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: "800", backgroundColor: "var(--neon-red)" }}>
          ENVOYER L'ACCUSATION
        </button>
      </form>
    </div>
  );
}
