import { fxPool } from '../../db.js';

/**
 * GET /api/fx/volatility/:instrument
 * Fetches the latest volatility metrics for a single instrument
 *
 * Path params:
 * - instrument: String (e.g., 'EUR_USD', 'GBP_USD')
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     instrument: 'EUR_USD',
 *     time: '2025-11-29T12:00:00.000Z',
 *     volatility_20: 0.0045,
 *     volatility_50: 0.0052,
 *     sma_15: 1.08950,
 *     sma_30: 1.08920,
 *     sma_50: 1.08890,
 *     atr: 0.00123,
 *     bb_upper: 1.09100,
 *     bb_middle: 1.08950,
 *     bb_lower: 1.08800
 *   }
 * }
 */
export async function getVolatility(req, res) {
  try {
    const { instrument } = req.params;

    // Validation
    if (!instrument) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: instrument'
      });
    }

    // Query latest volatility metrics for the instrument
    const result = await fxPool.query(`
      SELECT
        instrument,
        time,
        volatility_20,
        volatility_50,
        sma_15,
        sma_30,
        sma_50,
        atr,
        bb_upper,
        bb_middle,
        bb_lower
      FROM volatility_metrics
      WHERE instrument = $1
      ORDER BY time DESC
      LIMIT 1
    `, [instrument]);

    // Check if instrument exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No volatility data found for instrument: ${instrument}`
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching volatility:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/fx/volatility
 * Fetches the latest volatility metrics for all instruments
 *
 * Returns:
 * {
 *   success: true,
 *   count: 36,
 *   data: [
 *     {
 *       instrument: 'EUR_USD',
 *       time: '2025-11-29T12:00:00.000Z',
 *       volatility_20: 0.0045,
 *       atr: 0.00123,
 *       sma_30: 1.08920
 *     },
 *     ...
 *   ]
 * }
 */
export async function getAllVolatility(req, res) {
  try {
    // Query latest volatility metrics for each instrument
    // Return only key metrics to reduce payload size
    const result = await fxPool.query(`
      SELECT DISTINCT ON (instrument)
        instrument,
        time,
        volatility_20,
        volatility_50,
        atr,
        sma_30,
        bb_upper,
        bb_middle,
        bb_lower
      FROM volatility_metrics
      ORDER BY instrument, time DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching all volatility:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
