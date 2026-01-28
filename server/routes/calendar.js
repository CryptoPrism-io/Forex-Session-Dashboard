import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Helper function to get start and end of current week (Sunday to Saturday)
// Uses local time semantics to align with frontend week calculation
function getCurrentWeek() {
  const now = new Date();
  const day = now.getDay(); // Local Sunday=0..Saturday=6

  // Go back to Sunday (start of week) at midnight local time
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);

  // Go forward to Saturday (end of week) at end of day local time
  const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6, 23, 59, 59, 999);

  return {
    start: sunday.toISOString().split('T')[0],
    end: saturday.toISOString().split('T')[0]
  };
}

// GET /api/calendar/events - Fetch economic calendar events
// Query params:
//   - startDate: ISO date string (YYYY-MM-DD)
//   - endDate: ISO date string (YYYY-MM-DD)
//   - currency: Filter by currency (e.g., USD, EUR)
//   - impact: Filter by impact level (low, medium, high)
router.get('/events', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      currency,
      impact
    } = req.query;

    // Default to current week if no dates provided
    const week = getCurrentWeek();
    const start = startDate || week.start;
    const end = endDate || week.end;

    // Build dynamic query with DEDUPLICATION
    // Note: Database stores date_utc (UTC date with rollover) and time_utc (UTC time)
    // Use inclusive range [start, end] to respect exact date boundaries from frontend
    // DEDUPLICATION: Use DISTINCT ON to remove duplicate events (same event + currency + date)
    // Priority order:
    // 1. Prefer entries WITH actual data (actual IS NOT NULL)
    // 2. Then prefer entries with event_uid
    // 3. Then prefer most recent created_at
    let baseQuery = `
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
        forecast,
        previous,
        source_scope as source,
        event_uid,
        actual_status,
        datetime_utc
      FROM economic_calendar_ff
      WHERE date_utc >= $1::date
        AND date_utc <= $2::date
    `;

    const params = [start, end];
    let paramIndex = 3;

    // Add currency filter if provided
    if (currency) {
      baseQuery += ` AND UPPER(currency) = UPPER($${paramIndex})`;
      params.push(currency);
      paramIndex++;
    }

    // Add impact filter if provided
    if (impact) {
      baseQuery += ` AND UPPER(impact) = UPPER($${paramIndex})`;
      params.push(impact);
      paramIndex++;
    }

    // DISTINCT ON requires ORDER BY to start with the DISTINCT columns
    // Prefer records with actual data, then with event_uid, then most recent
    baseQuery += ` ORDER BY event, currency, date_utc::date, (actual IS NOT NULL AND actual != '') DESC, event_uid NULLS LAST, created_at DESC NULLS LAST`;

    // Wrap in subquery to apply final ordering by date/time for display
    const query = `
      SELECT * FROM (${baseQuery}) AS deduplicated
      ORDER BY date_utc DESC, time_utc DESC
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      dateRange: { start, end },
      filters: { currency, impact },
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar events',
      message: error.message
    });
  }
});

// GET /api/calendar/stats - Get statistics about events
router.get('/stats', async (req, res) => {
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

    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching calendar stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar statistics',
      message: error.message
    });
  }
});

// GET /api/calendar/currencies - Get list of unique currencies
router.get('/currencies', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT currency
      FROM economic_calendar_ff
      ORDER BY currency ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      currencies: result.rows.map(row => row.currency)
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch currencies',
      message: error.message
    });
  }
});

// GET /api/calendar/today - Get all events for today with all impact levels
// Query params:
//   - date: ISO date string (YYYY-MM-DD) from client's local timezone (optional, defaults to server's UTC date)
router.get('/today', async (req, res) => {
  try {
    // Accept date from client (user's local "today"), or fallback to server UTC date
    let todayISO;
    if (req.query.date) {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(req.query.date)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Expected YYYY-MM-DD'
        });
      }
      todayISO = req.query.date;
    } else {
      // Fallback to server UTC date
      const now = new Date();
      todayISO = now.toISOString().split('T')[0];
    }

    // Calculate tomorrow's date
    const todayDate = new Date(todayISO + 'T00:00:00Z');
    const tomorrowDate = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowISO = tomorrowDate.toISOString().split('T')[0];

    // Note: Database stores date_utc (UTC date with rollover) and time_utc (UTC time)
    // DEDUPLICATION: Use DISTINCT ON to remove duplicate events (same event + currency + date)
    // Priority: actual data > event_uid > most recent created_at
    const query = `
      SELECT * FROM (
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
          forecast,
          previous,
          source_scope as source,
          event_uid,
          actual_status,
          datetime_utc
        FROM economic_calendar_ff
        WHERE date_utc >= $1::date
          AND date_utc < $2::date
        ORDER BY event, currency, date_utc::date, (actual IS NOT NULL AND actual != '') DESC, event_uid NULLS LAST, created_at DESC NULLS LAST
      ) AS deduplicated
      ORDER BY time_utc ASC, event ASC
    `;

    const result = await pool.query(query, [todayISO, tomorrowISO]);

    res.json({
      success: true,
      count: result.rows.length,
      date: todayISO,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching today\'s events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s events',
      message: error.message
    });
  }
});

// POST /api/calendar/cleanup - Remove stale "month" records when "week" equivalents exist
// This is an admin endpoint to deduplicate the database
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🔍 Starting calendar cleanup...');

    // Step 1: Count duplicates
    const beforeCount = await pool.query(`
      SELECT COUNT(*) as duplicate_count
      FROM economic_calendar_ff m
      WHERE m.source_scope = 'month'
        AND EXISTS (
          SELECT 1 FROM economic_calendar_ff w
          WHERE w.source_scope = 'week'
            AND w.event = m.event
            AND w.currency = m.currency
            AND w.date_utc::date = m.date_utc::date
            AND w.time_utc = m.time_utc
        )
    `);

    const duplicateCount = parseInt(beforeCount.rows[0].duplicate_count);

    if (duplicateCount === 0) {
      return res.json({
        success: true,
        message: 'No cleanup needed - no duplicates found',
        deleted: 0
      });
    }

    // Step 2: Create backup
    await pool.query(`DROP TABLE IF EXISTS economic_calendar_ff_cleanup_003`);
    await pool.query(`
      CREATE TABLE economic_calendar_ff_cleanup_003 AS
      SELECT m.*
      FROM economic_calendar_ff m
      WHERE m.source_scope = 'month'
        AND EXISTS (
          SELECT 1 FROM economic_calendar_ff w
          WHERE w.source_scope = 'week'
            AND w.event = m.event
            AND w.currency = m.currency
            AND w.date_utc::date = m.date_utc::date
            AND w.time_utc = m.time_utc
        )
    `);

    // Step 3: Delete stale records
    const deleteResult = await pool.query(`
      DELETE FROM economic_calendar_ff m
      USING economic_calendar_ff w
      WHERE m.source_scope = 'month'
        AND w.source_scope = 'week'
        AND w.event = m.event
        AND w.currency = m.currency
        AND w.date_utc::date = m.date_utc::date
        AND w.time_utc = m.time_utc
    `);

    // Step 4: Get final stats
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM economic_calendar_ff WHERE source_scope = 'week') as week_records,
        (SELECT COUNT(*) FROM economic_calendar_ff WHERE source_scope = 'month') as month_records,
        (SELECT COUNT(*) FROM economic_calendar_ff) as total_records
    `);

    console.log(`✅ Cleanup complete: deleted ${deleteResult.rowCount} stale records`);

    res.json({
      success: true,
      message: 'Cleanup complete',
      deleted: deleteResult.rowCount,
      backed_up: duplicateCount,
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message
    });
  }
});

export default router;
