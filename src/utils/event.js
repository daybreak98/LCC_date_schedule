import { pad } from "./date.js";

export const eventAbbr = (title = "") =>
  Array.from(title.trim() || "事项").slice(0, 2).join("");

export const sortEvents = (events) =>
  [...events].sort((a, b) =>
    `${a.start_time || "99:99"}${a.title}`.localeCompare(
      `${b.start_time || "99:99"}${b.title}`,
      "zh-CN"
    )
  );

export function getDuration(event) {
  if (!event.start_time || !event.end_time) return 0;
  const [startHour, startMinute] = event.start_time.split(":").map(Number);
  const [endHour, endMinute] = event.end_time.split(":").map(Number);
  return Math.max(0, endHour * 60 + endMinute - startHour * 60 - startMinute);
}

export function formToPayload(formData, eventDate) {
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

export function computeIdleTime(events) {
  const sorted = sortEvents(events).filter((e) => e.start_time && e.end_time);
  if (sorted.length < 2) return 0;
  let idle = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const [eh, em] = sorted[i].end_time.split(":").map(Number);
    const [sh, sm] = sorted[i + 1].start_time.split(":").map(Number);
    const gap = sh * 60 + sm - eh * 60 - em;
    if (gap > 0) idle += gap;
  }
  return idle;
}

export function buildDailyCategoryStats(events) {
  const categories = {};
  let total = 0;
  for (const event of events) {
    const minutes = getDuration(event) || 30;
    const cat = event.category || "General";
    categories[cat] = (categories[cat] || 0) + minutes;
    total += minutes;
  }
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([name, minutes]) => ({
      name,
      minutes,
      hours: (minutes / 60).toFixed(1),
      percent: total ? ((minutes / total) * 100).toFixed(1) : "0",
    }));
}

export function buildWeeklyCategoryStats(viewDate, monthEvents) {
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
    const [y, m, d] = event.event_date.split("-").map(Number);
    const eventDate = new Date(y, m - 1, d);
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
      .map(([name, minutes]) => ({
        name,
        minutes,
        hours: (minutes / 60).toFixed(1),
      })),
  }));
}

export function buildMonthlyTrendData(monthEvents, viewDate) {
  const dailyData = {};
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    const key = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    dailyData[key] = { date: key, minutes: 0, count: 0, categories: {} };
  }

  for (const event of monthEvents) {
    const parts = event.event_date.split("-");
    const key = `${parts[1]}-${parts[2]}`;
    if (!dailyData[key]) continue;
    const minutes = getDuration(event) || 30;
    dailyData[key].minutes += minutes;
    dailyData[key].count += 1;
    const cat = event.category || "General";
    dailyData[key].categories[cat] = (dailyData[key].categories[cat] || 0) + minutes;
  }

  return Object.values(dailyData);
}

export function buildWeekdayDistribution(monthEvents) {
  const dist = Array(7).fill(0);
  for (const event of monthEvents) {
    const [y, m, d] = event.event_date.split("-").map(Number);
    const wd = new Date(y, m - 1, d).getDay();
    const idx = wd === 0 ? 6 : wd - 1;
    dist[idx] += getDuration(event) || 30;
  }
  return dist;
}
