# FX Data Pipeline Integration Plan
## Forex Session Trading Dashboard - 6-Week MVP (REVISED)

---

## Executive Summary

**Objective:** Integrate FX data from existing pipeline into Forex Session Dashboard to deliver 6 MUST-HAVE PRD features in 6 weeks.

**Architecture Decision:** **SEPARATE SERVICES** (Dashboard reads from shared database)

**Rationale:**
- **Pipeline already running** on GitHub Actions (hourly + daily cron jobs)
- **Database already populated** with 36 instruments in `fx_global`
- **Focus on value** - Build frontend features, not port Python code
- **Faster to market** - 6 weeks instead of 10 weeks
- **Lower cost** - ~$30/month (GitHub Actions free + Cloud Run dashboard)

**Timeline:** 6 weeks, 3 sprints, ~60 hours total effort (10 hrs/week)

---

## Architecture Overview

### System Architecture (Separate Services)
```
┌─────────────────────────────────────────────────────────────┐
│              GITHUB ACTIONS (Free Tier)                     │
│  DataPipeline-FX-APP (Python/Flask)                         │
│  ├── Hourly Cron: Fetch candles (36 instruments)           │
│  ├── Hourly Cron: Calculate volatility metrics             │
│  └── Daily Cron: Calculate correlation matrix              │
└─────────────────────────────────────────────────────────────┘
                          ↓ (writes to)
┌─────────────────────────────────────────────────────────────┐
│           POSTGRESQL CLOUD SQL (fx_global)                  │
│  ✅ oanda_candles (OHLC data, 365-day retention)           │
│  ✅ volatility_metrics (HV-20, HV-50, ATR, SMA, BB)        │
│  ✅ correlation_matrix (21×21 FX pairs)                    │
│  ✅ best_pairs_tracker (Trading recommendations)           │
│  ✅ cron_job_log (Job execution history)                   │
│  ✅ instruments (Instrument metadata)                      │
│  ✅ market_sessions (Session config)                       │
└─────────────────────────────────────────────────────────────┘
                          ↑ (reads from)
┌─────────────────────────────────────────────────────────────┐
│     FOREX SESSION DASHBOARD (Cloud Run - $15-30/month)     │
│  Forex-Session-Dashboard/ (this repo)                       │
│  ├── src/                     # React 19 frontend           │
│  │   ├── components/                                        │
│  │   │   ├── RiskCalculator.tsx        # NEW: PRD P1       │
│  │   │   ├── VolatilityPanel.tsx       # NEW: PRD P2       │
│  │   │   ├── CorrelationMatrix.tsx     # NEW: PRD P5       │
│  │   │   └── DangerZoneOverlay.tsx     # NEW: PRD P4       │
│  │   └── hooks/                                             │
│  │       ├── useFXPrice.ts             # NEW               │
│  │       ├── useFXVolatility.ts        # NEW               │
│  │       └── useFXCorrelation.ts       # NEW               │
│  │                                                          │
│  └── server/                  # Express.js backend          │
│      ├── api/                                               │
│      │   ├── calendar/        # Existing (economic events) │
│      │   └── fx/              # NEW: Read from fx_global   │
│      │       ├── prices.js                                 │
│      │       ├── candles.js                                │
│      │       ├── volatility.js                             │
│      │       ├── correlation.js                            │
│      │       └── bestPairs.js                              │
│      └── db.js                # Connect to fx_global       │
└─────────────────────────────────────────────────────────────┘
                          ↑ (fetches from)
                     USERS (Web Browser)
```

### Key Changes from Original Plan
- ✅ **No Python porting** - Pipeline stays in separate repo
- ✅ **No job scheduling in dashboard** - GitHub Actions handles it
- ✅ **No OANDA client** - Pipeline manages API calls
- ✅ **Read-only database access** - Dashboard only reads from `fx_global`
- ✅ **Simpler deployment** - Just frontend + thin API layer

---

## Database Schema (fx_global - Already Exists ✅)

### 7 Tables in Production

**Status:** ✅ All tables already created and populated by DataPipeline-FX-APP

**1. oanda_candles** - OHLC price data (365-day retention)
- 36 instruments × ~8,760 hours/year = ~315,360 rows
- Updated: Hourly by GitHub Actions
- Dashboard Usage: Historical charts, candle data API

**2. volatility_metrics** - Technical indicators (hourly refresh)
- 36 instruments × ~8,760 hours/year = ~315,360 rows
- Updated: Hourly by GitHub Actions
- Dashboard Usage: Volatility panel, risk calculator (ATR)

**3. correlation_matrix** - Pairwise correlations (daily refresh)
- 21 FX pairs × 210 combinations × ~365 days = ~76,650 rows
- Updated: Daily at 00:00 UTC by GitHub Actions
- Dashboard Usage: Correlation heatmap

**4. best_pairs_tracker** - Trading recommendations
- ~20 pairs × ~365 days = ~7,300 rows
- Updated: Daily by GitHub Actions
- Dashboard Usage: Best pairs widget

**5. cron_job_log** - Job execution history
- ~50 jobs/day × ~365 days = ~18,250 rows
- Updated: After each job run
- Dashboard Usage: (Optional) Job monitoring panel

**6. instruments** - Instrument metadata
- 36 instruments (static)
- Dashboard Usage: Instrument dropdown, filters

**7. market_sessions** - Session config (static)
- 4 sessions (Tokyo, London, New York, Sydney)
- Dashboard Usage: Session timing (already in constants.ts)

**Dashboard Database Access:** READ-ONLY via existing PostgreSQL credentials

---

## Sprint Breakdown (6 Weeks - REVISED)

### Sprint 1 (Weeks 1-2): Backend API Layer

**Goals:**
- Create Express.js API endpoints that read from `fx_global` database
- Test data retrieval from existing pipeline tables
- Basic caching (optional for MVP)

**Key Deliverables:**
- ✅ 8 REST API endpoints serving FX data
- ✅ Database queries optimized for read performance
- ✅ API documentation (inline comments)
- ✅ Postman/Thunder Client testing

**Files to Create (5):**
- `server/api/fx/prices.js` - Current prices + all instruments
- `server/api/fx/candles.js` - Historical OHLC data
- `server/api/fx/volatility.js` - Volatility metrics (single + all)
- `server/api/fx/correlation.js` - Correlation matrix + pairs
- `server/api/fx/bestPairs.js` - Trading pair recommendations

**Files to Modify (2):**
- `server/db.js` - Add connection to `fx_global` database
- `server/server.js` - Register `/api/fx/*` routes

**API Endpoints to Implement:**
1. `GET /api/fx/prices/current?instrument=EUR_USD` - Latest price for one instrument
2. `GET /api/fx/prices/all` - All 36 instruments latest prices
3. `GET /api/fx/candles/:instrument?limit=100&granularity=H1` - OHLC chart data
4. `GET /api/fx/volatility/:instrument` - Volatility metrics for one instrument
5. `GET /api/fx/volatility` - Volatility metrics for all instruments
6. `GET /api/fx/correlation/matrix` - Full 21×21 correlation matrix
7. `GET /api/fx/correlation/pairs` - Pairwise correlation list
8. `GET /api/fx/best-pairs?category=hedging` - Filtered recommendations

**Success Metrics:**
- All 8 endpoints return valid JSON data
- Response time < 200ms for single instrument queries
- Response time < 500ms for bulk queries (all instruments)
- Manual testing with Postman passes

**Complexity:** Low-Medium
**Estimated Hours:** 16 hours

**Detailed Implementation Steps:**

**Day 1-2: Database Connection**
```javascript
// server/db.js - Add fx_global connection
const { Pool } = require('pg');

const fxPool = new Pool({
  host: process.env.POSTGRES_HOST,     // 34.55.195.199
  port: process.env.POSTGRES_PORT,     // 5432
  database: 'fx_global',               // NEW: fx_global database
  user: process.env.POSTGRES_USER,     // yogass09
  password: process.env.POSTGRES_PASSWORD,
  max: 10,
  ssl: { rejectUnauthorized: false }
});

module.exports = { pool, fxPool }; // Export both pools
```

**Day 3-4: Prices API**
```javascript
// server/api/fx/prices.js
const { fxPool } = require('../../db');

// GET /api/fx/prices/current?instrument=EUR_USD
async function getCurrentPrice(req, res) {
  const { instrument } = req.query;

  const result = await fxPool.query(`
    SELECT instrument, close_mid as mid, time
    FROM oanda_candles
    WHERE instrument = $1
    AND granularity = 'H1'
    ORDER BY time DESC
    LIMIT 1
  `, [instrument]);

  res.json({ success: true, data: result.rows[0] });
}

// GET /api/fx/prices/all
async function getAllPrices(req, res) {
  const result = await fxPool.query(`
    SELECT DISTINCT ON (instrument)
      instrument, close_mid as mid, time
    FROM oanda_candles
    WHERE granularity = 'H1'
    ORDER BY instrument, time DESC
  `);

  res.json({ success: true, count: result.rows.length, data: result.rows });
}

module.exports = { getCurrentPrice, getAllPrices };
```

**Day 5-6: Volatility API**
```javascript
// server/api/fx/volatility.js
const { fxPool } = require('../../db');

// GET /api/fx/volatility/:instrument
async function getVolatility(req, res) {
  const { instrument } = req.params;

  const result = await fxPool.query(`
    SELECT instrument, time, volatility_20, volatility_50,
           sma_15, sma_30, sma_50, atr,
           bb_upper, bb_middle, bb_lower
    FROM volatility_metrics
    WHERE instrument = $1
    ORDER BY time DESC
    LIMIT 1
  `, [instrument]);

  res.json({ success: true, data: result.rows[0] });
}

// GET /api/fx/volatility (all instruments)
async function getAllVolatility(req, res) {
  const result = await fxPool.query(`
    SELECT DISTINCT ON (instrument)
      instrument, time, volatility_20, atr
    FROM volatility_metrics
    ORDER BY instrument, time DESC
  `);

  res.json({ success: true, count: result.rows.length, data: result.rows });
}

module.exports = { getVolatility, getAllVolatility };
```

**Day 7-8: Candles, Correlation, Best Pairs APIs**
- Implement remaining 4 endpoints
- Test with real data from `fx_global`
- Document API responses

**Day 9-10: Testing & Integration**
- Register all routes in `server/server.js`
- Test CORS headers
- Test from React frontend (dev mode)
- Fix any bugs

---

### Sprint 2 (Weeks 3-4): Frontend Core Features

**Goals:**
- Build Position Size & Risk Calculator (PRD Priority 1)
- Build Volatility Panel (PRD Priority 2)
- Build Best Pairs Widget
- Create custom React hooks for data fetching

**Key Deliverables:**
- ✅ Risk Calculator component with ATR-based position sizing
- ✅ Volatility Panel displaying HV-20, HV-50, ATR, SMA, Bollinger Bands
- ✅ Best Pairs Widget showing top hedging/uncorrelated pairs
- ✅ Custom hooks for API integration
- ✅ New "FX Data" tab in navigation

**Components to Create (6):**
- `src/components/RiskCalculator.tsx` - Position size calculator
- `src/components/VolatilityPanel.tsx` - Display volatility metrics for all instruments
- `src/components/VolatilityMeter.tsx` - Single instrument meter
- `src/components/BestPairsWidget.tsx` - Trading recommendations
- `src/hooks/useFXPrice.ts` - Fetch prices from API
- `src/hooks/useFXVolatility.ts` - Fetch volatility metrics

**Files to Modify (3):**
- `src/App.tsx` - Add 'fxdata' to activeView tabs
- `src/BentoDesktopLayout.tsx` - Add FX widgets to layout
- `src/constants.ts` - Add INSTRUMENTS array (36 instruments)

**Success Metrics:**
- Risk calculator produces accurate position sizes (manual validation)
- Volatility data refreshes automatically (1-hour interval via polling)
- User can select instruments from dropdown
- Components render within 2 seconds

**Complexity:** Medium
**Estimated Hours:** 24 hours

**Detailed Implementation Steps:**

**Day 1-3: Custom Hooks**
```typescript
// src/hooks/useFXPrice.ts
import { useState, useEffect } from 'react';

interface Price {
  instrument: string;
  mid: number;
  time: string;
}

export function useFXPrice(instrument?: string) {
  const [price, setPrice] = useState<Price | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const endpoint = instrument
          ? `/api/fx/prices/current?instrument=${instrument}`
          : '/api/fx/prices/all';

        const res = await fetch(endpoint);
        const data = await res.json();

        setPrice(data.data);
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }

    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // Refresh every 60s

    return () => clearInterval(interval);
  }, [instrument]);

  return { price, loading, error };
}
```

```typescript
// src/hooks/useFXVolatility.ts
import { useState, useEffect } from 'react';

interface VolatilityMetrics {
  instrument: string;
  time: string;
  volatility_20: number;
  volatility_50: number;
  atr: number;
  sma_15: number;
  sma_30: number;
  sma_50: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
}

export function useFXVolatility(instrument?: string) {
  const [metrics, setMetrics] = useState<VolatilityMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVolatility() {
      const endpoint = instrument
        ? `/api/fx/volatility/${instrument}`
        : '/api/fx/volatility';

      const res = await fetch(endpoint);
      const data = await res.json();

      setMetrics(instrument ? [data.data] : data.data);
      setLoading(false);
    }

    fetchVolatility();
    const interval = setInterval(fetchVolatility, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, [instrument]);

  return { metrics, loading };
}
```

**Day 4-7: Risk Calculator Component**
```typescript
// src/components/RiskCalculator.tsx
import React, { useState } from 'react';
import { useFXVolatility } from '../hooks/useFXVolatility';

export function RiskCalculator() {
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [stopLossPips, setStopLossPips] = useState(50);
  const [selectedPair, setSelectedPair] = useState('EUR_USD');

  const { metrics } = useFXVolatility(selectedPair);
  const atr = metrics[0]?.atr || 0;

  // Position size calculation
  const riskAmount = accountBalance * (riskPercent / 100);
  const pipValue = 10; // For standard lot (simplified)
  const lotSize = riskAmount / (stopLossPips * pipValue);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Position Size Calculator</h2>

      <div className="space-y-4">
        <div>
          <label>Currency Pair</label>
          <select
            value={selectedPair}
            onChange={(e) => setSelectedPair(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="EUR_USD">EUR/USD</option>
            <option value="GBP_USD">GBP/USD</option>
            {/* ... add all 36 instruments */}
          </select>
        </div>

        <div>
          <label>Account Balance ($)</label>
          <input
            type="number"
            value={accountBalance}
            onChange={(e) => setAccountBalance(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Risk Per Trade (%)</label>
          <input
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(Number(e.target.value))}
            step="0.1"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Stop Loss (pips)</label>
          <input
            type="number"
            value={stopLossPips}
            onChange={(e) => setStopLossPips(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold">Recommended Position Size</h3>
          <p className="text-2xl">{lotSize.toFixed(2)} lots</p>
          <p className="text-sm text-gray-600">
            Max Risk: ${riskAmount.toFixed(2)} | ATR: {atr.toFixed(5)}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Day 8-10: Volatility Panel & Best Pairs Widget**
- Implement VolatilityPanel with AG Grid or table
- Implement BestPairsWidget with recommendations
- Add to BentoDesktopLayout

---

### Sprint 3 (Weeks 5-6): Advanced Features

**Goals:**
- Correlation Matrix (PRD Priority 5)
- News Danger Zones (PRD Priority 4)
- Enhanced Session Alerts with volatility triggers
- Best Pairs Widget

**Key Deliverables:**
- ✅ Risk Calculator with ATR-based position sizing
- ✅ Volatility panel (HV-20, HV-50, ATR, SMA, Bollinger Bands)
- ✅ Best pairs recommendations widget
- ✅ ForexChart volatility overlay
- ✅ New "FX Data" tab in navigation

**Components to Create (6):**
- `components/RiskCalculator.tsx` - Account, risk %, stop-loss → lot size
- `components/VolatilityPanel.tsx` - Display metrics for all instruments
- `components/VolatilityMeter.tsx` - Single instrument visualization
- `components/BestPairsWidget.tsx` - Top hedging/uncorrelated pairs
- `hooks/useFXPrice.ts` - Fetch current prices
- `hooks/useFXVolatility.ts` - Fetch volatility metrics

**Files to Modify (3):**
- `App.tsx` - Add 'fxdata' to activeView tabs
- `ForexChart.tsx` - Add volatility color overlay
- `constants.ts` - Add INSTRUMENTS array (36 instruments: 19 FX + 2 metals + 15 CFDs)

**Success Metrics:**
- Risk calculator produces accurate position sizes (validated manually)
- Volatility data refreshes every 1 hour
- User can switch between timeline/volatility views

**Complexity:** Medium
**Estimated Hours:** 30 hours

---

### Sprint 4 (Weeks 7-8): Advanced Features (PRD Features 3-5)

**Goals:**
- Session Countdown & Browser Alerts (enhance existing - PRD Feature 3)
- News Danger Zones Visualization (PRD Feature 4)
- Currency Correlation Matrix (PRD Feature 5)

**Key Deliverables:**
- ✅ Enhanced alerts with volatility thresholds
- ✅ Danger zone overlays on ForexChart (30min before/after high-impact news)
- ✅ Correlation matrix heatmap (21×21 FX pairs)
- ✅ Real-time alert triggers

**Components to Create (4):**
- `components/CorrelationMatrix.tsx` - Heatmap with hover tooltips
- `components/DangerZoneOverlay.tsx` - News event shading on chart
- `hooks/useFXCorrelation.ts` - Fetch correlation data
- `hooks/useWebSocket.ts` - (Optional - can defer to Phase 2)

**Files to Modify (3):**
- `ForexChart.tsx` - Add danger zone shading logic
- `hooks/useSessionAlerts.ts` - Extend with volatility triggers
- `EconomicCalendar.tsx` - Add "danger zone" column

**Success Metrics:**
- Danger zones prevent trades during high-impact news
- Correlation matrix loads in < 2 seconds
- Alerts trigger within 1 minute of threshold breach

**Complexity:** Medium-High
**Estimated Hours:** 32 hours

---

### Sprint 5 (Weeks 9-10): Production Readiness

**Goals:**
- Deployment optimization
- Monitoring & observability
- Documentation
- Load testing

**Key Deliverables:**
- ✅ Docker container with Redis sidecar
- ✅ Cloud Run deployment with auto-scaling
- ✅ Job monitoring dashboard
- ✅ API documentation (Swagger/OpenAPI)
- ✅ Load testing results (1000 concurrent users)

**Files to Create (4):**
- `docker-entrypoint.sh` - Redis + Node.js startup script
- `docker-compose.yml` - Local dev environment
- `docs/FX_API.md` - API endpoint documentation
- `docs/DEPLOYMENT.md` - Deployment guide

**Files to Modify (3):**
- `Dockerfile` - Multi-container setup (Node.js + Redis)
- `env.yaml` - OANDA + Redis environment variables
- `.github/workflows/deploy.yml` - Update Cloud Run config

**Success Metrics:**
- Zero downtime deployment
- Jobs continue running after redeployment
- API handles 1000 req/s
- Job failure rate < 1%

**Complexity:** Medium
**Estimated Hours:** 18 hours

---

## Technology Stack

### Backend Dependencies (Minimal - No Changes Needed)
**Status:** ✅ No new dependencies required for Sprint 1-2

**Optional for Sprint 3 (if needed):**
```json
{
  "ioredis": "^5.3.2"  // Redis client (only if adding caching)
}
```

**Existing Dependencies Already Sufficient:**
- `pg` - PostgreSQL client (already installed)
- `express` - API server (already installed)
- `cors` - CORS handling (already installed)

### Environment Variables (Already Configured ✅)
```yaml
# PostgreSQL (fx_global database)
POSTGRES_HOST: "34.55.195.199"
POSTGRES_PORT: "5432"
POSTGRES_DB: "fx_global"  # NEW: Point to fx_global instead of dbcp
POSTGRES_USER: "yogass09"
POSTGRES_PASSWORD: "jaimaakamakhya"

# OANDA (Not needed in dashboard - pipeline handles it)
# OANDA_API_KEY: "1efe..." (Only in DataPipeline-FX-APP repo)

# Redis (Optional - defer to Phase 2)
# REDIS_HOST: "localhost"
# REDIS_PORT: "6379"
```

---

## Key Design Decisions

### Decision 1: Architecture - Separate Services vs Monorepo
**Choice:** SEPARATE SERVICES (Dashboard + Pipeline)
**Rationale:**
- Pipeline already running and tested on GitHub Actions
- No Python → Node.js porting needed (saves 4+ weeks)
- Dashboard only needs read access to `fx_global` database
- Lower monthly cost (~$30 vs $45-90)
- Faster time to market (6 weeks vs 10 weeks)

### Decision 2: Instrument Count (21 vs 36)
**Choice:** All 36 instruments (19 FX + 2 metals + 15 CFDs)
**Rationale:**
- Full coverage from day 1 per user requirement
- CFDs tracked for volatility (not used in correlation matrix)
- API rate limit mitigation via exponential backoff and request batching

### Decision 3: WebSocket - Now or Later?
**Choice:** DEFER to Phase 2
**Rationale:**
- Polling every 60 seconds acceptable for MVP
- WebSocket adds complexity (connection management, reconnection)
- Focus on core features first (PRD priorities 1-5)

### Decision 4: Redis Deployment
**Choice:** In-container Redis (not Cloud Memorystore)
**Rationale:**
- Cloud Run supports multi-container deployments
- ~$30/month savings vs Memorystore
- Easier local development
- Upgrade to Memorystore if traffic > 10k req/hour

### Decision 5: Authentication & Payments
**Choice:** DEFER to Phase 2 (not in 10-week MVP)
**Rationale:**
- PRD Features 6-7 are lower priority than data features
- Authentication requires user management infrastructure
- Stripe integration requires legal/compliance setup
- Focus on proving product value first

---

## Risk Mitigation Strategies

### Risk 1: OANDA API Rate Limits (100 req/60s)
**Impact:** 36 instruments × 2 requests/hour = 72 requests (72% of limit)
**Mitigation:**
- Exponential backoff with 3 retries (1s, 2s, 4s delays)
- Rate limit tracking in Redis (`oanda:requests` counter)
- Request throttling: 10 req/s max with 100ms delays between batches
- Monitor rate limit headers in responses
- Separate job runs: FX/metals (priority) → CFDs (lower priority)
- Failure isolation: Failed instruments don't block others

### Risk 2: Job Failures
**Mitigation:**
- Comprehensive logging to `cron_job_log` table
- Retry failed instruments separately (don't fail entire job)
- Backfill script for gap detection
- Cloud Logging alerts on consecutive failures

### Risk 3: Database Migration Failures
**Mitigation:**
- Transaction-wrapped migrations
- Separate migration files (one per table)
- Rollback scripts prepared
- Test migrations on staging DB first

### Risk 4: Cloud Run Cold Starts
**Mitigation:**
- Set `min_instances: 1` (always-on)
- Use warmup requests
- Optimize container startup time

---

## Implementation Checklist

### Sprint 1 (Weeks 1-2)
- [ ] Create database migration script
- [ ] Run migrations on dev database
- [ ] Install new npm dependencies (node-cron, axios, decimal.js)
- [ ] Implement OANDA client with error handling
- [ ] Create instrument configuration (21 instruments)
- [ ] Implement candle repository (insert/query)
- [ ] Implement volatility calculator (HV, ATR, SMA, BB)
- [ ] Implement hourly job (fetch + calculate)
- [ ] Implement correlation calculator (Pearson)
- [ ] Implement daily correlation job
- [ ] Test jobs locally for 48 hours
- [ ] Verify data quality in database

### Sprint 2 (Weeks 3-4)
- [ ] Set up Redis (Docker for local dev)
- [ ] Implement Redis client wrapper
- [ ] Implement cache service (get/set/invalidate)
- [ ] Create 8 API endpoints (/api/fx/*)
- [ ] Add cache headers to responses
- [ ] Write API integration tests
- [ ] Load test with Artillery/k6 (100 req/s)
- [ ] Monitor cache hit rate

### Sprint 3 (Weeks 5-6)
- [ ] Create RiskCalculator component
- [ ] Create VolatilityPanel component
- [ ] Create BestPairsWidget component
- [ ] Create useFXPrice hook
- [ ] Create useFXVolatility hook
- [ ] Add "FX Data" tab to App.tsx
- [ ] Update ForexChart with volatility overlay
- [ ] Test risk calculator accuracy
- [ ] Test data refresh (1-hour interval)

### Sprint 4 (Weeks 7-8)
- [ ] Create CorrelationMatrix component (heatmap)
- [ ] Create DangerZoneOverlay component
- [ ] Create useFXCorrelation hook
- [ ] Enhance useSessionAlerts with volatility triggers
- [ ] Add danger zones to ForexChart
- [ ] Test correlation matrix performance
- [ ] Test alert timing accuracy

### Sprint 5 (Weeks 9-10)
- [ ] Update Dockerfile (multi-container)
- [ ] Create docker-compose.yml
- [ ] Update env.yaml with all variables
- [ ] Write FX_API.md documentation
- [ ] Write DEPLOYMENT.md guide
- [ ] Deploy to Cloud Run staging
- [ ] Run load tests (1000 concurrent users)
- [ ] Monitor job execution post-deployment
- [ ] Deploy to production

---

## File-by-File Implementation Guide

### Critical Files to Create (30 total)

**Backend (22 files):**
1. `server/migrations/002_add_fx_pipeline_tables.sql`
2. `server/integrations/oandaClient.js`
3. `server/db/candleRepository.js`
4. `server/db/volatilityRepository.js`
5. `server/db/correlationRepository.js`
6. `server/db/bestPairsRepository.js`
7. `server/db/jobLogRepository.js`
8. `server/utils/volatilityCalculator.js`
9. `server/utils/correlationCalculator.js`
10. `server/utils/instrumentConfig.js`
11. `server/jobs/scheduler.js`
12. `server/jobs/hourlyJob.js`
13. `server/jobs/dailyCorrelationJob.js`
14. `server/jobs/backfillJob.js`
15. `server/cache/redisClient.js`
16. `server/cache/cacheService.js`
17. `server/api/fx/prices.js`
18. `server/api/fx/candles.js`
19. `server/api/fx/volatility.js`
20. `server/api/fx/correlation.js`
21. `server/api/fx/bestPairs.js`
22. `server/websocket/server.js` (optional)

**Frontend (8 files):**
23. `components/RiskCalculator.tsx`
24. `components/VolatilityPanel.tsx`
25. `components/VolatilityMeter.tsx`
26. `components/BestPairsWidget.tsx`
27. `components/CorrelationMatrix.tsx`
28. `components/DangerZoneOverlay.tsx`
29. `hooks/useFXPrice.ts`
30. `hooks/useFXVolatility.ts`
31. `hooks/useFXCorrelation.ts`

### Files to Modify (10 total)
1. `server/server.js` - Register FX routes, initialize scheduler
2. `server/package.json` - Add 5 dependencies
3. `App.tsx` - Add 'fxdata' tab
4. `ForexChart.tsx` - Volatility overlay + danger zones
5. `constants.ts` - Add INSTRUMENTS array
6. `hooks/useSessionAlerts.ts` - Volatility triggers
7. `Dockerfile` - Multi-container setup
8. `env.yaml` - OANDA + Redis vars
9. `.github/workflows/deploy.yml` - Cloud Run config
10. `docker-compose.yml` - Create new

---

## Deployment Architecture (REVISED)

### Local Development (Simplified)
```bash
# No Docker needed for local dev!
# Just connect to Cloud SQL fx_global database

# 1. Update server/.env
POSTGRES_HOST=34.55.195.199
POSTGRES_DB=fx_global  # Change from dbcp

# 2. Start frontend + backend
npm run dev          # Frontend (port 3000)
cd server && npm run dev  # Backend (port 5000)

# 3. Test API connection
curl http://localhost:5000/api/fx/prices/all
```

### Production (Cloud Run) - No Changes Needed!
**Current Setup:** ✅ Already deployed

**Resources:**
- CPU: 2 vCPU
- Memory: 1 GB
- Min instances: 0 (scale to zero when idle)
- Max instances: 10 (auto-scale on traffic)

**Deployment:**
- Same Dockerfile (no changes needed)
- Just update `env.yaml` with `POSTGRES_DB=fx_global`
- Deploy via GitHub Actions (existing workflow)

**Estimated Cost:** ~$15-30/month (scales to zero + requests)

**Pipeline Cost:** $0/month (GitHub Actions free tier: 2000 minutes/month)

---

## Success Criteria (MVP Completion)

### Functional Requirements
- [ ] Hourly job fetches candles for 36 instruments (success rate > 99%)
- [ ] Volatility metrics calculated and cached (1-hour refresh)
- [ ] Correlation matrix updated daily (21×21 pairs)
- [ ] Risk calculator produces accurate position sizes
- [ ] Danger zones displayed on news events
- [ ] All 8 API endpoints respond < 500ms (p95)

### Non-Functional Requirements
- [ ] Cache hit rate > 90%
- [ ] Job failure rate < 1%
- [ ] API uptime > 99.5%
- [ ] Zero downtime deployments
- [ ] Database size < 5 GB (365-day retention)

### Performance Targets
- [ ] 1000 concurrent users supported
- [ ] API throughput: 100 req/s
- [ ] P95 latency: < 500ms
- [ ] Job execution time: < 30s (hourly), < 60s (daily)

---

## Next Steps (Week 0 - Setup)

**Immediate Actions (1-2 days):**

1. **✅ Verify Pipeline is Running**
   - Check GitHub Actions in DataPipeline-FX-APP repo
   - Confirm hourly + daily jobs are green
   - Verify last run timestamps

2. **Update Dashboard Database Config**
   ```bash
   # server/.env (or env.yaml for Cloud Run)
   POSTGRES_HOST=34.55.195.199
   POSTGRES_PORT=5432
   POSTGRES_DB=fx_global  # CHANGE: was 'dbcp'
   POSTGRES_USER=yogass09
   POSTGRES_PASSWORD=jaimaakamakhya
   ```

3. **Test Database Connection**
   ```bash
   # Test query from server/
   cd server
   node -e "
   const { Pool } = require('pg');
   const pool = new Pool({
     host: '34.55.195.199',
     port: 5432,
     database: 'fx_global',
     user: 'yogass09',
     password: 'jaimaakamakhya',
     ssl: { rejectUnauthorized: false }
   });
   pool.query('SELECT COUNT(*) FROM oanda_candles')
     .then(res => console.log('✅ Candles:', res.rows[0].count))
     .catch(err => console.error('❌ Error:', err));
   "
   ```

4. **Verify Tables Have Data**
   ```sql
   -- Run these queries to confirm pipeline populated tables
   SELECT COUNT(*) FROM oanda_candles;  -- Should have 315k+ rows
   SELECT COUNT(*) FROM volatility_metrics;  -- Should have 315k+ rows
   SELECT COUNT(*) FROM correlation_matrix;  -- Should have 76k+ rows
   SELECT COUNT(*) FROM best_pairs_tracker;  -- Should have 7k+ rows
   SELECT COUNT(*) FROM instruments;  -- Should have 36 rows
   ```

5. **Decision Checkpoint**
   - ✅ Confirm 6-week timeline is acceptable
   - ✅ Confirm separate services approach
   - ✅ Approve starting with Sprint 1 (Backend API)

**First Day Goals:**
- Database connection verified
- Tables confirmed to have data
- Ready to start Sprint 1 (Backend API endpoints)

---

## Estimated Effort Summary (REVISED)

| Component | Hours | Notes |
|-----------|-------|-------|
| ~~Database migrations~~ | ~~4~~ | ✅ Already done |
| ~~OANDA client~~ | ~~8~~ | ✅ Pipeline handles it |
| ~~Job scheduler~~ | ~~12~~ | ✅ GitHub Actions |
| ~~Volatility calculator~~ | ~~16~~ | ✅ Pipeline calculates |
| ~~Correlation calculator~~ | ~~20~~ | ✅ Pipeline calculates |
| REST API endpoints | 16 | NEW: Read from fx_global |
| Frontend components | 24 | Same as before |
| Custom React hooks | 8 | NEW: Data fetching |
| Deployment & testing | 8 | Simpler (no pipeline) |
| Documentation | 4 | API docs only |
| **TOTAL** | **60 hours** | **150 hrs → 60 hrs savings!** |

**Timeline:** 6 weeks × 10 hours/week = 60 hours

**Time Savings:** 90 hours (no Python porting, no job scheduling, no OANDA integration)

---

## Appendix: PRD Feature Mapping

| PRD Feature | Sprint | Status | Priority |
|-------------|--------|--------|----------|
| 1. Position Size Calculator | Sprint 3 | ✅ Included | P1 (RICE: 216) |
| 2. Volatility Indicators | Sprint 3 | ✅ Included | P2 (RICE: 100.8) |
| 3. Session Alerts | Sprint 4 | ✅ Enhanced | P3 (RICE: 84) |
| 4. News Danger Zones | Sprint 4 | ✅ Included | P4 (RICE: 105) |
| 5. Correlation Matrix | Sprint 4 | ✅ Included | P5 (RICE: 56) |
| 6. User Authentication | Phase 2 | ❌ Deferred | P6 |
| 7. Stripe Payments | Phase 2 | ❌ Deferred | P7 |
| 8. Favorite Pairs | Sprint 3 | ✅ Included | P8 |

**MVP Scope:** Features 1-5 + 8 (6 of 8 PRD features)
**Phase 2 Scope:** Features 6-7 (Auth + Payments)

---

*End of Plan*
