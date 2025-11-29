import { fxPool } from '../../db.js';

/**
 * GET /api/fx/correlation/matrix
 * Fetches the latest correlation matrix for all FX pairs
 *
 * Returns:
 * {
 *   success: true,
 *   date: '2025-11-29',
 *   count: 400,
 *   data: [
 *     {
 *       pair1: 'EUR_USD',
 *       pair2: 'GBP_USD',
 *       correlation: 0.85,
 *       date: '2025-11-29'
 *     },
 *     ...
 *   ]
 * }
 */
export async function getCorrelationMatrix(req, res) {
  try {
    // Query latest correlation matrix (most recent time)
    const result = await fxPool.query(`
      SELECT
        pair1,
        pair2,
        correlation,
        time,
        window_size
      FROM correlation_matrix
      WHERE time = (SELECT MAX(time) FROM correlation_matrix)
      ORDER BY pair1, pair2
    `);

    // Check if data exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No correlation matrix data found'
      });
    }

    // Get the time from the first row
    const time = result.rows[0].time;

    res.json({
      success: true,
      time: time,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching correlation matrix:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/fx/correlation/pairs?pair1=EUR_USD&pair2=GBP_USD
 * Fetches correlation between two specific pairs (optional filters)
 *
 * Query params:
 * - pair1: String (optional) - First currency pair
 * - pair2: String (optional) - Second currency pair
 *
 * Returns:
 * {
 *   success: true,
 *   count: 1,
 *   data: [
 *     {
 *       pair1: 'EUR_USD',
 *       pair2: 'GBP_USD',
 *       correlation: 0.85,
 *       date: '2025-11-29'
 *     }
 *   ]
 * }
 */
export async function getCorrelationPairs(req, res) {
  try {
    const { pair1, pair2 } = req.query;

    let query = `
      SELECT
        pair1,
        pair2,
        correlation,
        time,
        window_size
      FROM correlation_matrix
      WHERE time = (SELECT MAX(time) FROM correlation_matrix)
    `;

    const params = [];

    // Add optional filters
    if (pair1) {
      params.push(pair1);
      query += ` AND pair1 = $${params.length}`;
    }

    if (pair2) {
      params.push(pair2);
      query += ` AND pair2 = $${params.length}`;
    }

    query += ` ORDER BY ABS(correlation::numeric) DESC`;

    const result = await fxPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching correlation pairs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
