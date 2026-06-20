import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Lightbulb, Loader2, X, PlusCircle, AlignJustify } from "lucide-react";

export default function SuggestActionTab({ playerName }) {
  const { gameState, suggestAction, deleteSuggestedAction } = useGame();
  const [subTab, setSubTab] = useState("new_request"); // new_request, list
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
    // Basculer sur l'onglet mes soumissions pour voir sa création
    setSubTab("list");
  };

  return (
    <div className="suggest-screen-layout">
      <div className="view-scroll-content">
        <div className="glass-card-gold" style={{ width: "100%", display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-gold)", textAlign: "center", marginBottom: "12px", textTransform: "uppercase" }}>
            Boîte à Idées
          </h2>

          {/* Sub-tabs Navigation */}
          <div className="suggest-subtabs" style={{
            display: "flex",
            backgroundColor: "rgba(10, 10, 14, 0.6)",
            backdropFilter: "blur(8px)",
            borderRadius: "var(--border-radius-sm)",
            padding: "2px",
            marginBottom: "12px",
            border: "1px solid rgba(245, 158, 11, 0.15)"
          }}>
            <button
              onClick={() => setSubTab("new_request")}
              style={{
                flex: 1,
                backgroundColor: subTab === "new_request" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                color: subTab === "new_request" ? "#ffffff" : "var(--text-muted)",
                border: subTab === "new_request" ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid transparent",
                boxShadow: subTab === "new_request" ? "0 0 8px rgba(245, 158, 11, 0.4)" : "none",
                borderRadius: "4px",
                padding: "5px 8px",
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
            >
              <PlusCircle size={13} />
              Proposer
            </button>
            <button
              onClick={() => setSubTab("list")}
              style={{
                flex: 1,
                backgroundColor: subTab === "list" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                color: subTab === "list" ? "#ffffff" : "var(--text-muted)",
                border: subTab === "list" ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid transparent",
                boxShadow: subTab === "list" ? "0 0 8px rgba(245, 158, 11, 0.4)" : "none",
                borderRadius: "4px",
                padding: "5px 8px",
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
            >
              <AlignJustify size={13} />
              Mes soumissions ({mySuggestions.length})
            </button>
          </div>

          {/* Tab contents */}
          {subTab === "new_request" ? (
            <form onSubmit={handleSuggestSubmit} className="suggest-action-form-v2" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h3 style={{ color: "var(--neon-gold)", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", textTransform: "uppercase", fontWeight: "800", marginBottom: "2px" }}>
                <Lightbulb size={18} /> Suggérer un défi
              </h3>
              <p className="ca-help" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4", margin: "0 0 4px 0" }}>
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
          ) : (
            <div className="my-submissions-list animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", flex: 1 }}>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--neon-gold)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                Défis proposés ({mySuggestions.length})
              </h3>
              
              {mySuggestions.length === 0 ? (
                <div style={{ padding: "40px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  Vous n'avez pas encore soumis de défis.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", paddingRight: "4px", flex: 1 }}>
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
