import React, { useState, useEffect } from "react";
import { getMoodHistory } from "../api";

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getMoodColor(valence, energy) {
  if (valence === "positive" && energy === "high") return "#5ce0d8";
  if (valence === "positive") return "#3aa8a0";
  if (valence === "negative" && energy === "high") return "#e878a8";
  if (valence === "negative") return "#5078c8";
  if (energy === "high") return "#e8b450";
  return "#a07ce8";
}

export default function MoodHeatmap() {
  const [history, setHistory] = useState([]);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    getMoodHistory().then(setHistory);
  }, []);

  if (history.length === 0) return null;

  // Group by date
  const byDate = {};
  history.forEach((entry) => {
    const date = entry.created_at.split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(entry);
  });

  // Stats
  const totalMoods = history.length;
  const moodCounts = { positive: 0, negative: 0, neutral: 0 };
  history.forEach((entry) => {
    const v = entry.valence || "neutral";
    if (v in moodCounts) moodCounts[v]++;
    else moodCounts.neutral++;
  });
  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const uniqueDays = Object.keys(byDate).length;

  // Build 12 weeks ending today (like GitHub)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Find Monday 12 weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - (12 * 7 - 1));
  const dow = start.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  start.setDate(start.getDate() - mondayOffset);

  // Build all days from start to today + pad
  const weeks = [];
  const current = new Date(start);
  while (current <= today || (weeks.length > 0 && weeks[weeks.length - 1].length < 7)) {
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) {
      weeks.push([]);
    }
    const dateStr = current.toISOString().split("T")[0];
    weeks[weeks.length - 1].push({
      date: dateStr,
      isFuture: current > today,
    });
    current.setDate(current.getDate() + 1);
  }

  const handleHover = (e, dateStr, moods) => {
    if (!moods || moods.length === 0) { setTooltip(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, date: dateStr, moods });
  };

  return (
    <div className="hm-container">
      <div className="hm-top">
        <span className="hm-title">your mood journey</span>
        <span className="hm-subtitle">{totalMoods} mood{totalMoods !== 1 ? "s" : ""} · {uniqueDays} day{uniqueDays !== 1 ? "s" : ""} · mostly {dominantMood[0]}</span>
      </div>

      {/* Distribution bar */}
      <div className="hm-bar">
        {moodCounts.positive > 0 && <div className="hm-bar-seg" style={{ flex: moodCounts.positive, background: "var(--accent)" }} />}
        {moodCounts.neutral > 0 && <div className="hm-bar-seg" style={{ flex: moodCounts.neutral, background: "var(--purple)" }} />}
        {moodCounts.negative > 0 && <div className="hm-bar-seg" style={{ flex: moodCounts.negative, background: "#5078c8" }} />}
      </div>

      <div className="hm-card">
        <div className="hm-body">
          {/* Day labels */}
          <div className="hm-day-labels">
            {DAY_LABELS.map((d, i) => <div key={i} className="hm-day-label">{d}</div>)}
          </div>

          {/* Grid */}
          <div className="hm-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="hm-col">
                {week.map((day) => {
                  const moods = byDate[day.date] || [];
                  const isToday = day.date === todayStr;
                  const hasMoods = moods.length > 0 && !day.isFuture;

                  let cellStyle = {};
                  if (hasMoods) {
                    const dominant = moods[0];
                    cellStyle.backgroundColor = getMoodColor(dominant.valence, dominant.energy);
                  }

                  return (
                    <div
                      key={day.date}
                      className={`hm-cell ${hasMoods ? "active" : ""} ${isToday ? "today" : ""} ${day.isFuture ? "future" : ""}`}
                      style={cellStyle}
                      onMouseEnter={hasMoods ? (e) => handleHover(e, day.date, moods) : undefined}
                      onMouseLeave={hasMoods ? () => setTooltip(null) : undefined}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="hm-footer">
          <div className="hm-legend">
            <span className="hm-legend-label">less</span>
            <div className="hm-legend-cell" />
            <div className="hm-legend-cell" style={{ backgroundColor: "var(--accent)", opacity: 0.4 }} />
            <div className="hm-legend-cell" style={{ backgroundColor: "var(--accent)", opacity: 0.6 }} />
            <div className="hm-legend-cell" style={{ backgroundColor: "var(--accent)", opacity: 0.8 }} />
            <div className="hm-legend-cell" style={{ backgroundColor: "var(--accent)" }} />
            <span className="hm-legend-label">more</span>
          </div>
          <div className="hm-colors">
            <span className="hm-color-item"><span className="hm-dot" style={{ background: "#5ce0d8" }} />happy</span>
            <span className="hm-color-item"><span className="hm-dot" style={{ background: "#5078c8" }} />sad</span>
            <span className="hm-color-item"><span className="hm-dot" style={{ background: "#e878a8" }} />intense</span>
            <span className="hm-color-item"><span className="hm-dot" style={{ background: "#a07ce8" }} />chill</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="hm-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="hm-tooltip-date">{tooltip.date}</div>
          {tooltip.moods.slice(0, 3).map((m, i) => (
            <div key={i} className="hm-tooltip-row">
              <span className="hm-dot" style={{ background: getMoodColor(m.valence, m.energy) }} />
              <span>{m.mood_text}</span>
            </div>
          ))}
          {tooltip.moods.length > 3 && <div className="hm-tooltip-more">+{tooltip.moods.length - 3} more</div>}
        </div>
      )}
    </div>
  );
}
