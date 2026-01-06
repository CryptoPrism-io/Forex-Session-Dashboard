# Changelog

All notable changes to the Forex Session Trading Dashboard project.

## [2026-01-06] - Database Migration to fx_global

### Changed - Database Migration from dbcp to fx_global
**What**: Migrated all calendar API endpoints to use `fx_global` database instead of `dbcp`
**Why**: The forex factory scraper writes fresh data to `fx_global`, but the app was reading stale data from `dbcp` (last updated Dec 30, 2025)
**How**:
- Updated `env.yaml` to set `POSTGRES_DB: fx_global`
- Updated `server/routes/calendar.js` to query from fx_global database
- Fixed schema mismatch: Changed `source` column to `source_scope as source`
- Added `datetime_utc` column to query results
- Calendar now shows live 2026 economic events (43 events for Jan 6, 2026)

### Fixed - Calendar API Schema Compatibility
**What**: Updated SQL queries to match fx_global database schema
**Why**: fx_global table has `source_scope` column instead of `source`, causing "column does not exist" errors
**How**:
- Modified `/events` endpoint query: `source_scope as source`
- Modified `/today` endpoint query: `source_scope as source`
- Added `datetime_utc` field to API responses
- Both endpoints now return data correctly from fx_global

## [2026-01-05] - Build Fix & Cloud Run Recovery

### Fixed - Missing breakpoints.ts Utility
**What**: Added missing `src/utils/breakpoints.ts` file that was not committed to git
**Why**: Cloud Run deployment was failing with "Could not resolve './utils/breakpoints' from 'src/App.tsx'"
**How**:
- Committed the untracked `breakpoints.ts` file containing:
  - `BREAKPOINTS` constants (sm: 640, md: 768, lg: 1024, xl: 1280)
  - `useViewport()` hook for responsive design
  - `useMediaQuery()` hook for CSS media query detection
  - `getResponsiveValue()` utility for breakpoint-based values
  - `TOUCH_TARGET_MIN` constant (44px for accessibility)
- Build now succeeds on Cloud Run

### Fixed - GCP Billing & Cloud Run Deployment
**What**: Resolved Cloud Run deployment failures due to disabled GCP billing
**Why**: Billing was disabled on `social-data-pipeline-and-push` project, causing PERMISSION_DENIED errors
**How**:
- Re-enabled billing on GCP project
- Re-enabled Artifact Registry API
- Successful deployment after billing propagation (~5 minutes)

## [2025-12-25] - Visual Design Enhancements

### Added - Darker Theme with Grid Pattern
**What**: Enhanced background with darker theme, grid pattern, and glowing orbs
**Why**: Improve visual aesthetics with premium dark theme appearance
**How**:
- Added animated glowing orbs in background
- Implemented soft blurred grid pattern overlay
- Enhanced glass morphism effects
- Brighter accent colors for better contrast

### Improved - Background Visual Effects
**What**: Enhanced background orbs with brighter colors and soft blur
**Why**: Previous orbs were too subtle; needed more visual impact
**How**:
- Increased orb brightness and saturation
- Added soft blur effect for depth
- Optimized animation performance

## [2025-12-24] - Mobile Layout Improvements

### Fixed - Mobile Layout for OverviewPanel
**What**: Improved responsive layout for OverviewPanel on mobile devices
**Why**: Panel was not displaying correctly on smaller screens
**How**:
- Adjusted grid layouts for mobile breakpoints
- Fixed overflow issues on small screens

## [2025-12-20] - Page Navigation & Backtesting

### Added - Multi-Page Navigation System
**What**: Added Page 1, 2, 3, 4 navigation buttons to top navbar with Backtesting page
**Why**: Enable navigation between different dashboard sections
**How**:
- Added navigation buttons to top navbar
- Page 1: Full Bento dashboard layout
- Page 4: Backtesting (Coming Soon)
- Fixed broken navigation button issues
- Renamed page navigation for clarity

### Added - ComingSoon Page Enhancement
**What**: Enhanced ComingSoon page with rich card-based UI design
**Why**: Provide better placeholder for upcoming features
**How**:
- Implemented card-based layout
- Added feature preview cards
- Applied glass morphism styling

## [2025-12-15] - Correlation Heatmap & Network Graph

### Added - Nivo Correlation HeatMap
**What**: Interactive correlation heatmap visualization using Nivo library
**Why**: Visualize currency pair correlations in an intuitive matrix format
**How**:
- Integrated Nivo HeatMap component with FX Tools Panel
- Added flexible field name handling for correlation matrix API
- Implemented portal rendering with boundary detection for tooltips
- Dynamic tooltip positioning near cursor using global mouse tracking
- Reduced heatmap cell size by 50% for better overview
- Canvas reduced by 25% to accommodate axis labels
- Margins optimized for 1920x1080 without scrolling

### Improved - Heatmap Layout & Styling
**What**: Transformed heatmap to horizontal landscape orientation with improved styling
**Why**: Better fit for widescreen displays and improved readability
**How**:
- Horizontal layout transformation
- Disabled horizontal scrolling
- Consolidated info panel into single concise design
- Improved axis label clarity and spacing
- Matched axis labels to WorldClocks styling
- Applied World Clocks title styling to Correlation Scale label

### Added - Interactive Network Graph
**What**: Network graph visualization for correlation relationships
**Why**: Alternative visualization showing correlation connections between pairs
**How**:
- Added interactive network graph component
- Added Network Corr Map as separate tab in FX Tools
- Nodes represent currency pairs, edges represent correlations
- Color-coded by correlation strength

### Improved - FX Tools Navigation
**What**: Moved FX Tools navigation to centered top bar
**Why**: Better accessibility and cleaner layout
**How**:
- Centered navigation buttons
- Cleaned up Correlation Matrix tab (removed Pairs Strategy subtabs)
- Removed bottom axis for cleaner appearance

## [2025-12-01] - Sprint 2: Live FX Data Integration & Project Structure Fix

### Added - Enhanced Risk Calculator with Live FX Data
**What**: Complete refactor of RiskCalculator to integrate real-time FX price feeds, volatility metrics, and correlation analysis
**Why**: Enable traders to calculate accurate position sizes using live market data instead of static estimates
**How**:
- Integrated `useFXPrice` hook for real-time mid/bid/ask prices (30-second refresh)
- Integrated `useFXVolatility` hook for ATR-based stop loss recommendations
- Integrated `useFXAvailableInstruments` to dynamically filter pairs with live data
- Added leverage presets: [10, 20, 30, 50, 100, 200, 500] with quick-select buttons
- Implemented pip/tick slider controls with ±/input field synchronization (5-100 range)
- Enhanced results display with 9 metrics:
  - Position Size (lots with 2-3 decimal precision)
  - Risk Amount (USD with comma formatting)
  - Risk Percentage (smart rounding: 1% vs 1.25%)
  - Margin Required (leverage-adjusted)
  - Margin Percentage
  - Current ATR (in pips and price with adaptive decimals)
  - Pip Value (per-pip profit/loss calculation)
  - Broker Fees (configurable)
  - Total Risk (including fees)
- Added search & dropdown for instrument selection (28 instruments)
- Implemented accordion layout to prevent overflow on mobile
- Custom formatters for currency, lots, and percentages

### Added - Correlation Matrix Integration
**What**: Real-time correlation analysis integrated into BestPairsWidget with visual cards and sortable table
**Why**: Traders need to identify hedging opportunities and avoid correlated positions
**How**:
- Created `useFXCorrelationMatrix` hook fetching from `/api/fx/correlation/matrix`
- Created `useFXCorrelationPairs` hook for filtered pair recommendations
- Added 4 correlation cards above BestPairsWidget table showing top correlations:
  - Color-coded by strength: Strong Positive (>+0.7 green) → Strong Negative (<-0.7 red)
  - Visual indicators (↑↓ arrows)
  - Updated timestamp display
  - Glassmorphism design with backdrop blur
- Enhanced BestPairsWidget table with correlation scores and sortable columns
- Auto-refresh every 5 minutes
- Loading states with spinners
- Error states with retry buttons
- Responsive grid: 4 columns (desktop) → 2 (tablet) → 1 (mobile)

### Added - New FX Data Hooks
**What**: Five custom React hooks for live FX market data
**Why**: Reusable data fetching logic with consistent error handling and caching
**How**:
- **`useFXPrice(instrument)`** - Real-time price feed (bid/ask/mid, 30s refresh)
  - Returns: `{ price, loading, error }`
  - API: `GET /api/fx/prices/current?instrument=EUR_USD`
  - Automatic cleanup on unmount
- **`useFXAvailableInstruments()`** - Dynamic instrument list from database
  - Returns: `{ instruments: string[], loading, error }`
  - API: `GET /api/fx/prices/all`
  - Cached for 5 minutes
- **`useFXVolatility(instrument)`** - ATR and volatility metrics (60s refresh)
  - Returns: `{ volatility: { atr, hv_20, sma_30, bb_width }, loading, error }`
  - API: `GET /api/fx/volatility/EUR_USD`
  - Used for stop loss recommendations
- **`useFXCorrelationMatrix()`** - Full 28×28 correlation matrix
  - Returns: `{ matrix: FXCorrelationPair[], loading, error }`
  - API: `GET /api/fx/correlation/matrix`
  - Auto-refresh every 5 minutes
- **`useFXCorrelationPairs(category, limit)`** - Filtered pair recommendations
  - Returns: `{ pairs: FXCorrelationPair[], loading, error }`
  - API: `GET /api/fx/correlation/pairs?category=hedging&limit=10`
  - Categories: hedging, trending, reversal

### Fixed - Project Structure & Build Errors
**What**: Consolidated all frontend code to `/src` directory and fixed import paths
**Why**: Build was failing with "Cannot resolve" errors due to inconsistent file locations
**How**:
- Moved all directories to standard Vite/React structure:
  - `components/` → `src/components/` (40+ files)
  - `hooks/` → `src/hooks/` (14 files)
  - `utils/` → `src/utils/` (4 files)
  - `workers/` → `src/workers/` (1 file)
  - `styles/` → `src/styles/` (1 file)
- Updated all import paths to follow consistent patterns:
  - From `src/App.tsx`: `import Component from './components/Component'`
  - From `src/components/*.tsx`: `import { Type } from '../types'`
  - From `src/hooks/*.ts`: `import { CONSTANT } from '../constants'`
- Fixed `index.html` script source: `/src/index.tsx`
- Updated `CLAUDE.md` with comprehensive directory structure documentation
- Created `docs/PROJECT_STRUCTURE_FIX.md` documenting the migration
- Build now succeeds: ✓ 2448 modules transformed in 9.21s

### Improved - TypeScript Type Safety
**What**: Added comprehensive type definitions for all FX data structures
**Why**: Prevent runtime errors and improve developer experience with IntelliSense
**How**:
- Added 5 new interfaces to `src/types.ts`:
  - `FXPrice` - Price data with bid/ask/mid/volume
  - `FXVolatility` - ATR, HV-20, SMA-30, BB Width
  - `FXCorrelationPair` - Correlation data for instrument pairs
  - `InstrumentInfo` - Metadata (name, display, base, quote, pipDecimals)
  - `UseFXPriceResult` - Hook return type with loading/error states
- Proper nullable handling (`string | null`, `number | undefined`)
- Optional properties for incomplete data (`bid?`, `ask?`, `volume?`)
- Date handling with ISO 8601 strings
- Full TypeScript strict mode compliance

### Improved - Constants & Configuration
**What**: Added comprehensive instrument definitions with pip decimal precision
**Why**: Enable accurate pip value calculations for all 28 supported instruments
**How**:
- Added `INSTRUMENTS` array to `src/constants.ts`:
  ```typescript
  { name: 'EUR_USD', display: 'EUR/USD', base: 'EUR', quote: 'USD', pipDecimals: 4 }
  ```
- 28 instruments: Majors (7), Crosses (14), Exotics (7)
- Pip decimal precision for each instrument (2 for JPY pairs, 4 for others)
- Base and quote currency identification
- Display names with proper formatting (slash vs underscore)
- Used for dropdown filtering, pip calculations, and formatting

### Documented - Sprint 2 Features
**What**: Comprehensive documentation of all Sprint 2 deliverables
**Why**: Ensure maintainability and onboarding for future developers
**How**:
- Created `docs/SPRINT_2_FX_DATA_FEATURES.md` (500+ lines):
  - Feature overview and deliverables
  - Technical implementation details
  - API integration summary
  - Performance metrics (before/after)
  - Testing recommendations
  - Known issues and future enhancements
  - Developer guidelines
- Updated `CLAUDE.md` with new components and hooks
- Updated `docs/CHANGELOG.md` (this file)
- All new code includes JSDoc comments and inline documentation

### Performance - Bundle Size & Optimization
**What**: Optimized API calls and implemented caching strategies
**Why**: Prevent unnecessary network requests and improve responsiveness
**How**:
- Reduced API calls from ~40/min to ~24/min with intelligent caching
- Instrument list cached for 5 minutes (rarely changes)
- Correlation matrix cached for 5 minutes (computationally expensive)
- Price updates rate-limited to 30 seconds (acceptable for dashboard)
- Volatility updates rate-limited to 60 seconds (slow-moving metric)
- Memoized expensive calculations (pip value, margin, lot size)
- Debounced search input (300ms delay)
- Bundle size increased 15% (485 KB vs 420 KB) - acceptable for features added

## [2025-11-28] - Backend Optimization & UI Polish

### Fixed - Backend Server Configuration & Performance
**What**: Started backend server and optimized database query performance
**Why**: News icons weren't displaying because backend API wasn't running; slow API response times (480ms)
**How**:
- Started backend server in development mode on port 5000
- Added database indexes for `date_utc` and `time_utc` columns
- Created composite index `idx_ec_date_utc_time_utc` for optimal query performance
- Ran `ANALYZE` to update PostgreSQL query planner statistics
- Improved API response time from 480ms to ~340ms (29% faster)
- Documented performance analysis showing network latency to Cloud SQL as primary bottleneck

### Improved - Session Timeline Label Styling
**What**: Redesigned session labels with glass morphism capsules and enhanced typography
**Why**: Duplicate city badges wasted screen space; labels needed more sophisticated styling
**How**:
- Removed duplicate city reference badges from top of chart
- Applied glass capsule design to session row labels:
  - Semi-transparent background with backdrop blur
  - Rounded pill shape with subtle border
  - Inner shadow for depth perception
- Enhanced typography:
  - Converted session names to UPPERCASE for emphasis
  - Reduced font weight from semibold (600) to normal (400)
  - Increased letter spacing to 0.15em for premium look
  - Reduced font size to text-xs for cleaner proportions
- Added UTC timezone offset display next to each session name
  - Shows time difference from UTC (e.g., "UTC+11", "UTC-5")
  - Lightweight font with muted color for secondary info

### Added - Database Performance Tools
**What**: Created utility scripts for database optimization and benchmarking
**Why**: Need tools to diagnose and improve query performance
**How**:
- Added `add-date-indexes.js` - Creates indexes for date_utc and time_utc columns
- Added `benchmark-query.js` - Benchmarks database query performance
- Scripts automatically verify index creation and update statistics
- Documented expected performance improvements in console output

## [2025-11-27] - Glass Morphism & Mobile Redesign

### Added - Multi-Select Filter Dropdowns
**What**: Complete redesign of Economic Calendar filter UI with multi-select functionality
**Why**: Users needed ability to filter multiple currencies and impact levels simultaneously
**How**:
- Implemented React Aria Components for accessible dropdowns
- Multi-select dropdowns for currencies (USD, EUR, GBP, etc.) and impact levels (High, Medium, Low)
- Persistent selection state with visual checkmarks
- Collapsible filter sections with smooth animations
- Impact counts displayed in real-time regardless of active filters

### Improved - Desktop Header Layout
**What**: Reorganized desktop header with horizontal layout for better space utilization
**Why**: Previous vertical layout wasted screen space on wide monitors
**How**:
- Switched from stacked to horizontal layout for timezone selector and controls
- Aligned elements in single row for compact presentation
- Maintained mobile-responsive design with breakpoints
- Reduced vertical spacing while preserving visual hierarchy

### Fixed - PWA Installation Support
**What**: Implemented proper Progressive Web App installation with vite-plugin-pwa
**Why**: Previous manual service worker registration was unreliable across browsers
**How**:
- Migrated to `vite-plugin-pwa` with automatic workbox configuration
- Removed manual service worker registration code
- Added install prompt UI with browser detection (Chrome, Firefox, Safari, Edge)
- Configured precaching for static assets and runtime caching for API calls
- Generated manifest.json with proper icons and theme colors

### Added - Glass Morphism UI
**What**: Enhanced UI with glass morphism design and improved mobile responsiveness
**Why**: Modern aesthetic with better visual hierarchy and depth
**How**:
- Applied backdrop blur and semi-transparent backgrounds to cards
- Implemented subtle shadows and borders for depth perception
- Enhanced mobile navigation with bottom tab bar
- Redesigned Overview page with card-based layout
- Added smooth transitions and hover states throughout

### Improved - Mobile Navigation
**What**: Redesigned mobile navigation and Overview page for touch-friendly interaction
**Why**: Previous desktop-first design was difficult to use on mobile devices
**How**:
- Added fixed bottom navigation bar with 4 tabs (Overview, Calendar, Charts, Guide)
- Implemented Overview page as mobile home screen with quick access cards
- Touch-optimized button sizes (minimum 44px tap targets)
- Swipe gestures for left pane toggle (drag left to close)
- Reduced header height on mobile for more content space

## [2025-11-23] - Performance Optimization & React 18 Migration

### Fixed - React Version Compatibility
**What**: Downgraded React from 19.2.0 to 18.3.1 for react-aria-components compatibility
**Why**: react-aria-components not yet compatible with React 19
**How**:
- Updated package.json to use React 18.3.1 and React DOM 18.3.1
- Removed CDN importmap forcing React 19.2.0
- Verified all components work with React 18 API
- Tested Framer Motion and React Aria integration

### Improved - Build Performance
**What**: Comprehensive performance optimization reducing bundle size and render time
**Why**: Initial load time was >3 seconds on 3G; bundle size was >500KB
**How**:
- Removed manual chunk splitting from Vite config (let Vite auto-optimize)
- Simplified Vite configuration to reduce build complexity
- Optimized GPU usage by using transform properties over layout properties
- Reduced main-thread blocking with useMemo and useCallback
- Added web vitals tracking with reportWebVitals.ts
- Lighthouse testing scripts for CI/CD performance monitoring

### Added - Sort Options for Economic Calendar
**What**: Multi-column sorting for economic calendar events
**Why**: Traders need to sort by date, impact, currency, or event name
**How**:
- Added sort dropdown with 5 options: Date (ascending/descending), Impact, Currency, Event
- Persistent sort state via localStorage
- Visual sort indicator (↑↓) in column headers
- Maintains sort order when applying filters

### Fixed - Impact Count Display
**What**: Show correct impact counts regardless of selected filters
**Why**: Users were confused by counts changing based on currency filters
**How**:
- Decoupled impact counts from active filters
- Counts now show total events in date range, not filtered subset
- Updated UI to clarify counts represent all events

## [2025-11-22] - Animation System & Accessibility

### Added - Framer Motion Integration
**What**: Professional animation system with accessibility support
**Why**: Enhance UX with smooth transitions while respecting user preferences
**How**:
- Integrated Framer Motion 11.18.2 for declarative animations
- Integrated React Aria Components 1.13.0 for accessibility
- Created comprehensive animation inventory in ANIMATIONS.md
- Implemented `useReducedMotion` hook for accessibility
- All animations respect `prefers-reduced-motion` OS setting

### Added - Gesture Handling
**What**: Touch gesture support for mobile interactions
**Why**: Modern mobile UX requires swipe and drag gestures
**How**:
- Left pane swipe-to-close: Drag left 100px or 500px/s velocity
- 20% elastic drag for natural feel
- Spring animations with stiffness 300, damping 30
- Momentum-based gesture detection

### Documented - Animation Architecture
**What**: Comprehensive animation documentation in ANIMATIONS.md
**Why**: Ensure consistency and maintainability of animation system
**How**:
- Documented all 5 core animations with specs and timing
- Usage patterns and code examples
- Best practices and anti-patterns
- Debugging guide and performance profiling
- Future enhancement suggestions
- Updated CLAUDE.md with animation system overview

## [2025-11-19] - UTC Migration & Database Updates

### Added - UTC-Based Timezone Handling
**What**: Migrated from timezone-specific storage to UTC-based event handling
**Why**: Previous system stored events in 'Asia/Kolkata' timezone causing conversion errors
**How**:
- Added `date_utc` column to economic_calendar_ff table
- Updated backend to store all events in UTC
- Modified frontend to convert from UTC to user's selected timezone
- Eliminated timezone conversion bugs and DST issues
- Improved query performance with UTC-indexed columns

### Fixed - Date Range Query
**What**: Correct date range query to exclude tomorrow's events in Today filter
**Why**: "Today" filter was showing events from tomorrow due to timezone overlap
**How**:
- Updated SQL query to use strict date equality for "Today" filter
- Changed from `date >= today AND date <= today` to `date = today`
- Added timezone-aware date parsing in frontend
- Verified edge cases around midnight UTC

## [2025-11-18] - Economic Calendar Table Redesign

### Added - Economic Calendar Table Layout
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
