import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { DEFAULT_ACTIONS } from "../services/gameEngine";
import { parseMessageToJSX } from "../utils/parseLogMessage";
import { 
  Check, X, ShieldAlert, Heart, Trophy, RefreshCw,
  Zap, Plus, Trash, Play, Users, Award, Shield, FileText, Edit2, Eye, EyeOff
} from "lucide-react";

export default function GMDashboard({ gmTab = "arbitrage" }) {
  const {
    gameState,
    gameCode,
    initializeGame,
    resetGame,
    approveHit,
    rejectHit,
    resolveCounterAttack,
    resurrectZombie,
    manualEditPlayer,
    triggerMorningSkips,
    removePlayer,
    dismissPinRecovery,
    approveSuggestedAction,
    rejectSuggestedAction,
    addCustomActionDirectly,
    deleteAction,
    editAction,
    savePlayerPhoto,
    togglePlayerActiveStatus
  } = useGame();

  const [initError, setInitError] = useState("");
  const [playersMasked, setPlayersMasked] = useState(false);
  const [showResetConfirmStep, setShowResetConfirmStep] = useState(0);

  // Editing player state
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editScore, setEditScore] = useState(0);
  const [editLives, setEditLives] = useState(7);
  const [editZombie, setEditZombie] = useState(false);

  // Direct action addition/edition state
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actPoints, setActPoints] = useState(30);
  const [actDamage, setActDamage] = useState(1.0);
  const [actEphemeral, setActEphemeral] = useState(false);
  const [editingActionId, setEditingActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  // Suggestion custom edits map (stores { points, damage, isEphemeral } for each pending suggestion)
  const [suggestionEdits, setSuggestionEdits] = useState({});

  // Filters
  const pendingEvents = gameState.history.filter((h) => h.status === "pending");
  const approvedEvents = gameState.history.filter((h) => h.status === "approved");

  const handleStartGame = () => {
    const playerNames = gameState.players.map(p => p.name);
    if (playerNames.length < 3) {
      setInitError("Il faut au moins 3 joueurs connectés pour démarrer la partie.");
      return;
    }
    initializeGame(playerNames);
  };

  // Direct action handler (Create or Edit)
  const handleAddActionDirectly = (e) => {
    e.preventDefault();
    if (!actTitle.trim() || !actDesc.trim()) return;
    
    if (editingActionId !== null) {
      editAction(editingActionId, actTitle.trim(), actDesc.trim(), Number(actPoints), Number(actDamage), actEphemeral);
      setEditingActionId(null);
      showToast("Défi mis à jour avec succès !", "success");
    } else {
      addCustomActionDirectly(actTitle.trim(), actDesc.trim(), Number(actPoints), Number(actDamage), actEphemeral);
      showToast("Défi ajouté avec succès !", "success");
    }
    
    setActTitle("");
    setActDesc("");
    setActPoints(30);
    setActDamage(1.0);
    setActEphemeral(false);
  };

  const startEditAction = (action) => {
    setEditingActionId(action.id);
    setActTitle(action.title);
    setActDesc(action.description);
    setActPoints(action.points || 30);
    setActDamage(action.damage || 1.0);
    setActEphemeral(!!action.isEphemeral);
    document.querySelector(".direct-action-card")?.scrollIntoView({ behavior: "smooth" });
  };

  const cancelEditAction = () => {
    setEditingActionId(null);
    setActTitle("");
    setActDesc("");
    setActPoints(30);
    setActDamage(1.0);
    setActEphemeral(false);
  };

  // Dynamic suggestion edits handler
  const updateSugEdit = (eventId, field, val, eventMetadata) => {
    setSuggestionEdits(prev => {
      const current = prev[eventId] || {
        points: eventMetadata?.points !== undefined ? eventMetadata.points : 30,
        damage: eventMetadata?.damage !== undefined ? eventMetadata.damage : 1.0,
        isEphemeral: eventMetadata?.isEphemeral !== undefined ? eventMetadata.isEphemeral : false
      };
      return {
        ...prev,
        [eventId]: {
          ...current,
          [field]: val
        }
      };
    });
  };

  const handleApproveSuggestion = (event) => {
    const editData = suggestionEdits[event.id] || {
      points: event.metadata?.points !== undefined ? event.metadata.points : 30,
      damage: event.metadata?.damage !== undefined ? event.metadata.damage : 1.0,
      isEphemeral: event.metadata?.isEphemeral !== undefined ? event.metadata.isEphemeral : false
    };
    approveSuggestedAction(event.id, editData.points, editData.damage, editData.isEphemeral);
  };

  // God Mode Handlers
  const startEditPlayer = (player) => {
    setEditingPlayer(player.name);
    setEditScore(player.score);
    setEditLives(player.lives);
    setEditZombie(player.isZombie);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingPlayer) return;
    manualEditPlayer(editingPlayer, editScore, editLives, editZombie);
    setEditingPlayer(null);
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  // === RENDU DU PANEL DE CONTRÔLE GM (ONGLETS DYNAMIQUES) ===
  return (
    <div className="judge-dashboard gm-refactored animate-fade-in">



      {/* GM Tab Content */}
      <div className="gm-tab-content">
        
        {/* --- 1. ARBITRAGE TAB --- */}
        {gmTab === "arbitrage" && (
          <div className="gm-sub-section">
            <h3 style={{ marginBottom: 16 }}>Demandes en Attente ({pendingEvents.length})</h3>
            {pendingEvents.length === 0 ? (
              <div className="empty-pending-card">Aucune demande en attente. Camping calme.</div>
            ) : (
              <div className="pending-list">
                {pendingEvents.map((event) => (
                  <div key={event.id} className={`pending-card event-${event.type}`}>
                    <div className="pending-card-header">
                      <span className="pending-type">
                        {event.type === "hit_declaration" && "🗡️ HIT SOUHAITÉ"}
                        {event.type === "abandon_request" && "🏳️ DEMANDE D'ABANDON"}
                        {event.type === "counter_attack" && "🛡️ ACCUSATION CONTRE-ATTAQUE"}
                        {event.type === "action_suggestion" && "💡 SUGGESTION DE DÉFI"}
                        {event.type === "pin_recovery" && "🔑 CODE PIN OUBLIÉ"}
                      </span>
                      <span className="pending-time">{formatTime(event.timestamp)}</span>
                    </div>
                    <div className="pending-body">
                      <p>{event.message}</p>
                      
                      {event.type === "counter_attack" && (
                        <div className="counter-attack-details">
                          Suspect accusé : <strong>{event.killer}</strong> <br />
                          Défi suspecté : <strong>{event.accusedActionText || "Non précisé"}</strong>
                        </div>
                      )}

                      {event.type === "pin_recovery" && (
                        <div className="counter-attack-details" style={{ borderTop: "1px dashed var(--border-color)", paddingTop: 8, marginTop: 8 }}>
                          Code PIN enregistré : <strong style={{ color: "var(--neon-green)", fontSize: "16px" }}>{event.message.includes("PIN enregistré : ") ? event.message.split("PIN enregistré : ")[1] : "Non trouvé"}</strong>
                        </div>
                      )}
                    </div>

                    <div className="pending-actions">
                      {event.type === "counter_attack" && (
                        <>
                          <button onClick={() => resolveCounterAttack(event.id, true)} className="btn-approve CA-correct">
                            <Check size={16} /> Bonne Accusation
                          </button>
                          <button onClick={() => resolveCounterAttack(event.id, false)} className="btn-reject CA-incorrect">
                            <X size={16} /> Fausse Accusation
                          </button>
                        </>
                      )}

                      {event.type === "action_suggestion" && (() => {
                        const editData = suggestionEdits[event.id] || {
                          points: event.metadata?.points !== undefined ? event.metadata.points : 30,
                          damage: event.metadata?.damage !== undefined ? event.metadata.damage : 1.0,
                          isEphemeral: event.metadata?.isEphemeral !== undefined ? event.metadata.isEphemeral : false
                        };
                        return (
                          <div className="suggestion-approval-container">
                            <div className="suggestion-edit-fields">
                              <label className="edit-sug-lbl">
                                Points :
                                <input 
                                  type="number" 
                                  value={editData.points} 
                                  min="0"
                                  onChange={(e) => updateSugEdit(event.id, "points", Number(e.target.value), event.metadata)}
                                  className="neon-input text-input-sug"
                                />
                              </label>
                              <label className="edit-sug-lbl">
                                Cœurs :
                                <input 
                                  type="number" 
                                  value={editData.damage} 
                                  step="0.25"
                                  min="0"
                                  max="7"
                                  onChange={(e) => updateSugEdit(event.id, "damage", Number(e.target.value), event.metadata)}
                                  className="neon-input text-input-sug"
                                />
                              </label>
                              <label className="checkbox-row inline-checkbox-sug" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                <input 
                                  type="checkbox" 
                                  checked={editData.isEphemeral} 
                                  onChange={(e) => updateSugEdit(event.id, "isEphemeral", e.target.checked, event.metadata)}
                                />
                                Ephem.
                              </label>
                            </div>
                            <div className="sug-approve-btns">
                              <button onClick={() => handleApproveSuggestion(event)} className="btn-approve sug-btn-ok">
                                <Check size={14} /> Ajouter à la Pool
                              </button>
                              <button onClick={() => rejectSuggestedAction(event.id)} className="btn-reject sug-btn-no">
                                <X size={14} /> Rejeter
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {event.type !== "counter_attack" && event.type !== "action_suggestion" && (
                        <>
                          <button 
                            onClick={() => {
                              if (event.type === "hit_declaration") approveHit(event.id);
                              else if (event.type === "pin_recovery") dismissPinRecovery(event.id);
                            }}
                            className="btn-approve"
                          >
                            <Check size={16} /> {event.type === "pin_recovery" ? "Lu / Effacer" : "Valider"}
                          </button>
                          {event.type !== "pin_recovery" && (
                            <button 
                              onClick={() => {
                                if (event.type === "hit_declaration") rejectHit(event.id);
                              }}
                              className="btn-reject"
                            >
                              <X size={16} /> Refuser
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 2. GM MODE TAB (PLAYERS & GOD MODE) --- */}
        {gmTab === "players" && (
          <div className="gm-sub-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>
                {gameState.started ? `Gestion des Joueurs (${gameState.players.length})` : `Joueurs Connectés (${gameState.players.length})`}
              </h3>
              <button
                onClick={() => setPlayersMasked(!playersMasked)}
                className="panic-toggle-inline-btn"
                style={{ position: "static", border: "1px solid var(--border-color)", padding: "6px 10px", height: "auto" }}
                title={playersMasked ? "Révéler les infos" : "Masquer les infos"}
              >
                {playersMasked ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            {!gameState.started ? (
              <>
                <p className="admin-subtitle" style={{ margin: 0, marginTop: -8, marginBottom: 12 }}>
                  Les joueurs apparaissent ici en temps réel au fur et à mesure de leurs inscriptions.
                </p>

                {initError && <div className="error-message" style={{ marginTop: 12 }}><ShieldAlert size={16} />{initError}</div>}

                {gameState.players.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: "13px", fontWeight: 600 }}>
                    Aucun joueur connecté pour l'instant.
                  </div>
                ) : (
                  <div className="judge-players-grid" style={{ marginTop: 16 }}>
                    {gameState.players.map((p) => (
                      <div key={p.name} className={`judge-player-card ${playersMasked ? "card-blurred" : ""}`}>
                        <div className="j-player-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className="row-avatar" style={{ width: "24px", height: "24px", fontSize: "10px", minWidth: "24px", minHeight: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <strong>{p.name}</strong>
                        </div>
                        <div className="j-player-stats" style={{ marginTop: 8 }}>
                          <div style={{ color: "var(--neon-green)", fontSize: "12px", fontWeight: "700" }}>Code PIN : {p.pin}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: 4 }}>Score : 0 pts</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Cœurs : 7 / 7</div>
                        </div>
                        <div className="j-player-actions" style={{ marginTop: 12 }}>
                          <button 
                            type="button" 
                            onClick={() => removePlayer(p.name)} 
                            className="btn-reject" 
                            style={{ width: "100%", height: 32, fontSize: 12, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                          >
                            <Trash size={12} /> Exclure le joueur
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="launch-game-btn-container" style={{ marginTop: 24 }}>
                  <button onClick={handleStartGame} className="launch-game-btn" style={{ width: "100%" }}>
                    <Play size={20} fill="#121214" /> LANCER LA PARTIE 🚀
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* God Form Editing */}
                {editingPlayer && (
                  <form onSubmit={handleSaveEdit} className="god-edit-form animate-fade-in">
                    <h4>Modifier {editingPlayer}</h4>
                    <div className="form-row">
                      <label>
                        Score (pts) :
                        <input type="number" value={editScore} onChange={(e) => setEditScore(Number(e.target.value))} />
                      </label>
                      <label>
                        Cœurs (max 7) :
                        <input type="number" step="0.25" min="0" max="7" value={editLives} onChange={(e) => setEditLives(Number(e.target.value))} />
                      </label>
                      <label className="checkbox-row">
                        <input type="checkbox" checked={editZombie} onChange={(e) => setEditZombie(e.target.checked)} />
                        Statut Zombie
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="save-edit-btn">Enregistrer</button>
                      <button type="button" onClick={() => setEditingPlayer(null)} className="cancel-edit-btn">Annuler</button>
                    </div>
                  </form>
                )}

                {/* Players Grid */}
                <div className="judge-players-grid" style={{ marginTop: 16 }}>
                  {gameState.players.map((p) => (
                    <div key={p.name} className={`judge-player-card ${p.isZombie ? "zombie-player" : ""} ${!p.target ? "player-inactive-card" : ""} ${playersMasked ? "card-blurred" : ""}`}>
                      <div className="j-player-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div className="row-avatar" style={{ width: "24px", height: "24px", fontSize: "10px", minWidth: "24px", minHeight: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <strong>{p.name}</strong>
                        {p.isZombie && <span className="z-label" style={{ marginLeft: "auto" }}>ZOMBIE</span>}
                        {!p.target && <span className="z-label" style={{ marginLeft: "auto", background: "rgba(245, 158, 11, 0.15)", color: "var(--neon-gold)", borderColor: "rgba(245, 158, 11, 0.3)" }}>ABSENT</span>}
                      </div>
                      <div className="j-player-stats">
                        <div>Score : {p.score} pts</div>
                        <div>Cœurs : {p.lives} / 7</div>
                        <div style={{ color: "var(--neon-green)", fontSize: "11px", fontWeight: "700", marginTop: "2px", marginBottom: "2px" }}>Code PIN : {p.pin}</div>
                        <div className="target-preview">Cible : <strong>{p.target || "Aucune"}</strong></div>
                        {p.target && (() => {
                          const action = (gameState.actionPool || DEFAULT_ACTIONS).find(a => a.id === p.actionId);
                          return (
                            <div className="gm-action-preview" style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", borderTop: "1px dashed var(--border-color)", paddingTop: "4px" }}>
                              Défi : <strong>{action ? action.title : "Inconnu"}</strong>
                              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "2px" }}>
                                « {action ? action.description : ""} »
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="j-player-actions" style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                        <button onClick={() => startEditPlayer(p)} className="j-btn-edit" style={{ flex: 1 }}>Modifier stats</button>
                        {p.target ? (
                          <button 
                            onClick={() => togglePlayerActiveStatus(p.name, false)} 
                            className="j-btn-edit" 
                            style={{ flex: 1, borderColor: "var(--neon-gold)", color: "var(--neon-gold)", background: "rgba(245, 158, 11, 0.05)" }}
                            title="Geler le score/vies et le retirer du pool de cibles"
                          >
                            Geler (Absent)
                          </button>
                        ) : (
                          <button 
                            onClick={() => togglePlayerActiveStatus(p.name, true)} 
                            className="j-btn-edit" 
                            style={{ flex: 1, borderColor: "var(--neon-green)", color: "var(--neon-green)", background: "rgba(16, 185, 129, 0.05)" }}
                            title="Réintégrer dans la boucle des cibles"
                          >
                            Activer (Présent)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowResetConfirmStep(1)} 
                  className="reset-game-btn" 
                  style={{ width: "100%", marginTop: 24 }}
                >
                  ⚠️ ARRÊTER / RÉINITIALISER LA PARTIE
                </button>
              </>
            )}
          </div>
        )}

        {/* --- 3. ACTIONS POOL TAB --- */}
        {gmTab === "actions" && (
          <div className="gm-sub-section">
            {/* Direct Add/Edit Action */}
            <div className="admin-card direct-action-card">
              <h3>{editingActionId !== null ? "✏️ Modifier le défi" : "Créer un défi personnalisé"}</h3>
              <form onSubmit={handleAddActionDirectly} className="direct-action-form" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Titre du défi :
                  <input
                    type="text"
                    placeholder="Ex: Le Vol de Tente..."
                    value={actTitle}
                    onChange={(e) => setActTitle(e.target.value)}
                    className="neon-input"
                    required
                  />
                </label>
                
                <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Description de la mission :
                  <textarea
                    placeholder="Description claire de la mission secrète..."
                    value={actDesc}
                    onChange={(e) => setActDesc(e.target.value)}
                    className="neon-input"
                    style={{ height: 75, resize: "none" }}
                    required
                  />
                </label>

                <div className="direct-action-row" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <label className="sug-diff-lbl" style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                      Points :
                      <input
                        type="number"
                        min="0"
                        value={actPoints}
                        onChange={(e) => setActPoints(Number(e.target.value))}
                        className="neon-input"
                        required
                      />
                    </label>
                    <label className="sug-diff-lbl" style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                      Cœurs perdus :
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="7"
                        value={actDamage}
                        onChange={(e) => setActDamage(Number(e.target.value))}
                        className="neon-input"
                        required
                      />
                    </label>
                  </div>
                  
                  <label className="checkbox-row" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8, cursor: "pointer", margin: "4px 0" }}>
                    <input
                      type="checkbox"
                      checked={actEphemeral}
                      onChange={(e) => setActEphemeral(e.target.checked)}
                      style={{ width: "auto", margin: 0 }}
                    />
                    <span className="checkbox-text" style={{ fontSize: "13px" }}>Bonus Éphémère (+75 pts si réussi)</span>
                  </label>

                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 12, width: "100%", alignItems: "center", flexWrap: "wrap" }}>
                    {editingActionId !== null ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteAction(editingActionId);
                          cancelEditAction();
                          showToast("Défi supprimé avec succès !", "danger");
                        }}
                        style={{
                          backgroundColor: "rgba(255, 51, 102, 0.1)",
                          border: "1px solid var(--neon-red)",
                          color: "var(--neon-red)",
                          padding: "8px 12px",
                          borderRadius: "var(--border-radius-sm)",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          fontFamily: "var(--font-sans)",
                          height: "38px",
                          boxSizing: "border-box"
                        }}
                      >
                        <Trash size={14} /> Supprimer
                      </button>
                    ) : (
                      <div />
                    )}
                    
                    <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                      <button 
                        type="submit" 
                        style={{
                          backgroundColor: "var(--neon-purple)",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--border-radius-sm)",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          fontFamily: "var(--font-sans)",
                          height: "38px",
                          boxSizing: "border-box"
                        }}
                      >
                        <Plus size={16} /> {editingActionId !== null ? "Enregistrer" : "Ajouter à la Pool"}
                      </button>
                      
                      {editingActionId !== null && (
                        <button 
                          type="button" 
                          onClick={cancelEditAction} 
                          style={{ 
                            backgroundColor: "#27272a", 
                            border: "1px solid var(--border-color)", 
                            color: "var(--text-primary)", 
                            borderRadius: "var(--border-radius-sm)", 
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: "700", 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-sans)",
                            height: "38px",
                            boxSizing: "border-box"
                          }}
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Dynamic Pool Preview */}
            <h3 style={{ marginTop: 20 }}>Défis Actifs ({gameState.actionPool?.length || 0})</h3>
            <div className="actions-list-container" style={{ maxHeight: "400px" }}>
              {["micro", "standard", "majeur", "legendaire"].map((category) => {
                const list = (gameState.actionPool || DEFAULT_ACTIONS).filter((a) => a.difficulty === category);
                return (
                  <div key={category} className="action-category-group">
                    <h4 className={`cat-title-${category}`}>{category.toUpperCase()} ({list.length} actions)</h4>
                    <div className="actions-scroll-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {list.map((act) => (
                        <div 
                          key={act.id} 
                          className={`action-item-mini ${editingActionId === act.id ? "editing-highlight" : ""}`}
                          onClick={() => startEditAction(act)}
                          title="Cliquer pour modifier ou supprimer cette action"
                        >
                          <div className="action-mini-header">
                            <span className="action-mini-title">{act.title}</span>
                            <span className="action-mini-rewards">+{act.points} pts / -{act.damage} HP</span>
                          </div>
                          <p className="action-mini-desc">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- 4. HISTORY TAB --- */}
        {gmTab === "history" && (
          <div className="gm-sub-section">
            <h3 style={{ marginBottom: 16 }}>Historique de la Partie</h3>
            <div className="activity-feed" style={{ maxHeight: "none" }}>
              {approvedEvents.length === 0 ? (
                <div className="empty-feed">Aucun événement validé pour l'instant.</div>
              ) : (
                approvedEvents.map((evt) => (
                  <div key={evt.id} className="feed-item">
                    <span className="feed-time">[{formatTime(evt.timestamp)}]</span>
                    <span className="feed-message"> {parseMessageToJSX(evt.message, gameState.players)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- 5. QR CODE TAB --- */}
        {gmTab === "qrcode" && (
          <div className="gm-sub-section animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <div className="admin-card text-center" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, padding: "32px 24px", width: "100%", maxWidth: "450px", border: "1px solid var(--neon-purple)", boxShadow: "0 0 20px rgba(139, 92, 246, 0.15)" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em" }}>Rejoindre la Partie</h3>
              <p className="admin-subtitle" style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>
                Faites scanner ce QR Code aux joueurs sur leur téléphone pour qu'ils s'enregistrent
              </p>
              <div style={{ backgroundColor: "#fff", padding: 16, borderRadius: "var(--border-radius-sm)", display: "inline-block", marginTop: 8, boxShadow: "0 0 25px rgba(255, 255, 255, 0.15)" }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + "/?join=" + gameCode)}`} 
                  alt="QR Code de partage" 
                  style={{ display: "block", width: 200, height: 200 }}
                />
              </div>
              <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--neon-purple)", letterSpacing: "0.05em", marginTop: 8 }}>
                CODE SALON : <span style={{ color: "#fff", background: "var(--bg-input)", padding: "6px 12px", borderRadius: 4, border: "1px solid var(--border-color)", display: "inline-block", marginTop: 4 }}>{gameCode}</span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", wordBreak: "break-all", borderTop: "1px dashed var(--border-color)", paddingTop: 12, marginTop: 8, width: "100%" }}>
                Lien direct : <a href={`${window.location.origin}/?join=${gameCode}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--neon-purple)", textDecoration: "underline" }}>{window.location.origin}/?join={gameCode}</a>
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Double confirmation modal for game reset */}
      {showResetConfirmStep > 0 && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          {showResetConfirmStep === 1 && (
            <div 
              className="admin-card text-center animate-fade-in" 
              style={{
                width: "100%",
                maxWidth: "380px",
                border: "2px solid var(--neon-red)",
                boxShadow: "0 0 25px rgba(255, 51, 102, 0.25)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                alignItems: "center"
              }}
            >
              <ShieldAlert size={48} className="glowing-icon-pink" style={{ color: "var(--neon-red)" }} />
              <h3 style={{ margin: 0, fontSize: "18px", color: "#fff", fontWeight: "900" }}>CONFIRMATION IMPORTANTE</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Voulez-vous vraiment <strong>ARRÊTER</strong> et <strong>RÉINITIALISER</strong> la partie ? Cette action est irréversible et supprimera le salon.
              </p>
              <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "8px" }}>
                <button 
                  onClick={() => setShowResetConfirmStep(0)}
                  style={{
                    flex: 1,
                    height: "44px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--border-radius-sm)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Annuler
                </button>
                <button 
                  onClick={() => setShowResetConfirmStep(2)}
                  className="reset-game-btn"
                  style={{
                    flex: 1,
                    height: "44px",
                    margin: 0,
                    fontWeight: "700",
                    backgroundColor: "var(--neon-red)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--border-radius-sm)",
                    cursor: "pointer"
                  }}
                >
                  Oui, continuer
                </button>
              </div>
            </div>
          )}

          {showResetConfirmStep === 2 && (
            <div 
              className="admin-card text-center animate-fade-in" 
              style={{
                width: "100%",
                maxWidth: "380px",
                border: "2px solid var(--neon-red)",
                boxShadow: "0 0 25px rgba(255, 51, 102, 0.35)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                alignItems: "center"
              }}
            >
              <ShieldAlert size={48} className="glowing-icon-pink" style={{ color: "var(--neon-red)", animation: "pulse 1.5s infinite" }} />
              <h3 style={{ margin: 0, fontSize: "18px", color: "var(--neon-red)", fontWeight: "900" }}>DOUBLE CONFIRMATION</h3>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Toutes les données du salon seront <strong>définitivement effacées</strong>. Êtes-vous ABSOLUMENT sûr de vous ?
              </p>
              <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "8px" }}>
                {/* INVERTED BUTTONS ORDER FOR STEP 2 */}
                <button 
                  onClick={() => {
                    resetGame();
                    setShowResetConfirmStep(0);
                  }}
                  className="reset-game-btn"
                  style={{
                    flex: 1,
                    height: "44px",
                    margin: 0,
                    fontWeight: "700",
                    backgroundColor: "var(--neon-red)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--border-radius-sm)",
                    cursor: "pointer"
                  }}
                >
                  Détruire le salon
                </button>
                <button 
                  onClick={() => setShowResetConfirmStep(0)}
                  style={{
                    flex: 1,
                    height: "44px",
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    borderRadius: "var(--border-radius-sm)",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="toast-notification-backdrop">
          <div className={`toast-notification-body toast-${toast.type} animate-fade-in`}>
            {toast.type === "success" ? <Check size={24} /> : <Trash size={24} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
