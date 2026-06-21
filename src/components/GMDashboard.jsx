import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { supabase } from "../services/supabaseClient";
import { DEFAULT_ACTIONS } from "../services/gameEngine";
import { parseMessageToJSX } from "../utils/parseLogMessage";
import { 
  Check, X, ShieldAlert, Heart, Trophy, RefreshCw,
  Zap, Plus, Trash, Play, Users, Award, Shield, FileText, Edit2, Eye, EyeOff, Trash2, Droplet, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import defaultAvatar from "../assets/default_avatar.png";
import SwipeToDeleteItem from "./SwipeToDeleteItem";

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
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editScore, setEditScore] = useState(0);
  const [editLives, setEditLives] = useState(7);
  const [editZombie, setEditZombie] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  // Direct action addition/edition state
  const [actTitle, setActTitle] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actPoints, setActPoints] = useState(30);
  const [actDamage, setActDamage] = useState(1.0);
  const [editingActionId, setEditingActionId] = useState(null);
  const [deletingActionId, setDeletingActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  // Suggestion custom edits map (stores { points, damage } for each pending suggestion)
  const [suggestionEdits, setSuggestionEdits] = useState({});

  // --- FONTAINE DE VIE GM STATE & HANDLERS ---
  const [fountainPool, setFountainPool] = useState([]);
  const [fountainTitle, setFountainTitle] = useState("");
  const [fountainDesc, setFountainDesc] = useState("");
  const [fountainType, setFountainType] = useState("action");
  const [fountainDiff, setFountainDiff] = useState("facile");
  const [loadingFountain, setLoadingFountain] = useState(false);
  const [deletingFountainId, setDeletingFountainId] = useState(null);

  const [activeRulesSubtab, setActiveRulesSubtab] = useState("defis"); // 'defis', 'actions', 'verites'
  const [editingFountainId, setEditingFountainId] = useState(null);

  const fetchFountainPool = async () => {
    if (!gameCode) return;
    const { data, error } = await supabase
      .from("fountain_pool")
      .select("*")
      .eq("game_code", gameCode)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setFountainPool(data);
    }
  };

  useEffect(() => {
    if ((gmTab === "actions" || gmTab === "fountain") && gameCode) {
      fetchFountainPool();
    }
  }, [gmTab, gameCode]);

  const handleAddOrEditFountainChallenge = async (e) => {
    e.preventDefault();
    if (!fountainTitle.trim()) return;
    setLoadingFountain(true);
    try {
      const currentType = activeRulesSubtab === "actions" ? "action" : "verite";
      if (editingFountainId !== null) {
        const { error } = await supabase
          .from("fountain_pool")
          .update({
            title: fountainTitle.trim(),
            description: fountainTitle.trim(),
            difficulty: fountainDiff
          })
          .eq("id", editingFountainId);

        if (error) throw error;
        showToast(activeRulesSubtab === "actions" ? "Action mise à jour !" : "Vérité mise à jour !", "success");
        setEditingFountainId(null);
      } else {
        const { error } = await supabase
          .from("fountain_pool")
          .insert({
            game_code: gameCode,
            type: currentType,
            title: fountainTitle.trim(),
            description: fountainTitle.trim(),
            difficulty: fountainDiff
          });

        if (error) throw error;
        showToast(activeRulesSubtab === "actions" ? "Action ajoutée !" : "Vérité ajoutée !", "success");
      }
      setFountainTitle("");
      setFountainDesc("");
      await fetchFountainPool();
    } catch (err) {
      showToast(err.message || "Erreur d'enregistrement", "error");
    } finally {
      setLoadingFountain(false);
    }
  };

  const startEditFountainChallenge = (item) => {
    setEditingFountainId(item.id);
    setFountainTitle(item.title || item.description);
    setFountainDesc(item.description);
    setFountainDiff(item.difficulty);
    // Smooth scroll support
    setTimeout(() => {
      document.querySelector(".direct-action-card")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const cancelEditFountainChallenge = () => {
    setEditingFountainId(null);
    setFountainTitle("");
    setFountainDesc("");
    setFountainDiff("facile");
  };

  const handleDeleteFountainChallenge = async (id) => {
    try {
      const { error } = await supabase
        .from("fountain_pool")
        .delete()
        .eq("id", id);
      if (error) throw error;
      showToast("Défi Fontaine supprimé !", "success");
      await fetchFountainPool();
    } catch (err) {
      showToast(err.message || "Erreur de suppression", "error");
    } finally {
      setDeletingFountainId(null);
    }
  };

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
      editAction(editingActionId, actTitle.trim(), actDesc.trim(), Number(actPoints), Number(actDamage), false);
      setEditingActionId(null);
      showToast("Défi mis à jour avec succès !", "success");
    } else {
      addCustomActionDirectly(actTitle.trim(), actDesc.trim(), Number(actPoints), Number(actDamage), false);
      showToast("Défi ajouté avec succès !", "success");
    }
    
    setActTitle("");
    setActDesc("");
    setActPoints(30);
    setActDamage(1.0);
  };

  const startEditAction = (action) => {
    setEditingActionId(action.id);
    setActTitle(action.title);
    setActDesc(action.description);
    setActPoints(action.points || 30);
    setActDamage(action.damage || 1.0);
    document.querySelector(".direct-action-card")?.scrollIntoView({ behavior: "smooth" });
  };

  const cancelEditAction = () => {
    setEditingActionId(null);
    setActTitle("");
    setActDesc("");
    setActPoints(30);
    setActDamage(1.0);
  };

  // Dynamic suggestion edits handler
  const updateSugEdit = (eventId, field, val, eventMetadata) => {
    setSuggestionEdits(prev => {
      const current = prev[eventId] || {
        points: eventMetadata?.points !== undefined ? eventMetadata.points : 30,
        damage: eventMetadata?.damage !== undefined ? eventMetadata.damage : 1.0
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
      damage: event.metadata?.damage !== undefined ? event.metadata.damage : 1.0
    };
    approveSuggestedAction(event.id, editData.points, editData.damage, false);
  };

  // God Mode Handlers
  const startEditPlayer = (player) => {
    setEditingPlayer(player.name);
    setEditName(player.name);
    setEditPin(player.pin);
    setEditScore(player.score);
    setEditLives(player.lives);
    setEditZombie(player.isZombie);
    setEditIsActive(player.target !== null);

    // Scroll en haut vers le formulaire d'édition
    setTimeout(() => {
      const mainContent = document.querySelector(".app-main-content");
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const editorElement = document.getElementById("god-player-editor");
        if (editorElement) {
          editorElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 50);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingPlayer) return;

    const cleanNewName = editName.trim();
    if (!cleanNewName) {
      showToast("Le pseudo ne peut pas être vide.", "danger");
      return;
    }

    try {
      // 1. Sauvegarde des stats (Score, Vies, Zombie, Nom, PIN)
      const finalLives = editZombie ? 0 : editLives;
      await manualEditPlayer(editingPlayer, editScore, finalLives, editZombie, cleanNewName, editPin.trim());
      
      // 2. Gestion du statut gelé/actif si nécessaire
      const playerObj = gameState.players.find(p => p.name === editingPlayer);
      const currentActive = playerObj ? playerObj.target !== null : true;
      if (editIsActive !== currentActive) {
        const nameToToggle = cleanNewName || editingPlayer;
        await togglePlayerActiveStatus(nameToToggle, editIsActive);
      }
      
      showToast("Joueur mis à jour avec succès !", "success");
      setEditingPlayer(null);
    } catch (err) {
      showToast(err.message || "Erreur de modification", "danger");
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  // === RENDU DU PANEL DE CONTRÔLE GM (ONGLETS DYNAMIQUES) ===
  return (
    <>
      {/* GM Tab Content */}
      <div className="gm-tab-content">
        
        {/* --- 1. ARBITRAGE TAB --- */}
        {gmTab === "arbitrage" && (
          <div className="counter-screen-layout">
            <div className="view-scroll-content">
              <div className="glass-card-red" style={{ width: "100%" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-red)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
                  ACTIONS EN ATTENTE ({pendingEvents.length})
                </h2>
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
                            const category = event.metadata?.category || "defi";
                            if (category === "defi") {
                              const editData = suggestionEdits[event.id] || {
                                points: event.metadata?.points !== undefined ? event.metadata.points : 30,
                                damage: event.metadata?.damage !== undefined ? event.metadata.damage : 1.0
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
                                        style={{ textAlign: "left" }}
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
                                        style={{ textAlign: "left" }}
                                      />
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
                            } else {
                              const typeLabel = category === "action_fountain" ? "Fontaine : Action" : "Fontaine : Vérité";
                              const diffLabel = event.metadata?.difficulty === "facile" ? "Facile" : event.metadata?.difficulty === "moyen" ? "Moyen" : "Difficile";
                              return (
                                <div className="suggestion-approval-container" style={{ flexDirection: "column", gap: "8px", width: "100%" }}>
                                  <div style={{ fontSize: "11px", color: "var(--neon-blue)", fontWeight: "800", textTransform: "uppercase" }}>
                                    Catégorie : {typeLabel} ({diffLabel})
                                  </div>
                                  <div className="sug-approve-btns" style={{ display: "flex", gap: "8px", width: "100%" }}>
                                    <button onClick={() => handleApproveSuggestion(event)} className="btn-approve sug-btn-ok" style={{ flex: 1 }}>
                                      <Check size={14} /> Valider Fontaine
                                    </button>
                                    <button onClick={() => rejectSuggestedAction(event.id)} className="btn-reject sug-btn-no" style={{ flex: 1 }}>
                                      <X size={14} /> Rejeter
                                    </button>
                                  </div>
                                </div>
                              );
                            }
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
            </div>
          </div>
        )}

        {/* --- 2. GM MODE TAB (PLAYERS & GOD MODE) --- */}
        {gmTab === "players" && (
          <div className="players-gm-screen-layout">
            <div className="view-scroll-content">
              <div className="glass-card" style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "var(--neon-purple)", fontWeight: "900", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {gameState.started ? `GESTION DES JOUEURS (${gameState.players.length})` : `JOUEURS CONNECTÉS (${gameState.players.length})`}
                  </h2>
                </div>

                {!gameState.started ? (
                  <>
                    <p className="admin-subtitle" style={{ margin: 0, marginTop: -8, marginBottom: 12, fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                      Les joueurs apparaissent ici en temps réel au fur et à mesure de leurs inscriptions.
                    </p>

                    {initError && <div className="error-message" style={{ marginTop: 12 }}><ShieldAlert size={16} />{initError}</div>}

                    {gameState.players.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: "13px", fontWeight: 600 }}>
                        Aucun joueur connecté pour l'instant.
                      </div>
                    ) : (
                      <div className="judge-players-vertical-list" style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        {gameState.players.map((p) => (
                          <div 
                            key={p.name} 
                            className="judge-player-horizontal-card"
                            style={{
                              width: "100%",
                              background: "rgba(24, 24, 31, 0.65)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "var(--border-radius-sm)",
                              padding: "10px 12px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "12px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                              <img src={defaultAvatar} alt={p.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                              <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{p.name}</strong>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                              <span style={{ fontSize: "11px", color: "var(--neon-green)", fontWeight: "700" }}>PIN : {p.pin}</span>
                              <button 
                                type="button" 
                                onClick={() => removePlayer(p.name)} 
                                className="btn-reject" 
                                style={{ height: 28, width: 28, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                                title="Exclure le joueur"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* God Form Editing */}
                    {editingPlayer && (
                      <form onSubmit={handleSaveEdit} id="god-player-editor" className="god-edit-form animate-fade-in" style={{ scrollMarginTop: "80px", marginBottom: "20px" }}>
                        <h4 style={{ marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>Gérer {editingPlayer}</h4>
                        <div className="form-row" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", gap: "10px", width: "100%", flexWrap: "wrap" }}>
                            <label style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                              Pseudo :
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="neon-input" required style={{ padding: "8px 12px" }} />
                            </label>
                            <label style={{ flex: "1 1 100px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                              Code PIN :
                              <input type="text" maxLength={4} value={editPin} onChange={(e) => setEditPin(e.target.value)} className="neon-input" required style={{ padding: "8px 12px", textAlign: "center", letterSpacing: "0.2em" }} />
                            </label>
                          </div>

                          <div style={{ display: "flex", gap: "10px", width: "100%", flexWrap: "wrap" }}>
                            <label style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                              Score (pts) :
                              <input type="number" value={editScore} onChange={(e) => setEditScore(Number(e.target.value))} className="neon-input" style={{ padding: "8px 12px" }} />
                            </label>
                            <label style={{ flex: "1 1 120px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
                              Cœurs (max 7) :
                              <input type="number" step="0.25" min="0" max="7" value={editLives} onChange={(e) => setEditLives(Number(e.target.value))} className="neon-input" style={{ padding: "8px 12px" }} />
                            </label>
                          </div>

                          <div style={{ display: "flex", gap: "20px", marginTop: "4px", flexWrap: "wrap" }}>
                            <label className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                              <input 
                                type="checkbox" 
                                checked={editZombie} 
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setEditZombie(checked);
                                  if (checked) {
                                    setEditLives(0);
                                  } else {
                                    setEditLives(1);
                                  }
                                }} 
                                style={{ width: "auto", margin: 0 }} 
                              />
                              Statut Zombie 💀
                            </label>
                            <label className="checkbox-row" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                              <input type="checkbox" checked={!editIsActive} onChange={(e) => setEditIsActive(!e.target.checked)} style={{ width: "auto", margin: 0 }} />
                              Gelé / Absent ❄️
                            </label>
                          </div>
                        </div>
                        
                        <div className="form-actions" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                          <button type="submit" className="save-edit-btn" style={{ flex: 1, backgroundColor: "var(--neon-purple)", color: "white", border: "none", padding: "10px", borderRadius: "var(--border-radius-sm)", fontWeight: "bold", cursor: "pointer" }}>Enregistrer</button>
                          <button type="button" onClick={() => setEditingPlayer(null)} className="cancel-edit-btn" style={{ flex: 1, backgroundColor: "#27272a", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "10px", borderRadius: "var(--border-radius-sm)", cursor: "pointer" }}>Annuler</button>
                        </div>
                      </form>
                    )}

                    {/* Players Vertical List */}
                    <div style={{ marginTop: 8, width: "100%" }}>
                      <label style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                        Sélectionner un joueur à gérer :
                      </label>
                      <div 
                        className="judge-players-vertical-list" 
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          width: "100%",
                        }}
                      >
                        {gameState.players.map((p) => {
                          const isSelected = editingPlayer === p.name;
                          return (
                            <div 
                              key={p.name} 
                              onClick={() => startEditPlayer(p)}
                              className={`judge-player-horizontal-card ${isSelected ? "selected-card" : ""}`}
                              style={{
                                width: "100%",
                                background: isSelected 
                                  ? "rgba(139, 92, 246, 0.22)" 
                                  : "rgba(24, 24, 31, 0.65)",
                                border: isSelected 
                                  ? "1.5px solid var(--neon-purple)" 
                                  : "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "var(--border-radius-sm)",
                                padding: "10px 12px",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                transition: "all 0.2s ease",
                                boxShadow: isSelected ? "0 0 10px rgba(139, 92, 246, 0.25)" : "none",
                              }}
                            >
                              {/* Main row: Avatar, Name, PIN, Target */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                {/* Left side: Avatar + Name + Target */}
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                                  {p.photo && p.photo !== "skipped" ? (
                                    <img src={p.photo} alt={p.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                                  ) : (
                                    <img src={defaultAvatar} alt={p.name} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                                  )}
                                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                      <strong style={{ fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>{p.name}</strong>
                                      {p.isZombie && (
                                        <span style={{
                                          fontSize: "8.5px",
                                          fontWeight: "900",
                                          backgroundColor: "rgba(16, 185, 129, 0.15)",
                                          color: "var(--neon-green)",
                                          border: "1px solid rgba(16, 185, 129, 0.4)",
                                          borderRadius: "4px",
                                          padding: "1px 4px",
                                          textTransform: "uppercase"
                                        }}>Zombie</span>
                                      )}
                                      {!p.target && (
                                        <span style={{
                                          fontSize: "8.5px",
                                          fontWeight: "900",
                                          backgroundColor: "rgba(59, 130, 246, 0.15)",
                                          color: "var(--neon-blue)",
                                          border: "1px solid rgba(59, 130, 246, 0.4)",
                                          borderRadius: "4px",
                                          padding: "1px 4px",
                                          textTransform: "uppercase"
                                        }}>Gelé</span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                      Cible : <strong style={{ color: "var(--neon-red)" }}>{p.target || "Aucune"}</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Right side: PIN */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1px", flexShrink: 0 }}>
                                  <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "0.05em" }}>PIN</span>
                                  <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-muted)" }}>{p.pin}</span>
                                </div>
                              </div>

                              {/* Sub-pane: Current Mission Details */}
                              {(() => {
                                const action = (gameState.actionPool || DEFAULT_ACTIONS).find(a => a.id === p.actionId);
                                return (
                                  <div 
                                    style={{ 
                                      borderTop: "1px solid rgba(255,255,255,0.06)", 
                                      paddingTop: "6px", 
                                      marginTop: "2px", 
                                      width: "100%", 
                                      display: "flex", 
                                      flexDirection: "column", 
                                      gap: "2px" 
                                    }}
                                  >
                                    <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--neon-gold)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                      Mission active :
                                    </span>
                                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.35" }}>
                                      {action ? (
                                        <>
                                          <strong>{action.title}</strong> — {action.description}
                                        </>
                                      ) : (
                                        "Aucune mission"
                                      )}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons rendered outside the glass-card */}
              {!gameState.started ? (
                <div className="launch-game-btn-container" style={{ marginTop: 16, width: "100%" }}>
                  <button onClick={handleStartGame} className="launch-game-btn" style={{ width: "100%" }}>
                    <Play size={20} fill="#121214" /> LANCER LA PARTIE 🚀
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowResetConfirmStep(1)} 
                  className="reset-game-btn" 
                  style={{ width: "100%", marginTop: 16 }}
                >
                  ⚠️ ARRÊTER / RÉINITIALISER LA PARTIE
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- 3. RULES POOL TAB (FUSION DÉFIS & FONTAINE GM) --- */}
        {gmTab === "actions" && (
          <div className="rules-gm-screen-layout">
            <div className="view-scroll-content">
              <div className="glass-card-gold" style={{ width: "100%" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-gold)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
                  GESTION DES RÈGLES
                </h2>

                {/* Switch 3 Sous-onglets */}
                <div style={{
                  display: "flex",
                  backgroundColor: "rgba(10, 10, 14, 0.6)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "2px",
                  marginBottom: "16px",
                  border: "1px solid rgba(245, 158, 11, 0.2)"
                }}>
                  <button
                    onClick={() => {
                      setActiveRulesSubtab("defis");
                      cancelEditAction();
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: activeRulesSubtab === "defis" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                      color: activeRulesSubtab === "defis" ? "#ffffff" : "var(--text-muted)",
                      border: activeRulesSubtab === "defis" ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid transparent",
                      boxShadow: activeRulesSubtab === "defis" ? "0 0 8px rgba(245, 158, 11, 0.4)" : "none",
                      borderRadius: "4px",
                      padding: "8px 4px",
                      fontSize: "11px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    <Zap size={13} />
                    Défis
                  </button>
                  <button
                    onClick={() => {
                      setActiveRulesSubtab("actions");
                      cancelEditFountainChallenge();
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: activeRulesSubtab === "actions" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                      color: activeRulesSubtab === "actions" ? "#ffffff" : "var(--text-muted)",
                      border: activeRulesSubtab === "actions" ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid transparent",
                      boxShadow: activeRulesSubtab === "actions" ? "0 0 8px rgba(245, 158, 11, 0.4)" : "none",
                      borderRadius: "4px",
                      padding: "8px 4px",
                      fontSize: "11px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    <Droplet size={13} />
                    Actions
                  </button>
                  <button
                    onClick={() => {
                      setActiveRulesSubtab("verites");
                      cancelEditFountainChallenge();
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: activeRulesSubtab === "verites" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                      color: activeRulesSubtab === "verites" ? "#ffffff" : "var(--text-muted)",
                      border: activeRulesSubtab === "verites" ? "1px solid rgba(245, 158, 11, 0.7)" : "1px solid transparent",
                      boxShadow: activeRulesSubtab === "verites" ? "0 0 8px rgba(245, 158, 11, 0.4)" : "none",
                      borderRadius: "4px",
                      padding: "8px 4px",
                      fontSize: "11px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s"
                    }}
                  >
                    <FileText size={13} />
                    Vérités
                  </button>
                </div>

                {/* Rendu dynamique du sous-onglet sélectionné */}
                {activeRulesSubtab === "defis" ? (
                  <>
                    {/* Formulaire Défis Classiques */}
                    <div className="admin-card direct-action-card" style={{ borderColor: "rgba(245, 158, 11, 0.2)", backgroundColor: "rgba(24, 24, 31, 0.5)" }}>
                      <h3 style={{ color: "var(--neon-gold)", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>
                        {editingActionId !== null ? "✏️ Modifier le défi" : "Créer un défi personnalisé"}
                      </h3>
                      <form onSubmit={handleAddActionDirectly} className="direct-action-form" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Titre du défi :
                          <input
                            type="text"
                            placeholder="Ex: Le Vol de Tente..."
                            value={actTitle}
                            onChange={(e) => setSugTitle ? setActTitle(e.target.value) : setActTitle(e.target.value)}
                            className="neon-input-premium"
                            required
                            style={{ textAlign: "left" }}
                          />
                        </label>
                        
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Description de la mission :
                          <textarea
                            placeholder="Description claire de la mission secrète..."
                            value={actDesc}
                            onChange={(e) => setActDesc(e.target.value)}
                            className="neon-input-premium"
                            style={{ height: 75, resize: "none", textAlign: "left" }}
                            required
                          />
                        </label>

                        <div className="direct-action-row" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ display: "flex", gap: 12 }}>
                            <label className="sug-diff-lbl" style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Points :
                              <input
                                type="number"
                                min="0"
                                value={actPoints}
                                onChange={(e) => setActPoints(Number(e.target.value))}
                                className="neon-input-premium"
                                style={{ textAlign: "left" }}
                                required
                              />
                            </label>
                            <label className="sug-diff-lbl" style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Cœurs perdus :
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max="7"
                                value={actDamage}
                                onChange={(e) => setActDamage(Number(e.target.value))}
                                className="neon-input-premium"
                                style={{ textAlign: "left" }}
                                required
                              />
                            </label>
                          </div>

                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12, width: "100%", alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button 
                                type="submit" 
                                style={{
                                  backgroundColor: "var(--neon-gold)",
                                  color: "#121214",
                                  border: "none",
                                  borderRadius: "var(--border-radius-sm)",
                                  padding: "8px 12px",
                                  fontSize: "12px",
                                  fontWeight: "800",
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

                    {/* Liste des Défis Classiques */}
                    <h3 style={{ marginTop: 20, marginBottom: "12px", color: "var(--neon-gold)", fontSize: "14px", fontWeight: "800", textTransform: "uppercase" }}>
                      Défis Actifs ({gameState.actionPool?.length || 0})
                    </h3>
                    <div className="actions-list-container" style={{ maxHeight: "400px" }}>
                      {["micro", "standard", "majeur", "legendaire"].map((category) => {
                        const list = (gameState.actionPool || DEFAULT_ACTIONS).filter((a) => a.difficulty === category);
                        return (
                          <div key={category} className="action-category-group">
                            <h4 className={`cat-title-${category}`} style={{ fontSize: "12px", fontWeight: "800", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px", marginBottom: "8px" }}>
                              {category.toUpperCase()} ({list.length} actions)
                            </h4>
                            <div className="actions-scroll-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {list.map((act) => (
                                <SwipeToDeleteItem
                                  key={act.id}
                                  onDelete={() => setDeletingActionId(act.id)}
                                  onClick={() => startEditAction(act)}
                                  isSelected={editingActionId === act.id}
                                  revealOnSelect={false}
                                  isConfirming={deletingActionId === act.id}
                                >
                                  <div 
                                    className={`action-item-mini ${editingActionId === act.id ? "editing-highlight" : ""}`}
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "2px",
                                      cursor: "grab",
                                      background: editingActionId === act.id
                                        ? "rgba(139, 92, 246, 0.22)"
                                        : "rgba(20, 20, 25, 0.95)",
                                      border: editingActionId === act.id
                                        ? "1.5px solid var(--neon-purple)"
                                        : "1px solid transparent",
                                      boxShadow: editingActionId === act.id ? "0 0 10px rgba(139, 92, 246, 0.25)" : "none",
                                      borderRadius: "var(--border-radius-sm)",
                                      width: "100%",
                                      transition: "all 0.2s ease"
                                    }}
                                  >
                                    <div className="action-mini-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span className="action-mini-title" style={{ fontWeight: "700" }}>{act.title}</span>
                                      <span className="action-mini-rewards">+{act.points} pts / -{act.damage} HP</span>
                                    </div>
                                    <p className="action-mini-desc" style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 2px 0", lineHeight: "1.3" }}>{act.description}</p>
                                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                                      <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>◀ Supprimer</span>
                                    </div>
                                  </div>
                                </SwipeToDeleteItem>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Formulaire Fontaine (Actions ou Vérités) */}
                    <div className="admin-card direct-action-card" style={{ borderColor: "rgba(245, 158, 11, 0.2)", backgroundColor: "rgba(24, 24, 31, 0.5)" }}>
                      <h3 style={{ color: "var(--neon-gold)", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", marginBottom: "12px" }}>
                        {editingFountainId !== null 
                          ? (activeRulesSubtab === "actions" ? "✏️ Modifier l'action" : "✏️ Modifier la vérité") 
                          : (activeRulesSubtab === "actions" ? "Créer une action Fontaine" : "Créer une vérité Fontaine")}
                      </h3>
                      <form onSubmit={handleAddOrEditFountainChallenge} className="direct-action-form" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {activeRulesSubtab === "actions" ? "Action :" : "Question :"}
                          <textarea
                            value={fountainTitle}
                            onChange={(e) => setFountainTitle(e.target.value)}
                            required
                            placeholder={activeRulesSubtab === "actions" ? "Saisir l'action de la fontaine..." : "Saisir la question de la fontaine..."}
                            className="neon-input-premium"
                            style={{ height: 75, resize: "none", textAlign: "left", paddingTop: "8px" }}
                          />
                        </label>

                        <div className="direct-action-row" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <label className="sug-diff-lbl" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12px", fontWeight: "800", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Difficulté :
                            <select
                              value={fountainDiff}
                              onChange={(e) => setFountainDiff(e.target.value)}
                              className="neon-input-premium"
                              style={{ textAlign: "left" }}
                            >
                              <option value="facile">Facile (Tier 1)</option>
                              <option value="moyen">Moyen (Tier 2)</option>
                              <option value="difficile">Difficile (Tier 3)</option>
                            </select>
                          </label>

                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                            <button
                              type="submit"
                              disabled={loadingFountain}
                              style={{
                                backgroundColor: "var(--neon-gold)",
                                color: "#121214",
                                border: "none",
                                borderRadius: "var(--border-radius-sm)",
                                padding: "8px 12px",
                                fontSize: "12px",
                                fontWeight: "800",
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
                              <Plus size={16} /> {loadingFountain ? "Enregistrement..." : (editingFountainId !== null ? "Enregistrer" : "Ajouter à la Pool")}
                            </button>
                            {editingFountainId !== null && (
                              <button
                                type="button"
                                onClick={cancelEditFountainChallenge}
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
                      </form>
                    </div>
                                     {/* Liste des Défis Fontaine */}
                    <h3 style={{ marginTop: 24, marginBottom: 12, color: "var(--neon-gold)", fontSize: "14px", fontWeight: "800", textTransform: "uppercase" }}>
                      {activeRulesSubtab === "actions" ? "ACTIONS" : "VERITES"}
                    </h3>
                    <div className="actions-list-container" style={{ maxHeight: "400px" }}>
                      {["facile", "moyen", "difficile"].map((diff) => {
                        const currentType = activeRulesSubtab === "actions" ? "action" : "verite";
                        const items = fountainPool.filter(c => c.type === currentType && c.difficulty === diff);
                        return (
                          <div key={diff} className="action-category-group" style={{ marginBottom: "16px" }}>
                            <h4 style={{
                              fontSize: "12px",
                              fontWeight: "900",
                              textTransform: "uppercase",
                              color: diff === "facile" ? "var(--neon-green)" : diff === "moyen" ? "var(--neon-blue)" : "var(--neon-gold)",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                              paddingBottom: "4px",
                              marginBottom: "8px"
                            }}>
                              {diff === "facile" ? "Facile (Tier 1)" : diff === "moyen" ? "Moyen (Tier 2)" : "Difficile (Tier 3)"} ({items.length})
                            </h4>

                            {items.length === 0 ? (
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", padding: "4px 8px" }}>
                                Aucun élément de cette difficulté.
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {items.map((item) => {
                                  const isSelected = editingFountainId === item.id;
                                  return (
                                    <SwipeToDeleteItem
                                      key={item.id}
                                      onDelete={() => setDeletingFountainId(item.id)}
                                      onClick={() => startEditFountainChallenge(item)}
                                      isSelected={isSelected}
                                      revealOnSelect={false}
                                      isConfirming={deletingFountainId === item.id}
                                    >
                                      <div
                                        className={`action-item-mini ${isSelected ? "editing-highlight" : ""}`}
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "2px",
                                          cursor: "grab",
                                          background: isSelected 
                                            ? "rgba(139, 92, 246, 0.22)" 
                                            : "rgba(20, 20, 25, 0.95)",
                                          border: isSelected 
                                            ? "1.5px solid var(--neon-purple)" 
                                            : "1px solid transparent",
                                          boxShadow: isSelected ? "0 0 10px rgba(139, 92, 246, 0.25)" : "none",
                                          borderRadius: "var(--border-radius-sm)",
                                          width: "100%",
                                          transition: "all 0.2s ease"
                                        }}
                                      >
                                        <div className="action-mini-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                                          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.4" }}>{item.title || item.description}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                                          <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>◀ Supprimer</span>
                                        </div>
                                      </div>
                                    </SwipeToDeleteItem>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Pop-up de confirmation de suppression unifiée pour le GM */}
            <AnimatePresence>
              {(deletingActionId || deletingFountainId) && (
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
                    <h3 className="confirm-modal-title-v2" style={{ color: "var(--neon-red)", textTransform: "uppercase" }}>
                      {deletingActionId ? "Supprimer le défi ?" : "Supprimer le défi Fontaine ?"}
                    </h3>
                    <p className="confirm-modal-body-v2">
                      {deletingActionId 
                        ? "Es-tu sûr de vouloir supprimer définitivement ce défi de la pool active ?"
                        : "Es-tu sûr de vouloir supprimer définitivement ce défi du pool de la fontaine ?"}
                    </p>

                    <div className="confirm-action-btns-v2">
                      <button
                        className="confirm-btn-primary-v2"
                        style={{ backgroundColor: "var(--neon-red)", color: "#fff" }}
                        onClick={() => {
                          if (deletingActionId) {
                            deleteAction(deletingActionId);
                            setDeletingActionId(null);
                            showToast("Défi supprimé avec succès !", "danger");
                          } else {
                            handleDeleteFountainChallenge(deletingFountainId);
                          }
                        }}
                      >
                        Supprimer
                      </button>
                      <button 
                        className="confirm-btn-cancel-v2" 
                        onClick={() => {
                          setDeletingActionId(null);
                          setDeletingFountainId(null);
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
        )}

        {/* --- 4. HISTORY TAB --- */}
        {gmTab === "history" && (
          <div className="auth-screen-layout">
            <div className="view-scroll-content">
              <div className="glass-card" style={{ width: "100%" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-purple)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
                  FIL D'ACTUALITÉ
                </h2>
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
            </div>
          </div>
        )}

        {/* --- 5. QR CODE TAB --- */}
        {gmTab === "qrcode" && (
          <div className="qrcode-screen-layout" style={{ height: "100%" }}>
            <div className="view-scroll-content" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="glass-card" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-purple)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
                  REJOINDRE LE SALON
                </h2>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, padding: "8px 0", width: "100%", flex: 1, justifyContent: "center" }}>
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
    </>
  );
}
