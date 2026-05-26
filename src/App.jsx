import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus,
  Moon, Sun, Download, Settings2,
} from "lucide-react";
import { toDateKey, formatDateZh, formatMonth, monthKey, getMonthRange } from "./utils/date.js";
import { sortEvents } from "./utils/event.js";
import {
  buildWeeklyCategoryStats,
  buildMonthlyTrendData,
  buildWeekdayDistribution,
} from "./utils/event.js";
import { useEvents } from "./hooks/useEvents.js";
import { useStats } from "./hooks/useStats.js";
import { useKeyboardNav } from "./hooks/useKeyboardNav.js";
import { useToast } from "./hooks/useToast.js";
import { useConfirm } from "./hooks/useConfirm.js";
import ImportPanel from "./components/ImportPanel.jsx";
import MetricPanel from "./components/MetricPanel.jsx";
import CalendarGrid from "./components/CalendarGrid.jsx";
import WeeklyCategoryPanel from "./components/WeeklyCategoryPanel.jsx";
import DetailDrawer from "./components/DetailDrawer.jsx";
import DayFocusModal from "./components/DayFocusModal.jsx";
import HoverCard from "./components/HoverCard.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import ToastContainer from "./components/Toast.jsx";
import SearchFilter from "./components/SearchFilter.jsx";
import CategoryManager from "./components/CategoryManager.jsx";
import DailyDonutChart from "./components/DailyDonutChart.jsx";
import TrendChart from "./components/TrendChart.jsx";
import IdleTimePanel from "./components/IdleTimePanel.jsx";
import Skeleton from "./components/Skeleton.jsx";

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [focusedDate, setFocusedDate] = useState(null);
  const [hover, setHover] = useState(null);
  const [importStatus, setImportStatus] = useState("支持 .md / .json / .xml / .csv");
  const [isDetailOpen, setIsDetailOpen] = useState(true);
  const [addFormFocusNonce, setAddFormFocusNonce] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("schedule-dark") === "1"; } catch { return false; }
  });
  const [showCategoryMgr, setShowCategoryMgr] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState(null);
  const [filterMeta, setFilterMeta] = useState({});
  const [catColors, setCatColors] = useState({});

  const { events, isLoading, fetchEvents, createEvent, updateEvent, deleteEvent, importFile } = useEvents();
  const { stats, fetchStats } = useStats();
  const { toasts, addToast, removeToast } = useToast();
  const { confirmData, handleConfirm, cancelConfirm, confirm } = useConfirm();

  useKeyboardNav({ viewDate, setViewDate, selectedDate, setSelectedDate, setIsDetailOpen });

  const range = useMemo(() => getMonthRange(viewDate), [viewDate]);
  const eventsByDate = useMemo(() => {
    const source = filteredEvents || events;
    return source.reduce((groups, event) => {
      groups[event.event_date] ||= [];
      groups[event.event_date].push(event);
      return groups;
    }, {});
  }, [events, filteredEvents]);

  const selectedEvents = sortEvents(eventsByDate[selectedDate] || []);
  const focusedEvents = sortEvents(eventsByDate[focusedDate] || []);
  const monthEvents = events.filter((event) => event.event_date.startsWith(monthKey(viewDate)));
  const weeklyStats = useMemo(() => buildWeeklyCategoryStats(viewDate, monthEvents), [viewDate, monthEvents]);
  const trendData = useMemo(() => buildMonthlyTrendData(monthEvents, viewDate), [monthEvents, viewDate]);
  const weekdayDist = useMemo(() => buildWeekdayDistribution(monthEvents), [monthEvents]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try { localStorage.setItem("schedule-dark", darkMode ? "1" : "0"); } catch {}
  }, [darkMode]);

  async function refresh() {
    try {
      const [evtResult] = await Promise.all([
        fetchEvents(toDateKey(range.gridStart), toDateKey(range.gridEnd)),
        fetchStats(),
      ]);
      setFilteredEvents(null);
      setFilterMeta({});
    } catch (err) {
      setImportStatus(err.message);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, [range.gridStart, range.gridEnd]);

  async function handleCreate(formData) {
    try {
      await createEvent(formData, selectedDate);
      await refresh();
      addToast("日程已创建", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleUpdate(id, formData, eventDate) {
    try {
      await updateEvent(id, formData, eventDate);
      await refresh();
      addToast("日程已更新", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEvent(id);
      await refresh();
      addToast("日程已删除", "success");
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  async function handleConfirmDelete(id, title) {
    const result = await confirm(`确定要删除 "${title}" 吗？此操作不可撤销。`, "删除确认");
    if (result) {
      handleDelete(id);
    }
  }

  async function handleImport(file) {
    setImportStatus(`正在导入 ${file.name}`);
    try {
      const payload = await importFile(file);
      setImportStatus(`已导入 ${payload.imported} 条日程`);
      addToast(`成功导入 ${payload.imported} 条日程`, "success");
      await refresh();
    } catch (err) {
      setImportStatus(err.message);
      addToast(err.message, "error");
    }
  }

  function handleExport(format = "json") {
    const exportEvents = filteredEvents || events;
    let content = "";
    let filename = `schedule-export-${toDateKey(today)}`;
    let mime = "application/json";

    if (format === "json") {
      content = JSON.stringify(exportEvents.map((e) => ({
        title: e.title,
        date: e.event_date,
        start: e.start_time,
        end: e.end_time,
        category: e.category,
        location: e.location,
        description: e.description,
      })), null, 2);
      filename += ".json";
    } else if (format === "md") {
      const byDate = {};
      for (const e of exportEvents) {
        byDate[e.event_date] ||= [];
        byDate[e.event_date].push(e);
      }
      const lines = [];
      for (const [date, evts] of Object.entries(byDate).sort()) {
        lines.push(`## ${date}`);
        for (const e of sortEvents(evts)) {
          const time = e.start_time ? `${e.start_time}${e.end_time ? `-${e.end_time}` : ""} ` : "";
          lines.push(`- ${time}${e.title} | ${e.category || "General"}${e.description ? ` | ${e.description}` : ""}`);
        }
        lines.push("");
      }
      content = lines.join("\n");
      filename += ".md";
      mime = "text/markdown";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    addToast(`已导出为 ${format.toUpperCase()}`, "success");
  }

  function handleFiltered(events, meta) {
    setFilteredEvents(events);
    setFilterMeta(meta);
  }

  function shiftMonth(offset) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDay(key) {
    setSelectedDate(key);
    setIsDetailOpen(true);
  }

  function openAddForm() {
    setIsDetailOpen(true);
    setAddFormFocusNonce((value) => value + 1);
    addToast("已定位到添加日程表单", "success");
  }

  function focusDay(key) {
    setFocusedDate(key);
    setSelectedDate(key);
  }

  return (
    <div className={`app ${darkMode ? "dark" : ""} ${isDetailOpen ? "detail-open" : ""}`}>
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
          <div className="rail-actions">
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
            <button
              className="icon-button"
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "切换日间模式" : "切换夜间模式"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </section>

        <ImportPanel status={importStatus} onImport={handleImport} />

        {isLoading && !events.length ? (
          <Skeleton type="metric" count={4} />
        ) : (
          <MetricPanel stats={stats} />
        )}

        <section className="control-panel">
          <div className="panel-title">
            <span><Settings2 size={17} /> 快捷操作</span>
          </div>
          <div className="quick-actions">
            <button
              className="wide-button"
              type="button"
              onClick={() => handleExport("json")}
              title="导出 JSON"
            >
              <Download size={16} /> 导出 JSON
            </button>
            <button
              className="wide-button"
              type="button"
              onClick={() => handleExport("md")}
              title="导出 Markdown"
            >
              <Download size={16} /> 导出 MD
            </button>
            <button
              className="wide-button"
              type="button"
              onClick={() => setShowCategoryMgr(!showCategoryMgr)}
            >
              <Settings2 size={16} /> 管理分类
            </button>
          </div>
          {showCategoryMgr && (
            <CategoryManager
              categories={catColors}
              onUpdate={setCatColors}
            />
          )}
        </section>
      </aside>

      <main className="calendar-stage">
        <header className="stage-header">
          <div>
            <span className="overline">Interactive Calendar</span>
            <h2>{formatMonth(viewDate)} 计划视图</h2>
          </div>
          <div className="stage-actions">
            {isLoading && <span className="sync-pill">同步中</span>}
            {filterMeta.search && (
              <span className="sync-pill" style={{ background: "#e7f4ef", color: "#0f766e" }}>
                筛选: "{filterMeta.search}"
              </span>
            )}
            <button className="primary-action" type="button" onClick={openAddForm}>
              <Plus size={18} /> 新增日程
            </button>
          </div>
        </header>

        <SearchFilter events={events} onFiltered={handleFiltered} />

        {isLoading && !events.length ? (
          <Skeleton type="calendar" />
        ) : (
          <CalendarGrid
            range={range}
            today={today}
            viewDate={viewDate}
            selectedDate={selectedDate}
            eventsByDate={eventsByDate}
            onSelect={selectDay}
            onFocusDay={focusDay}
            onHover={setHover}
            monthlyTrendData={trendData}
          />
        )}

        {selectedEvents.length > 0 && (
          <div className="day-analytics">
            <DailyDonutChart events={selectedEvents} />
            <IdleTimePanel events={selectedEvents} />
          </div>
        )}

        {monthEvents.length > 0 && (
          <TrendChart trendData={trendData} />
        )}

        <WeeklyCategoryPanel
          weeklyStats={weeklyStats}
          weekdayDist={weekdayDist}
        />
      </main>

      <DetailDrawer
        open={isDetailOpen}
        focusNonce={addFormFocusNonce}
        selectedDate={selectedDate}
        events={selectedEvents}
        onClose={() => setIsDetailOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onConfirmDelete={handleConfirmDelete}
      />

      {focusedDate && (
        <DayFocusModal
          dateKey={focusedDate}
          events={focusedEvents}
          onClose={() => setFocusedDate(null)}
          onCreateFromModal={() => {
            setFocusedDate(null);
            setIsDetailOpen(true);
          }}
        />
      )}

      <HoverCard hover={hover} />
      <ConfirmDialog
        data={confirmData}
        onConfirm={handleConfirm}
        onCancel={cancelConfirm}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
