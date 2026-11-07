/**
 * WindScope API Service
 * Integrates real data from Elexon BMRS:
 * - Actual wind generation: /datasets/FUELHH/stream (fuelType=WIND)
 * - Forecast wind generation: /datasets/WINDFOR/stream
 */

function getApiBase() {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ''
  ).trim();

  let base = envUrl;

  // Auto-correct common 0 vs o typo in render subdomain (0c6h -> oc6h)
  if (base.includes('windscope-backend-0c6h.onrender.com')) {
    base = base.replace('windscope-backend-0c6h.onrender.com', 'windscope-backend-oc6h.onrender.com');
  }

  // Strip trailing slashes
  base = base.replace(/\/+$/, '');

  if (base) {
    // If backend base URL provided, ensure /api is included since FastAPI routes are prefixed with /api
    return base.endsWith('/api') ? base : `${base}/api`;
  }

  // In production, fallback directly to the live Render FastAPI backend
  if (import.meta.env.PROD) {
    return 'https://windscope-backend-oc6h.onrender.com/api';
  }

  // In local development, use relative /api proxied by Vite dev server
  return '/api';
}

const API_BASE = getApiBase();

async function handleResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      if (contentType.includes('application/json')) {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
      } else {
        const text = await response.text();
        errorDetail = text.trim().startsWith('<') 
          ? `Server returned HTTP ${response.status}` 
          : text.slice(0, 300);
      }
    } catch {
      // Use statusText fallback
    }
    throw new Error(`API Error ${response.status}: ${errorDetail}`);
  }

  // Verify response is actually JSON before calling response.json()
  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    if (rawText.trim().startsWith('<!doctype') || rawText.trim().startsWith('<html')) {
      throw new Error(
        `API returned HTML instead of JSON. Ensure VITE_API_BASE_URL points to the active FastAPI backend (${API_BASE}).`
      );
    }
    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error(`Invalid non-JSON response from server: ${rawText.slice(0, 100)}`);
    }
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
