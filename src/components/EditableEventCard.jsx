import React, { useState } from "react";
import { Edit3, Trash2, MapPin, Check, X } from "lucide-react";
import TimeSelect from "./TimeSelect.jsx";

export default function EditableEventCard({ event, onUpdate, onDelete, onConfirmDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    await onUpdate(event.id, new FormData(submitEvent.currentTarget), event.event_date);
    setIsEditing(false);
  }

  function handleDeleteClick() {
    if (onConfirmDelete) {
      onConfirmDelete(event.id, event.title);
    } else {
      onDelete(event.id);
    }
  }

  if (isEditing) {
    return (
      <article className="timeline-item">
        <div className="time-badge">{event.start_time || "全天"}{event.end_time ? `-${event.end_time}` : ""}</div>
        <form className="event-card edit-card" onSubmit={handleSubmit}>
          <input name="title" required defaultValue={event.title} placeholder="事件标题" />
          <div className="two-col">
            <TimeSelect name="start_time" label="开始时间" value={event.start_time} />
            <TimeSelect name="end_time" label="结束时间" value={event.end_time} />
          </div>
          <div className="two-col">
            <input name="category" defaultValue={event.category} placeholder="分类" />
            <input name="location" defaultValue={event.location} placeholder="地点" />
          </div>
          <textarea name="description" rows="3" defaultValue={event.description} placeholder="备注" />
          <div className="edit-actions">
            <button className="save-edit" type="submit"><Check size={16} /> 保存</button>
            <button className="cancel-edit" type="button" onClick={() => setIsEditing(false)}><X size={16} /> 取消</button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="timeline-item">
      <div className="time-badge">{event.start_time || "全天"}{event.end_time ? `-${event.end_time}` : ""}</div>
      <div className="event-card">
        <div className="event-card-head">
          <div>
            <strong>{event.title}</strong>
            <span>{event.category}</span>
          </div>
          <div className="event-actions">
            <button type="button" onClick={() => setIsEditing(true)} title="编辑"><Edit3 size={16} /></button>
            <button type="button" onClick={handleDeleteClick} title="删除"><Trash2 size={16} /></button>
          </div>
        </div>
        {event.location && <p className="event-meta"><MapPin size={14} />{event.location}</p>}
        {event.description && <p className="event-desc">{event.description}</p>}
      </div>
    </article>
  );
}
