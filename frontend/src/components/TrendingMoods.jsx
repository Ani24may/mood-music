import React, { useState, useEffect } from "react";
import { getTrending } from "../api";

export default function TrendingMoods({ onSelectMood, isLoading }) {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    getTrending().then(setTrending);
  }, []);

  if (trending.length === 0) return null;

  return (
    <div className="trending-section">
      <div className="trending-header">
        <span className="trending-fire">&#x1F525;</span>
        <span>trending right now</span>
      </div>
      <div className="trending-scroll">
        <div className="trending-list">
          {trending.map((item, i) => (
            <button
              key={item.mood}
              className={`trending-chip ${i === 0 ? "top" : ""}`}
              onClick={() => onSelectMood(item.mood)}
              disabled={isLoading}
            >
              <span className="trending-mood">{item.mood}</span>
              <span className="trending-badge">{item.count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
