import { DAILY_QUOTES } from "./constants.js";

export const pad = (value) => String(value).padStart(2, "0");

export const toDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromDateKey = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const monthKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

export const formatMonth = (date) =>
  `${date.getFullYear()}年 ${date.getMonth() + 1}月`;

export const formatDateZh = (key) => {
  const date = fromDateKey(key);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

export const isSameDate = (a, b) => toDateKey(a) === toDateKey(b);

export function getMonthRange(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const last = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
  return { first, last, gridStart, gridEnd };
}

export function getQuoteForDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const seed = year * 10000 + month * 100 + day;
  return DAILY_QUOTES[seed % DAILY_QUOTES.length];
}

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h)}:${pad(m)}`;
}

export function getTimeOfDay(hour) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
