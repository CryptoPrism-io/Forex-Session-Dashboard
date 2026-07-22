/**
 * Data-freshness helpers.
 *
 * The FX pipeline (oanda_candles, volatility_metrics, correlation_matrix) stopped
 * writing on 2026-04-03. The economic calendar is still live. Without an explicit
 * staleness signal the price endpoints happily return months-old rows that the UI
 * renders as if they were current prices — which is worse than returning nothing.
 *
 * These helpers attach machine-readable provenance to every FX response so the
 * client can render an honest "stale / last updated" state. We never fabricate,
 * interpolate or forward-fill a value to cover the gap.
 */

// Beyond this, data is no longer meaningful as a "current" price.
const STALE_AFTER_HOURS = 2;

/**
 * Build a freshness descriptor from the newest timestamp in a result set.
 * @param {Date|string|null} newest - newest row timestamp, or null if no rows
 * @returns {{stale: boolean, last_updated: string|null, age_hours: number|null, reason: string}}
 */
export function describeFreshness(newest) {
  if (!newest) {
    return {
      stale: true,
      last_updated: null,
      age_hours: null,
      reason: 'no_data',
    };
  }

  const ts = newest instanceof Date ? newest : new Date(newest);
  if (Number.isNaN(ts.getTime())) {
    return { stale: true, last_updated: null, age_hours: null, reason: 'no_data' };
  }

  const ageHours = (Date.now() - ts.getTime()) / 36e5;
  return {
    stale: ageHours > STALE_AFTER_HOURS,
    last_updated: ts.toISOString(),
    age_hours: Math.round(ageHours * 10) / 10,
    reason: ageHours > STALE_AFTER_HOURS ? 'pipeline_stalled' : 'fresh',
  };
}

/** Newest value of `field` across rows, or null when there are none. */
export function newestOf(rows, field = 'time') {
  let newest = null;
  for (const row of rows) {
    const v = row?.[field];
    if (!v) continue;
    const ts = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(ts.getTime())) continue;
    if (newest === null || ts > newest) newest = ts;
  }
  return newest;
}

export { STALE_AFTER_HOURS };
