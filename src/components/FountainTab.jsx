import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, RefreshCw, Check, Sparkles, AlertCircle, Skull } from "lucide-react";
import fountainTier1 from "../assets/fountain_tier1.png";
import fountainTier2 from "../assets/fountain_tier2.png";
import fountainTier3 from "../assets/fountain_tier3.png";
import heartImage from "../assets/heart_neon.png";
import tokenImage from "../assets/token_neon.png";

export default function FountainTab({ playerName }) {
  const { gameState, drawFountainChallenge, skipFountainChallenge, confirmFountainChallenge } = useGame();
  const [selectedType, setSelectedType] = useState("action"); // 'action' or 'verite'
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const player = gameState.players.find((p) => p.name === playerName);
  if (!player) return null;

  // Calcul du palier
  const totalUses = player.fountainTotalUses || 0;
  let fountainImg = fountainTier1;
  let tierLabel = "Tier I - Source Timide";
  let difficulty = "Facile";
  let tierColor = "var(--neon-green)";

  if (totalUses >= 3 && totalUses <= 4) {
    fountainImg = fountainTier2;
    tierLabel = "Tier II - Source Éveillée";
    difficulty = "Moyen";
    tierColor = "var(--neon-blue)";
  } else if (totalUses >= 5) {
    fountainImg = fountainTier3;
    tierLabel = "Tier III - Source Sacrée";
    difficulty = "Difficile";
    tierColor = "var(--neon-gold)";
  }

  const usesLeft = Math.max(0, 2 - (player.fountainUsesToday || 0));
  const refreshesLeft = Math.max(0, 3 - (player.fountainRefreshesToday || 0));
  const hasActiveChallenge = !!player.fountainActiveTitle;
  const isFountainActive = usesLeft > 0 && !hasActiveChallenge;

  const handleDraw = async () => {
    if (player.isZombie || !isFountainActive) return;
    setLoadingAction(true);
    setErrorMsg("");
    try {
      await drawFountainChallenge(playerName, selectedType);
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de la pioche.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSkip = async () => {
    if (player.isZombie || refreshesLeft <= 0) return;
    setLoadingAction(true);
    setErrorMsg("");
    try {
      await skipFountainChallenge(playerName);
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors du rafraîchissement.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirm = async () => {
    if (player.isZombie) return;
    setLoadingAction(true);
    setErrorMsg("");
    try {
      await confirmFountainChallenge(playerName);
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de la validation.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fountain-screen-layout" style={{ height: "100%" }}>
      <div className="view-scroll-content" style={{ height: "100%", display: "flex", flexDirection: "column", paddingBottom: "10px" }}>
        
        {/* En-tête / Stats */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          width: "100%",
          flexShrink: 0
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "var(--border-radius-sm)",
            padding: "4px 8px",
            fontSize: "10.5px",
            fontWeight: "800",
            color: "#ffffff"
          }}>
            <img src={heartImage} alt="Heal" style={{ width: "12px", height: "12px", objectFit: "contain" }} />
            <span>Soins : {usesLeft} / 2</span>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "var(--border-radius-sm)",
            padding: "4px 8px",
            fontSize: "10.5px",
            fontWeight: "800",
            color: "#ffffff"
          }}>
            <img src={tokenImage} alt="Refresh" style={{ width: "12px", height: "12px", objectFit: "contain" }} />
            <span>Relances : {refreshesLeft} / 3</span>
          </div>
        </div>

        {/* Titre standardisé */}
        <div style={{ textAlign: "center", marginBottom: "14px", flexShrink: 0 }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-blue)", textTransform: "uppercase", margin: 0 }}>
            Fontaine de Vie
          </h2>
          <span style={{ fontSize: "10px", color: tierColor, fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {tierLabel} (Défi {difficulty})
          </span>
        </div>

        {/* Sélecteur de type (Action / Vérité) ou Message d'exclusion Zombie */}
        {player.isZombie ? (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px 20px",
            border: "1px solid rgba(255, 51, 102, 0.4)",
            background: "linear-gradient(135deg, rgba(255, 51, 102, 0.03) 0%, rgba(20, 10, 12, 0.95) 100%)",
            boxShadow: "0 0 20px rgba(255, 51, 102, 0.15)",
            borderRadius: "var(--border-radius-sm)",
            gap: "18px",
            margin: "20px 0"
          }}>
            <Skull size={54} style={{ color: "var(--neon-red)", filter: "drop-shadow(0 0 8px rgba(255, 51, 102, 0.5))" }} className="animate-pulse" />
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "900", color: "var(--neon-red)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px 0" }}>
                Accès Refusé
              </h3>
              <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Statut Zombie Actif
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0, maxWidth: "230px" }}>
              La Fontaine de Vie refuse de soigner les morts-vivants. Votre âme appartient au camp des morts.
            </p>
          </div>
        ) : (
          <>
            {!hasActiveChallenge && (
              <div style={{
                display: "flex",
                backgroundColor: "rgba(10, 10, 14, 0.6)",
                backdropFilter: "blur(8px)",
                borderRadius: "var(--border-radius-sm)",
                padding: "2px",
                marginBottom: "14px",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                flexShrink: 0
              }}>
                <button
                  onClick={() => setSelectedType("action")}
                  disabled={usesLeft <= 0}
                  style={{
                    flex: 1,
                    backgroundColor: selectedType === "action" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                    color: selectedType === "action" ? "#ffffff" : "var(--text-muted)",
                    border: selectedType === "action" ? "1px solid rgba(59, 130, 246, 0.6)" : "1px solid transparent",
                    boxShadow: selectedType === "action" ? "0 0 8px rgba(59, 130, 246, 0.3)" : "none",
                    borderRadius: "4px",
                    padding: "6px 4px",
                    fontSize: "10.5px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: usesLeft <= 0 ? 0.5 : 1
                  }}
                >
                  Action
                </button>
                <button
                  onClick={() => setSelectedType("verite")}
                  disabled={usesLeft <= 0}
                  style={{
                    flex: 1,
                    backgroundColor: selectedType === "verite" ? "rgba(59, 130, 246, 0.25)" : "transparent",
                    color: selectedType === "verite" ? "#ffffff" : "var(--text-muted)",
                    border: selectedType === "verite" ? "1px solid rgba(59, 130, 246, 0.6)" : "1px solid transparent",
                    boxShadow: selectedType === "verite" ? "0 0 8px rgba(59, 130, 246, 0.3)" : "none",
                    borderRadius: "4px",
                    padding: "6px 4px",
                    fontSize: "10.5px",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: usesLeft <= 0 ? 0.5 : 1
                  }}
                >
                  Vérité
                </button>
              </div>
            )}

            {/* Section Interactive: Fontaine */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
              position: "relative",
              margin: "10px 0"
            }}>
              <AnimatePresence mode="wait">
                {!hasActiveChallenge ? (
                  <motion.div
                    key="fountain"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={handleDraw}
                    style={{
                      cursor: isFountainActive ? "pointer" : "default",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative"
                    }}
                  >
                    <motion.img
                      src={fountainImg}
                      alt="Fontaine de Vie"
                      animate={
                        isFountainActive
                          ? {
                              y: [0, -8, 0],
                              filter: [
                                "drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))",
                                "drop-shadow(0 0 20px rgba(59, 130, 246, 0.7))",
                                "drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))"
                              ]
                            }
                          : {}
                      }
                      transition={
                        isFountainActive
                          ? {
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }
                          : {}
                      }
                      style={{
                        width: "100%",
                        maxWidth: "200px",
                        height: "auto",
                        objectFit: "contain",
                        filter: isFountainActive ? "none" : "grayscale(100%) opacity(0.4)",
                        transition: "filter 0.5s ease"
                      }}
                    />

                    {isFountainActive ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                          marginTop: "12px",
                          fontSize: "11px",
                          color: "var(--neon-blue)",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <Sparkles size={12} className="animate-pulse" />
                        Appuyez pour puiser la source
                      </motion.div>
                    ) : (
                      <div style={{ marginTop: "12px", fontSize: "11.5px", color: "var(--text-muted)", fontWeight: "700", textAlign: "center", maxWidth: "220px" }}>
                        {usesLeft <= 0 
                          ? "La source s'est tarie pour aujourd'hui. Reviens demain !" 
                          : "Un défi est déjà en cours."}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  // Papyrus / Carte de défi actif
                  <motion.div
                    key="challenge"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                      width: "100%",
                      maxWidth: "300px",
                      background: "linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)",
                      border: "1px solid rgba(59, 130, 246, 0.45)",
                      boxShadow: "0 0 15px rgba(59, 130, 246, 0.25)",
                      borderRadius: "var(--border-radius-sm)",
                      padding: "16px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      textAlign: "center"
                    }}
                  >
                    {/* Badge Type */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span style={{
                        fontSize: "9px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        color: "var(--neon-blue)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        borderRadius: "4px",
                        padding: "2px 8px",
                        letterSpacing: "0.08em"
                      }}>
                        {player.fountainActiveType === "action" ? "Action Recommandée" : "Vérité à Révéler"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#ffffff", margin: 0 }}>
                        « {player.fountainActiveTitle} »
                      </h3>
                      <p style={{
                        fontSize: "12.5px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.4",
                        margin: 0,
                        padding: "8px 0",
                        borderTop: "1px dashed rgba(255,255,255,0.08)",
                        borderBottom: "1px dashed rgba(255,255,255,0.08)"
                      }}>
                        {player.fountainActiveDescription}
                      </p>
                    </div>

                    {/* Boutons d'interaction du défi */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={handleSkip}
                        disabled={refreshesLeft <= 0 || loadingAction}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          backgroundColor: "rgba(245, 158, 11, 0.1)",
                          border: "1px solid rgba(245, 158, 11, 0.3)",
                          borderRadius: "var(--border-radius-sm)",
                          color: refreshesLeft > 0 ? "var(--neon-gold)" : "var(--text-muted)",
                          padding: "10px",
                          fontSize: "12px",
                          fontWeight: "900",
                          textTransform: "uppercase",
                          cursor: refreshesLeft > 0 ? "pointer" : "default",
                          transition: "all 0.2s",
                          opacity: refreshesLeft > 0 ? 1 : 0.4
                        }}
                      >
                        <RefreshCw size={14} className={loadingAction ? "animate-spin" : ""} />
                        Passer ({refreshesLeft})
                      </button>

                      <button
                        onClick={handleConfirm}
                        disabled={loadingAction}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          backgroundColor: "rgba(16, 185, 129, 0.2)",
                          border: "1px solid rgba(16, 185, 129, 0.6)",
                          borderRadius: "var(--border-radius-sm)",
                          color: "#ffffff",
                          boxShadow: "0 0 10px rgba(16, 185, 129, 0.2)",
                          padding: "10px",
                          fontSize: "12px",
                          fontWeight: "900",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <Check size={14} />
                        Valider
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {errorMsg && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            justifyContent: "center",
            color: "var(--neon-red)",
            fontSize: "11px",
            fontWeight: "700",
            textAlign: "center",
            marginTop: "8px",
            flexShrink: 0
          }}>
            <AlertCircle size={12} />
            {errorMsg}
          </div>
        )}

      </div>
    </div>
  );
}
