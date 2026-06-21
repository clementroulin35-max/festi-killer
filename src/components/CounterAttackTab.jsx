import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function CounterAttackTab({ playerName, logo }) {
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
      <div className="counter-screen-layout" style={{ height: "100%" }}>
        <div className="view-scroll-content" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", height: "100%", paddingBottom: "20px" }}>
          <div className="glass-card-red" style={{ textAlign: "center", width: "100%", flex: "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <Loader2 size={48} className="animate-spin" style={{ color: "var(--neon-red)" }} />
              <h2 style={{ color: "var(--neon-red)", fontSize: "20px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>Dénonciation en cours</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Votre accusation a été transmise. Le GameMaster étudie la situation pour déterminer si votre paranoïa est justifiée !
              </p>
            </div>
          </div>

          {logo && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
              <img 
                src={logo} 
                alt="Cooki'llers logo" 
                className="floating-logo"
                style={{ 
                  width: "100%", 
                  maxWidth: "180px", 
                  height: "auto",
                  opacity: 0.8,
                  marginTop: "20px"
                }} 
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="counter-screen-layout">
      <div className="view-scroll-content">
        <div className="glass-card-red" style={{ width: "100%" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-red)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
            Contre-Attaque
          </h2>
          
          <form onSubmit={handleCounterAttackSubmit} className="counter-attack-form-v2">
            <h3 style={{ color: "var(--neon-red)", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", textTransform: "uppercase", fontWeight: "800", marginBottom: "4px" }}>
              <ShieldAlert size={18} /> Accuser mon tueur
            </h3>
            <p className="ca-help" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4", marginBottom: "12px" }}>
              Si tu suspectes quelqu'un de vouloir te faire faire une action, dénonce-le.
            </p>

            <table style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "8px 0px",
              marginBottom: "14px",
              fontSize: "12px",
              textAlign: "center",
              background: "transparent"
            }}>
              <tbody>
                {/* Ligne 1: Libellés */}
                <tr>
                  <td style={{ 
                    padding: "8px 6px 2px 6px", 
                    fontWeight: "900", 
                    color: "var(--neon-green)", 
                    textTransform: "uppercase", 
                    fontSize: "11px",
                    backgroundColor: "rgba(51, 255, 102, 0.04)", 
                    border: "1px solid rgba(51, 255, 102, 0.2)",
                    borderBottom: "none",
                    borderRadius: "var(--border-radius-sm) var(--border-radius-sm) 0 0"
                  }}>
                    Correct
                  </td>
                  <td style={{ 
                    padding: "8px 6px 2px 6px", 
                    fontWeight: "900", 
                    color: "var(--neon-red)", 
                    textTransform: "uppercase", 
                    fontSize: "11px",
                    backgroundColor: "rgba(255, 51, 102, 0.04)", 
                    border: "1px solid rgba(255, 51, 102, 0.2)",
                    borderBottom: "none",
                    borderRadius: "var(--border-radius-sm) var(--border-radius-sm) 0 0"
                  }}>
                    Incorrect
                  </td>
                </tr>
                {/* Ligne 3: Descriptions */}
                <tr>
                  <td style={{ 
                    padding: "6px 8px 10px 8px", 
                    color: "#ffffff", 
                    verticalAlign: "top", 
                    fontSize: "10.5px", 
                    lineHeight: "1.4",
                    backgroundColor: "rgba(51, 255, 102, 0.04)", 
                    border: "1px solid rgba(51, 255, 102, 0.2)",
                    borderTop: "none",
                    borderRadius: "0 0 var(--border-radius-sm) var(--border-radius-sm)"
                  }}>
                    Son action est brûlée, il perd <strong>25 pts 🪙</strong>.
                  </td>
                  <td style={{ 
                    padding: "6px 8px 10px 8px", 
                    color: "#ffffff", 
                    verticalAlign: "top", 
                    fontSize: "10.5px", 
                    lineHeight: "1.4",
                    backgroundColor: "rgba(255, 51, 102, 0.04)", 
                    border: "1px solid rgba(255, 51, 102, 0.2)",
                    borderTop: "none",
                    borderRadius: "0 0 var(--border-radius-sm) var(--border-radius-sm)"
                  }}>
                    Tu perds <strong>0.5 cœur ❤️</strong> pour paranoïa.
                  </td>
                </tr>
              </tbody>
            </table>

            {caMessage && <div className="ca-error-msg" style={{ color: "var(--neon-red)", fontSize: "12px", fontWeight: "700" }}>{caMessage}</div>}

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Je suspecte :
              <select 
                value={suspect} 
                onChange={(e) => setSuspect(e.target.value)} 
                required 
                className="neon-input-premium"
                style={{ textAlign: "left" }}
              >
                <option value="" style={{ background: "var(--bg-secondary)" }}>-- Choisir un joueur --</option>
                {otherPlayers.map((p) => (
                  <option key={p.name} value={p.name} style={{ background: "var(--bg-secondary)" }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>
              Défi suspecté (facultatif) :
              <textarea
                placeholder="Ex: Te faire chanter une chanson..."
                value={accusedActionText}
                onChange={(e) => setAccusedActionText(e.target.value)}
                className="neon-input-premium"
                rows={3}
                style={{ height: "66px", resize: "none", textAlign: "left", paddingTop: "8px" }}
              />
            </label>

            <button type="submit" className="ca-submit-btn" style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: "800", backgroundColor: "var(--neon-red)", color: "#fff", border: "none", borderRadius: "var(--border-radius-sm)", cursor: "pointer", transition: "all 0.2s", marginTop: "8px" }}>
              ENVOYER L'ACCUSATION
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
