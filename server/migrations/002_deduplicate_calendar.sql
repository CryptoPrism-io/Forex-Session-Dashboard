-- Migration: Remove duplicate economic calendar entries and add constraint
-- Issue: Same events appearing multiple times with different time_utc values
-- Root cause: Data imported from multiple sources or timezone conversion issues
-- Solution: Keep entries with event_uid (preferred), remove NULL event_uid duplicates

-- Step 1: Create a backup table before cleanup
CREATE TABLE IF NOT EXISTS economic_calendar_ff_backup_duplicates AS
SELECT * FROM economic_calendar_ff WHERE 1=0;

-- Step 2: Identify and backup the duplicate rows that will be deleted
INSERT INTO economic_calendar_ff_backup_duplicates
SELECT e.*
FROM economic_calendar_ff e
WHERE EXISTS (
    SELECT 1
    FROM economic_calendar_ff e2
    WHERE e2.event = e.event
    AND e2.currency = e.currency
    AND e2.date_utc::date = e.date_utc::date
    AND e2.ctid != e.ctid
)
AND NOT EXISTS (
    SELECT 1 FROM economic_calendar_ff_backup_duplicates b
    WHERE b.event = e.event AND b.currency = e.currency AND b.date_utc = e.date_utc
);

-- Step 3: Delete duplicates, keeping the one with event_uid (or most recent if both have it)
-- This uses a CTE to identify rows to keep
WITH ranked_events AS (
    SELECT
        ctid,
        ROW_NUMBER() OVER (
            PARTITION BY event, currency, date_utc::date
            ORDER BY
                CASE WHEN event_uid IS NOT NULL THEN 0 ELSE 1 END,  -- Prefer non-NULL event_uid
                created_at DESC NULLS LAST                           -- Then most recent
        ) as rn
    FROM economic_calendar_ff
)
DELETE FROM economic_calendar_ff
WHERE ctid IN (
    SELECT ctid FROM ranked_events WHERE rn > 1
);

-- Step 4: Add unique constraint to prevent future duplicates
-- Note: This uses (event, currency, date) as the unique key
-- If you need to allow same event on same date with different times, adjust accordingly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_event_currency_date'
    ) THEN
        ALTER TABLE economic_calendar_ff
        ADD CONSTRAINT unique_event_currency_date
        UNIQUE (event, currency, date_utc);
    END IF;
END $$;

-- Step 5: Create index to support the unique constraint and improve query performance
CREATE INDEX IF NOT EXISTS idx_calendar_event_currency_date
ON economic_calendar_ff(event, currency, date_utc);

-- Verify: Count duplicates after cleanup (should be 0)
SELECT
    event,
    currency,
    date_utc::date as event_date,
    COUNT(*) as count
FROM economic_calendar_ff
GROUP BY event, currency, date_utc::date
HAVING COUNT(*) > 1;
