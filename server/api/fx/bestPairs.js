import { fxPool } from '../../db.js';

/**
 * GET /api/fx/best-pairs?category=hedging&limit=10
 * Fetches trading pair recommendations from best_pairs_tracker
 *
 * Query params:
 * - category: String (optional) - Filter by category (e.g., 'hedging', 'trending', 'uncorrelated')
 * - limit: Number (default: 20, max: 100) - Number of pairs to return
 *
 * Returns:
 * {
 *   success: true,
 *   count: 10,
 *   data: [
 *     {
 *       pair1: 'EUR_USD',
 *       pair2: 'USD_JPY',
 *       category: 'hedging',
 *       score: 0.92,
 *       correlation: -0.85,
 *       volatility_score: 0.75,
 *       date: '2025-11-29'
 *     },
 *     ...
 *   ]
 * }
 */
export async function getBestPairs(req, res) {
  try {
    const { category, limit = 20 } = req.query;

    // Validate and sanitize limit (max 100)
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);

    // Simple query - table may be empty, so just select all columns
    let query = `
      SELECT *
      FROM best_pairs_tracker
      LIMIT $1
    `;

    const params = [parsedLimit];

    // Add optional category filter if column exists and table has data
    if (category) {
      query = `
        SELECT *
        FROM best_pairs_tracker
        WHERE category = $1
        LIMIT $2
      `;
      params.unshift(category);
    }

    const result = await fxPool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      message: result.rows.length === 0 ? 'No best pairs data available yet' : undefined
    });

  } catch (error) {
    console.error('❌ Error fetching best pairs:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
