import { fxPool } from '../../db.js';

/**
 * GET /api/fx/candles/:instrument?limit=100&granularity=H1
 * Fetches historical OHLC candle data for an instrument
 *
 * Path params:
 * - instrument: String (e.g., 'EUR_USD', 'GBP_USD')
 *
 * Query params:
 * - limit: Number (default: 100, max: 1000) - Number of candles to return
 * - granularity: String (default: 'H1') - Candle timeframe (H1, H4, D)
 *
 * Returns:
 * {
 *   success: true,
 *   count: 100,
 *   instrument: 'EUR_USD',
 *   granularity: 'H1',
 *   data: [
 *     {
 *       time: '2025-11-29T12:00:00.000Z',
 *       open_mid: 1.08950,
 *       high_mid: 1.09020,
 *       low_mid: 1.08920,
 *       close_mid: 1.08990,
 *       volume: 1234
 *     },
 *     ...
 *   ]
 * }
 */
export async function getCandles(req, res) {
  try {
    const { instrument } = req.params;
    const { limit = 100, granularity = 'H1' } = req.query;

    // Validation
    if (!instrument) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: instrument'
      });
    }

    // Validate and sanitize limit (max 1000)
    const parsedLimit = Math.min(parseInt(limit) || 100, 1000);

    // Query historical candles
    const result = await fxPool.query(`
      SELECT
        time,
        open_mid,
        high_mid,
        low_mid,
        close_mid,
        volume,
        granularity
      FROM oanda_candles
      WHERE instrument = $1
        AND granularity = $2
      ORDER BY time DESC
      LIMIT $3
    `, [instrument, granularity, parsedLimit]);

    // Check if data exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No candle data found for ${instrument} at ${granularity} granularity`
      });
    }

    res.json({
      success: true,
      count: result.rows.length,
      instrument,
      granularity,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching candles:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
