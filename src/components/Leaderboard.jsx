import React, { useState } from "react";
import { Trophy, Heart, Shuffle, ShieldAlert, Award, AlignJustify, Shield, Skull, Activity, MessageSquare, Droplet } from "lucide-react";
import { getRank } from "./PlayerDashboard";

export default function Leaderboard({ players, history }) {
  const [subTab, setSubTab] = useState("scores"); // scores, trophies, flux
  const [expandedPhoto, setExpandedPhoto] = useState(null);

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
              <Skull size={10} color="#ffffff" />
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
                padding: "5px 4px",
                fontSize: "10.5px",
                fontWeight: "800",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <AlignJustify size={12} />
              Scores
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
                padding: "5px 4px",
                fontSize: "10.5px",
                fontWeight: "800",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <Award size={12} />
              Trophées
            </button>
            <button
              onClick={() => setSubTab("flux")}
              style={{
                flex: 1,
                backgroundColor: subTab === "flux" ? "rgba(139, 92, 246, 0.25)" : "transparent",
                color: subTab === "flux" ? "#ffffff" : "var(--text-muted)",
                border: subTab === "flux" ? "1px solid rgba(139, 92, 246, 0.7)" : "1px solid transparent",
                boxShadow: subTab === "flux" ? "0 0 8px rgba(139, 92, 246, 0.4)" : "none",
                borderRadius: "4px",
                padding: "5px 4px",
                fontSize: "10.5px",
                fontWeight: "800",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s"
              }}
            >
              <Activity size={12} />
              Flux
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
                             {isSurvivor && <ShieldAlert size={11} className="row-trophy trophy-red" fill="#ef4444" color="#ef4444" title="Survivant Ultime" />}
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
                  textAlign: "right"
                }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)", fontStyle: "italic" }}>
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
                    <ShieldAlert className="trophy-red" fill="#ef4444" color="#ef4444" size={20} />
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
                  textAlign: "right"
                }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)", fontStyle: "italic" }}>
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
                  textAlign: "right"
                }}>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary)", fontStyle: "italic" }}>
                    {crazyPlayers.length > 0 ? `${crazyPlayers.join(", ")} (${maxSkipsCount} actions)` : "Aucun pour l'instant"}
                  </strong>
                </div>
              </div>

            </div>
          )}

          {/* --- SUB-TAB 3 : ACTIVITY FLUX --- */}
          {subTab === "flux" && (
            <div className="flux-tab-content animate-fade-in" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              {(() => {
                const fluxEvents = history.filter(
                  (h) =>
                    h.type === "hit_validation" ||
                    h.type === "counter_attack_resolution" ||
                    (h.type === "fountain_heal" && h.status === "approved")
                );

                const formatTime = (ts) => {
                  if (!ts) return "";
                  try {
                    const d = new Date(ts);
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + d.toLocaleDateString([], { day: 'numeric', month: 'short' });
                  } catch (e) {
                    return "";
                  }
                };

                if (fluxEvents.length === 0) {
                  return (
                    <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic" }}>
                      Aucune activité enregistrée dans le flux pour l'instant.
                    </div>
                  );
                }

                return (
                  <div className="flux-scroll-list" style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
                    {fluxEvents.map((evt) => {
                      let icon = <Trophy size={16} style={{ color: "var(--neon-gold)" }} />;
                      let borderColor = "rgba(245, 158, 11, 0.25)";
                      let title = "Activité";

                      if (evt.type === "hit_validation") {
                        icon = <Trophy size={16} style={{ color: "var(--neon-purple)" }} />;
                        borderColor = "rgba(139, 92, 246, 0.25)";
                        title = "Mission Accomplie";
                      } else if (evt.type === "counter_attack_resolution") {
                        icon = <Shield size={16} style={{ color: "var(--neon-red)" }} />;
                        borderColor = "rgba(255, 51, 102, 0.25)";
                        title = "Contre-Attaque";
                      } else if (evt.type === "fountain_heal") {
                        icon = <Droplet size={16} style={{ color: "var(--neon-blue)" }} />;
                        borderColor = "rgba(59, 130, 246, 0.25)";
                        title = "Soin Fontaine";
                      }

                      return (
                        <div
                          key={evt.id}
                          className="flux-item-card"
                          style={{
                            background: "rgba(20, 20, 25, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            borderLeft: `3px solid ${borderColor.replace("0.25", "0.7")}`,
                            borderRadius: "var(--border-radius-sm)",
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {icon}
                              <span style={{ fontSize: "11px", fontWeight: "950", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                {title}
                              </span>
                            </div>
                            <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700" }}>
                              {formatTime(evt.timestamp)}
                            </span>
                          </div>

                          <p style={{ fontSize: "12px", color: "var(--text-primary)", margin: 0, lineHeight: "1.4", fontWeight: "500", textAlign: "left" }}>
                            {evt.message}
                          </p>

                          {/* Preuve de la Fontaine */}
                          {evt.type === "fountain_heal" && (evt.responseText || evt.photoProof) && (
                            <div
                              style={{
                                marginTop: "4px",
                                padding: "8px",
                                background: "rgba(0, 0, 0, 0.25)",
                                border: "1px solid rgba(255, 255, 255, 0.04)",
                                borderRadius: "4px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                textAlign: "left"
                              }}
                            >
                              <span style={{ fontSize: "9px", fontWeight: "900", color: "var(--neon-blue)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Preuve de validation :
                              </span>
                              {evt.responseText && (
                                <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", marginTop: "2px" }}>
                                  <MessageSquare size={12} style={{ color: "var(--text-muted)", marginTop: "2px", flexShrink: 0 }} />
                                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: 0, fontStyle: "italic", lineHeight: "1.3" }}>
                                    « {evt.responseText} »
                                  </p>
                                </div>
                              )}
                              {evt.photoProof && (
                                <div style={{ marginTop: "4px", display: "flex", justifyContent: "left" }}>
                                  <img
                                    src={evt.photoProof}
                                    alt="Preuve photo"
                                    onClick={() => setExpandedPhoto(evt.photoProof)}
                                    style={{
                                      width: "120px",
                                      height: "90px",
                                      objectFit: "cover",
                                      borderRadius: "4px",
                                      border: "1px solid rgba(59, 130, 246, 0.3)",
                                      cursor: "pointer",
                                      transition: "all 0.2s"
                                    }}
                                    title="Cliquez pour agrandir"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Photo Lightbox */}
      {expandedPhoto && (
        <div
          onClick={() => setExpandedPhoto(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            cursor: "pointer"
          }}
        >
          <img
            src={expandedPhoto}
            alt="Preuve Agrandie"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "8px",
              border: "2px solid var(--neon-blue)",
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)"
            }}
          />
          <button
            onClick={() => setExpandedPhoto(null)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              fontSize: "24px",
              fontWeight: "bold",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
