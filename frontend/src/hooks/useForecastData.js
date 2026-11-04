import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useForecastData(initialStartDate = '2026-01-01', initialEndDate = '2026-01-01') {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [cutoff, setCutoff] = useState('12:00'); // Standard Day-Ahead 12:00 D-1 Gate Closure
  const [selectedPublishTime, setSelectedPublishTime] = useState(null);
  const [availablePublishTimes, setAvailablePublishTimes] = useState([]);
  const [publicationHistory, setPublicationHistory] = useState([]);
  const [source, setSource] = useState('Elexon BMRS');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [forecastRes, pubHistoryRes] = await Promise.all([
        api.getForecastRange(startDate, endDate, cutoff, selectedPublishTime),
        api.getPublicationHistory(startDate),
      ]);

      setData(forecastRes.data || []);
      setMetrics(forecastRes.metrics || null);
      setAvailablePublishTimes(forecastRes.availablePublishTimes || []);
      if (!selectedPublishTime && forecastRes.selectedPublishTime) {
        setSelectedPublishTime(forecastRes.selectedPublishTime);
      }
      setSource(forecastRes.source || 'Elexon BMRS (FUELHH & WINDFOR)');
      setPublicationHistory(pubHistoryRes.runs || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Forecast data load error:", err);
      setError(err.message || 'Failed to load forecast data from Elexon BMRS');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cutoff, selectedPublishTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When changing dates or cutoff, reset specific publishTime to allow auto cutoff selection
  const handleDateChange = (newStart, newEnd) => {
    setSelectedPublishTime(null);
    setStartDate(newStart);
    setEndDate(newEnd || newStart);
  };

  const handleCutoffChange = (newCutoff) => {
    setSelectedPublishTime(null);
    setCutoff(newCutoff);
  };

  return {
    data,
    metrics,
    loading,
    error,
    startDate,
    endDate,
    cutoff,
    selectedPublishTime,
    availablePublishTimes,
    publicationHistory,
    setStartDate,
    setEndDate,
    setCutoff: handleCutoffChange,
    setSelectedPublishTime,
    setDateRange: handleDateChange,
    source,
    lastUpdated,
    refresh: fetchData,
  };
}
