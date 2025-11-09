import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runMigration() {
  try {
    console.log('🚀 Running database migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '001_add_filter_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon to execute statements individually
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.length === 0) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const result = await pool.query(statement);

        // If it's a SELECT query, show results
        if (statement.toUpperCase().includes('SELECT')) {
          console.log('✅ Query result:');
          console.table(result.rows);
        } else {
          console.log(`✅ Success: ${result.command || 'OK'}`);
        }
      } catch (error) {
        // If error is about index already existing, that's okay
        if (error.message.includes('already exists')) {
          console.log('ℹ️  Index already exists, skipping...');
        } else {
          throw error;
        }
      }

      console.log('');
    }

    console.log('✨ Migration completed successfully!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
