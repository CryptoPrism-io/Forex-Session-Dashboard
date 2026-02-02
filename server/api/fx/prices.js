import { fxPool } from '../../db.js';

/**
 * GET /api/fx/prices/current?instrument=EUR_USD
 * Fetches the latest price for a single instrument
 *
 * Query params:
 * - instrument: String (e.g., 'EUR_USD', 'GBP_USD')
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     instrument: 'EUR_USD',
 *     mid: 1.08950,
 *     time: '2025-11-29T12:00:00.000Z'
 *   }
 * }
 */
export async function getCurrentPrice(req, res) {
  try {
    const { instrument } = req.query;

    // Validation
    if (!instrument) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: instrument'
      });
    }

    // Query latest H1 candle for the instrument
    const result = await fxPool.query(`
      SELECT
        instrument,
        close_mid as mid,
        time,
        open_mid,
        high_mid,
        low_mid,
        volume
      FROM oanda_candles
      WHERE instrument = $1
        AND granularity = 'H1'
      ORDER BY time DESC
      LIMIT 1
    `, [instrument]);

    // Check if instrument exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No data found for instrument: ${instrument}`
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching current price:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/fx/prices/all
 * Fetches the latest prices for all instruments
 *
 * Returns:
 * {
 *   success: true,
 *   count: 36,
 *   data: [
 *     { instrument: 'EUR_USD', mid: 1.08950, time: '2025-11-29T12:00:00.000Z', ... },
 *     { instrument: 'GBP_USD', mid: 1.27340, time: '2025-11-29T12:00:00.000Z', ... },
 *     ...
 *   ]
 * }
 */
export async function getAllPrices(req, res) {
  try {
    // Query latest H1 candle for each instrument
    // DISTINCT ON ensures we get only the most recent candle per instrument
    const result = await fxPool.query(`
      SELECT DISTINCT ON (instrument)
        instrument,
        close_mid as mid,
        time,
        open_mid,
        high_mid,
        low_mid,
        volume
      FROM oanda_candles
      WHERE granularity = 'H1'
      ORDER BY instrument, time DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching all prices:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/fx/prices/sparklines?hours=24
 * Fetches sparkline data (last N hours of close prices) for all instruments
 *
 * Query params:
 * - hours: Number (default: 24, max: 168) - Hours of data to return
 *
 * Returns:
 * {
 *   success: true,
 *   hours: 24,
 *   data: {
 *     'EUR_USD': [1.185, 1.186, 1.184, ...],
 *     'GBP_USD': [1.367, 1.368, 1.366, ...],
 *     ...
 *   }
 * }
 */
export async function getSparklines(req, res) {
  try {
    const { hours = 24 } = req.query;
    const parsedHours = Math.min(parseInt(hours) || 24, 168); // Max 1 week

    // Query last N hours of candles for all instruments
    const result = await fxPool.query(`
      SELECT instrument, time, close_mid
      FROM oanda_candles
      WHERE granularity = 'H1'
        AND time >= NOW() - INTERVAL '${parsedHours} hours'
      ORDER BY instrument, time ASC
    `);

    // Group by instrument
    const sparklines = {};
    for (const row of result.rows) {
      if (!sparklines[row.instrument]) {
        sparklines[row.instrument] = [];
      }
      sparklines[row.instrument].push(parseFloat(row.close_mid));
    }

    res.json({
      success: true,
      hours: parsedHours,
      count: Object.keys(sparklines).length,
      data: sparklines
    });

  } catch (error) {
    console.error('❌ Error fetching sparklines:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
