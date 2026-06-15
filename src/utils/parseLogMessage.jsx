import React from "react";

/**
 * Parses a game log message string and returns JSX with colored spans:
 * - Player names → yellow bold (.log-player-name)
 * - Point gains (e.g. +85 pts) → blue (.log-points)
 * - Heart/life losses (e.g. -0.5 coeur, 1 coeur) → red (.log-damage)
 */
export function parseMessageToJSX(text, players = []) {
  if (!text) return text;

  const playerNames = players.map((p) => p.name).filter(Boolean);

  // Build a combined regex for all patterns to match
  // 1. Player names (exact match, case-insensitive, word boundary)
  // 2. Point patterns like "+85 pts", "+150 pts", "-25 pts"
  // 3. Heart/life damage patterns like "0.5 coeur", "1 coeur", "2 coeurs", "-0.5 coeur"
  const patterns = [];

  if (playerNames.length > 0) {
    // Escape special regex chars in player names, longest first to avoid partial matches
    const escapedNames = playerNames
      .sort((a, b) => b.length - a.length)
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    patterns.push(`(?:${escapedNames.join("|")})`);
  }

  // Points pattern: +N pts or -N pts
  patterns.push("[+-]?\\d+\\s*pts?");

  // Hearts/damage pattern: N coeur(s), -N coeur(s), N.N coeur(s)
  patterns.push("-?\\d+(?:\\.\\d+)?\\s*c[oœ]eurs?");

  const combinedRegex = new RegExp(`(${patterns.join("|")})`, "gi");

  const parts = text.split(combinedRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Check if it's a player name
    const isPlayerName = playerNames.some(
      (name) => name.toLowerCase() === part.toLowerCase()
    );
    if (isPlayerName) {
      return (
        <span key={i} className="log-player-name">
          {part}
        </span>
      );
    }

    // Check if it's a points pattern
    if (/[+-]?\d+\s*pts?/i.test(part)) {
      return (
        <span key={i} className="log-points">
          {part}
        </span>
      );
    }

    // Check if it's a hearts/damage pattern
    if (/-?\d+(?:\.\d+)?\s*c[oœ]eurs?/i.test(part)) {
      return (
        <span key={i} className="log-damage">
          {part}
        </span>
      );
    }

    // Plain text
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
