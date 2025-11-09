-- Migration: Add functional indexes for case-insensitive filtering
-- Purpose: Improve query performance for currency and impact filters
-- Date: 2025-11-09

-- Create index for case-insensitive currency filtering
-- CONCURRENTLY allows index creation without locking the table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ec_currency_upper
ON economic_calendar_ff (UPPER(currency));

-- Create index for case-insensitive impact filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ec_impact_upper
ON economic_calendar_ff (UPPER(impact));

-- Verify indexes were created
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'economic_calendar_ff'
    AND indexname IN ('idx_ec_currency_upper', 'idx_ec_impact_upper');
