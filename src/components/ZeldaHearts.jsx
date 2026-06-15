import React from "react";

export default function ZeldaHearts({ lives, maxLives = 7 }) {
  // Generate hearts list
  const hearts = [];
  for (let i = 0; i < maxLives; i++) {
    // Determine how much this specific heart is filled (0 to 1)
    const remaining = lives - i;
    let fillRatio = 0;
    if (remaining >= 1) {
      fillRatio = 1;
    } else if (remaining > 0) {
      fillRatio = Math.round(remaining * 4) / 4; // Round to nearest 0.25
    }
    hearts.push({ id: i, fillRatio });
  }

  return (
    <div className="hearts-container" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {hearts.map((heart) => {
        const percentage = heart.fillRatio * 100;
        const gradId = `heart-grad-${heart.id}-${percentage}`;

        return (
          <svg
            key={heart.id}
            width="28"
            height="28"
            viewBox="0 0 24 24"
            className="zelda-heart"
            style={{
              filter: heart.fillRatio > 0 ? "drop-shadow(0 0 4px rgba(239, 68, 68, 0.4))" : "none",
              transition: "transform 0.2s ease",
            }}
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset={`${percentage}%`} stopColor="#ef4444" />
                <stop offset={`${percentage}%`} stopColor="#2a2a2e" />
              </linearGradient>
            </defs>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={`url(#${gradId})`}
              stroke={heart.fillRatio > 0 ? "#ef4444" : "#4a4a4f"}
              strokeWidth="1.5"
            />
          </svg>
        );
      })}
    </div>
  );
}
