/**
 * WindScope API Service
 * Integrates real data from Elexon BMRS:
 * - Actual wind generation: /datasets/FUELHH/stream (fuelType=WIND)
 * - Forecast wind generation: /datasets/WINDFOR/stream
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }
  return response.json();
}

export const api = {
  /**
   * Health check
   */
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await handleResponse(res);
  },

  /**
   * Get forecast and actual generation for specified January 2026 range & cutoff
   */
  async getForecastRange(startDate = '2026-01-01', endDate = '2026-01-01', cutoff = '12:00', publishTime = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (cutoff) params.append('cutoff', cutoff);
    if (publishTime) params.append('publish_time', publishTime);

    const res = await fetch(`${API_BASE}/forecast/range?${params.toString()}`);
    return await handleResponse(res);
  },

  /**
   * Get forecast evolution / publication history across all publish times on D-1
   */
  async getPublicationHistory(targetDate = '2026-01-01') {
    const params = new URLSearchParams({ target_date: targetDate });
    const res = await fetch(`${API_BASE}/forecast/publication-history?${params.toString()}`);
    return await handleResponse(res);
  },

  /**
   * Get summary KPIs (MAE, RMSE, MAPE, Bias, Reliability Score)
   */
  async getAnalyticsSummary(startDate = '2026-01-01', endDate = '2026-01-01', cutoff = '12:00', publishTime = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (cutoff) params.append('cutoff', cutoff);
    if (publishTime) params.append('publish_time', publishTime);

    const res = await fetch(`${API_BASE}/analytics/summary?${params.toString()}`);
    return await handleResponse(res);
  },

  /**
   * Get 48 settlement period diurnal error profile
   */
  async getSettlementProfile(startDate = '2026-01-01', endDate = '2026-01-01', cutoff = '12:00', publishTime = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (cutoff) params.append('cutoff', cutoff);
    if (publishTime) params.append('publish_time', publishTime);

    const res = await fetch(`${API_BASE}/analytics/settlement-profile?${params.toString()}`);
    return await handleResponse(res);
  },

  /**
   * Get error distribution histogram and quantiles (P10, P50, P90, skewness)
   */
  async getErrorDistribution(startDate = '2026-01-01', endDate = '2026-01-01', cutoff = '12:00', publishTime = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (cutoff) params.append('cutoff', cutoff);
    if (publishTime) params.append('publish_time', publishTime);

    const res = await fetch(`${API_BASE}/analytics/error-distribution?${params.toString()}`);
    return await handleResponse(res);
  },

  /**
   * Get daily accuracy leaderboard for January 2026
   */
  async getDailyAccuracy(startDate = '2026-01-01', endDate = '2026-01-31', cutoff = '12:00') {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (cutoff) params.append('cutoff', cutoff);

    const res = await fetch(`${API_BASE}/analytics/daily-accuracy?${params.toString()}`);
    return await handleResponse(res);
  },
};
