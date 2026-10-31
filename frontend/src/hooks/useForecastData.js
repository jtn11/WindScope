import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useForecastData(initialDays = 2) {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(initialDays);
  const [source, setSource] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLatestForecast(days);
      setData(res.data || []);
      setMetrics(res.metrics || null);
      setSource(res.source || 'Elexon BMRS');
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    metrics,
    loading,
    error,
    days,
    setDays,
    source,
    lastUpdated,
    refresh: fetchData,
  };
}
