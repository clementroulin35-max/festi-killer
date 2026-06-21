import React, { useState } from "react";
import { Trophy, Heart, Shuffle, ShieldAlert, Award, AlignJustify, Shield } from "lucide-react";
import { getRank } from "./PlayerDashboard";

export default function Leaderboard({ players, history }) {
  const [subTab, setSubTab] = useState("scores"); // scores, trophies

  // Sort players: score desc, lives desc, name asc
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.lives !== a.lives) return b.lives - a.lives;
    return a.name.localeCompare(b.name);
  });

  // Calculate stats for trophies
  // 1. Prédateur Alpha: Max score
  const maxScore = Math.max(...players.map(p => p.score), 0);
  const predators = maxScore > 0 ? players.filter(p => p.score === maxScore).map(p => p.name) : [];

  // 2. Survivant Ultime: Max lives (only among non-zombies)
  const maxLives = Math.max(...players.filter(p => !p.isZombie).map(p => p.lives), 0);
  const survivors = maxLives > 0 ? players.filter(p => !p.isZombie && p.lives === maxLives).map(p => p.name) : [];

  // 3. Joueur Fou: Count skips and abandons
  const getSkipsAndAbandonsCount = (name) => {
    const skips = history.filter(h => h.type === "skip" && h.killer === name).length;
    const abandons = history.filter(h => h.type === "abandon_validation" && h.killer === name).length;
    return skips + abandons;
  };

  const crazyPlayerScores = players.map(p => ({
    name: p.name,
    count: getSkipsAndAbandonsCount(p.name)
  }));
  const maxSkipsCount = Math.max(...crazyPlayerScores.map(c => c.count), 0);
  const crazyPlayers = maxSkipsCount > 0 ? crazyPlayerScores.filter(c => c.count === maxSkipsCount).map(c => c.name) : [];

  // Podium Positions (1st in middle, 2nd on left, 3rd on right)
  const first = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];

  const renderPodiumItem = (player, position) => {
    if (!player) return <div className="podium-col empty"></div>;

    const rankClasses = ["podium-gold", "podium-silver", "podium-bronze"];
    const rankLabels = ["1", "2", "3"];
    const rankColors = ["#f59e0b", "#9ca3af", "#b45309"];

    return (
      <div className={`podium-col ${rankClasses[position - 1]}`}>
        <div className="podium-avatar">
          {player.photo ? (
            <img src={player.photo} alt={player.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            player.name.slice(0, 2).toUpperCase()
          )}
          {player.isZombie && (
            <div className="zombie-badge-small" title="Zombie">
              <ShieldAlert size={10} color="#ff0055" />
            </div>
          )}
        </div>
        <div className="podium-name">{player.name}</div>
        <div className="podium-points">{player.score} pts</div>
        <div className="podium-bar" style={{ backgroundColor: rankColors[position - 1] }}>
          <span className="podium-number">{rankLabels[position - 1]}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="leaderboard-screen-layout">
      <div className="view-scroll-content">
        <div className="glass-card-purple" style={{ width: "100%", maxWidth: "100%" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.05em", color: "var(--neon-purple)", textAlign: "center", marginBottom: "14px", textTransform: "uppercase" }}>
            Classement Général
          </h2>

          {/* Sub-tabs Navigation */}
          <div className="leaderboard-subtabs" style={{
            display: "flex",
            backgroundColor: "rgba(10, 10, 14, 0.6)",
            backdropFilter: "blur(8px)",
            borderRadius: "var(--border-radius-sm)",
            padding: "2px",
            marginTop: "4px",
            marginBottom: "8px",
            border: "1px solid rgba(139, 92, 246, 0.15)"
          }}>
            <button
              onClick={() => setSubTab("scores")}
              style={{
                flex: 1,
                backgroundColor: subTab === "scores" ? "rgba(139, 92, 246, 0.25)" : "transparent",
                color: subTab === "scores" ? "#ffffff" : "var(--text-muted)",
                border: subTab === "scores" ? "1px solid rgba(139, 92, 246, 0.7)" : "1px solid transparent",
                boxShadow: subTab === "scores" ? "0 0 8px rgba(139, 92, 246, 0.4)" : "none",
                borderRadius: "4px",
                padding: "5px 8px",
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
            >
              <AlignJustify size={13} />
              Scores & Vies
            </button>
            <button
              onClick={() => setSubTab("trophies")}
              style={{
                flex: 1,
                backgroundColor: subTab === "trophies" ? "rgba(139, 92, 246, 0.25)" : "transparent",
                color: subTab === "trophies" ? "#ffffff" : "var(--text-muted)",
                border: subTab === "trophies" ? "1px solid rgba(139, 92, 246, 0.7)" : "1px solid transparent",
                boxShadow: subTab === "trophies" ? "0 0 8px rgba(139, 92, 246, 0.4)" : "none",
                borderRadius: "4px",
                padding: "5px 8px",
                fontSize: "11px",
                fontWeight: "800",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                transition: "all 0.2s"
              }}
            >
              <Award size={13} />
              Trophées Spéciaux
            </button>
          </div>

          {/* --- SUB-TAB 1 : SCORES & PODIUM --- */}
          {subTab === "scores" && (
            <div className="scores-tab-content animate-fade-in" style={{ width: "100%" }}>
              {sortedPlayers.length > 0 && (
                <div className="podium-container" style={{ marginBottom: "20px" }}>
                  {renderPodiumItem(second, 2)}
                  {renderPodiumItem(first, 1)}
                  {renderPodiumItem(third, 3)}
                </div>
              )}

              <div className="leaderboard-list">
                {sortedPlayers.map((player, index) => {
                  const isPredator = predators.includes(player.name);
                  const isSurvivor = survivors.includes(player.name);
                  const isCrazy = crazyPlayers.includes(player.name);

                  return (
                    <div key={player.name} className={`leaderboard-row ${player.isZombie ? "row-zombie" : ""}`} style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "var(--border-radius-sm)", marginBottom: "8px", padding: "10px 12px" }}>
                      <div className="row-left">
                        <span className="row-rank" style={{ color: "var(--neon-purple)" }}>{index + 1}</span>
                        <div className="row-avatar">
                          {player.photo ? (
                            <img src={player.photo} alt={player.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            player.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="row-player-info" style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
                           <div className="row-player-name" style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                             <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</span>
                           </div>
                           <div className="row-trophies" style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                             {(() => { const r = getRank(player.score); return <span className={`rank-badge ${r.css}`} style={{ fontSize: 9, padding: '1px 5px', lineHeight: "1" }}>{r.icon} {r.label}</span>; })()}
                             {isPredator && <Trophy size={11} className="row-trophy trophy-gold" title="Prédateur Alpha" />}
                             {isSurvivor && <Shield size={11} className="row-trophy trophy-red" fill="#ef4444" color="#ef4444" title="Survivant Ultime" />}
                             {isCrazy && <Shuffle size={11} className="row-trophy trophy-purple" title="Joueur Fou" />}
                           </div>
                         </div>
                      </div>
                      <div className="row-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: "2px", flexShrink: 0 }}>
                        <span className="row-score" style={{ color: "var(--text-primary)", fontWeight: "800", fontSize: "14px" }}>{player.score} pts</span>
                        <span className="row-lives" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {player.isZombie ? "💀" : `${player.lives} ❤️`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- SUB-TAB 2 : TROPHIES --- */}
          {subTab === "trophies" && (
            <div className="trophies-tab-content animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              
              {/* Trophy 1: Prédateur Alpha */}
              <div className="admin-card trophy-detail-card" style={{
                borderColor: predators.length > 0 ? "var(--neon-gold)" : "var(--border-color)",
                boxShadow: predators.length > 0 ? "0 0 10px rgba(245, 158, 11, 0.15)" : "none",
                backgroundColor: "rgba(24, 24, 31, 0.5)",
                border: "1px solid rgba(245, 158, 11, 0.2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(245, 158, 11, 0.3)"
                  }}>
                    <Trophy className="trophy-gold" size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: "var(--neon-gold)", fontSize: "14px", fontWeight: "800" }}>Prédateur Alpha</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Le plus haut score en points. L'assassin ultime.</p>
                  </div>
                </div>
                <div style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  textAlign: "center"
                }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                    {predators.join(", ") || "Aucun pour l'instant"}
                  </strong>
                </div>
              </div>

              {/* Trophy 2: Survivant Ultime */}
              <div className="admin-card trophy-detail-card" style={{
                borderColor: survivors.length > 0 ? "var(--neon-red)" : "var(--border-color)",
                boxShadow: survivors.length > 0 ? "0 0 10px rgba(255, 51, 102, 0.15)" : "none",
                backgroundColor: "rgba(24, 24, 31, 0.5)",
                border: "1px solid rgba(255, 51, 102, 0.2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 51, 102, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255, 51, 102, 0.3)"
                  }}>
                    <Shield className="trophy-red" fill="#ef4444" color="#ef4444" size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: "var(--neon-red)", fontSize: "14px", fontWeight: "800" }}>Survivant Ultime</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Celui à qui il reste le plus de cœurs d'énergie Zelda.</p>
                  </div>
                </div>
                <div style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  textAlign: "center"
                }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                    {survivors.join(", ") || "Aucun pour l'instant"}
                  </strong>
                </div>
              </div>

              {/* Trophy 3: Joueur Fou */}
              <div className="admin-card trophy-detail-card" style={{
                borderColor: crazyPlayers.length > 0 ? "var(--neon-purple)" : "var(--border-color)",
                boxShadow: crazyPlayers.length > 0 ? "0 0 10px rgba(139, 92, 246, 0.15)" : "none",
                backgroundColor: "rgba(24, 24, 31, 0.5)",
                border: "1px solid rgba(139, 92, 246, 0.2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(139, 92, 246, 0.3)"
                  }}>
                    <Shuffle className="trophy-purple" size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: "var(--neon-purple)", fontSize: "14px", fontWeight: "800" }}>Joueur Fou</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Celui qui a cumulé le plus d'actions tactiques (Skips + Abandons).</p>
                  </div>
                </div>
                <div style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  textAlign: "center"
                }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                    {crazyPlayers.length > 0 ? `${crazyPlayers.join(", ")} (${maxSkipsCount} actions)` : "Aucun pour l'instant"}
                  </strong>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
