import React from "react";

export default function PinPad({ value, onChange, maxLength = 4 }) {
  const handleKeyPress = (num) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleBackspace = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <div className="pin-pad-container">
      {/* Indicateurs visuels (Dots) */}
      <div className="pin-dots-display">
        {Array.from({ length: maxLength }).map((_, idx) => (
          <div
            key={idx}
            className={`pin-dot ${idx < value.length ? "active" : ""}`}
          />
        ))}
      </div>

      {/* Clavier numérique */}
      <div className="pin-keyboard-grid">
        {keys.map((key, idx) => {
          if (key === "") {
            return <div key={idx} className="pin-key-empty" aria-hidden="true" />;
          }
          const isBackspace = key === "⌫";
          return (
            <button
              key={idx}
              type="button"
              className={`pin-key-btn ${isBackspace ? "backspace-key" : ""}`}
              onClick={isBackspace ? handleBackspace : () => handleKeyPress(key)}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
