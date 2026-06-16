import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Lightbulb, Loader2 } from "lucide-react";

export default function SuggestActionTab({ playerName }) {
  const { gameState, suggestAction } = useGame();
  const [sugTitle, setSugTitle] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sugPoints, setSugPoints] = useState(30);
  const [sugDamage, setSugDamage] = useState(1.0);

  const player = gameState.players.find(p => p.name === playerName);
  if (!player) return null;

  const hasPendingSuggest = gameState.history.some(
    (h) => h.status === "pending" && h.type === "action_suggestion" && h.killer === playerName
  );

  const handleSuggestSubmit = (e) => {
    e.preventDefault();
    if (hasPendingSuggest) return;
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

  if (hasPendingSuggest) {
    return (
      <div className="suggest-screen-layout">
        <div className="view-scroll-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="glass-card-gold" style={{ textAlign: "center", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <Loader2 size={48} className="animate-spin" style={{ color: "var(--neon-gold)" }} />
              <h2 style={{ color: "var(--neon-gold)", fontSize: "20px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>Idée envoyée</h2>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Ta suggestion a été transmise. Dès que le GameMaster l'aura validée, elle sera ajoutée à la pool active.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-screen-layout">
      <div className="view-scroll-content">
        <div className="glass-card-gold" style={{ width: "100%" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-gold)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
            Boîte à Idées
          </h2>
          
          <form onSubmit={handleSuggestSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
      </div>
    </div>
  );
}
