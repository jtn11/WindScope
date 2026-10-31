/**
 * Format megawatt values with commas and unit
 */
export function formatMW(val, includeUnit = true) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const formatted = Math.round(val).toLocaleString('en-GB');
  return includeUnit ? `${formatted} MW` : formatted;
}

/**
 * Format gigawatt values
 */
export function formatGW(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${(val / 1000).toFixed(2)} GW`;
}

/**
 * Format percentages with specified decimal places
 */
export function formatPercent(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${Number(val).toFixed(decimals)}%`;
}

/**
 * Format British Pounds currency (£)
 */
export function formatGBP(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * Format ISO datetime string to clean date and time
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(d) + ' UTC';
  } catch (e) {
    return isoString;
  }
}

/**
 * Format ISO string to time only (HH:MM)
 */
export function formatTimeOnly(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(d);
  } catch (e) {
    return isoString;
  }
}

/**
 * Convert Settlement Period (1-48) to standard HH:MM time range
 */
export function formatSettlementPeriodTime(sp) {
  if (!sp || sp < 1 || sp > 48) return '—';
  const startMinutes = (sp - 1) * 30;
  const startH = Math.floor(startMinutes / 60).toString().padStart(2, '0');
  const startM = (startMinutes % 60).toString().padStart(2, '0');

  const endMinutes = sp * 30;
  const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
  const endM = (endMinutes % 60).toString().padStart(2, '0');

  return `${startH}:${startM} - ${endH}:${endM}`;
}
