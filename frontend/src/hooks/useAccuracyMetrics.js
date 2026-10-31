import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useAccuracyMetrics(startDate, endDate) {
  const [summary, setSummary] = useState(null);
  const [settlementProfile, setSettlementProfile] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [ramps, setRamps] = useState(null);
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, profRes, distRes, rampRes, dailyRes] = await Promise.all([
        api.getAnalyticsSummary(startDate, endDate),
        api.getSettlementProfile(startDate, endDate),
        api.getErrorDistribution(startDate, endDate),
        api.getRampAnalysis(startDate, endDate),
        api.getDailyAccuracy(startDate, endDate),
      ]);

      setSummary(sumRes.metrics);
      setSettlementProfile(profRes.periods || []);
      setDistribution(distRes);
      setRamps(rampRes);
      setDailyLeaderboard(dailyRes.days || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  return {
    summary,
    settlementProfile,
    distribution,
    ramps,
    dailyLeaderboard,
    loading,
    error,
    refresh: fetchAllAnalytics,
  };
}
