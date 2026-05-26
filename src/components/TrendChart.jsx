import React from "react";
import { TrendingUp } from "lucide-react";

export default function TrendChart({ trendData }) {
  if (!trendData || trendData.length === 0) return null;

  const max = Math.max(1, ...trendData.map((d) => d.minutes));
  const maxHours = (max / 60).toFixed(1);
  const activeDays = trendData.filter((d) => d.minutes > 0).length;

  function getEnergyLevel(minutes) {
    if (minutes === 0) return "idle";
    const ratio = minutes / max;
    if (ratio >= 0.72) return "high";
    if (ratio >= 0.34) return "medium";
    return "low";
  }

  return (
    <div className="trend-chart-section energy-panel">
      <div className="panel-title">
        <span><TrendingUp size={17} /> 每日能量场</span>
        <small>峰值 {maxHours}h · 活跃 {activeDays} 天</small>
      </div>
      <div className="energy-legend" aria-hidden="true">
        <span>低能</span>
        <i />
        <span>高能</span>
      </div>
      <div className="trend-chart energy-chart" aria-label="每日活动能量趋势">
        {trendData.map((d, index) => {
          const pct = (d.minutes / max) * 100;
          const energyLevel = getEnergyLevel(d.minutes);
          const hours = (d.minutes / 60).toFixed(1);
          const day = d.date.split("-")[1];

          return (
            <div
              className={`trend-bar energy-day energy-${energyLevel}`}
              key={d.date}
              title={`${d.date}: ${hours}h · ${d.count || 0} 项安排`}
              style={{
                "--energy-height": `${Math.max(pct, d.minutes ? 12 : 5)}%`,
                "--energy-delay": `${index * 22}ms`,
              }}
            >
              <div className="energy-column">
                <div className="energy-aura" />
                <div className="trend-fill energy-core">
                  <span className="energy-spark" />
                </div>
              </div>
              <span className="energy-day-label">{day}</span>
              <small className="energy-value">{d.minutes ? `${hours}h` : "休"}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
