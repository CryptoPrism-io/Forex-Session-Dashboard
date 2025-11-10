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
    const query = `
      SELECT
        COUNT(*) as total_events,
        COUNT(DISTINCT currency) as currencies,
        COUNT(CASE WHEN impact = 'high' THEN 1 END) as high_impact,
        COUNT(CASE WHEN impact = 'medium' THEN 1 END) as medium_impact,
        COUNT(CASE WHEN impact = 'low' THEN 1 END) as low_impact,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM economic_calendar_ff
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar statistics',
      message: error.message
    });
  }
}
