import React, { useState } from "react";
import { shareOrDownload } from "../utils/shareCard";
import AudioPreview from "./AudioPreview";

export default function SongResult({
  song,
  mood,
  moodTags,
  story,
  songs,
  message,
  onClose,
  onAnotherSong,
  onNewMood,
  onSelectSong,
}) {
  const otherSongs = songs.filter((s) => s.name !== song.name);
  const [shareStatus, setShareStatus] = useState(null);
  const [showMoreSongs, setShowMoreSongs] = useState(false);

  const handleShare = async () => {
    setShareStatus("generating");
    try {
      const result = await shareOrDownload({ mood, song, story });
      if (result === "cancelled") {
        setShareStatus(null);
      } else {
        setShareStatus("done");
        setTimeout(() => setShareStatus(null), 2500);
      }
    } catch (err) {
      console.error("Share failed:", err);
      setShareStatus("error");
      setTimeout(() => setShareStatus(null), 2500);
    }
  };

  const getShareLabel = () => {
    switch (shareStatus) {
      case "generating": return "Creating...";
      case "done": return "Saved!";
      case "error": return "Failed";
      default: return "Share";
    }
  };

  return (
    <div className="result-overlay" onClick={onClose}>
      <div className="result-card" onClick={(e) => e.stopPropagation()}>
        {/* Sticky Header — always visible */}
        <div className="result-header">
          <span className="result-mood">{mood}</span>
          <button className="close-btn" onClick={onClose}>
            CLOSE
          </button>
        </div>

        {/* Fallback notice */}
        {message && (
          <div className="result-notice">
            {message}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="result-body">
          {/* Song Hero */}
          <div className="song-hero">
            <div className="song-hero-image">
              {song.image ? (
                <img src={song.image} alt={song.name} />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-dim)",
                    fontSize: "1.5rem",
                  }}
                >
                  &#9835;
                </div>
              )}
            </div>
            <div className="song-hero-info">
              <div className="song-hero-artist">{song.artist}</div>
              <div className="song-hero-title">{song.name}</div>
            </div>
          </div>

          {/* Audio Preview */}
          <AudioPreview previewUrl={song.preview_url} spotifyUrl={song.spotify_url} />

          {/* Mood Tags */}
          {moodTags && (
            <div className="mood-tags">
              <span className="tag">Energy: {moodTags.energy}</span>
              <span className="tag">Valence: {moodTags.valence}</span>
              {moodTags.genres?.map((g) => (
                <span key={g} className="tag genre-tag">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Song Story */}
          {story && (
            <p className="song-description">{story}</p>
          )}

          {/* Play Links */}
          <div className="play-links">
            {song.spotify_url && (
              <a
                href={song.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                className="play-link"
              >
                <div className="play-link-icon spotify">&#9654;</div>
                <div>
                  <div className="play-link-label">PLAY ON SPOTIFY</div>
                  <div className="play-link-title">
                    {song.artist} &mdash; {song.name}
                  </div>
                </div>
              </a>
            )}

            {song.youtube_url && (
              <a
                href={song.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="play-link"
              >
                <div className="play-link-icon youtube">&#9654;</div>
                <div>
                  <div className="play-link-label">SEARCH ON YOUTUBE MUSIC</div>
                  <div className="play-link-title">
                    {song.artist} &mdash; {song.name}
                  </div>
                </div>
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="result-actions">
            <button
              className={`action-btn share ${shareStatus === "done" ? "share-done" : ""}`}
              onClick={handleShare}
              disabled={shareStatus === "generating"}
            >
              {getShareLabel()} &#10022;
            </button>
            {songs.length > 1 && (
              <button className="action-btn" onClick={onAnotherSong}>
                Another Song &#8594;
              </button>
            )}
            <button className="action-btn primary" onClick={onNewMood}>
              New Mood &#10022;
            </button>
          </div>

          {/* More Songs — collapsible on mobile */}
          {otherSongs.length > 0 && (
            <div className="more-songs">
              <button
                className="more-songs-toggle"
                onClick={() => setShowMoreSongs(!showMoreSongs)}
              >
                {showMoreSongs ? "Hide" : "Show"} {otherSongs.length} more {otherSongs.length === 1 ? "match" : "matches"}
                <span className={`toggle-arrow ${showMoreSongs ? "open" : ""}`}>&#9662;</span>
              </button>
              {showMoreSongs && (
                <div className="more-songs-list">
                  {otherSongs.slice(0, 5).map((s) => (
                    <div
                      key={`${s.name}-${s.artist}`}
                      className="more-song-item"
                      onClick={() => onSelectSong(s)}
                    >
                      <div className="more-song-img">
                        {s.image ? (
                          <img src={s.image} alt={s.name} />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "var(--bg)",
                            }}
                          />
                        )}
                      </div>
                      <div className="more-song-info">
                        <div className="more-song-title">{s.name}</div>
                        <div className="more-song-artist">{s.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
