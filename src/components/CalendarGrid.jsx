import React from "react";
import { Maximize2 } from "lucide-react";
import { WEEKDAYS } from "../utils/constants.js";
import { toDateKey, isSameDate } from "../utils/date.js";
import { sortEvents, eventAbbr } from "../utils/event.js";

export default function CalendarGrid({
  range, today, viewDate, selectedDate,
  eventsByDate, onSelect, onFocusDay, onHover,
  monthlyTrendData,
}) {
  const cells = [];
  const cursor = new Date(range.gridStart);
  while (cursor <= range.gridEnd) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxMinutes = monthlyTrendData
    ? Math.max(1, ...monthlyTrendData.map((d) => d.minutes))
    : 1;

  return (
    <section className="calendar-panel">
      <div className="weekday-row">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const key = toDateKey(cell);
          const dayEvents = sortEvents(eventsByDate[key] || []);
          const isMuted = cell.getMonth() !== viewDate.getMonth();
          const isToday = isSameDate(cell, today);
          const isSelected = selectedDate === key;

          const parts = key.split("-");
          const trendKey = `${parts[1]}-${parts[2]}`;
          const trendEntry = monthlyTrendData?.find((d) => d.date === trendKey);
          const heatIntensity = trendEntry ? trendEntry.minutes / maxMinutes : 0;

          return (
            <button
              className={`day-cell ${isMuted ? "is-muted" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
              data-date={key}
              data-testid="day-cell"
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              onDoubleClick={() => onFocusDay(key)}
              onMouseEnter={(event) => onHover({ x: event.clientX, y: event.clientY, date: key, events: dayEvents })}
              onMouseMove={(event) => onHover({ x: event.clientX, y: event.clientY, date: key, events: dayEvents })}
              onMouseLeave={() => onHover(null)}
              onContextMenu={(event) => {
                event.preventDefault();
                onSelect(key);
              }}
            >
              <div className="day-cell-top">
                <span className="day-number">{cell.getDate()}</span>
                <span className="focus-hint" title="双击放大查看当天详情">
                  <Maximize2 size={13} />
                </span>
              </div>
              <div
                className="day-load"
                style={{
                  "--load": Math.min(dayEvents.length, 6),
                  opacity: 0.15 + heatIntensity * 0.85,
                }}
              />
              {trendEntry && trendEntry.minutes > 0 && (
                <span className="day-hours">{(trendEntry.minutes / 60).toFixed(1)}h</span>
              )}
              <div className="event-chips">
                {dayEvents.slice(0, 4).map((event) => (
                  <span className="event-chip" key={event.id} title={`${event.start_time || "全天"} ${event.title}`}>
                    {eventAbbr(event.title)}
                  </span>
                ))}
                {dayEvents.length > 4 && <span className="more-chip">+{dayEvents.length - 4}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
