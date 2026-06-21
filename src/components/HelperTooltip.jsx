import React from "react";
import { motion } from "framer-motion";

export default function HelperTooltip({ text, position = "top", align = "center", onClose, isZombie = false, noHalo = false }) {
  const neonColor = isZombie ? "var(--neon-red)" : "var(--neon-gold)";
  const glowColor = isZombie ? "rgba(255, 51, 102, 0.35)" : "rgba(245, 158, 11, 0.3)";

  // Styles dynamiques de positionnement horizontal
  const alignStyle = align === "left" 
    ? { left: 0 } 
    : align === "right" 
    ? { right: 0, left: "auto" } 
    : { left: "50%" };

  const arrowStyle = align === "left"
    ? { left: "20px", transform: "none" }
    : align === "right"
    ? { right: "20px", left: "auto", transform: "none" }
    : { left: "50%", transform: "translateX(-50%)" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: position === "top" ? 8 : -8, x: align === "center" ? "-50%" : 0 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: align === "center" ? "-50%" : 0 }}
      exit={{ opacity: 0, scale: 0.9, x: align === "center" ? "-50%" : 0 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={`absolute-helper-tooltip position-${position} align-${align}`}
      style={{
        position: "absolute",
        [position === "top" ? "bottom" : "top"]: "calc(100% + 8px)",
        ...alignStyle,
        backgroundColor: "rgba(18, 18, 22, 0.98)",
        border: `2px solid ${neonColor}`,
        boxShadow: noHalo ? "none" : `0 0 10px ${glowColor}`,
        borderRadius: "var(--border-radius-sm)",
        padding: "8px 12px",
        zIndex: 1000000,
        width: "max-content",
        maxWidth: "180px",
        fontSize: "11px",
        fontFamily: "var(--font-sans)",
        color: "#fff",
        lineHeight: "1.4",
        fontWeight: "600",
        textAlign: "center",
        cursor: "pointer",
        pointerEvents: "auto"
      }}
    >
      {text}
      <div 
        className="tooltip-arrow" 
        style={{
          position: "absolute",
          ...arrowStyle,
          width: 0,
          height: 0,
          borderStyle: "solid",
          [position === "top" ? "top" : "bottom"]: "100%",
          borderWidth: position === "top" ? "6px 6px 0 6px" : "0 6px 6px 6px",
          borderColor: position === "top" 
            ? `${neonColor} transparent transparent transparent` 
            : `transparent transparent ${neonColor}`
        }}
      />
    </motion.div>
  );
}

