import pool from '../lib/db.js';

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

    // Build dynamic query
    let query = `
      SELECT
        id,
        date,
        time,
        time_utc,
        currency,
        impact,
        event,
        actual,
        forecast,
        previous,
        source,
        event_uid
      FROM economic_calendar_ff
      WHERE (date AT TIME ZONE 'Asia/Kolkata') >= $1::date
        AND (date AT TIME ZONE 'Asia/Kolkata') < ($2::date + INTERVAL '1 day')
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

    // Order by date and time_utc - most recent first
    query += ` ORDER BY date DESC, time_utc DESC`;

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
