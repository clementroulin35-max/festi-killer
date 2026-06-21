import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Lightbulb, Loader2, X, PlusCircle, AlignJustify, Trash2, History, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SuggestActionTab({ playerName }) {
  const { gameState, suggestAction, deleteSuggestedAction } = useGame();
  const [subTab, setSubTab] = useState("new_request"); // new_request, pending_or_rejected, approved
  const [sugTitle, setSugTitle] = useState("");
  const [sugDesc, setSugDesc] = useState("");
  const [sugPoints, setSugPoints] = useState(30);
  const [sugDamage, setSugDamage] = useState(1.0);
  const [deletingActionId, setDeletingActionId] = useState(null);
  const [sugCategory, setSugCategory] = useState("defi"); // 'defi', 'action_fountain', 'verite_fountain'
  const [sugFountainDifficulty, setSugFountainDifficulty] = useState("facile"); // 'facile', 'moyen', 'difficile'

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
      sugCategory === "defi" ? Number(sugPoints) : 0,
      sugCategory === "defi" ? Number(sugDamage) : 0,
      sugCategory,
      sugCategory !== "defi" ? sugFountainDifficulty : null
    );
    setSugTitle("");
    setSugDesc("");
    setSugPoints(30);
    setSugDamage(1.0);
    setSugCategory("defi");
    setSugFountainDifficulty("facile");
    setSubTab("pending_or_rejected");
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
                padding: "6px 4px",
                fontSize: "10px",
                fontWeight: "850",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <PlusCircle size={12} />
              Proposer
            </button>
            <button
              onClick={() => setSubTab("pending_or_rejected")}
              style={{
                flex: 1,
                backgroundColor: subTab === "pending_or_rejected" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                color: subTab === "pending_or_rejected" ? "#ffffff" : "var(--text-muted)",
                border: subTab === "pending_or_rejected" ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid transparent",
                boxShadow: subTab === "pending_or_rejected" ? "0 0 8px rgba(245, 158, 11, 0.4)" : "none",
                borderRadius: "4px",
                padding: "6px 4px",
                fontSize: "10px",
                fontWeight: "850",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <History size={12} />
              Soumis ({pendingAndRejected.length})
            </button>
            <button
              onClick={() => setSubTab("approved")}
              style={{
                flex: 1,
                backgroundColor: subTab === "approved" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                color: subTab === "approved" ? "#ffffff" : "var(--text-muted)",
                border: subTab === "approved" ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid transparent",
                boxShadow: subTab === "approved" ? "0 0 8px rgba(245, 158, 11, 0.4)" : "none",
                borderRadius: "4px",
                padding: "6px 4px",
                fontSize: "10px",
                fontWeight: "850",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <Check size={12} />
              Validés ({approvedSuggestions.length})
            </button>
          </div>

          {/* Tab contents */}
          {/* Tab contents */}
          {subTab === "new_request" && (
            <form onSubmit={handleSuggestSubmit} className="suggest-action-form-v2" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <h3 style={{ color: "var(--neon-gold)", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", textTransform: "uppercase", fontWeight: "800", marginBottom: "2px" }}>
                <Lightbulb size={18} /> Suggérer un défi
              </h3>
              <p className="ca-help" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.4", margin: "0 0 4px 0" }}>
                Suggère un nouveau défi farfelu ou un contenu pour la Fontaine de Vie. Après validation, il rejoindra le pool du jeu.
              </p>

              {/* Boutons Poussoirs 3 Catégories */}
              <div style={{
                display: "flex",
                backgroundColor: "rgba(10, 10, 14, 0.6)",
                backdropFilter: "blur(8px)",
                borderRadius: "var(--border-radius-sm)",
                padding: "2px",
                margin: "4px 0 10px 0",
                border: "1px solid rgba(245, 158, 11, 0.15)"
              }}>
                <button
                  type="button"
                  onClick={() => setSugCategory("defi")}
                  style={{
                    flex: 1,
                    backgroundColor: sugCategory === "defi" ? "rgba(245, 158, 11, 0.2)" : "transparent",
                    color: sugCategory === "defi" ? "#ffffff" : "var(--text-muted)",
                    border: sugCategory === "defi" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
                    borderRadius: "4px",
                    padding: "6px 2px",
                    fontSize: "10px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.2s"
                  }}
                >
                  Défi
                </button>
                <button
                  type="button"
                  onClick={() => setSugCategory("action_fountain")}
                  style={{
                    flex: 1,
                    backgroundColor: sugCategory === "action_fountain" ? "rgba(245, 158, 11, 0.2)" : "transparent",
                    color: sugCategory === "action_fountain" ? "#ffffff" : "var(--text-muted)",
                    border: sugCategory === "action_fountain" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
                    borderRadius: "4px",
                    padding: "6px 2px",
                    fontSize: "10px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.2s"
                  }}
                >
                  Action Fontaine
                </button>
                <button
                  type="button"
                  onClick={() => setSugCategory("verite_fountain")}
                  style={{
                    flex: 1,
                    backgroundColor: sugCategory === "verite_fountain" ? "rgba(245, 158, 11, 0.2)" : "transparent",
                    color: sugCategory === "verite_fountain" ? "#ffffff" : "var(--text-muted)",
                    border: sugCategory === "verite_fountain" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid transparent",
                    borderRadius: "4px",
                    padding: "6px 2px",
                    fontSize: "10px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    transition: "all 0.2s"
                  }}
                >
                  Vérité Fontaine
                </button>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Titre de la proposition :
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
                Description de la proposition :
                <textarea
                  placeholder="Expliquer en quelques mots ce que le joueur doit faire ou révéler..."
                  value={sugDesc}
                  onChange={(e) => setSugDesc(e.target.value)}
                  className="neon-input-premium"
                  style={{ height: "60px", resize: "none", textAlign: "left" }}
                  required
                />
              </label>

              {sugCategory === "defi" ? (
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
              ) : (
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Difficulté Fontaine :
                  <select
                    value={sugFountainDifficulty}
                    onChange={(e) => setSugFountainDifficulty(e.target.value)}
                    className="neon-input-premium"
                    style={{ textAlign: "left" }}
                  >
                    <option value="facile">Facile (Tier 1)</option>
                    <option value="moyen">Moyen (Tier 2)</option>
                    <option value="difficile">Difficile (Tier 3)</option>
                  </select>
                </label>
              )}

              <button type="submit" className="ca-submit-btn" style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: "800", backgroundColor: "var(--neon-gold)", color: "#000", border: "none", borderRadius: "var(--border-radius-sm)", cursor: "pointer", transition: "all 0.2s", marginTop: "8px" }}>
                SOUMETTRE LA PROPOSITION
              </button>
            </form>
          )}

          {subTab === "pending_or_rejected" && (
            <div className="my-submissions-list animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", flex: 1, minHeight: 0 }}>
              <div className="actions-scroll-list" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                {pendingAndRejected.length === 0 ? (
                  <div style={{ padding: "24px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                    Aucun défi en attente ou rejeté.
                  </div>
                ) : (
                  pendingAndRejected.map((sug) => {
                    const title = sug.metadata?.title || sug.actionTitle || "Défi sans titre";
                    const desc = sug.metadata?.description || "";
                    const pts = sug.metadata?.points || sug.points || 0;
                    const dmg = sug.metadata?.damage || sug.damage || 0;
                    const status = sug.status;

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
                            width: "80px",
                            backgroundColor: "rgba(255, 51, 102, 0.15)",
                            border: "1px solid rgba(255, 51, 102, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1,
                            borderRadius: "var(--border-radius-sm)"
                          }}
                        >
                          <div style={{
                            textTransform: "uppercase",
                            fontWeight: "900",
                            fontSize: "10px",
                            letterSpacing: "0.05em",
                            color: "var(--neon-red)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            <Trash2 size={14} />
                            <span>Supprimer</span>
                          </div>
                        </div>

                        {/* Composant glissable de premier plan */}
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: -80, right: 0 }}
                          dragElastic={{ left: 0.1, right: 0 }}
                          onDragEnd={(event, info) => {
                            if (info.offset.x < -45) {
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
                          <div className="action-mini-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="action-mini-title" style={{ fontWeight: "700" }}>{title}</span>
                            <span className="action-mini-rewards">
                              {sug.metadata?.category === "action_fountain" ? "⛲ Action Fontaine" : 
                               sug.metadata?.category === "verite_fountain" ? "⛲ Vérité Fontaine" : 
                               `+${pts} pts / -${dmg} HP`}
                            </span>
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
                              <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>◀ Supprimer</span>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {subTab === "approved" && (
            <div className="my-submissions-list animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", flex: 1, minHeight: 0 }}>
              <div className="actions-scroll-list" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                {approvedSuggestions.length === 0 ? (
                  <div style={{ padding: "24px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
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
                          <div className="action-mini-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="action-mini-title" style={{ fontWeight: "700" }}>{title}</span>
                            <span className="action-mini-rewards">
                              {sug.metadata?.category === "action_fountain" ? "⛲ Action Fontaine" : 
                               sug.metadata?.category === "verite_fountain" ? "⛲ Vérité Fontaine" : 
                               `+${pts} pts / -${dmg} HP`}
                            </span>
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
