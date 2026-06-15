import React, { useState, useRef, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { 
  Camera, Upload, RotateCcw, Check, AlertCircle, RefreshCw,
  Skull, Target, Shuffle, ShieldAlert, Zap, ChevronRight, ChevronLeft
} from "lucide-react";

export default function PlayerSetup({ playerName }) {
  const { savePlayerPhoto } = useGame();
  
  // Carousel state: 0 to 4 are tutorial slides, 5 is the final photo configuration step
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start/Stop camera only when the user is on the final photo setup slide (slide 5)
  useEffect(() => {
    if (currentSlide === 5) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentSlide]);

  const startCamera = async () => {
    setError(null);
    setLoading(true);
    try {
      if (stream) {
        stopCamera();
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Impossible d'accéder à la caméra :", err);
      setError("Accès caméra refusé ou non disponible. Utilisez l'importation de fichier.");
      setCameraActive(false);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 400;
    canvas.height = 400;

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    context.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        canvas.width = 400;
        canvas.height = 400;
        
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
        setLoading(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRecapture = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleValidate = () => {
    if (!capturedPhoto) return;
    savePlayerPhoto(playerName, capturedPhoto);
  };

  // Skip tutorial entirely and jump to photo setup (Slide 5)
  const handleSkipTutorial = () => {
    setCurrentSlide(5);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(5, prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  // Render onboarding tutorial slides
  const renderTutorialSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="tutorial-slide animate-fade-in">
            <div className="slide-icon-container">
              <Skull size={64} className="glowing-icon-pink" />
            </div>
            <h3>Bienvenue dans Cooki'llers</h3>
            <p className="slide-intro">
              Le célèbre jeu de bluff, de paranoïa et d'assassinat adapté pour ton festival de musique !
            </p>
            <div className="slide-points">
              <div className="point-item">🗡️ <strong>Élimine ta cible</strong> secrète en réalisant un défi.</div>
              <div className="point-item">❤️ <strong>Survis</strong> en conservant tes 7 cœurs de vie de départ.</div>
              <div className="point-item">⛺ <strong>Reste sur tes gardes</strong> au camping et devant les scènes !</div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="tutorial-slide animate-fade-in">
            <div className="slide-icon-container" style={{ borderColor: "var(--neon-green)", boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)" }}>
              <Target size={64} style={{ color: "var(--neon-green)" }} />
            </div>
            <h3>Accomplis ta Mission</h3>
            <p className="slide-intro">
              Pour assassiner ta cible, tu dois lui faire exécuter à son insu le défi secret qui t'a été attribué.
            </p>
            <div className="slide-points">
              <div className="point-item">🕵️ <strong>Fais preuve de ruse</strong> pour ne pas éveiller les soupçons.</div>
              <div className="point-item">📣 <strong>Déclare ton Hit</strong> sur le dashboard dès que c'est fait.</div>
              <div className="point-item">⚖️ <strong>Attends le GM</strong> qui validera discrètement ton assassinat.</div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="tutorial-slide animate-fade-in">
            <div className="slide-icon-container" style={{ borderColor: "var(--neon-gold)", boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)" }}>
              <Shuffle size={64} style={{ color: "var(--neon-gold)" }} />
            </div>
            <h3>Skips & Actions Tactiques</h3>
            <p className="slide-intro">
              Si un défi ou une cible est trop difficile, tu as des options tactiques sur ton tableau de bord.
            </p>
            <div className="slide-points">
              <div className="point-item">🎲 <strong>Reroll Action (Skip)</strong> : Coûte 1 skip (change de défi, garde la cible).</div>
              <div className="point-item">🏳️ <strong>Reroll Cible (Abandon)</strong> : Pénalité d'un cœur de vie ou 150 points (change de cible).</div>
              <div className="point-item">🔋 <strong>Gagne des Skips</strong> : +1 skip chaque matin et +1 skip par hit validé.</div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="tutorial-slide animate-fade-in">
            <div className="slide-icon-container" style={{ borderColor: "var(--neon-red)", boxShadow: "0 0 15px rgba(255, 51, 102, 0.2)" }}>
              <ShieldAlert size={64} style={{ color: "var(--neon-red)" }} />
            </div>
            <h3>Contre-Attaque (Dénonciation)</h3>
            <p className="slide-intro">
              Tu penses qu'un joueur essaie de te piéger pour accomplir son défi ? Dénonce-le !
            </p>
            <div className="slide-points">
              <div className="point-item">🎯 <strong>Bonne Dénonciation</strong> : Son action est brûlée, il perd 25 pts de score.</div>
              <div className="point-item">⚠️ <strong>Fausse Accusation</strong> : Tu es paranoïaque ! Tu perds 0.5 cœur de vie.</div>
              <div className="point-item">✍️ <strong>Saisie libre</strong> : Rédige ce que tu penses qu'il voulait te faire faire.</div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="tutorial-slide animate-fade-in">
            <div className="slide-icon-container" style={{ borderColor: "var(--neon-purple)", boxShadow: "0 0 15px rgba(139, 92, 246, 0.2)" }}>
              <Zap size={64} style={{ color: "var(--neon-purple)" }} />
            </div>
            <h3>Le Mode Zombie</h3>
            <p className="slide-intro">
              Si ton énergie tombe à 0 cœur, tu es éliminé du tour principal mais la partie continue !
            </p>
            <div className="slide-points">
              <div className="point-item">💀 <strong>Insaisissable</strong> : Les vivants ne peuvent plus te cibler.</div>
              <div className="point-item">🪙 <strong>Score pénalisé</strong> : Tes hits validés ne rapportent plus que la moitié des points.</div>
              <div className="point-item">❤️ <strong>Résurrection</strong> : Récupère 2 cœurs si tu valides un défi majeur.</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="player-setup-screen onboarding-carousel-view animate-fade-in">
      <div className="admin-card setup-card tutorial-carousel-card">
        
        {/* Onboarding Header with Skip Button */}
        <div className="carousel-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "16px" }}>
          <span className="badge badge-player" style={{ textTransform: "uppercase", fontSize: "10px" }}>
            {currentSlide < 5 ? `Tutoriel : Étape ${currentSlide + 1} / 5` : "Initialisation Photo"}
          </span>
          {currentSlide < 5 && (
            <button 
              onClick={handleSkipTutorial} 
              className="skip-tutorial-btn"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "var(--border-radius-sm)",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.color = "var(--text-primary)"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}
            >
              Passer ➔
            </button>
          )}
        </div>

        {/* Carousel Slide Area */}
        <div className="carousel-body" style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column" }}>
          {currentSlide < 5 ? (
            renderTutorialSlide()
          ) : (
            /* Slide 5: Photo Profil setup (Original Form) */
            <div className="photo-setup-step animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              <div className="setup-header" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <h2>Bonjour {playerName} !</h2>
                <p className="setup-subtitle" style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Prends ou importe une photo en direct pour t'identifier dans la partie.
                </p>
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="camera-box-outer">
                <canvas ref={canvasRef} style={{ display: "none" }} />
                
                {capturedPhoto ? (
                  <div className="photo-preview-container animate-fade-in">
                    <img src={capturedPhoto} alt="Aperçu profil" className="captured-profile-img" />
                    <div className="glowing-border-purple" />
                  </div>
                ) : (
                  <div className="video-viewport">
                    {cameraActive ? (
                      <video ref={videoRef} autoPlay playsInline muted className="camera-feed-video" />
                    ) : (
                      <div className="camera-placeholder">
                        {loading ? (
                          <RefreshCw className="animate-spin text-muted" size={36} />
                        ) : (
                          <Camera className="text-muted" size={48} />
                        )}
                        <p>{loading ? "Démarrage de l'appareil..." : "Caméra désactivée"}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="setup-controls">
                {capturedPhoto ? (
                  <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                    <button onClick={handleRecapture} className="btn-reject" style={{ flex: 1, padding: "12px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                      <RotateCcw size={16} style={{ marginRight: 6 }} /> Recommencer
                    </button>
                    <button 
                      onClick={handleValidate} 
                      className="btn-approve" 
                      style={{ flex: 1, padding: "12px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", background: "linear-gradient(135deg, var(--neon-green), #059669)", color: "#121214" }}
                    >
                      <Check size={16} style={{ marginRight: 6 }} /> Valider ma photo
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                    {cameraActive ? (
                      <button onClick={capturePhoto} className="hit-success-btn" style={{ padding: "14px", fontWeight: "800", letterSpacing: "0.05em" }}>
                        <Camera size={18} style={{ marginRight: 8, display: "inline" }} />
                        PRENDRE LA PHOTO
                      </button>
                    ) : (
                      <button onClick={startCamera} className="panic-btn" style={{ margin: 0, padding: "12px" }}>
                        <RotateCcw size={16} style={{ marginRight: 6 }} /> Réactiver la caméra
                      </button>
                    )}

                    <div className="file-upload-wrapper">
                      <label className="upload-file-btn">
                        <Upload size={16} />
                        <span>Importer un fichier image</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Carousel Bottom Indicator Dots and Navigation Buttons */}
        <div className="carousel-navigation-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
          {/* Left Arrow Button */}
          {currentSlide > 0 ? (
            <button 
              onClick={prevSlide}
              className="carousel-nav-arrow"
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <div style={{ width: "36px" }} />
          )}

          {/* Dots Indicator */}
          <div className="carousel-dots" style={{ display: "flex", gap: "8px" }}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div 
                key={idx}
                className={`dot ${currentSlide === idx ? "active" : ""}`}
                style={{
                  width: currentSlide === idx ? "18px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor: currentSlide === idx ? "var(--neon-purple)" : "var(--border-color)",
                  transition: "all 0.3s ease",
                  cursor: idx <= currentSlide ? "pointer" : "not-allowed"
                }}
                onClick={() => {
                  if (idx <= currentSlide || idx === 5) {
                    setCurrentSlide(idx);
                  }
                }}
              />
            ))}
          </div>

          {/* Right Arrow / Action Button */}
          {currentSlide < 5 ? (
            <button 
              onClick={nextSlide}
              className="carousel-nav-arrow"
              style={{
                background: "var(--neon-purple)",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)"
              }}
            >
              <ChevronRight size={18} />
            </button>
          ) : (
            <div style={{ width: "36px" }} />
          )}
        </div>

      </div>
    </div>
  );
}
