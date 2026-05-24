import React from "react";
import { PieChart } from "lucide-react";
import { CATEGORY_COLORS } from "../utils/constants.js";
import { buildDailyCategoryStats } from "../utils/event.js";

export default function DailyDonutChart({ events }) {
  const stats = buildDailyCategoryStats(events);
  if (stats.length === 0) return null;

  const total = stats.reduce((s, c) => s + c.minutes, 0);
  let cumulative = 0;
  const segments = stats.map((cat, i) => {
    const start = cumulative;
    cumulative += (cat.minutes / total) * 100;
    return { ...cat, start, end: cumulative, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] };
  });

  const conicGradient = segments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ");

  return (
    <div className="donut-chart-section">
      <div className="panel-title">
        <span><PieChart size={17} /> 当日时间分配</span>
        <small>{(total / 60).toFixed(1)}h</small>
      </div>
      <div className="donut-wrap">
        <div
          className="donut"
          style={{ background: `conic-gradient(${conicGradient})` }}
        >
          <span>{(total / 60).toFixed(1)}h</span>
        </div>
        <div className="legend-list">
          {stats.map((cat, i) => (
            <div className="legend-row" key={cat.name}>
              <i style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
              <span>{cat.name}</span>
              <strong>{cat.hours}h</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
