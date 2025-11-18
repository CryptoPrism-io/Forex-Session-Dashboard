# Changelog

All notable changes to the Forex Session Trading Dashboard project.

## [Unreleased] - 2025-11-18

### Added - Economic Calendar Table Redesign
**What**: Complete redesign of Economic Calendar from card-based layout to table format
**Why**: Improved data density and easier comparison of economic events across multiple data points
**How**:
- Implemented responsive table with 7 columns: Date, Time Left, Event, Impact, Previous, Forecast, Actual
- Added sticky header for better scrolling experience
- Chronological sorting (oldest events first) for better time-based navigation
- Missing data displays as "--" for clean presentation

### Added - Live Countdown Timer
**What**: Real-time countdown showing time remaining until each economic event
**Why**: Traders need to know exactly how much time remains before market-moving events
**How**:
- Updates every second via React useState + setInterval
- Color-coded indicators: Red (<2h urgent), Amber (2-6h soon), Cyan (>6h normal), Grey (passed)
- Proper UTC date parsing using Date.UTC() for accurate calculations
- Fixed logic: `currentTime - eventTime` (positive = passed)

### Fixed - Timezone Mismatch for Event Indicators
**What**: News icon indicators on charts were showing stale data due to timezone issues
**Why**: Backend was using hardcoded 'Asia/Kolkata' timezone while users could be in any timezone
**How**:
- Modified `/api/calendar/today` endpoint to accept optional `date` query parameter
- Frontend now passes user's local date in YYYY-MM-DD format
- Backend changed timezone filtering from 'Asia/Kolkata' to 'UTC' for consistency
- Added date format validation (YYYY-MM-DD regex check)

### Improved - Alert Icon Animation
**What**: Simplified alert bell icon from complex multi-layer animations to simple glow border
**Why**: Previous design was too visually distracting with 3 pulsing/rotating glow layers
**How**:
- Removed: 3 glow divs (outer, middle, inner), conic gradients, pulse animations, drop shadows
- Added: Simple border glow - Green when alerts ON, Red when alerts OFF
- Reduced notification badge from 3px pulsing gradient to 2px solid green dot
- Cleaner, less CPU-intensive animation

## [2025-11-17] - Unified Filter System

### Added - Unified Filter System for Charts
**What**: Consolidated filter menu combining chart layers and event impact levels
**Why**: Previous separate menus created scattered UX; unified approach is more intuitive
**How**:
- Single "Filters" button opens dropdown with two sections: Layers and Impact Levels
- Layers section: Toggles for Sessions, Overlaps, Killzones, Volume, News
- Impact Levels section: High/Medium/Low checkboxes (only visible when News layer enabled)
- Simplified from complex multi-step filtering to single-click access

### Improved - Event Indicator Opacity
**What**: Increased economic event indicator opacity from 33% to 67%
**Why**: 33% was too subtle; users reported difficulty seeing event markers
**How**:
- Changed base opacity from 0.33 to 0.67 in chart rendering
- Maintained 100% opacity on hover for detailed inspection
- Improved visibility while keeping charts clean

## [2025-11-10] - Economic Event Indicators

### Added - Event Indicators on Volume Chart
**What**: Visual markers showing economic events directly on the volume timeline
**Why**: Traders need to correlate volume spikes with scheduled economic releases
**How**:
- Fetches events from `/api/calendar/today` endpoint
- Displays color-coded circular indicators at event times
- Stacks overlapping events vertically (18px spacing)
- Tooltip on hover shows event details: Impact, Currency, Forecast/Actual

### Fixed - API Base URL Configuration
**What**: Environment variable handling for API calls
**Why**: Need different endpoints for development (localhost:5000) vs production (Cloud Run)
**How**:
- Uses `VITE_API_BASE_URL` from environment variables
- Development: `http://localhost:5000`
- Production: `https://forex-dashboard-963362833537.us-central1.run.app`
- Fallback to localhost if not specified

## [2025-11-08] - World Clock & Calendar Integration

### Added - World Clock Panel
**What**: 3-section layout with analog clocks, active sessions, and economic calendar
**Why**: Consolidate time-based information in one accessible view
**How**:
- Section 1: 4 analog clocks (Sydney, Tokyo, London, New York)
- Section 2: Active sessions with countdown timers
- Section 3: Today's economic events filtered by impact
- Compact display optimized for quick reference

### Added - Economic Calendar Component
**What**: Full economic calendar with timezone-aware event display
**Why**: Forex traders need economic event schedules for planning trades
**How**:
- Fetches data from PostgreSQL via Express backend (`/api/calendar/events`)
- Filters: Date range (Yesterday/Today/Tomorrow), Currency, Impact level
- Timezone conversion: UTC events converted to user's selected timezone
- Auto-refresh every 15 minutes
- Displays: Event name, Time, Currency, Impact, Previous/Forecast/Actual values

## [2025-11-05] - Layout Redesign

### Added - 1:3 Layout with Tabbed Navigation
**What**: Complete UI restructure with collapsible left pane and 4-tab right pane
**Why**: Maximize chart visibility while keeping controls accessible
**How**:
- Left pane (1/4 width): Current time, timezone selector, active sessions
  - Auto-collapses on mobile (< 768px)
  - State persists to localStorage
- Right pane (3/4 width): 4 tabs with custom icons
  - Calendar (📅): Economic events
  - Clock (🕐): 4-clock display
  - Charts (📊): Session timeline
  - Guide (📖): Trading reference tables
- Mobile-first: Hamburger menu toggles left pane

### Added - Session Guide Component
**What**: Comprehensive reference tables for trading sessions, overlaps, and killzones
**Why**: New traders need quick reference for session times across timezones
**How**:
- 3 collapsible sections: Main Sessions, Overlaps, Killzones
- Toggle between Winter (Standard Time) and Summer (DST) views
- Educational descriptions explaining each concept
- Color-coded session indicators matching chart

## [2025-10-28] - Deployment & CI/CD

### Added - Cloud Run Deployment
**What**: Containerized deployment on Google Cloud Platform
**Why**: Need production-grade hosting with auto-scaling and reliability
**How**:
- Multi-stage Dockerfile: Builds React frontend + Node.js backend
- GitHub Actions workflow with Workload Identity Federation
- Environment variables via `env.yaml`
- Serves both static files and API from same service
- URL: `https://forex-dashboard-963362833537.us-central1.run.app`

### Added - GitHub Pages Deployment
**What**: Frontend-only deployment for public demo
**Why**: Provide accessible demo without backend infrastructure costs
**How**:
- Separate workflow (`.github/workflows/pages.yml`)
- Uses Cloud Run backend for API calls
- Custom base path: `/Forex-Session-Dashboard/`
- URL: `https://cryptoprism-io.github.io/Forex-Session-Dashboard/`

### Added - GitHub Actions CI/CD
**What**: Automated build and deployment pipeline
**Why**: Enable rapid iteration with confidence in production stability
**How**:
- Triggers on push to main branch
- Parallel workflows: Cloud Run + GitHub Pages
- Uses Google Cloud Workload Identity Federation (no service account keys)
- Build steps: Install → Build → Deploy → Verify
- Environment management via GitHub Secrets

## [2025-10-20] - Database Integration

### Added - PostgreSQL Backend
**What**: Express.js API with PostgreSQL Cloud SQL database
**Why**: Need persistent storage for economic calendar events
**How**:
- Database: `economic_calendar_ff` table with 18 columns
- Endpoints:
  - `GET /api/calendar/events` - Query events by date range, currency, impact
  - `GET /api/calendar/today` - Today's events (timezone-aware)
  - `GET /api/calendar/stats` - Event statistics
  - `GET /api/calendar/currencies` - Available currencies
- Connection pooling with pg library
- Environment-based configuration (dev/production)

### Added - Economic Event Schema
**What**: Database schema for forex economic calendar data
**Why**: Track scheduled economic releases that impact currency markets
**How**:
- Fields: date, time, time_utc, currency, impact, event, actual, forecast, previous
- Indexes on: date, currency, impact for fast querying
- Timestamp tracking: created_at, updated_at, last_updated
- Source tracking for data lineage
- Unique constraint on event_uid to prevent duplicates

## [2025-10-15] - Core Features

### Added - Session Timeline Chart
**What**: Interactive 24-hour visualization of forex trading sessions
**Why**: Traders need to see when major markets are active and overlapping
**How**:
- Recharts BarChart with custom bar shape renderer
- 3 rendering layers: Main sessions (90% height) → Overlaps (40%) → Killzones (40%)
- Timezone-aware: All times adjust based on user's selected timezone
- "Now" line: Blinking yellow indicator with glow effect (updates every 1 second)
- Handles overnight sessions crossing midnight (splits into part 1 and part 2)

### Added - Session Clocks
**What**: 4 analog clocks showing Sydney, Tokyo, London, New York times
**Why**: Visual reference for current time in major forex trading hubs
**How**:
- Updates every 100ms for smooth second hand animation
- Uses `Intl.DateTimeFormat` with timezone parameter for accuracy
- Sub-second precision: `secondProgress = second + millisecond / 1000`
- Status indicators: Glows when session OPEN/WARNING, pulses on WARNING
- Color theme: Sydney (cyan), Tokyo (pink), London (yellow), New York (green)
- Card borders glow when session active

### Added - Session Status Calculation
**What**: Real-time status tracking (OPEN/CLOSED/WARNING) for all sessions
**Why**: Alert traders when sessions are about to open or close
**How**:
- Checks UTC hours against session ranges every 1 second
- OPEN: Current time within session range
- WARNING: Within 15 minutes (0.25 hours) of open/close
- Handles overnight sessions: Checks both "today" and "yesterday" ranges
- Logic: `(utcHours >= start && utcHours < end) || (utcHours >= start - 24 && utcHours < end - 24)`

### Added - Volume Profile Chart
**What**: 24-hour trading volume histogram with session overlays
**Why**: Visualize liquidity patterns across the trading day
**How**:
- 48 data points (30-min intervals) covering 24 hours
- Volume model: Sydney quiet → Asia ramp → London spike → NY overlap peak (100) → rollover lull
- Session bands stacked by type: Main (60-100), Overlap (35-60), Killzone (12-35)
- Gradient fill: Red (low) → Orange → Green (high) from bottom to top
- Rotates data based on timezone offset for accurate local view
- "Now" line with rotated time capsule label

## Technical Architecture

### Frontend Stack
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 6.4.1
- **Charting**: Recharts (area charts, bar charts, custom renderers)
- **Styling**: Tailwind CSS via CDN
- **State Management**: React Hooks (no Redux)
- **Routing**: None (SPA with tabbed navigation)

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL Cloud SQL
- **ORM**: Raw SQL with pg library
- **API**: RESTful JSON endpoints
- **Environment**: dotenv for configuration
- **Deployment**: Docker multi-stage builds

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Cloud Provider**: Google Cloud Platform
- **Container Registry**: Artifact Registry
- **Authentication**: Workload Identity Federation
- **Environments**: Development (localhost), Production (Cloud Run)

## Development Workflow

### Local Development
```bash
# Frontend (port 3000)
npm run dev

# Backend (port 5000)
cd server && npm run dev
```

### Deployment
```bash
# Automatic on push to main
git push origin main

# Manual deployment
npm run build
# Cloud Run deployment via GitHub Actions
```

### Data Updates
- Economic calendar events fetched from database
- Auto-refresh: Every 15 minutes
- Manual refresh: Click refresh button in calendar view

---

**Project**: Forex Session Trading Dashboard
**Repository**: https://github.com/CryptoPrism-io/Forex-Session-Dashboard
**Production**: https://forex-dashboard-963362833537.us-central1.run.app
**Demo**: https://cryptoprism-io.github.io/Forex-Session-Dashboard/
