import React, { useState, useCallback, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import MoodInput from "./components/MoodInput";
import SongResult from "./components/SongResult";
import ErrorDisplay from "./components/ErrorDisplay";
import BackgroundAnimation from "./components/BackgroundAnimation";
import { generatePlaylist } from "./api";

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

  const tagline = useMemo(() => {
    return TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
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
          <MoodInput
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />

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
            message={message}
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
                  onClick={() => handleGenerate(session.mood, "Any")}
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

      {/* Result overlay rendered OUTSIDE .app to avoid 3D transform stacking context issues */}
      {showResult && selectedSong && (
        <SongResult
          song={selectedSong}
          mood={lastMood}
          moodTags={moodTags}
          story={story}
          songs={songs}
          onClose={handleNewMood}
          onAnotherSong={handleAnotherSong}
          onNewMood={handleNewMood}
          onSelectSong={handleSelectSong}
        />
      )}
      <Analytics />
    </>
  );
}
