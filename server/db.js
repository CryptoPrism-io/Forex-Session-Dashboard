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
  max: parseInt(process.env.POSTGRES_POOL_SIZE) || 5,
  ssl: {
    rejectUnauthorized: false
  }
});

// FX Global database connection pool (for FX pipeline data)
const fxPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: 'fx_global',  // Dedicated database for FX pipeline data
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 10,  // Higher max connections for FX data queries
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database (economic calendar)');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test FX database connection on startup
fxPool.on('connect', () => {
  console.log('✅ Connected to fx_global database (FX pipeline data)');
});

fxPool.on('error', (err) => {
  console.error('❌ Unexpected error on idle fx_global client', err);
  process.exit(-1);
});

// Export both pools
export default pool;
export { fxPool };
