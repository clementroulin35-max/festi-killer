import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";

export default function SwipeToDeleteItem({ 
  children, 
  onDelete, 
  onClick, 
  isSelected, 
  revealOnSelect = false,
  className = "" 
}) {
  const x = useMotionValue(0);

  // Le drag va de -80 à 0.
  // L'opacité va de 1 (à -60) à 0 (à -15)
  const opacity = useTransform(x, [-60, -15], [1, 0]);

  // Si revealOnSelect est vrai et que l'élément est sélectionné, on force la translation à -80
  React.useEffect(() => {
    if (revealOnSelect) {
      if (isSelected) {
        x.set(-80);
      } else {
        x.set(0);
      }
    }
  }, [isSelected, revealOnSelect, x]);

  return (
    <div style={{ position: "relative", overflow: "hidden", width: "100%", borderRadius: "var(--border-radius-sm)" }}>
      {/* Bouton de suppression dessous (sans fond ni bordure rouge) */}
      <motion.div 
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          opacity: (revealOnSelect && isSelected) ? 1 : opacity,
          pointerEvents: "auto"
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
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
          gap: "4px",
          cursor: "pointer"
        }}>
          <Trash2 size={14} />
          <span>Supprimer</span>
        </div>
      </motion.div>

      {/* Élément de premier plan */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        style={{ x, position: "relative", zIndex: 2 }}
        onDragEnd={(event, info) => {
          if (info.offset.x < -45) {
            onDelete();
          }
        }}
        onClick={onClick}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}
