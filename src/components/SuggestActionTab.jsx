import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { Lightbulb, Loader2, X, PlusCircle, AlignJustify, Trash2, History, Check, Target, Droplet, HelpCircle, Zap, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import tokenImage from "../assets/token_neon.png";
import SwipeToDeleteItem from "./SwipeToDeleteItem";

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

  const getRomainDifficulty = (diff) => {
    if (diff === "facile") return "I";
    if (diff === "moyen") return "II";
    if (diff === "difficile") return "III";
    return "";
  };

  const handleSuggestSubmit = (e) => {
    e.preventDefault();
    let titleVal = "";
    if (sugCategory === "defi") {
      titleVal = sugTitle.trim();
    } else if (sugCategory === "action_fountain") {
      titleVal = "Action";
    } else if (sugCategory === "verite_fountain") {
      titleVal = "Vérité";
    }
    const descVal = sugDesc.trim();
    if (!descVal || (sugCategory === "defi" && !titleVal)) return;
    suggestAction(
      playerName,
      titleVal,
      descVal,
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
              <h3 style={{ color: sugCategory === "defi" ? "var(--neon-purple)" : sugCategory === "action_fountain" ? "var(--neon-red)" : "var(--neon-blue)", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", textTransform: "uppercase", fontWeight: "800", marginBottom: "2px" }}>
                {sugCategory === "defi" ? (
                  <><Target size={16} /> Suggérer un défi</>
                ) : sugCategory === "action_fountain" ? (
                  <><Zap size={16} /> Suggérer une action</>
                ) : (
                  <><HelpCircle size={16} /> Suggérer une vérité</>
                )}
              </h3>
              <p className="ca-help" style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4", margin: "0 0 4px 0" }}>
                {sugCategory === "defi" 
                  ? "Propose un défi secret pour le pool de cibles du jeu. Après validation, les joueurs pourront le piocher."
                  : sugCategory === "action_fountain"
                  ? "Propose une action physique ou drôle pour la Fontaine de Vie. Elle permettra aux joueurs blessés de se soigner."
                  : "Propose une question indiscrète ou drôle pour la Fontaine de Vie. Elle permettra aux joueurs blessés de se soigner."
                }
              </p>

              {/* Boutons Poussoirs 3 Catégories Réduits et Colorés */}
              <div style={{
                display: "flex",
                backgroundColor: "rgba(10, 10, 14, 0.6)",
                backdropFilter: "blur(8px)",
                borderRadius: "var(--border-radius-sm)",
                padding: "2px",
                margin: "4px 0 10px 0",
                border: "1px solid rgba(245, 158, 11, 0.15)",
                gap: "4px",
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => setSugCategory("defi")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    backgroundColor: sugCategory === "defi" ? "rgba(139, 92, 246, 0.2)" : "transparent",
                    color: sugCategory === "defi" ? "#ffffff" : "var(--text-muted)",
                    border: sugCategory === "defi" ? "1px solid var(--neon-purple)" : "1px solid transparent",
                    borderRadius: "4px",
                    padding: "4px 2px",
                    fontSize: "9.5px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    boxShadow: sugCategory === "defi" ? "0 0 8px rgba(139, 92, 246, 0.3)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  <Target size={10} />
                  Défi
                </button>
                <button
                  type="button"
                  onClick={() => setSugCategory("action_fountain")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    backgroundColor: sugCategory === "action_fountain" ? "rgba(255, 51, 102, 0.15)" : "transparent",
                    color: sugCategory === "action_fountain" ? "#ffffff" : "var(--text-muted)",
                    border: sugCategory === "action_fountain" ? "1px solid var(--neon-red)" : "1px solid transparent",
                    borderRadius: "4px",
                    padding: "4px 2px",
                    fontSize: "9.5px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    boxShadow: sugCategory === "action_fountain" ? "0 0 8px rgba(255, 51, 102, 0.3)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  <Zap size={10} />
                  Action
                </button>
                <button
                  type="button"
                  onClick={() => setSugCategory("verite_fountain")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    backgroundColor: sugCategory === "verite_fountain" ? "rgba(59, 130, 246, 0.2)" : "transparent",
                    color: sugCategory === "verite_fountain" ? "#ffffff" : "var(--text-muted)",
                    border: sugCategory === "verite_fountain" ? "1px solid var(--neon-blue)" : "1px solid transparent",
                    borderRadius: "4px",
                    padding: "4px 2px",
                    fontSize: "9.5px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    boxShadow: sugCategory === "verite_fountain" ? "0 0 8px rgba(59, 130, 246, 0.3)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  <HelpCircle size={10} />
                  Vérité
                </button>
              </div>

              {sugCategory === "defi" ? (
                <>
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
                      placeholder="Expliquer en quelques mots ce que le joueur doit faire..."
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
                </>
              ) : (
                <>
                  <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Intitulé de la proposition :
                    <textarea
                      placeholder={sugCategory === "action_fountain" ? "Ex: Faire 10 pompes devant un inconnu..." : "Ex: Quel est ton pire secret de festival ?"}
                      value={sugDesc}
                      onChange={(e) => setSugDesc(e.target.value)}
                      className="neon-input-premium"
                      style={{ height: "70px", resize: "none", textAlign: "left" }}
                      required
                    />
                  </label>

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
                </>
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
                      <SwipeToDeleteItem
                        key={sug.id}
                        onDelete={() => setDeletingActionId(sug.id)}
                        onClick={() => {}}
                        isSelected={false}
                        revealOnSelect={false}
                        isConfirming={deletingActionId === sug.id}
                      >
                        <div
                          className="action-item-mini"
                          style={{
                            borderLeftColor: statusColor,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            cursor: "grab",
                            background: "rgba(20, 20, 25, 0.95)",
                            width: "100%"
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                            <div className="action-mini-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                              {/* Partie gauche */}
                              {(sug.metadata?.category === "action_fountain" || sug.metadata?.category === "verite_fountain") ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontSize: "12px", fontWeight: "800" }}>
                                  <Droplet size={13} fill="var(--text-primary)" style={{ color: "var(--text-primary)" }} />
                                  <span>Fontaine - {getRomainDifficulty(sug.metadata?.difficulty)}</span>
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontSize: "12px", fontWeight: "800" }}>
                                  <Target size={13} fill="var(--text-primary)" style={{ color: "var(--text-primary)" }} />
                                  <span>Défi - {title}</span>
                                </div>
                              )}

                              {/* Partie droite */}
                              {(sug.metadata?.category === "action_fountain" || sug.metadata?.category === "verite_fountain") ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: "850", textTransform: "uppercase" }}>
                                  <span>{sug.metadata?.category === "action_fountain" ? "Action" : "Vérité"}</span>
                                  {sug.metadata?.category === "action_fountain" ? (
                                    <Zap size={12} style={{ color: "var(--text-secondary)" }} />
                                  ) : (
                                    <HelpCircle size={12} style={{ color: "var(--text-secondary)" }} />
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: "850", textTransform: "uppercase" }}>
                                  <span>+{pts}</span>
                                  <span style={{ fontSize: "11px", marginLeft: "-2px" }}>🪙</span>
                                  <span style={{ margin: "0 2px", color: "var(--text-muted)" }}>/</span>
                                  <span>-{dmg}</span>
                                  <Heart size={11} fill="var(--neon-red)" style={{ color: "var(--neon-red)" }} />
                                </div>
                              )}
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
                        </div>
                      </SwipeToDeleteItem>
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
                          <div className="action-mini-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            {/* Partie gauche */}
                            {(sug.metadata?.category === "action_fountain" || sug.metadata?.category === "verite_fountain") ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontSize: "12px", fontWeight: "800" }}>
                                <Droplet size={13} fill="var(--text-primary)" style={{ color: "var(--text-primary)" }} />
                                <span>Fontaine - {getRomainDifficulty(sug.metadata?.difficulty)}</span>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-primary)", fontSize: "12px", fontWeight: "800" }}>
                                <Target size={13} fill="var(--text-primary)" style={{ color: "var(--text-primary)" }} />
                                <span>Défi - {title}</span>
                              </div>
                            )}

                            {/* Partie droite */}
                            {(sug.metadata?.category === "action_fountain" || sug.metadata?.category === "verite_fountain") ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: "850", textTransform: "uppercase" }}>
                                <span>{sug.metadata?.category === "action_fountain" ? "Action" : "Vérité"}</span>
                                {sug.metadata?.category === "action_fountain" ? (
                                  <Zap size={12} style={{ color: "var(--text-secondary)" }} />
                                ) : (
                                  <HelpCircle size={12} style={{ color: "var(--text-secondary)" }} />
                                )}
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "10px", fontWeight: "850", textTransform: "uppercase" }}>
                                <span>+{pts}</span>
                                <span style={{ fontSize: "11px", marginLeft: "-2px" }}>🪙</span>
                                <span style={{ margin: "0 2px", color: "var(--text-muted)" }}>/</span>
                                <span>-{dmg}</span>
                                <Heart size={11} fill="var(--neon-red)" style={{ color: "var(--neon-red)" }} />
                              </div>
                            )}
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
