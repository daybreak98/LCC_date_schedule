import React, { useRef } from "react";
import { Plus, X } from "lucide-react";
import { formatDateZh } from "../utils/date.js";
import { getDuration } from "../utils/event.js";
import EditableEventCard from "./EditableEventCard.jsx";
import TimeSelect from "./TimeSelect.jsx";

export default function DetailDrawer({
  open, selectedDate, events, onClose,
  onCreate, onUpdate, onDelete, onConfirmDelete,
}) {
  const formRef = useRef(null);
  const totalMinutes = events.reduce((sum, event) => sum + getDuration(event), 0);

  async function handleSubmit(event) {
    event.preventDefault();
    await onCreate(new FormData(event.currentTarget));
    formRef.current?.reset();
  }

  return (
    <aside className={`detail-drawer ${open ? "is-open" : ""}`}>
      <div className="drawer-head">
        <div>
          <span className="overline">Day Detail</span>
          <h2>{formatDateZh(selectedDate)}</h2>
        </div>
        <button type="button" className="round-button" onClick={onClose} title="收起详情">
          <X size={20} />
        </button>
      </div>

      <div className="day-kpis">
        <div><strong>{events.length}</strong><span>事件数</span></div>
        <div><strong>{(totalMinutes / 60).toFixed(1)}</strong><span>小时</span></div>
      </div>

      <div className="timeline">
        {events.length === 0 && (
          <div className="empty-state">这一天还没有安排，可以从下面添加第一条。</div>
        )}
        {events.map((event) => (
          <EditableEventCard
            event={event}
            key={event.id}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onConfirmDelete={onConfirmDelete}
          />
        ))}
      </div>

      <form className="quick-form" ref={formRef} onSubmit={handleSubmit}>
        <div className="panel-title">
          <span><Plus size={17} /> 添加安排</span>
          <small>{selectedDate}</small>
        </div>
        <input name="title" required placeholder="事件标题" />
        <div className="two-col">
          <TimeSelect name="start_time" label="开始时间" />
          <TimeSelect name="end_time" label="结束时间" />
        </div>
        <div className="two-col">
          <input name="category" placeholder="分类" list="cat-suggestions" />
          <input name="location" placeholder="地点" />
        </div>
        <textarea name="description" rows="3" placeholder="备注" />
        <button className="primary-action" type="submit">保存日程</button>
      </form>
    </aside>
  );
}
