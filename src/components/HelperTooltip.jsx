import React from "react";
import { motion } from "framer-motion";

export default function HelperTooltip({ text, position = "top", onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: position === "top" ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={`absolute-helper-tooltip position-${position}`}
      style={{
        position: "absolute",
        [position === "top" ? "bottom" : "top"]: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(18, 18, 22, 0.98)",
        border: "1px solid var(--neon-gold)",
        boxShadow: "0 0 10px rgba(245, 158, 11, 0.3)",
        borderRadius: "var(--border-radius-sm)",
        padding: "8px 12px",
        zIndex: 100,
        width: "max-content",
        maxWidth: "180px",
        fontSize: "11px",
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
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderStyle: "solid",
          [position === "top" ? "top" : "bottom"]: "100%",
          borderWidth: position === "top" ? "6px 6px 0 6px" : "0 6px 6px 6px",
          borderColor: position === "top" 
            ? "var(--neon-gold) transparent transparent transparent" 
            : "transparent transparent var(--neon-gold) transparent"
        }}
      />
    </motion.div>
  );
}
