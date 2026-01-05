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
    const query = `
      SELECT DISTINCT currency
      FROM economic_calendar_ff
      ORDER BY currency ASC
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      success: true,
      currencies: result.rows.map(row => row.currency)
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch currencies',
      message: error.message
    });
  }
}
