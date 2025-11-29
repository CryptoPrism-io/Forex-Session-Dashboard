import { fxPool } from './db.js';

async function testFXDatabase() {
  console.log('\n🔍 Testing fx_global database connection...\n');

  try {
    // Test 1: oanda_candles
    const candles = await fxPool.query('SELECT COUNT(*) FROM oanda_candles');
    console.log(`✅ oanda_candles: ${candles.rows[0].count} rows`);

    // Test 2: volatility_metrics
    const volatility = await fxPool.query('SELECT COUNT(*) FROM volatility_metrics');
    console.log(`✅ volatility_metrics: ${volatility.rows[0].count} rows`);

    // Test 3: correlation_matrix
    const correlation = await fxPool.query('SELECT COUNT(*) FROM correlation_matrix');
    console.log(`✅ correlation_matrix: ${correlation.rows[0].count} rows`);

    // Test 4: best_pairs_tracker
    const bestPairs = await fxPool.query('SELECT COUNT(*) FROM best_pairs_tracker');
    console.log(`✅ best_pairs_tracker: ${bestPairs.rows[0].count} rows`);

    // Test 5: instruments
    const instruments = await fxPool.query('SELECT COUNT(*) FROM instruments');
    console.log(`✅ instruments: ${instruments.rows[0].count} rows`);

    // Test 6: market_sessions
    const sessions = await fxPool.query('SELECT COUNT(*) FROM market_sessions');
    console.log(`✅ market_sessions: ${sessions.rows[0].count} rows`);

    // Test 7: cron_job_log
    const cronLog = await fxPool.query('SELECT COUNT(*) FROM cron_job_log');
    console.log(`✅ cron_job_log: ${cronLog.rows[0].count} rows`);

    // Sample data check: Latest candle
    const latestCandle = await fxPool.query(`
      SELECT instrument, close_mid, time
      FROM oanda_candles
      WHERE granularity = 'H1'
      ORDER BY time DESC
      LIMIT 1
    `);
    console.log(`\n📊 Latest candle: ${latestCandle.rows[0].instrument} @ ${latestCandle.rows[0].close_mid} (${latestCandle.rows[0].time})`);

    // Sample data check: Available instruments
    const instrumentList = await fxPool.query(`
      SELECT name, asset_class
      FROM instruments
      ORDER BY asset_class, name
      LIMIT 10
    `);
    console.log(`\n📈 Sample instruments (first 10):`);
    instrumentList.rows.forEach(row => {
      console.log(`   ${row.asset_class}: ${row.name}`);
    });

    console.log('\n✅ All tests passed! Database is ready.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testFXDatabase();
