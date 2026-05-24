import { useEffect, useCallback } from "react";
import { getMonthRange } from "../utils/date.js";

export function useKeyboardNav({
  viewDate, setViewDate,
  selectedDate, setSelectedDate,
  setIsDetailOpen,
}) {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.tagName === "SELECT") {
        return;
      }
      const range = getMonthRange(viewDate);
      const cells = [];
      const cursor = new Date(range.gridStart);
      while (cursor <= range.gridEnd) {
        cells.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      const currentIdx = cells.findIndex(
        (c) => `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, "0")}-${String(c.getDate()).padStart(2, "0")}` === selectedDate
      );

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          if (currentIdx > 0) {
            const prev = cells[currentIdx - 1];
            setSelectedDate(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`);
            setIsDetailOpen(true);
          } else {
            setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (currentIdx < cells.length - 1) {
            const next = cells[currentIdx + 1];
            setSelectedDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`);
            setIsDetailOpen(true);
          } else {
            setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (currentIdx >= 7) {
            const up = cells[currentIdx - 7];
            setSelectedDate(`${up.getFullYear()}-${String(up.getMonth() + 1).padStart(2, "0")}-${String(up.getDate()).padStart(2, "0")}`);
            setIsDetailOpen(true);
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          if (currentIdx < cells.length - 7) {
            const down = cells[currentIdx + 7];
            setSelectedDate(`${down.getFullYear()}-${String(down.getMonth() + 1).padStart(2, "0")}-${String(down.getDate()).padStart(2, "0")}`);
            setIsDetailOpen(true);
          }
          break;
        case "n":
        case "N":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            setIsDetailOpen(true);
          }
          break;
        case "t":
        case "T":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            setViewDate((d) => new Date(d.getFullYear(), d.getMonth(), 1));
            const today = new Date();
            setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
            setIsDetailOpen(true);
          }
          break;
        default:
          break;
      }
    },
    [viewDate, selectedDate, setViewDate, setSelectedDate, setIsDetailOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {};
}
