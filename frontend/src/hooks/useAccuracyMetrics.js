import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useAccuracyMetrics(startDate = '2026-01-01', endDate = '2026-01-01', cutoff = '12:00') {
  const [summary, setSummary] = useState(null);
  const [settlementProfile, setSettlementProfile] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, profRes, distRes, dailyRes] = await Promise.all([
        api.getAnalyticsSummary(startDate, endDate, cutoff),
        api.getSettlementProfile(startDate, endDate, cutoff),
        api.getErrorDistribution(startDate, endDate, cutoff),
        api.getDailyAccuracy('2026-01-01', '2026-01-31', cutoff),
      ]);

      setSummary(sumRes.metrics);
      setSettlementProfile(profRes.periods || []);
      setDistribution(distRes);
      setDailyLeaderboard(dailyRes.days || []);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message || 'Failed to fetch analytics from Elexon data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cutoff]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  return {
    summary,
    settlementProfile,
    distribution,
    dailyLeaderboard,
    loading,
    error,
    refresh: fetchAllAnalytics,
  };
}
