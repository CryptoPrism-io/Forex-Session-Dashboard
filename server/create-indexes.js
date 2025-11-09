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

async function createIndexes() {
  try {
    console.log('🚀 Creating functional indexes for performance optimization...\n');

    // Create index for case-insensitive currency filtering
    console.log('Creating index: idx_ec_currency_upper...');
    try {
      await pool.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ec_currency_upper
        ON economic_calendar_ff (UPPER(currency))
      `);
      console.log('✅ Currency index created successfully\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Currency index already exists\n');
      } else {
        throw error;
      }
    }

    // Create index for case-insensitive impact filtering
    console.log('Creating index: idx_ec_impact_upper...');
    try {
      await pool.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ec_impact_upper
        ON economic_calendar_ff (UPPER(impact))
      `);
      console.log('✅ Impact index created successfully\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Impact index already exists\n');
      } else {
        throw error;
      }
    }

    // Verify indexes
    console.log('Verifying indexes...');
    const result = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'economic_calendar_ff'
        AND indexname IN ('idx_ec_currency_upper', 'idx_ec_impact_upper')
      ORDER BY indexname
    `);

    if (result.rows.length > 0) {
      console.log('\n📊 Created indexes:');
      result.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
    } else {
      console.log('\n⚠️  No indexes found. They may still be building.');
    }

    console.log('\n✨ Index creation completed!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Index creation failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

createIndexes();
