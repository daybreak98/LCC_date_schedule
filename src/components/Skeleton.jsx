import React from "react";

export default function Skeleton({ type = "card", count = 1 }) {
  const items = Array.from({ length: count }, (_, i) => i);
  if (type === "metric") {
    return (
      <div className="skeleton-metric-list">
        {items.map((i) => (
          <div className="skeleton-metric" key={i}>
            <div className="skeleton-icon" />
            <div>
              <div className="skeleton-line skeleton-line-big" />
              <div className="skeleton-line" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (type === "calendar") {
    return (
      <div className="skeleton-calendar">
        <div className="skeleton-weekdays">
          {items.map((i) => (
            <div className="skeleton-cell" key={i} />
          ))}
        </div>
        <div className="skeleton-grid">
          {Array.from({ length: 35 }, (_, i) => (
            <div className="skeleton-cell" key={i} />
          )).map((el, i) => el)}
        </div>
      </div>
    );
  }
  return (
    <div className="skeleton-list">
      {items.map((i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line skeleton-line-big" />
          <div className="skeleton-line" />
        </div>
      ))}
    </div>
  );
}
