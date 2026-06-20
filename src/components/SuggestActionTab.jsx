import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Lightbulb, Loader2, X, PlusCircle, AlignJustify, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuggestActionTab({ playerName }) {
  const { gameState, suggestAction, deleteSuggestedAction } = useGame();
  const [subTab, setSubTab] = useState("new_request"); // new_request, list
  const [sugTitle, setSugTitle] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sugPoints, setSugPoints] = useState(30);
  const [sugDamage, setSugDamage] = useState(1.0);
  const [deletingActionId, setDeletingActionId] = useState(null);

  const player = gameState.players.find(p => p.name === playerName);
  if (!player) return null;

  const mySuggestions = gameState.history.filter(
    (h) => h.type === "action_suggestion" && h.killer === playerName
  );

  // Liste 1 : en attente (pending) et refusées (rejected), triées (pending d'abord)
  const pendingAndRejected = mySuggestions
    .filter(sug => sug.status === "pending" || sug.status === "rejected")
    .sort((a, b) => {
      if (a.status === "pending" && b.status === "rejected") return -1;
      if (a.status === "rejected" && b.status === "pending") return 1;
      return 0;
    });

  // Liste 2 : validées (approved)
  const approvedSuggestions = mySuggestions.filter(sug => sug.status === "approved");

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
    setSubTab("list");
  };

  return (
    <div className="suggest-screen-layout" style={{ height: "100%" }}>
      <div className="view-scroll-content" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div className="glass-card-gold" style={{ width: "100%", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
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
            border: "1px solid rgba(245, 158, 11, 0.15)",
            flexShrink: 0
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
            <div className="my-submissions-list animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", flex: 1, minHeight: 0 }}>
              
              {/* Division 50/50 avec flexbox vertical */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, minHeight: 0 }}>
                
                {/* Liste 1 : En attente & Refusés */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <h4 style={{ fontSize: "11px", fontWeight: "900", color: "var(--neon-gold)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px", flexShrink: 0 }}>
                    En attente & Refusés ({pendingAndRejected.length})
                  </h4>
                  <div className="actions-scroll-list" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                    {pendingAndRejected.length === 0 ? (
                      <div style={{ padding: "16px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                        Aucun défi en attente ou rejeté.
                      </div>
                    ) : (
                      pendingAndRejected.map((sug) => {
                        const title = sug.metadata?.title || sug.actionTitle || "Défi sans titre";
                        const desc = sug.metadata?.description || "";
                        const pts = sug.metadata?.points || sug.points || 0;
                        const dmg = sug.metadata?.damage || sug.damage || 0;
                        const status = sug.status; // pending, rejected

                        let statusLabel = "En attente GM";
                        let statusColor = "var(--neon-gold)";
                        if (status === "rejected") {
                          statusLabel = "Rejeté par le GM";
                          statusColor = "var(--neon-red)";
                        }

                        return (
                          <div 
                            key={sug.id} 
                            style={{ 
                              position: "relative", 
                              overflow: "hidden", 
                              borderRadius: "var(--border-radius-sm)",
                              flexShrink: 0,
                              width: "100%"
                            }}
                          >
                            {/* Bouton de suppression rouge caché en arrière-plan */}
                            <div 
                              style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                bottom: 0,
                                width: "100px",
                                backgroundColor: "var(--neon-red)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1,
                                borderRadius: "0 var(--border-radius-sm) var(--border-radius-sm) 0"
                              }}
                            >
                              <div style={{
                                writingMode: "vertical-lr",
                                textTransform: "uppercase",
                                fontWeight: "900",
                                fontSize: "10px",
                                letterSpacing: "0.1em",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <Trash2 size={11} style={{ transform: "rotate(270deg)" }} /> Supprimer
                              </div>
                            </div>

                            {/* Composant glissable de premier plan */}
                            <motion.div
                              drag="x"
                              dragConstraints={{ left: -100, right: 0 }}
                              dragElastic={{ left: 0.1, right: 0 }}
                              onDragEnd={(event, info) => {
                                if (info.offset.x < -60) {
                                  setDeletingActionId(sug.id);
                                }
                              }}
                              className="action-item-mini"
                              style={{
                                position: "relative",
                                zIndex: 2,
                                borderLeftColor: statusColor,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "grab",
                                x: 0,
                                background: "rgba(20, 20, 25, 0.95)"
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div className="action-mini-header">
                                  <span className="action-mini-title" style={{ fontWeight: "700" }}>{title}</span>
                                  <span className="action-mini-rewards">+{pts} pts / -{dmg} HP</span>
                                </div>
                                {desc && (
                                  <p className="action-mini-desc" style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 2px 0", lineHeight: "1.3", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "normal" }}>
                                    {desc}
                                  </p>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                                  <div style={{ fontSize: "10px", fontWeight: "800", color: statusColor, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    ● {statusLabel}
                                  </div>
                                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>◀ Glisser</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Liste 2 : Validés & Intégrés */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <h4 style={{ fontSize: "11px", fontWeight: "900", color: "var(--neon-green)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px", flexShrink: 0 }}>
                    Validés & Intégrés ({approvedSuggestions.length})
                  </h4>
                  <div className="actions-scroll-list" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                    {approvedSuggestions.length === 0 ? (
                      <div style={{ padding: "16px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                        Aucune idée validée par le GM pour le moment.
                      </div>
                    ) : (
                      approvedSuggestions.map((sug) => {
                        const title = sug.metadata?.title || sug.actionTitle || "Défi sans titre";
                        const desc = sug.metadata?.description || "";
                        const pts = sug.metadata?.points || sug.points || 0;
                        const dmg = sug.metadata?.damage || sug.damage || 0;
                        const statusColor = "var(--neon-green)";

                        return (
                          <div 
                            key={sug.id} 
                            className="action-item-mini"
                            style={{
                              borderLeftColor: statusColor,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "10px",
                              cursor: "default"
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div className="action-mini-header">
                                <span className="action-mini-title" style={{ fontWeight: "700" }}>{title}</span>
                                <span className="action-mini-rewards">+{pts} pts / -{dmg} HP</span>
                              </div>
                              {desc && (
                                <p className="action-mini-desc" style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 2px 0", lineHeight: "1.3" }}>
                                  {desc}
                                </p>
                              )}
                              <div style={{ fontSize: "10px", fontWeight: "800", color: statusColor, textTransform: "uppercase", letterSpacing: "0.03em", marginTop: "2px" }}>
                                ● Validé & Intégré
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pop-up de confirmation de suppression */}
      <AnimatePresence>
        {deletingActionId && (
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
            >
              <h3 className="confirm-modal-title-v2" style={{ color: "var(--neon-red)", textTransform: "uppercase" }}>Supprimer la proposition ?</h3>
              <p className="confirm-modal-body-v2">
                Es-tu sûr de vouloir supprimer cette proposition de défi ? Cette action est irréversible.
              </p>

              <div className="confirm-action-btns-v2">
                <button
                  className="confirm-btn-primary-v2"
                  style={{ backgroundColor: "var(--neon-red)", color: "#fff" }}
                  onClick={() => {
                    deleteSuggestedAction(deletingActionId);
                    setDeletingActionId(null);
                  }}
                >
                  Supprimer
                </button>
                <button 
                  className="confirm-btn-cancel-v2" 
                  onClick={() => {
                    setDeletingActionId(null);
                  }}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
