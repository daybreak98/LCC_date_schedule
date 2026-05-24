import React from "react";
import { Coffee } from "lucide-react";
import { computeIdleTime, getDuration, sortEvents } from "../utils/event.js";

export default function IdleTimePanel({ events }) {
  const total = events.reduce((s, e) => s + getDuration(e), 0);
  const idle = computeIdleTime(events);
  const busy = total;
  const totalSpan = busy + idle;
  const busyPct = totalSpan > 0 ? (busy / totalSpan) * 100 : 0;
  const idlePct = totalSpan > 0 ? (idle / totalSpan) * 100 : 0;

  const sorted = sortEvents(events).filter((e) => e.start_time && e.end_time);
  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const [eh, em] = sorted[i].end_time.split(":").map(Number);
    const [sh, sm] = sorted[i + 1].start_time.split(":").map(Number);
    const gap = sh * 60 + sm - eh * 60 - em;
    if (gap > 0) {
      gaps.push({ between: `${sorted[i].title} → ${sorted[i + 1].title}`, minutes: gap });
    }
  }

  return (
    <div className="idle-panel">
      <div className="panel-title">
        <span><Coffee size={17} /> 空闲与间隙</span>
        <small>{(idle / 60).toFixed(1)}h 可支配</small>
      </div>
      {totalSpan > 0 && (
        <div className="idle-bar-wrap">
          <div className="idle-bar">
            <div className="idle-busy" style={{ width: `${busyPct}%` }}>
              <span>{busyPct > 12 ? `${busyPct.toFixed(0)}%` : ""}</span>
            </div>
            <div className="idle-free" style={{ width: `${idlePct}%` }}>
              <span>{idlePct > 12 ? `${idlePct.toFixed(0)}%` : ""}</span>
            </div>
          </div>
          <div className="idle-legend">
            <span>已安排 {(busy / 60).toFixed(1)}h</span>
            <span>空闲 {(idle / 60).toFixed(1)}h</span>
          </div>
        </div>
      )}
      {gaps.length > 0 && (
        <div className="gap-list">
          {gaps.map((g, i) => (
            <div className="gap-row" key={i}>
              <span>{g.between}</span>
              <strong>{(g.minutes / 60).toFixed(1)}h</strong>
            </div>
          ))}
        </div>
      )}
      {gaps.length === 0 && events.length > 0 && (
        <p className="weekly-empty">当天没有时间冲突或空闲间隙。</p>
      )}
    </div>
  );
}
