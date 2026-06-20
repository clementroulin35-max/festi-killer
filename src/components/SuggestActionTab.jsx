import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Lightbulb, Loader2, X } from "lucide-react";

export default function SuggestActionTab({ playerName }) {
  const { gameState, suggestAction, deleteSuggestedAction } = useGame();
  const [sugTitle, setSugTitle] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sugPoints, setSugPoints] = useState(30);
  const [sugDamage, setSugDamage] = useState(1.0);

  const player = gameState.players.find(p => p.name === playerName);
  if (!player) return null;

  const mySuggestions = gameState.history.filter(
    (h) => h.type === "action_suggestion" && h.killer === playerName
  );

  const handleSuggestSubmit = (e) => {
    e.preventDefault();
    if (!sugTitle.trim() || !sugDesc.trim()) return;
    suggestAction(
      playerName,
      sugTitle.trim(),
      sugDesc.trim(),
      Number(sugPoints),
      Number(sugDamage),
      false
    );
    setSugTitle("");
    setSugDesc("");
    setSugPoints(30);
    setSugDamage(1.0);
  };

  return (
    <div className="suggest-screen-layout">
      <div className="view-scroll-content">
        <div className="glass-card-gold" style={{ width: "100%" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-gold)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
            Boîte à Idées
          </h2>
          
          <form onSubmit={handleSuggestSubmit} className="suggest-action-form-v2">
            <h3 style={{ color: "var(--neon-gold)", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", textTransform: "uppercase", fontWeight: "800", marginBottom: "4px" }}>
              <Lightbulb size={18} /> Proposer un défi
            </h3>
            <p className="ca-help" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Suggère un nouveau défi farfelu. S'il est validé par le GM, il rejoindra la pool des actions disponibles en jeu.
            </p>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Titre du défi :
              <input
                type="text"
                placeholder="Ex: Le Vol de Chaussure"
                value={sugTitle}
                onChange={(e) => setSugTitle(e.target.value)}
                className="neon-input-premium"
                style={{ textAlign: "left" }}
                required
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Description du défi :
              <textarea
                placeholder="Ex: Faire danser la cible..."
                value={sugDesc}
                onChange={(e) => setSugDesc(e.target.value)}
                className="neon-input-premium"
                style={{ height: "60px", resize: "none", textAlign: "left" }}
                required
              />
            </label>

            <div style={{ display: "flex", gap: "12px" }}>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Points :
                <input
                  type="number"
                  min="0"
                  value={sugPoints}
                  onChange={(e) => setSugPoints(Number(e.target.value))}
                  className="neon-input-premium"
                  required
                />
              </label>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Dégâts (PV) :
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="7"
                  value={sugDamage}
                  onChange={(e) => setSugDamage(Number(e.target.value))}
                  className="neon-input-premium"
                  required
                />
              </label>
            </div>

            <button type="submit" className="ca-submit-btn" style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: "800", backgroundColor: "var(--neon-gold)", color: "#000", border: "none", borderRadius: "var(--border-radius-sm)", cursor: "pointer", transition: "all 0.2s", marginTop: "8px" }}>
              SOUMETTRE LE DÉFI
            </button>
          </form>
        </div>

        {mySuggestions.length > 0 && (
          <div className="glass-card-gold" style={{ width: "100%", marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--neon-gold)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
              Mes suggestions ({mySuggestions.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto", paddingRight: "4px" }}>
              {mySuggestions.map((sug) => {
                const title = sug.metadata?.title || sug.actionTitle || "Défi sans titre";
                const desc = sug.metadata?.description || "";
                const pts = sug.metadata?.points || sug.points || 0;
                const dmg = sug.metadata?.damage || sug.damage || 0;
                const status = sug.status; // pending, approved, rejected

                let statusLabel = "En attente GM";
                let statusColor = "var(--neon-gold)";
                if (status === "approved") {
                  statusLabel = "Validé & Intégré";
                  statusColor = "var(--neon-green)";
                } else if (status === "rejected") {
                  statusLabel = "Rejeté par le GM";
                  statusColor = "var(--neon-red)";
                }

                return (
                  <div 
                    key={sug.id} 
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "var(--border-radius-sm)",
                      padding: "8px 10px",
                      gap: "10px"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong style={{ fontSize: "12px", color: "var(--text-primary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{title}</strong>
                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>(+{pts} pts, -{dmg} HP)</span>
                      </div>
                      {desc && (
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {desc}
                        </div>
                      )}
                      <div style={{ fontSize: "10px", fontWeight: "800", color: statusColor, textTransform: "uppercase", letterSpacing: "0.03em", marginTop: "2px" }}>
                        ● {statusLabel}
                      </div>
                    </div>

                    {status !== "approved" && (
                      <button
                        onClick={() => deleteSuggestedAction(sug.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--neon-red)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                        title="Supprimer la proposition"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
