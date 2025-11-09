import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

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

async function exportToCSV() {
  try {
    console.log('Connecting to database...');

    // Query the data
    const query = 'SELECT * FROM "public"."economic_calendar_ff" LIMIT 1000';
    const result = await pool.query(query);

    console.log(`Fetched ${result.rows.length} rows`);

    if (result.rows.length === 0) {
      console.log('No data to export');
      await pool.end();
      return;
    }

    // Get column names from the first row
    const columns = Object.keys(result.rows[0]);

    // Create CSV header
    let csv = columns.join(',') + '\n';

    // Add rows with proper formatting
    result.rows.forEach(row => {
      const values = columns.map(col => {
        let value = row[col];

        // Handle null values
        if (value === null || value === undefined) {
          return '';
        }

        // Handle dates - format as YYYY-MM-DD
        if (value instanceof Date) {
          if (col === 'date') {
            // Format date as YYYY-MM-DD (remove time portion)
            value = value.toISOString().split('T')[0];
          } else if (col === 'created_at' || col === 'updated_at' || col === 'last_updated') {
            // Format datetime as YYYY-MM-DD HH:MM:SS
            const d = new Date(value);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            const seconds = String(d.getSeconds()).padStart(2, '0');
            value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          }
        }

        // Convert to string and escape quotes
        value = String(value).replace(/"/g, '""');

        // Wrap in quotes if contains comma, newline, or quote
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value}"`;
        }

        return value;
      });

      csv += values.join(',') + '\n';
    });

    // Save to file
    const filename = 'economic_calendar_export.csv';
    fs.writeFileSync(filename, csv, 'utf8');

    console.log(`\n✅ CSV exported successfully!`);
    console.log(`File: ${filename}`);
    console.log(`Rows: ${result.rows.length}`);
    console.log(`Columns: ${columns.length}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    await pool.end();
    process.exit(1);
  }
}

exportToCSV();
