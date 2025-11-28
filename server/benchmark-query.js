import pool from './db.js';

async function benchmarkQuery() {
  console.log('🔍 Benchmarking database query performance...\n');

  const todayISO = '2025-11-28';
  const tomorrowISO = '2025-11-29';

  const query = `
    SELECT
      id, date, to_char(date_utc, 'YYYY-MM-DD') as date_utc,
      time, time_utc, time_zone, currency, impact, event,
      actual, forecast, previous, source, event_uid, actual_status
    FROM economic_calendar_ff
    WHERE date_utc >= $1::date AND date_utc < $2::date
    ORDER BY time_utc ASC, event ASC
  `;

  // Warm-up query
  await pool.query(query, [todayISO, tomorrowISO]);

  // Run 10 benchmark tests
  const times = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    const result = await pool.query(query, [todayISO, tomorrowISO]);
    const end = performance.now();
    times.push(end - start);
    console.log(`Test ${i + 1}: ${(end - start).toFixed(2)}ms (${result.rows.length} rows)`);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`\n📊 Results:`);
  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Min: ${min.toFixed(2)}ms`);
  console.log(`   Max: ${max.toFixed(2)}ms`);

  await pool.end();
}

benchmarkQuery().catch(console.error);
