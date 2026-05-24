import React from "react";
import { TrendingUp } from "lucide-react";

export default function TrendChart({ trendData }) {
  if (!trendData || trendData.length === 0) return null;

  const max = Math.max(1, ...trendData.map((d) => d.minutes));
  const maxHours = (max / 60).toFixed(1);

  return (
    <div className="trend-chart-section">
      <div className="panel-title">
        <span><TrendingUp size={17} /> 每日时间趋势</span>
        <small>最高 {maxHours}h</small>
      </div>
      <div className="trend-chart">
        {trendData.map((d) => {
          const pct = (d.minutes / max) * 100;
          return (
            <div className="trend-bar" key={d.date} title={`${d.date}: ${(d.minutes / 60).toFixed(1)}h`}>
              <div
                className="trend-fill"
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
              <span>{d.date.split("-")[1]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
