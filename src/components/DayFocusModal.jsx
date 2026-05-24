import React from "react";
import { X, MapPin, Clock3, ArrowUpRight } from "lucide-react";
import { formatDateZh, getQuoteForDate } from "../utils/date.js";
import { getDuration, computeIdleTime } from "../utils/event.js";

export default function DayFocusModal({ dateKey, events, onClose, onCreateFromModal }) {
  const quote = getQuoteForDate(dateKey);
  const totalMinutes = events.reduce((sum, event) => sum + getDuration(event), 0);
  const idleMinutes = computeIdleTime(events);

  const morningEvents = events.filter((e) => {
    if (!e.start_time) return false;
    const h = parseInt(e.start_time.split(":")[0]);
    return h < 12;
  });
  const afternoonEvents = events.filter((e) => {
    if (!e.start_time) return false;
    const h = parseInt(e.start_time.split(":")[0]);
    return h >= 12 && h < 18;
  });
  const eveningEvents = events.filter((e) => {
    if (!e.start_time) return false;
    const h = parseInt(e.start_time.split(":")[0]);
    return h >= 18;
  });
  const allDayEvents = events.filter((e) => !e.start_time);

  function renderTimeline(label, list) {
    if (list.length === 0) return null;
    return (
      <div className="focus-group">
        <h4 className="focus-group-title">{label}</h4>
        {list.map((event) => (
          <article className="focus-event" key={event.id}>
            <div className="focus-time">
              <strong>{event.start_time || "全天"}</strong>
              <span>{event.end_time || "未设置结束时间"}</span>
            </div>
            <div className="focus-event-card">
              <div className="focus-event-head">
                <strong>{event.title}</strong>
                <span>{event.category || "General"}</span>
              </div>
              {event.location && <p className="event-meta"><MapPin size={14} />{event.location}</p>}
              {event.description && <p className="event-desc">{event.description}</p>}
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="focus-overlay" onClick={onClose}>
      <section className="focus-modal" onClick={(event) => event.stopPropagation()}>
        <div className="focus-header">
          <div>
            <span className="overline">Expanded Day</span>
            <h2>{formatDateZh(dateKey)}</h2>
            <p className="focus-quote">{quote}</p>
          </div>
          <button type="button" className="round-button" onClick={onClose} title="关闭放大视图">
            <X size={20} />
          </button>
        </div>

        <div className="focus-summary">
          <div>
            <strong>{events.length}</strong>
            <span>当日安排</span>
          </div>
          <div>
            <strong>{(totalMinutes / 60).toFixed(1)}</strong>
            <span>总时长</span>
          </div>
          <div>
            <strong>{(idleMinutes / 60).toFixed(1)}</strong>
            <span>空闲时间</span>
          </div>
          <div>
            <strong>{events.length ? (totalMinutes / events.length / 60).toFixed(1) : "0"}</strong>
            <span>平均时长(h)</span>
          </div>
        </div>

        <div className="focus-timeline">
          {events.length === 0 && (
            <div className="empty-state">
              这一天还没有安排，正好留给灵感和休息。
              <br />
              <button
                className="primary-action"
                type="button"
                style={{ marginTop: 10 }}
                onClick={() => onCreateFromModal && onCreateFromModal()}
              >
                <ArrowUpRight size={14} /> 添加日程
              </button>
            </div>
          )}
          {renderTimeline("全天 · All Day", allDayEvents)}
          {renderTimeline("上午 · Morning", morningEvents)}
          {renderTimeline("下午 · Afternoon", afternoonEvents)}
          {renderTimeline("晚上 · Evening", eveningEvents)}
        </div>
      </section>
    </div>
  );
}
