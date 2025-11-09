// API Verification Test Script
// Tests all endpoints and verifies functionality

console.log('🧪 Running API Verification Tests...\n');

const tests = [
  {
    name: 'Test 1: Default week endpoint (no params)',
    url: 'http://localhost:5000/api/calendar/events',
    check: (data) => {
      console.log(`  Date Range: ${data.dateRange.start} to ${data.dateRange.end}`);
      console.log(`  Event Count: ${data.count}`);
      return data.count > 0 && data.dateRange.start && data.dateRange.end;
    }
  },
  {
    name: 'Test 2: Specific date range (2025-11-09)',
    url: 'http://localhost:5000/api/calendar/events?startDate=2025-11-09&endDate=2025-11-09',
    check: (data) => {
      console.log(`  Event Count: ${data.count}`);
      if (data.count > 0) {
        console.log(`  Sample times:`, data.data.slice(0, 3).map(e => e.time_utc));
      }
      return data.success === true;
    }
  },
  {
    name: 'Test 3: Combined filters (USD + high impact)',
    url: 'http://localhost:5000/api/calendar/events?startDate=2025-11-08&endDate=2025-11-15&currency=USD&impact=high',
    check: (data) => {
      console.log(`  Filtered Count: ${data.count}`);
      const allUSD = data.data.every(e => e.currency === 'USD');
      const allHigh = data.data.every(e => e.impact.toLowerCase() === 'high');
      console.log(`  All USD: ${allUSD}`);
      console.log(`  All High Impact: ${allHigh}`);
      return allUSD && allHigh;
    }
  },
  {
    name: 'Test 4: Stats endpoint',
    url: 'http://localhost:5000/api/calendar/stats',
    check: (data) => {
      console.log(`  Total Events: ${data.stats.total_events}`);
      console.log(`  Currencies: ${data.stats.currencies}`);
      console.log(`  High Impact: ${data.stats.high_impact}`);
      return data.success === true && data.stats.total_events > 0;
    }
  },
  {
    name: 'Test 5: Currencies endpoint',
    url: 'http://localhost:5000/api/calendar/currencies',
    check: (data) => {
      console.log(`  Currency List: ${data.currencies.slice(0, 10).join(', ')}${data.currencies.length > 10 ? '...' : ''}`);
      return data.success === true && data.currencies.length > 0;
    }
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📝 ${test.name}`);

    try {
      const response = await fetch(test.url);
      const data = await response.json();

      if (test.check(data)) {
        console.log('  ✅ PASSED\n');
        passed++;
      } else {
        console.log('  ❌ FAILED: Check condition not met\n');
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}\n`);
      failed++;
    }
  }

  console.log('═══════════════════════════════════════');
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✨ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

runTests();
