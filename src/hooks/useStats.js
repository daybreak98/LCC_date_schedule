import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

function durationMinutes(event) {
  if (!event.start_time || !event.end_time) return 0;
  const [sh, sm] = event.start_time.split(":").map(Number);
  const [eh, em] = event.end_time.split(":").map(Number);
  return Math.max(0, eh * 60 + em - sh * 60 - sm);
}

export function useStats() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data: allEvents, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date")
        .order("start_time");

      if (error) throw error;

      const events = allEvents || [];
      const today = new Date();
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      const monthEnd = (() => {
        const d = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })();
      const monthEvents = events.filter(
        (e) => e.event_date >= monthStart && e.event_date <= monthEnd
      );

      const byDay = {};
      const byCategory = {};
      const byWeekday = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };
      let monthMinutes = 0;
      let allMinutes = 0;

      for (const event of monthEvents) {
        byDay[event.event_date] = (byDay[event.event_date] || 0) + 1;
        byCategory[event.category] = (byCategory[event.category] || 0) + 1;
        const wd = new Date(event.event_date + "T00:00:00").getDay();
        byWeekday[String(wd)] = (byWeekday[String(wd)] || 0) + 1;
        monthMinutes += durationMinutes(event);
      }

      for (const event of events) {
        allMinutes += durationMinutes(event);
      }

      const busiestEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0] || ["", 0];
      const topCategoryEntry = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0] || ["General", 0];

      const result = {
        total: events.length,
        month_total: monthEvents.length,
        scheduled_days: Object.keys(byDay).length,
        busiest_day: { date: busiestEntry[0], count: busiestEntry[1] },
        top_category: { name: topCategoryEntry[0], count: topCategoryEntry[1] },
        total_hours: Math.round((monthMinutes / 60) * 10) / 10,
        all_time_hours: Math.round((allMinutes / 60) * 10) / 10,
        by_day: byDay,
        by_category: byCategory,
        by_weekday: byWeekday,
      };

      setStats(result);
      return result;
    } finally {
      setStatsLoading(false);
    }
  }, []);

  return { stats, statsLoading, fetchStats };
}
