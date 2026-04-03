import React from "react";

const SUGGESTED_MOODS = [
  "a quiet afternoon alone",
  "dancing in the rain",
  "late night drive",
  "missing someone",
  "new beginnings",
];

export default function ErrorDisplay({ error, message, onSuggestion }) {
  if (message && !error) {
    const isServiceDown = message.toLowerCase().includes("busy") || message.toLowerCase().includes("warming");
    return (
      <div className="error-display no-results">
        <p className="error-message" style={{ color: "var(--cream-dim)" }}>
          {message}
        </p>
        {!isServiceDown && (
          <div className="suggestions" style={{ marginTop: "1rem" }}>
            {SUGGESTED_MOODS.map((m) => (
              <button
                key={m}
                className="suggestion-chip"
                onClick={() => onSuggestion(m)}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!error) return null;

  return (
    <div className="error-display">
      <p className="error-message">{error}</p>
      <p className="error-hint">Try again with a different mood.</p>
    </div>
  );
}
