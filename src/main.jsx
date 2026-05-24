import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  FileUp,
  MapPin,
  Maximize2,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import "./styles.css";

const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minute}`;
});
const DAILY_QUOTES = [
  "Keep your face always toward the sunshine.",
  "Small steps still shape a meaningful day.",
  "把今天过好，明天自然会来。",
  "Calm plans make brave lives.",
  "生活自有节奏，不必事事追赶。",
  "A gentle routine can carry bold dreams.",
  "认真生活的人，连平凡都闪光。",
  "Make room for work, wonder, and rest.",
  "今日宜专注，也宜热爱。",
  "Discipline turns hope into something visible.",
  "慢一点，反而更接近自己。",
  "A clear hour is worth a hurried day.",
];
const CATEGORY_COLORS = [
  "#0f766e",
  "#b45309",
  "#2563eb",
  "#be123c",
  "#6d28d9",
  "#4d7c0f",
  "#0369a1",
];

const pad = (value) => String(value).padStart(2, "0");
const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromDateKey = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const monthKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const formatMonth = (date) => `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
const formatDateZh = (key) => {
  const date = fromDateKey(key);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};
const isSameDate = (a, b) => toDateKey(a) === toDateKey(b);
const eventAbbr = (title = "") => Array.from(title.trim() || "事项").slice(0, 2).join("");
const sortEvents = (events) =>
  [...events].sort((a, b) => `${a.start_time || "99:99"}${a.title}`.localeCompare(`${b.start_time || "99:99"}${b.title}`, "zh-CN"));

function getMonthRange(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const last = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
  return { first, last, gridStart, gridEnd };
}

function getQuoteForDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const seed = year * 10000 + month * 100 + day;
  return DAILY_QUOTES[seed % DAILY_QUOTES.length];
}

function getDuration(event) {
  if (!event.start_time || !event.end_time) return 0;
  const [startHour, startMinute] = event.start_time.split(":").map(Number);
  const [endHour, endMinute] = event.end_time.split(":").map(Number);
  return Math.max(0, endHour * 60 + endMinute - startHour * 60 - startMinute);
}

function buildWeeklyCategoryStats(viewDate, monthEvents) {
  const weeks = new Map();
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  for (let cursor = new Date(monthStart); cursor <= monthEnd; cursor.setDate(cursor.getDate() + 1)) {
    const current = new Date(cursor);
    const weekIndex = Math.floor((current.getDate() - 1) / 7) + 1;
    if (!weeks.has(weekIndex)) {
      weeks.set(weekIndex, {
        label: `第 ${weekIndex} 周`,
        totalMinutes: 0,
        categories: {},
      });
    }
  }

  for (const event of monthEvents) {
    const eventDate = fromDateKey(event.event_date);
    const weekIndex = Math.floor((eventDate.getDate() - 1) / 7) + 1;
    const bucket = weeks.get(weekIndex);
    if (!bucket) continue;
    const minutes = getDuration(event) || 30;
    const category = event.category || "General";
    bucket.totalMinutes += minutes;
    bucket.categories[category] = (bucket.categories[category] || 0) + minutes;
  }

  return Array.from(weeks.values()).map((week) => ({
    ...week,
    categoryList: Object.entries(week.categories)
      .sort((a, b) => b[1] - a[1])
      .map(([name, minutes]) => ({ name, minutes, hours: (minutes / 60).toFixed(1) })),
  }));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "请求失败");
  }
  return payload;
}

function formToPayload(formData, eventDate) {
  return {
    title: formData.get("title"),
    event_date: eventDate,
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    category: formData.get("category"),
    location: formData.get("location"),
    description: formData.get("description"),
  };
}

function App() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [focusedDate, setFocusedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [hover, setHover] = useState(null);
  const [importStatus, setImportStatus] = useState("支持 .md / .json / .xml");
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const range = useMemo(() => getMonthRange(viewDate), [viewDate]);
  const eventsByDate = useMemo(() => {
    return events.reduce((groups, event) => {
      groups[event.event_date] ||= [];
      groups[event.event_date].push(event);
      return groups;
    }, {});
  }, [events]);

  const selectedEvents = sortEvents(eventsByDate[selectedDate] || []);
  const focusedEvents = sortEvents(eventsByDate[focusedDate] || []);
  const monthEvents = events.filter((event) => event.event_date.startsWith(monthKey(viewDate)));
  const weeklyStats = useMemo(() => buildWeeklyCategoryStats(viewDate, monthEvents), [viewDate, monthEvents]);

  async function refresh() {
    setIsLoading(true);
    try {
      const [eventPayload, statsPayload] = await Promise.all([
        api(`/api/events?start=${toDateKey(range.gridStart)}&end=${toDateKey(range.gridEnd)}`),
        api("/api/stats"),
      ]);
      setEvents(eventPayload.events);
      setStats(statsPayload);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch((error) => setImportStatus(error.message));
  }, [range.gridStart, range.gridEnd]);

  async function createEvent(formData) {
    await api("/api/events", {
      method: "POST",
      body: JSON.stringify(formToPayload(formData, selectedDate)),
    });
    await refresh();
  }

  async function updateEvent(id, formData, eventDate) {
    await api(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(formToPayload(formData, eventDate)),
    });
    await refresh();
  }

  async function deleteEvent(id) {
    await api(`/api/events/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function importFile(file) {
    if (!file) return;
    setImportStatus(`正在导入 ${file.name}`);
    const content = await file.text();
    const payload = await api("/api/import", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, content }),
    });
    setImportStatus(`已导入 ${payload.imported} 条日程`);
    await refresh();
  }

  function shiftMonth(offset) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDay(key) {
    setSelectedDate(key);
    setIsDetailOpen(true);
  }

  function focusDay(key) {
    setFocusedDate(key);
    setSelectedDate(key);
  }

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand-block">
          <div className="brand-icon"><CalendarDays size={25} /></div>
          <div>
            <h1>日程管理</h1>
            <p>{formatDateZh(toDateKey(today))}</p>
          </div>
        </div>

        <section className="control-panel">
          <div className="month-switcher">
            <button type="button" onClick={() => shiftMonth(-1)} title="上个月"><ChevronLeft size={20} /></button>
            <div>
              <strong>{formatMonth(viewDate)}</strong>
              <span>{monthEvents.length} 项安排</span>
            </div>
            <button type="button" onClick={() => shiftMonth(1)} title="下个月"><ChevronRight size={20} /></button>
          </div>
          <button
            className="wide-button"
            type="button"
            onClick={() => {
              setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelectedDate(toDateKey(today));
            }}
          >
            回到今天
          </button>
        </section>

        <ImportPanel
          status={importStatus}
          inputRef={fileInputRef}
          onImport={(file) => importFile(file).catch((error) => setImportStatus(error.message))}
        />

        <MetricPanel stats={stats} />
      </aside>

      <main className="calendar-stage">
        <header className="stage-header">
          <div>
            <span className="overline">Interactive Calendar</span>
            <h2>{formatMonth(viewDate)} 计划视图</h2>
          </div>
          <div className="stage-actions">
            {isLoading && <span className="sync-pill">同步中</span>}
            <button className="primary-action" type="button" onClick={() => setIsDetailOpen(true)}>
              <Plus size={18} /> 新增日程
            </button>
          </div>
        </header>

        <CalendarGrid
          range={range}
          today={today}
          viewDate={viewDate}
          selectedDate={selectedDate}
          eventsByDate={eventsByDate}
          onSelect={selectDay}
          onFocusDay={focusDay}
          onHover={setHover}
        />

        <WeeklyCategoryPanel weeklyStats={weeklyStats} />
      </main>

      <DetailDrawer
        open={isDetailOpen}
        selectedDate={selectedDate}
        events={selectedEvents}
        onClose={() => setIsDetailOpen(false)}
        onCreate={createEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
      />

      {focusedDate && (
        <DayFocusModal
          dateKey={focusedDate}
          events={focusedEvents}
          onClose={() => setFocusedDate(null)}
        />
      )}

      {hover && <HoverCard hover={hover} />}
    </div>
  );
}

function ImportPanel({ status, inputRef, onImport }) {
  const [dragging, setDragging] = useState(false);

  return (
    <section className="control-panel import-card">
      <div className="panel-title">
        <span><FileUp size={17} /> 文件导入</span>
        <small>MD / JSON / XML</small>
      </div>
      <button
        className={`drop-area ${dragging ? "is-dragging" : ""}`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          onImport(event.dataTransfer.files?.[0]);
        }}
      >
        <UploadCloud size={28} />
        <strong>拖入或选择文件</strong>
        <span>JSON 对象数组、XML event 节点、Markdown 日期清单都可识别</span>
      </button>
      <input
        ref={inputRef}
        className="hidden-input"
        type="file"
        accept=".md,.markdown,.json,.xml"
        onChange={(event) => onImport(event.target.files?.[0])}
      />
      <p className="status-text">{status}</p>
    </section>
  );
}

function MetricPanel({ stats }) {
  const metrics = [
    { label: "总日程", value: stats?.total ?? 0, icon: CalendarDays },
    { label: "本月安排", value: stats?.month_total ?? 0, icon: Sparkles },
    { label: "有安排天数", value: stats?.scheduled_days ?? 0, icon: BarChart3 },
    { label: "计划小时", value: stats?.total_hours ?? 0, icon: Clock3 },
  ];

  return (
    <section className="control-panel">
      <div className="panel-title">
        <span><BarChart3 size={17} /> 指标</span>
        <small>实时统计</small>
      </div>
      <div className="metric-list">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div className="metric" key={metric.label}>
              <Icon size={18} />
              <div>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="insight-note">
        <strong>{stats?.top_category?.name || "General"}</strong>
        <span>当前最高频分类</span>
      </div>
    </section>
  );
}

function CalendarGrid({ range, today, viewDate, selectedDate, eventsByDate, onSelect, onFocusDay, onHover }) {
  const cells = [];
  const cursor = new Date(range.gridStart);
  while (cursor <= range.gridEnd) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <section className="calendar-panel">
      <div className="weekday-row">
        {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const key = toDateKey(cell);
          const dayEvents = sortEvents(eventsByDate[key] || []);
          const isMuted = cell.getMonth() !== viewDate.getMonth();
          const isToday = isSameDate(cell, today);
          const isSelected = selectedDate === key;
          return (
            <button
              className={`day-cell ${isMuted ? "is-muted" : ""} ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              onDoubleClick={() => onFocusDay(key)}
              onMouseEnter={(event) => onHover({ x: event.clientX, y: event.clientY, date: key, events: dayEvents })}
              onMouseMove={(event) => onHover({ x: event.clientX, y: event.clientY, date: key, events: dayEvents })}
              onMouseLeave={() => onHover(null)}
            >
              <div className="day-cell-top">
                <span className="day-number">{cell.getDate()}</span>
                <span className="focus-hint" title="双击放大查看当天详情">
                  <Maximize2 size={13} />
                </span>
              </div>
              <span className="day-load" style={{ "--load": Math.min(dayEvents.length, 6) }} />
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

function WeeklyCategoryPanel({ weeklyStats }) {
  return (
    <section className="weekly-panel">
      <div className="panel-title">
        <span><Clock3 size={17} /> 每周时间类目分类</span>
        <small>按当前月份统计</small>
      </div>
      <div className="weekly-list">
        {weeklyStats.map((week, weekIndex) => (
          <article className="weekly-card" key={week.label}>
            <div className="weekly-card-head">
              <div>
                <strong>{week.label}</strong>
                <span>{(week.totalMinutes / 60).toFixed(1)} 小时</span>
              </div>
            </div>
            {week.categoryList.length === 0 && <p className="weekly-empty">这一周还没有记录时间类目。</p>}
            {week.categoryList.length > 0 && (
              <div className="weekly-bars">
                {week.categoryList.map((category, categoryIndex) => {
                  const width = week.totalMinutes ? (category.minutes / week.totalMinutes) * 100 : 0;
                  return (
                    <div className="weekly-row" key={`${week.label}-${category.name}`}>
                      <div className="weekly-label">
                        <i style={{ background: CATEGORY_COLORS[(weekIndex + categoryIndex) % CATEGORY_COLORS.length] }} />
                        <span>{category.name}</span>
                      </div>
                      <div className="weekly-track">
                        <span
                          className="weekly-fill"
                          style={{
                            width: `${Math.max(width, 10)}%`,
                            background: CATEGORY_COLORS[(weekIndex + categoryIndex) % CATEGORY_COLORS.length],
                          }}
                        />
                      </div>
                      <strong>{category.hours}h</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function DetailDrawer({ open, selectedDate, events, onClose, onCreate, onUpdate, onDelete }) {
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
        <button type="button" className="round-button" onClick={onClose} title="收起详情"><X size={20} /></button>
      </div>

      <div className="day-kpis">
        <div><strong>{events.length}</strong><span>事件数</span></div>
        <div><strong>{(totalMinutes / 60).toFixed(1)}</strong><span>小时</span></div>
      </div>

      <div className="timeline">
        {events.length === 0 && <div className="empty-state">这一天还没有安排，可以从下面添加第一条。</div>}
        {events.map((event) => (
          <EditableEventCard
            event={event}
            key={event.id}
            onUpdate={onUpdate}
            onDelete={onDelete}
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
          <input name="category" placeholder="分类" />
          <input name="location" placeholder="地点" />
        </div>
        <textarea name="description" rows="3" placeholder="备注" />
        <button className="primary-action" type="submit">保存日程</button>
      </form>
    </aside>
  );
}

function EditableEventCard({ event, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    await onUpdate(event.id, new FormData(submitEvent.currentTarget), event.event_date);
    setIsEditing(false);
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
            <button type="button" onClick={() => onDelete(event.id)} title="删除"><Trash2 size={16} /></button>
          </div>
        </div>
        {event.location && <p className="event-meta"><MapPin size={14} />{event.location}</p>}
        {event.description && <p className="event-desc">{event.description}</p>}
      </div>
    </article>
  );
}

function DayFocusModal({ dateKey, events, onClose }) {
  const quote = getQuoteForDate(dateKey);
  const totalMinutes = events.reduce((sum, event) => sum + getDuration(event), 0);

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
        </div>

        <div className="focus-timeline">
          {events.length === 0 && <div className="empty-state">这一天还没有安排，正好留给灵感和休息。</div>}
          {events.map((event) => (
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
      </section>
    </div>
  );
}

function TimeSelect({ name, label, value = "" }) {
  const normalizedValue = TIME_OPTIONS.includes(value) ? value : "";
  return (
    <select name={name} defaultValue={normalizedValue} aria-label={label}>
      <option value="">{label}</option>
      {TIME_OPTIONS.map((option) => (
        <option value={option} key={option}>{option}</option>
      ))}
    </select>
  );
}

function HoverCard({ hover }) {
  const title = hover.events.length ? `${hover.events.length} 项安排` : "暂无安排";
  const timeText = hover.events
    .slice(0, 4)
    .map((event) => `${event.start_time || "全天"} ${event.title}`)
    .join(" · ");

  return (
    <div className="hover-card" style={{ left: hover.x + 16, top: hover.y + 16 }}>
      <strong>{formatDateZh(hover.date)} · {title}</strong>
      <span>{timeText || "点击当天可添加新事件，双击可放大查看"}</span>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
