import React, { useState, useRef, useCallback } from "react";

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

// Check if Web Speech API is available
const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function MoodInput({ onGenerate, isLoading }) {
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("Any");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

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

  const startListening = useCallback(() => {
    if (!SpeechRecognition || isLoading) return;

    // Stop if already listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Set language based on selected language
    const langMap = {
      Tamil: "ta-IN",
      Hindi: "hi-IN",
      English: "en-US",
      Telugu: "te-IN",
      Any: "en-US",
    };
    recognition.lang = langMap[language] || "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setMood(transcript);
    };

    recognition.onerror = (event) => {
      // Silently handle — user can just type instead
      if (event.error !== "aborted") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, [isListening, isLoading, language]);

  return (
    <form className="mood-input" onSubmit={handleSubmit}>
      <div className="search-bar">
        {/* Voice button — left side */}
        {SpeechRecognition && (
          <button
            type="button"
            className={`voice-btn ${isListening ? "listening" : ""}`}
            onClick={startListening}
            disabled={isLoading}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>
        )}

        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder={isListening ? "listening..." : "how are you feeling right now?"}
          maxLength={500}
          disabled={isLoading}
          autoFocus
          className={isListening ? "listening-input" : ""}
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
