import React from "react";
import { formatDateZh } from "../utils/date.js";

export default function HoverCard({ hover }) {
  if (!hover) return null;
  const title = hover.events.length ? `${hover.events.length} 项安排` : "暂无安排";
  const timeText = hover.events
    .slice(0, 4)
    .map((event) => `${event.start_time || "全天"} ${event.title}`)
    .join(" · ");

  const style = {};
  if (hover.x + 350 > window.innerWidth) {
    style.right = window.innerWidth - hover.x + 16;
  } else {
    style.left = hover.x + 16;
  }
  if (hover.y + 150 > window.innerHeight) {
    style.bottom = window.innerHeight - hover.y + 16;
  } else {
    style.top = hover.y + 16;
  }

  return (
    <div className="hover-card" style={style}>
      <strong>{formatDateZh(hover.date)} · {title}</strong>
      <span>{timeText || "点击当天可添加新事件，双击可放大查看"}</span>
    </div>
  );
}
