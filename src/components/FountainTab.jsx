import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, RefreshCw, Check, Sparkles, AlertCircle, Skull, Heart } from "lucide-react";
import HelperTooltip from "./HelperTooltip";
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
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const player = gameState.players.find((p) => p.name === playerName);

  React.useEffect(() => {
    if (player?.fountainActiveType) {
      setSelectedType(player.fountainActiveType);
    }
  }, [player?.fountainActiveType]);

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
  
  const isFullHealth = player.lives >= 7.0;
  const isFountainDisabled = player.isZombie || isFullHealth || usesLeft <= 0;
  
  // Fontaine active si non zombie, non full lives et utilisations restantes (peu importe si défi en cours ou non)
  const isFountainActive = !player.isZombie && !isFullHealth && usesLeft > 0;

  const handleDraw = async () => {
    if (isFountainDisabled) return;
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

  const handleFountainClick = async () => {
    if (!isFountainActive) return;
    if (hasActiveChallenge) {
      setIsRevealed(true);
    } else {
      await handleDraw();
      setIsRevealed(true);
    }
  };

  const handleSkip = async () => {
    if (player.isZombie || isFullHealth || refreshesLeft <= 0) return;
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
    if (player.isZombie || isFullHealth) return;
    setLoadingAction(true);
    setErrorMsg("");
    try {
      await confirmFountainChallenge(playerName);
      setIsRevealed(false); // Masquer à nouveau après validation
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || "Erreur lors de la validation.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="glass-card-blue animate-fade-in" style={{ height: "100%" }}>
      <div className="view-scroll-content" style={{ height: "100%", display: "flex", flexDirection: "column", paddingBottom: "10px", justifyContent: "space-between" }}>
        
        {/* 1. Titre de l'écran en premier */}
        <div style={{ textAlign: "center", marginBottom: "4px", flexShrink: 0 }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-blue)", textTransform: "uppercase", margin: 0 }}>
            Fontaine de Vie
          </h2>
        </div>

        {/* 2. Courte description de l'écran */}
        <p style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          textAlign: "center",
          margin: "0 auto 12px auto",
          maxWidth: "320px",
          lineHeight: "1.4",
          flexShrink: 0
        }}>
          Buvez à la source sacrée pour soigner vos blessures de combat en accomplissant des actions ou en révélant des vérités.
        </p>

        {player.isZombie && (
          <div style={{
            background: "rgba(255, 51, 102, 0.15)",
            border: "1px solid var(--neon-red)",
            borderRadius: "var(--border-radius-sm)",
            padding: "8px 12px",
            color: "var(--neon-red)",
            fontSize: "12px",
            fontWeight: "bold",
            textAlign: "center",
            margin: "0 auto 12px auto",
            maxWidth: "300px",
            flexShrink: 0
          }}>
            💀 ACCÈS REFUSÉ : Les Zombies ne peuvent pas boire à la Fontaine. Pas de résurrection possible.
          </div>
        )}

        {!player.isZombie && isFullHealth && (
          <div style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid var(--neon-green)",
            borderRadius: "var(--border-radius-sm)",
            padding: "8px 12px",
            color: "var(--neon-green)",
            fontSize: "12px",
            fontWeight: "bold",
            textAlign: "center",
            margin: "0 auto 12px auto",
            maxWidth: "300px",
            flexShrink: 0
          }}>
            💖 VITALITÉ MAXIMALE : Vous êtes déjà au maximum de vos points de vie (7.0 ❤️).
          </div>
        )}

        {/* 3. Switch sous forme de boutons-poussoirs individuels */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100%", flexShrink: 0, marginBottom: "14px" }}>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", width: "100%" }}>
            <button
              onClick={() => setSelectedType("action")}
              disabled={isFountainDisabled || hasActiveChallenge}
              style={{
                flex: 1,
                backgroundColor: selectedType === "action" ? "rgba(59, 130, 246, 0.25)" : "rgba(255, 255, 255, 0.02)",
                border: selectedType === "action" ? "1.5px solid var(--neon-blue)" : "1px solid var(--border-color)",
                color: selectedType === "action" ? "#ffffff" : "var(--text-muted)",
                borderRadius: "var(--border-radius-sm)",
                padding: "8px 12px",
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
                cursor: (isFountainDisabled || hasActiveChallenge) ? "default" : "pointer",
                boxShadow: selectedType === "action" ? "0 0 10px rgba(59, 130, 246, 0.3)" : "none",
                transition: "all 0.2s"
              }}
            >
              Action
            </button>
            <button
              onClick={() => setSelectedType("verite")}
              disabled={isFountainDisabled || hasActiveChallenge}
              style={{
                flex: 1,
                backgroundColor: selectedType === "verite" ? "rgba(59, 130, 246, 0.25)" : "rgba(255, 255, 255, 0.02)",
                border: selectedType === "verite" ? "1.5px solid var(--neon-blue)" : "1px solid var(--border-color)",
                color: selectedType === "verite" ? "#ffffff" : "var(--text-muted)",
                borderRadius: "var(--border-radius-sm)",
                padding: "8px 12px",
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
                cursor: (isFountainDisabled || hasActiveChallenge) ? "default" : "pointer",
                boxShadow: selectedType === "verite" ? "0 0 10px rgba(59, 130, 246, 0.3)" : "none",
                transition: "all 0.2s"
              }}
            >
              Vérité
            </button>
          </div>
          {/* Ligne 2 : Gain joint */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            fontSize: "11px",
            fontWeight: "800",
            color: "var(--text-secondary)",
            marginTop: "2px"
          }}>
            <span>Le Gain : +0.5</span>
            <Heart size={12} fill="var(--neon-red)" style={{ color: "var(--neon-red)", display: "inline-block" }} />
          </div>
        </div>

        {/* 4. Fontaine et Compteurs à gauche */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          position: "relative",
          width: "100%",
          maxWidth: "280px",
          margin: "0 auto",
          flex: 1,
          minHeight: 0
        }}>
          {/* Colonne gauche de compteurs à hauteur du sommet du prop */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            position: "absolute",
            left: "10px",
            top: "10px",
            zIndex: 10
          }}>
            {/* Soins restants */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveTooltip(activeTooltip === "uses" ? null : "uses");
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                background: "rgba(16, 185, 129, 0.08)",
                border: "2px solid var(--neon-gold)",
                borderRadius: "var(--border-radius-sm)",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 0 5px rgba(245, 158, 11, 0.2)",
                boxSizing: "border-box"
              }}
            >
              <Heart size={13} fill="var(--neon-gold)" style={{ color: "var(--neon-gold)", display: "block" }} />
              <span style={{ fontSize: "11px", fontWeight: "900", color: "#ffffff", lineHeight: 1 }}>{usesLeft}</span>
              <AnimatePresence>
                {activeTooltip === "uses" && (
                  <HelperTooltip
                    text={`Utilisations restantes : Il vous reste ${usesLeft} soin(s) disponible(s) aujourd'hui.`}
                    position="right"
                    align="left"
                    onClose={() => setActiveTooltip(null)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Relances restantes */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveTooltip(activeTooltip === "refreshes" ? null : "refreshes");
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                background: "rgba(245, 158, 11, 0.08)",
                border: "2px solid var(--neon-gold)",
                borderRadius: "var(--border-radius-sm)",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 0 5px rgba(245, 158, 11, 0.2)",
                boxSizing: "border-box"
              }}
            >
              <RefreshCw size={13} style={{ color: "var(--neon-gold)", display: "block" }} />
              <span style={{ fontSize: "11px", fontWeight: "900", color: "#ffffff", lineHeight: 1 }}>{refreshesLeft}</span>
              <AnimatePresence>
                {activeTooltip === "refreshes" && (
                  <HelperTooltip
                    text={`Relances restantes : Il vous reste ${refreshesLeft} relance(s) disponible(s) aujourd'hui.`}
                    position="right"
                    align="left"
                    onClose={() => setActiveTooltip(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Prop Fontaine avec Tier au-dessus */}
          <div
            onClick={handleFountainClick}
            style={{
              cursor: isFountainActive ? "pointer" : "default",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <span style={{ fontSize: "10px", color: tierColor, fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              {tierLabel} (Défi {difficulty})
            </span>
            <motion.img
              src={fountainImg}
              alt="Fontaine de Vie"
              animate={
                isFountainActive
                  ? {
                      y: [0, -6, 0],
                      filter: [
                        "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))",
                        "drop-shadow(0 0 16px rgba(59, 130, 246, 0.7))",
                        "drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))"
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
                width: "150px",
                height: "auto",
                objectFit: "contain",
                filter: isFountainActive ? "none" : "grayscale(100%) opacity(0.4)",
                transition: "filter 0.5s ease"
              }}
            />
          </div>
        </div>

        {/* 5. Espace interactif sous la fontaine */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: "60px", marginTop: "10px" }}>
          <AnimatePresence mode="wait">
            {!isRevealed || !hasActiveChallenge ? (
              <motion.div
                key="reveal-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleFountainClick}
                style={{
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  cursor: isFountainActive ? "pointer" : "default",
                  textAlign: "center"
                }}
              >
                BOIRE LA SOURCE POUR RÉVÉLER
              </motion.div>
            ) : (
              <motion.div
                key="challenge-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  background: "linear-gradient(135deg, rgba(20, 20, 28, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)",
                  border: "1px solid rgba(59, 130, 246, 0.45)",
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.25)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  textAlign: "center"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "900", color: "#ffffff", margin: 0, lineHeight: "1.4" }}>
                    « {player.fountainActiveTitle || player.fountainActiveDescription} »
                  </h3>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                  <button
                    onClick={handleSkip}
                    disabled={refreshesLeft <= 0 || loadingAction}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      borderRadius: "var(--border-radius-sm)",
                      color: refreshesLeft > 0 ? "var(--neon-gold)" : "var(--text-muted)",
                      padding: "8px",
                      fontSize: "11px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: refreshesLeft > 0 ? "pointer" : "default",
                      transition: "all 0.2s",
                      opacity: refreshesLeft > 0 ? 1 : 0.4
                    }}
                  >
                    <RefreshCw size={12} className={loadingAction ? "animate-spin" : ""} />
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
                      gap: "4px",
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid rgba(16, 185, 129, 0.6)",
                      borderRadius: "var(--border-radius-sm)",
                      color: "#ffffff",
                      boxShadow: "0 0 10px rgba(16, 185, 129, 0.2)",
                      padding: "8px",
                      fontSize: "11px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Check size={12} />
                    Accepter
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 6. Message d'erreur s'il y a lieu */}
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
            marginTop: "6px",
            flexShrink: 0
          }}>
            <AlertCircle size={12} />
            {errorMsg}
          </div>
        )}

      </div>

      {/* Success Modal popup */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="confirm-modal-backdrop-v2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 12000 }}
          >
            <motion.div
              className="confirm-modal-v2"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ borderColor: "rgba(16, 185, 129, 0.4)", boxShadow: "0 0 20px rgba(16, 185, 129, 0.25)" }}
            >
              <h3 className="confirm-modal-title-v2" style={{ color: "var(--neon-green)" }}>Soin Reçu ! 💖</h3>
              <p className="confirm-modal-body-v2">
                Félicitations ! Vous venez de récupérer <strong style={{ color: "var(--neon-red)" }}>+0.5 cœur</strong>.
              </p>
              <button
                className="confirm-btn-primary-v2"
                style={{ backgroundColor: "var(--neon-green)", color: "#121214", width: "100%", marginTop: "10px" }}
                onClick={() => setShowSuccessModal(false)}
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
