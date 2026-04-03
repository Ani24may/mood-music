import React, { useState } from "react";

const LANGUAGES = ["Tamil", "Hindi", "English", "Telugu", "Any"];

// Emoji quick-picks — one tap mood selection (unique to Mood Music)
const MOOD_EMOJIS = [
  { emoji: "\u{1F614}", label: "low", mood: "feeling down and heavy" },
  { emoji: "\u{1F60C}", label: "calm", mood: "peaceful and relaxed" },
  { emoji: "\u{1F525}", label: "hype", mood: "pumped up and unstoppable" },
  { emoji: "\u{1F497}", label: "love", mood: "head over heels in love" },
  { emoji: "\u{1F319}", label: "night", mood: "late night thoughts" },
  { emoji: "\u{1F3C3}", label: "grind", mood: "focused and grinding" },
];

// Original mood suggestions — NOT from Tunelet
const MOOD_SUGGESTIONS = [
  "monsoon chai on the balcony",
  "3am overthinking again",
  "aaj accha nhi lag raha h",
  "just got good news",
  "long drive with no destination",
  "dil toot gaya yaar",
  "Sunday morning laziness",
  "missing home",
];

export default function MoodInput({ onGenerate, isLoading }) {
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("Any");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mood.trim() && !isLoading) {
      onGenerate(mood.trim(), language);
    }
  };

  const handleSuggestion = (suggestion) => {
    setMood(suggestion);
    if (!isLoading) {
      onGenerate(suggestion, language);
    }
  };

  const handleEmoji = (moodText) => {
    setMood(moodText);
    if (!isLoading) {
      onGenerate(moodText, language);
    }
  };

  return (
    <form className="mood-input" onSubmit={handleSubmit}>
      <div className="search-bar">
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="how are you feeling right now?"
          maxLength={500}
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          className="search-btn"
          disabled={!mood.trim() || isLoading}
          title="Generate"
        >
          &#10140;
        </button>
      </div>

      {/* Emoji quick-picks */}
      <div className="language-bar">
        {MOOD_EMOJIS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="lang-chip"
            onClick={() => handleEmoji(item.mood)}
            disabled={isLoading}
            title={item.mood}
          >
            {item.emoji} {item.label}
          </button>
        ))}
      </div>

      {/* Language selector */}
      <div className="language-bar">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            className={`lang-chip ${language === lang ? "active" : ""}`}
            onClick={() => setLanguage(lang)}
            disabled={isLoading}
          >
            {lang}
          </button>
        ))}
      </div>

      {!isLoading && (
        <div className="suggestions">
          {MOOD_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="suggestion-chip"
              onClick={() => handleSuggestion(s)}
              disabled={isLoading}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
