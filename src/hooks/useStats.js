import { useState, useCallback } from "react";
import { api } from "../utils/api.js";

export function useStats() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const payload = await api("/api/stats");
      setStats(payload);
      return payload;
    } finally {
      setStatsLoading(false);
    }
  }, []);

  return { stats, statsLoading, fetchStats };
}
