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
  ssl: {
    rejectUnauthorized: false
  }
});

async function addDateIndexes() {
  try {
    console.log('🚀 Adding indexes for date_utc and time_utc columns...\n');

    // Check existing indexes
    console.log('Checking existing indexes on economic_calendar_ff table...');
    const existingIndexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'economic_calendar_ff'
      ORDER BY indexname
    `);
    
    console.log('\n📊 Existing indexes:');
    existingIndexes.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });

    // Create composite index for date_utc + time_utc (most common query pattern)
    console.log('\nCreating composite index: idx_ec_date_utc_time_utc...');
    try {
      await pool.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ec_date_utc_time_utc
        ON economic_calendar_ff (date_utc, time_utc)
      `);
      console.log('✅ Composite date/time index created successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Composite date/time index already exists');
      } else {
        throw error;
      }
    }

    // Create standalone date_utc index for date range queries
    console.log('\nCreating index: idx_ec_date_utc...');
    try {
      await pool.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ec_date_utc
        ON economic_calendar_ff (date_utc)
      `);
      console.log('✅ Date UTC index created successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Date UTC index already exists');
      } else {
        throw error;
      }
    }

    // Verify new indexes
    console.log('\nVerifying new indexes...');
    const result = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'economic_calendar_ff'
        AND (indexname LIKE '%date_utc%' OR indexname LIKE '%time_utc%')
      ORDER BY indexname
    `);

    if (result.rows.length > 0) {
      console.log('\n📊 Date/Time indexes:');
      result.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
        console.log(`    ${row.indexdef}\n`);
      });
    }

    // Run ANALYZE to update statistics
    console.log('Running ANALYZE to update query planner statistics...');
    await pool.query('ANALYZE economic_calendar_ff');
    console.log('✅ Statistics updated');

    console.log('\n✨ Index optimization completed!\n');
    console.log('💡 Expected performance improvement:');
    console.log('   - /api/calendar/today should now respond in <50ms (was ~480ms)');
    console.log('   - Date range queries will be much faster\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Index creation failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

addDateIndexes();
