import React, { useMemo } from "react";

// Mood → aurora color themes (teal/purple/pink base)
const MOOD_THEMES = {
  "positive-high":  { primary: "250, 200, 80",  secondary: "92, 224, 216",  glow1: "#e8c050", glow2: "#5ce0d8" },
  "positive-medium": { primary: "92, 224, 216",  secondary: "160, 124, 232", glow1: "#5ce0d8", glow2: "#a07ce8" },
  "positive-low":   { primary: "100, 200, 180",  secondary: "120, 160, 220", glow1: "#64c8b4", glow2: "#78a0dc" },
  "negative-high":  { primary: "232, 100, 120",  secondary: "200, 80, 160",  glow1: "#e86478", glow2: "#c850a0" },
  "negative-medium": { primary: "160, 124, 232", secondary: "100, 80, 180",  glow1: "#a07ce8", glow2: "#6450b4" },
  "negative-low":   { primary: "80, 120, 200",   secondary: "100, 100, 160", glow1: "#5078c8", glow2: "#6464a0" },
  "neutral-high":   { primary: "232, 180, 80",   secondary: "232, 120, 168", glow1: "#e8b450", glow2: "#e878a8" },
  "neutral-medium": { primary: "92, 224, 216",   secondary: "160, 124, 232", glow1: "#5ce0d8", glow2: "#a07ce8" },
  "neutral-low":    { primary: "140, 140, 180",  secondary: "120, 130, 160", glow1: "#8c8cb4", glow2: "#7882a0" },
};

const DEFAULT_THEME = MOOD_THEMES["neutral-medium"];

function getMoodTheme(moodTags) {
  if (!moodTags) return DEFAULT_THEME;
  const valence = moodTags.valence || "neutral";
  const energy = moodTags.energy || "medium";
  return MOOD_THEMES[`${valence}-${energy}`] || DEFAULT_THEME;
}

function getSpeedMultiplier(energy) {
  switch (energy) {
    case "high": return 0.5;
    case "medium": return 0.8;
    case "low": return 1.4;
    default: return 1;
  }
}

export default function BackgroundAnimation({ moodTags }) {
  const theme = getMoodTheme(moodTags);
  const energy = moodTags?.energy || "medium";
  const speedMul = getSpeedMultiplier(energy);
  const count = energy === "high" ? 50 : energy === "low" ? 25 : 35;

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      baseSize: 1 + Math.random() * 2,
      baseDuration: 10 + Math.random() * 20,
      delay: `${Math.random() * 15}s`,
      useSecondary: Math.random() > 0.5,
    }));
  }, [count]);

  return (
    <>
      <div className="bg-animation">
        {particles.map((p) => {
          const color = p.useSecondary ? theme.secondary : theme.primary;
          return (
            <div
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                bottom: "-5px",
                width: `${p.baseSize}px`,
                height: `${p.baseSize}px`,
                animationDuration: `${p.baseDuration * speedMul}s`,
                animationDelay: p.delay,
                background: `rgba(${color}, 0.6)`,
                boxShadow: `0 0 4px rgba(${color}, 0.3)`,
                transition: "background 2s ease, box-shadow 2s ease",
              }}
            />
          );
        })}
      </div>
      <div
        className="bg-glow bg-glow-1"
        style={{ background: theme.glow1, transition: "background 2s ease" }}
      />
      <div
        className="bg-glow bg-glow-2"
        style={{ background: theme.glow2, transition: "background 2s ease" }}
      />
    </>
  );
}
