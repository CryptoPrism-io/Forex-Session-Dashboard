/**
 * Migration 003: Clean up stale "month" source records
 *
 * Run this script on the server to remove duplicate events where both
 * "week" and "month" sources exist, keeping only the "week" version
 * (which has more up-to-date actual values).
 *
 * Usage: node run-cleanup-003.js
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function runCleanup() {
  const client = await pool.connect();

  try {
    console.log('🔍 Analyzing duplicate records...\n');

    // Step 1: Count duplicates before cleanup
    const beforeCount = await client.query(`
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
    console.log(`Found ${duplicateCount} stale "month" records with "week" equivalents\n`);

    if (duplicateCount === 0) {
      console.log('✅ No cleanup needed - no duplicates found!');
      return;
    }

    // Step 2: Show sample of what will be deleted
    const sample = await client.query(`
      SELECT m.id, m.event, m.currency, m.date_utc::date as date, m.time_utc, m.actual as month_actual,
             w.actual as week_actual
      FROM economic_calendar_ff m
      JOIN economic_calendar_ff w ON
        w.source_scope = 'week'
        AND w.event = m.event
        AND w.currency = m.currency
        AND w.date_utc::date = m.date_utc::date
        AND w.time_utc = m.time_utc
      WHERE m.source_scope = 'month'
      LIMIT 10
    `);

    console.log('Sample records to be cleaned up:');
    console.table(sample.rows);

    // Step 3: Create backup table
    console.log('\n📦 Creating backup of records to be deleted...');
    await client.query(`
      DROP TABLE IF EXISTS economic_calendar_ff_cleanup_003
    `);

    await client.query(`
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

    const backupCount = await client.query('SELECT COUNT(*) as cnt FROM economic_calendar_ff_cleanup_003');
    console.log(`✅ Backed up ${backupCount.rows[0].cnt} records to economic_calendar_ff_cleanup_003\n`);

    // Step 4: Delete stale records
    console.log('🗑️  Deleting stale "month" records...');
    const deleteResult = await client.query(`
      DELETE FROM economic_calendar_ff m
      USING economic_calendar_ff w
      WHERE m.source_scope = 'month'
        AND w.source_scope = 'week'
        AND w.event = m.event
        AND w.currency = m.currency
        AND w.date_utc::date = m.date_utc::date
        AND w.time_utc = m.time_utc
    `);

    console.log(`✅ Deleted ${deleteResult.rowCount} stale records\n`);

    // Step 5: Report final stats
    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM economic_calendar_ff WHERE source_scope = 'week') as week_records,
        (SELECT COUNT(*) FROM economic_calendar_ff WHERE source_scope = 'month') as month_records,
        (SELECT COUNT(*) FROM economic_calendar_ff) as total_records
    `);

    console.log('📊 Final statistics:');
    console.table(stats.rows);

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runCleanup().catch(console.error);
