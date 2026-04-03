import React, { useState, useCallback, useMemo, useEffect } from "react";
import MoodInput from "./components/MoodInput";
import SongResult from "./components/SongResult";
import ErrorDisplay from "./components/ErrorDisplay";
import BackgroundAnimation from "./components/BackgroundAnimation";
import { generatePlaylist, getUsage } from "./api";

const TAGLINES = [
  { line1: "How are you", line2: "feeling right now?" },
  { line1: "What's on", line2: "your mind today?" },
  { line1: "Tell us the vibe,", line2: "we'll find the track." },
  { line1: "Your feelings,", line2: "our playlist." },
  { line1: "Music that", line2: "gets you." },
  { line1: "What does today", line2: "sound like?" },
  { line1: "Name the emotion.", line2: "Hear the song." },
  { line1: "Mood in,", line2: "music out." },
  { line1: "Let your mood", line2: "pick the beat." },
  { line1: "Type your heart out.", line2: "We'll play it back." },
];

export default function App() {
  const [songs, setSongs] = useState([]);
  const [moodTags, setMoodTags] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [lastMood, setLastMood] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [pastSessions, setPastSessions] = useState([]);
  const [story, setStory] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [limit, setLimit] = useState(10);

  const tagline = useMemo(() => {
    return TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
  }, []);

  // Fetch remaining searches on page load
  useEffect(() => {
    getUsage().then((data) => {
      if (data) {
        setRemaining(data.remaining);
        setLimit(data.limit);
      }
    });
  }, []);

  const handleGenerate = useCallback(async (mood, language) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    setSongs([]);
    setMoodTags(null);
    setLastMood(mood);
    setShowResult(false);
    setSelectedSong(null);
    setStory(null);

    try {
      const data = await generatePlaylist(mood, language);
      const fetchedSongs = data.songs || [];
      setSongs(fetchedSongs);
      setMoodTags(data.mood_tags || null);
      setMessage(data.message || null);
      setStory(data.story || null);

      // Update remaining from response
      if (data.remaining !== undefined) setRemaining(data.remaining);
      if (data.limit !== undefined) setLimit(data.limit);

      if (fetchedSongs.length > 0) {
        setSelectedSong(fetchedSongs[0]);
        setShowResult(true);
        setPastSessions((prev) => {
          const entry = { mood, song: fetchedSongs[0].name, artist: fetchedSongs[0].artist };
          return [entry, ...prev.slice(0, 9)];
        });
      }
    } catch (err) {
      setError(err.message);
      // Update remaining from error response (402 quota exceeded)
      if (err.remaining !== undefined) setRemaining(err.remaining);
      if (err.limit !== undefined) setLimit(err.limit);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleAnotherSong = () => {
    if (songs.length <= 1) return;
    const currentIndex = songs.findIndex((s) => s.name === selectedSong?.name);
    const nextIndex = (currentIndex + 1) % songs.length;
    setSelectedSong(songs[nextIndex]);
  };

  const handleNewMood = () => {
    setShowResult(false);
    setSelectedSong(null);
    setSongs([]);
  };

  const handleSelectSong = (song) => {
    setSelectedSong(song);
  };

  const isQuotaExhausted = remaining === 0;

  return (
    <>
      <BackgroundAnimation moodTags={moodTags} />

      <div className="app">
        <header className="header">
          <div className="brand">moodmusic</div>
          <h1>
            {tagline.line1}
            <br />
            {tagline.line2}
          </h1>
        </header>

        <main className="main">
          {isQuotaExhausted ? (
            <div className="quota-wall">
              <div className="quota-wall-icon">&#9749;</div>
              <h2>You've used all {limit} free searches today</h2>
              <p>Come back tomorrow for more mood-matched music!</p>
              <div className="quota-wall-hint">Resets at midnight UTC</div>
            </div>
          ) : (
            <MoodInput
              onGenerate={handleGenerate}
              isLoading={isLoading}
              remaining={remaining}
              limit={limit}
            />
          )}

          {isLoading && (
            <div className="loading">
              <div className="eye-animation">
                <div className="eye-ring eye-ring-1"></div>
                <div className="eye-ring eye-ring-2"></div>
                <div className="eye-ring eye-ring-3"></div>
                <div className="eye-center"></div>
              </div>
              <p>Finding your sound...</p>
            </div>
          )}

          <ErrorDisplay
            error={error}
            message={!showResult ? message : null}
            onSuggestion={(mood) => handleGenerate(mood, "Any")}
          />

          {pastSessions.length > 0 && !showResult && !isLoading && (
            <div className="past-sessions">
              <div className="past-sessions-divider">
                <span>past sessions</span>
              </div>
              {pastSessions.map((session, i) => (
                <div
                  key={i}
                  className="past-session-item"
                  onClick={() => !isQuotaExhausted && handleGenerate(session.mood, "Any")}
                  style={isQuotaExhausted ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                >
                  <span className="past-session-mood">{session.mood}</span>
                  <span className="past-session-song">{session.song}</span>
                </div>
              ))}
            </div>
          )}
        </main>

        <footer className="footer">
          <div className="footer-text">Powered by AI & Spotify</div>
        </footer>
      </div>

      {showResult && selectedSong && (
        <SongResult
          song={selectedSong}
          mood={lastMood}
          moodTags={moodTags}
          story={story}
          songs={songs}
          message={message}
          onClose={handleNewMood}
          onAnotherSong={handleAnotherSong}
          onNewMood={handleNewMood}
          onSelectSong={handleSelectSong}
        />
      )}
    </>
  );
}
