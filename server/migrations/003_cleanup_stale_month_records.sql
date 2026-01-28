-- Migration 003: Clean up stale "month" source records when "week" source records exist
-- This removes duplicate events where both sources scraped the same event,
-- preferring "week" source because it has more up-to-date actual values.

-- Step 1: Create backup of records to be deleted (safety measure)
CREATE TABLE IF NOT EXISTS economic_calendar_ff_cleanup_003 AS
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
  );

-- Step 2: Delete stale "month" records that have "week" equivalents
DELETE FROM economic_calendar_ff m
USING economic_calendar_ff w
WHERE m.source_scope = 'month'
  AND w.source_scope = 'week'
  AND w.event = m.event
  AND w.currency = m.currency
  AND w.date_utc::date = m.date_utc::date
  AND w.time_utc = m.time_utc;

-- Step 3: Report results
SELECT
  (SELECT COUNT(*) FROM economic_calendar_ff_cleanup_003) as backed_up_count,
  (SELECT COUNT(*) FROM economic_calendar_ff WHERE source_scope = 'week') as week_records,
  (SELECT COUNT(*) FROM economic_calendar_ff WHERE source_scope = 'month') as month_records,
  (SELECT COUNT(*) FROM economic_calendar_ff) as total_records;
