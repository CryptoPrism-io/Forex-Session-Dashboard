import pool from '../../db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const {
      startDate,
      endDate,
      currency,
      impact
    } = req.query;

    // Build dynamic query with deduplication
    // Note: Database stores date_utc (UTC date with rollover) and time_utc (UTC time)
    // Scraper converts all times from PST/PDT to UTC and handles date rollover
    //
    // DEDUPLICATION: Use DISTINCT ON to remove duplicate events (same event + currency + date)
    // Prefer entries with event_uid (NOT NULL) over those without, then by most recent created_at
    let query = `
      SELECT DISTINCT ON (event, currency, date_utc::date)
        id,
        date,
        to_char(date_utc, 'YYYY-MM-DD') as date_utc,
        time,
        time_utc,
        time_zone,
        currency,
        impact,
        event,
        actual,
        actual_status,
        forecast,
        previous,
        source_scope as source,
        event_uid,
        datetime_utc
      FROM economic_calendar_ff
      WHERE date_utc >= $1::date
        AND date_utc < ($2::date + INTERVAL '1 day')
    `;

    const params = [startDate || '2025-11-10', endDate || '2025-11-10'];
    let paramIndex = 3;

    // Add currency filter if provided
    if (currency) {
      query += ` AND UPPER(currency) = UPPER($${paramIndex})`;
      params.push(currency);
      paramIndex++;
    }

    // Add impact filter if provided
    if (impact) {
      query += ` AND UPPER(impact) = UPPER($${paramIndex})`;
      params.push(impact);
      paramIndex++;
    }

    // DISTINCT ON requires ORDER BY to start with the DISTINCT columns
    // Then we prefer entries with event_uid (NOT NULL sorted first via NULLS LAST)
    // and most recent created_at as tiebreaker
    query += ` ORDER BY event, currency, date_utc::date, event_uid NULLS LAST, created_at DESC NULLS LAST`;

    // Wrap in subquery to apply final ordering by date/time for display
    query = `
      SELECT * FROM (${query}) AS deduplicated
      ORDER BY date_utc DESC, time_utc DESC
    `;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      dateRange: { start: params[0], end: params[1] },
      filters: { currency, impact },
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar events',
      message: error.message
    });
  }
}
