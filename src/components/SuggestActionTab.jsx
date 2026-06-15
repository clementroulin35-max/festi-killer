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
      <div className="player-waiting-screen animate-fade-in">
        <div className="waiting-card" style={{ borderColor: "var(--neon-purple)", boxShadow: "0 0 15px rgba(139, 92, 246, 0.2)" }}>
          <Loader2 size={48} className="animate-spin" style={{ color: "var(--neon-purple)" }} />
          <h2 style={{ color: "var(--neon-purple)", fontSize: "20px", fontWeight: "800", textTransform: "uppercase" }}>Idée envoyée</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", textAlign: "center", lineHeight: "1.5" }}>
            Ta suggestion a été transmise. Dès que le GameMaster l'aura validée, elle sera ajoutée à la pool active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-action-tab-view animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h2>BOÎTE À IDÉES</h2>
      <form onSubmit={handleSuggestSubmit} className="counter-attack-form" style={{ border: "1px solid rgba(139, 92, 246, 0.3)", backgroundColor: "var(--bg-card)", padding: "20px", borderRadius: "var(--border-radius-md)" }}>
        <h3 style={{ color: "var(--neon-purple)", display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", textTransform: "uppercase", fontWeight: "800", marginBottom: "12px" }}>
          <Lightbulb size={18} /> Proposer un défi
        </h3>
        <p className="ca-help" style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5", marginBottom: "16px" }}>
          Suggère un nouveau défi farfelu. S'il est validé par le GM, il rejoindra la pool des actions disponibles en jeu.
        </p>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px" }}>
          Titre du défi :
          <input
            type="text"
            placeholder="Ex: Le Vol de Chaussure"
            value={sugTitle}
            onChange={(e) => setSugTitle(e.target.value)}
            className="neon-input"
            style={{ padding: "10px 12px", fontSize: "14px", backgroundColor: "var(--bg-input)" }}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px" }}>
          Description du défi :
          <textarea
            placeholder="Ex: Faire danser la cible..."
            value={sugDesc}
            onChange={(e) => setSugDesc(e.target.value)}
            className="neon-input"
            style={{ height: "60px", resize: "none", padding: "10px 12px", fontSize: "14px", backgroundColor: "var(--bg-input)" }}
            required
          />
        </label>

        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
            Points :
            <input
              type="number"
              min="0"
              value={sugPoints}
              onChange={(e) => setSugPoints(Number(e.target.value))}
              className="neon-input"
              style={{ padding: "8px 10px", fontSize: "14px", backgroundColor: "var(--bg-input)" }}
              required
            />
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
            Cœurs perdus :
            <input
              type="number"
              step="0.25"
              min="0"
              max="7"
              value={sugDamage}
              onChange={(e) => setSugDamage(Number(e.target.value))}
              className="neon-input"
              style={{ padding: "8px 10px", fontSize: "14px", backgroundColor: "var(--bg-input)" }}
              required
            />
          </label>
        </div>

        <button type="submit" className="ca-submit-btn" style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: "800", backgroundColor: "var(--neon-purple)", marginTop: "8px" }}>
          SOUMETTRE LE DÉFI
        </button>
      </form>
    </div>
  );
}
