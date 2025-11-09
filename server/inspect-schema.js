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

async function inspectSchema() {
  try {
    console.log('Connecting to PostgreSQL database...');
    console.log(`Host: ${process.env.POSTGRES_HOST}`);
    console.log(`Database: ${process.env.POSTGRES_DB}`);
    console.log(`Table: economic_calendar_ff\n`);

    // Get column information
    const schemaQuery = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM
        information_schema.columns
      WHERE
        table_name = 'economic_calendar_ff'
      ORDER BY
        ordinal_position;
    `;

    const schemaResult = await pool.query(schemaQuery);

    if (schemaResult.rows.length === 0) {
      console.log('❌ Table "economic_calendar_ff" not found in database.');
      console.log('\nListing all tables in database:');

      const tablesQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;

      const tablesResult = await pool.query(tablesQuery);
      console.log(tablesResult.rows.map(r => `  - ${r.table_name}`).join('\n'));
    } else {
      console.log('✅ Table found! Column structure:\n');
      console.log('─'.repeat(80));
      console.log(
        'Column Name'.padEnd(30) +
        'Data Type'.padEnd(20) +
        'Max Length'.padEnd(15) +
        'Nullable'
      );
      console.log('─'.repeat(80));

      schemaResult.rows.forEach(col => {
        console.log(
          col.column_name.padEnd(30) +
          col.data_type.padEnd(20) +
          (col.character_maximum_length || 'N/A').toString().padEnd(15) +
          col.is_nullable
        );
      });
      console.log('─'.repeat(80));

      // Get sample data
      console.log('\n📊 Sample data (first 3 rows):\n');
      const sampleQuery = 'SELECT * FROM economic_calendar_ff LIMIT 3;';
      const sampleResult = await pool.query(sampleQuery);
      console.log(JSON.stringify(sampleResult.rows, null, 2));

      // Get row count
      const countQuery = 'SELECT COUNT(*) FROM economic_calendar_ff;';
      const countResult = await pool.query(countQuery);
      console.log(`\n📈 Total rows in table: ${countResult.rows[0].count}`);
    }

    await pool.end();
    console.log('\n✅ Connection closed.');
  } catch (error) {
    console.error('❌ Error inspecting schema:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

inspectSchema();
