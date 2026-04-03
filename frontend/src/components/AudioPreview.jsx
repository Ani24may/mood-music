import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * Extracts Spotify track ID from a Spotify URL.
 * e.g. "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh" -> "4iV5W9uYEdYUVa79Axb7Rh"
 */
function getSpotifyTrackId(spotifyUrl) {
  if (!spotifyUrl) return null;
  const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * AudioPreview — tries native <audio> with preview_url first,
 * falls back to Spotify Embed iframe if no preview_url available.
 */
export default function AudioPreview({ previewUrl, spotifyUrl }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progressBarRef = useRef(null);

  const trackId = getSpotifyTrackId(spotifyUrl);
  const hasNativePreview = !!previewUrl;

  // Reset when preview URL or song changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [previewUrl, spotifyUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar || !audio.duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = pct * audio.duration;
  };

  const formatTime = (seconds) => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Native audio player (when preview_url is available)
  if (hasNativePreview) {
    return (
      <div className="audio-preview">
        <audio
          ref={audioRef}
          src={previewUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <button
          className={`audio-play-btn ${isPlaying ? "playing" : ""}`}
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5v11l9-5.5z" />
            </svg>
          )}
        </button>

        <div className="audio-track">
          <div
            className="audio-progress-bar"
            ref={progressBarRef}
            onClick={handleSeek}
          >
            <div
              className="audio-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="audio-progress-knob"
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="audio-times">
            <span>{formatTime(currentTime)}</span>
            <span>{duration ? formatTime(duration) : "0:30"}</span>
          </div>
        </div>
      </div>
    );
  }

  // Spotify Embed fallback (when no preview_url)
  if (trackId) {
    return (
      <div className="audio-preview-embed">
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify preview"
          style={{ borderRadius: "12px" }}
        />
      </div>
    );
  }

  // No preview available at all
  return null;
}
