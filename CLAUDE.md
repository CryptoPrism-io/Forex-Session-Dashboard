# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Forex Session Trading Dashboard** is a full-stack web application that visualizes global forex market trading sessions, session overlaps, and "killzones" (institutional liquidity zones). The dashboard uses timezone-aware calculations to display sessions and allows users to switch between multiple timezones to view market activity.

The application consists of:
- **Frontend**: React 19.2 SPA with TypeScript and Recharts
- **Backend**: Node.js/Express API serving economic calendar data from PostgreSQL
- **Database**: PostgreSQL Cloud SQL with forex economic calendar events
- **Deployment**: Dual deployment strategy (Cloud Run for full stack, GitHub Pages for frontend-only)

**Key Tech Stack:**
- React 19.2 with TypeScript
- Vite (build tool)
- Recharts (charting library)
- Tailwind CSS (via CDN)
- Express.js (backend API)
- PostgreSQL (database)
- Docker (containerization for Cloud Run)

## Common Development Commands

```bash
# Frontend development (runs on http://localhost:3000)
npm run dev

# Backend development (runs on http://localhost:5000)
npm run dev:server

# Build frontend for production
npm run build

# Preview production build locally
npm run preview

# Backend setup and running
cd server && npm install
npm run start        # production
npm run dev         # development with auto-reload
npm run inspect-schema  # inspect database schema
```

## Project Architecture

### System Overview

```
User → Vite Dev Server (3000) → React Components → Backend API (5000) → PostgreSQL
                          ↓
                    (Production: Docker/Cloud Run)
```

### Frontend Architecture

**Layout Structure: 1:3 Ratio with Collapsible Left Pane**

```
┌─────────────────────────────────────────────────┐
│ LEFT PANE (1/4) │     RIGHT PANE (3/4)         │
│  • Time Display │ ┌─────────────────────────┐  │
│  • Timezone     │ │ [Hamburger] Cal Clock   │  │
│  • Active       │ │            Charts Guide │  │
│    Sessions     │ │                         │  │
│                 │ │   Content Area          │  │
│  [Collapsible   │ │   (75vh max height)     │  │
│   on mobile]    │ │                         │  │
│                 │ └─────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

- **Left Pane (w-1/4)**: Current time, timezone selector, active sessions list
  - Auto-collapses on mobile (< 768px), persists state to localStorage
  - Toggle button hidden on desktop, visible on mobile via hamburger icon
- **Right Pane (flex-1)**: 4 main tabs with tabbed content area
  - Tab 1: **Calendar** - Economic calendar events (EconomicCalendar.tsx)
  - Tab 2: **Clock** - 4-clock display (SessionClocks.tsx)
  - Tab 3: **Charts** - Session timeline charts (ForexChart.tsx)
  - Tab 4: **Guide** - Trading session reference tables (SessionGuide.tsx)

**Key Components:**

1. **App.tsx** (main orchestrator)
   - Manages timezone selection and global time state (updates every 1 second)
   - Manages `leftPaneOpen` state with localStorage persistence (for mobile responsiveness)
   - Manages `activeView` state: 'calendar' | 'clocks' | 'charts' | 'guide'
   - Calculates `nowLine` position (current UTC time as percentage of 24 hours)
   - Runs `checkSession()` logic on each update to determine `sessionStatus` for all sessions
   - Passes timezone, nowLine, and sessionStatus down to child components
   - Maintains `activeSessions` array for left pane display

2. **ForexChart.tsx** (24-hour timeline visualization)
   - Receives timezone offset and applies it to adjust all session bar positions
   - Uses Recharts `BarChart` with custom `CustomBarShape` renderer
   - Draws session bars in layers: main sessions → overlaps → killzones
   - Renders "Now" line that blinks every 1 second with glow effect
   - Handles collapsible sections (mainSessions, overlaps, killzones)

3. **SessionClocks.tsx** (timezone-aware analog clocks)
   - Renders 4 clocks (Sydney, Asia, London, New York) in compact or full size
   - Updates time every 100ms for smooth second hand animation
   - Displays status indicator (colored dot) for each session: glows when OPEN/WARNING, pulses on WARNING
   - Card borders glow when session is active using accent color from clock config

4. **EconomicCalendar.tsx** (calendar data visualization)
   - Fetches economic calendar events from backend `/api/calendar/events`
   - Filters by date range and currency pairs
   - Displays event impact levels and timestamps
   - Supports daily filters (Yesterday, Today, Tomorrow)

5. **ChartTooltip.tsx** (hover information)
   - Shows detailed session info when hovering over chart bars
   - Displays elapsed/remaining time for active sessions

6. **SessionGuide.tsx** (trading session reference tables)
   - Displays comprehensive tables: Main Sessions, Session Overlaps, Killzones
   - Toggle between Winter (Standard Time) and Summer (Daylight Saving Time) views
   - Shows session times, durations, overlap hours, killzone hours
   - Educational descriptions for each trading concept
   - Fully collapsible sections for better UX

### Backend Architecture (server/)

**Structure:**
- `server.js` - Express app setup, static file serving (React dist/), CORS configuration
- `db.js` - PostgreSQL connection pool and initialization
- `api/calendar/` - Economic calendar endpoints
  - `events.js` - GET `/api/calendar/events` with date filtering
  - `currencies.js` - GET `/api/calendar/currencies` list
  - `stats.js` - GET `/api/calendar/stats` aggregation
- `routes/` - API route handlers
- `migrations/` - Database schema and migration scripts
- `create-indexes.js`, `run-migration.js` - Database setup utilities

**Key Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (Cloud SQL for production)
- `NODE_ENV` - "development" or "production"
- `PORT` - Server port (default 5000)

### Session Status Calculation

The `checkSession()` function in App.tsx (lines 42-86) determines three states:
- **OPEN**: Current UTC time falls within session range
- **CLOSED**: Session not active
- **WARNING**: Opening or closing within 15 minutes (0.25 hours)

Key logic: Checks both "today" and "yesterday" ranges to handle overnight sessions crossing 00:00 UTC:
```typescript
const isActive = (utcHours >= s && utcHours < e) || (utcHours >= s - 24 && utcHours < e - 24);
```

### Timezone Conversions

- **UTC to Local**: `localTime = (utcHours + offset) % 24`
- All session times stored in UTC hours (0-24+, where >24 indicates next-day range)
- ForexChart adjusts bar positions: `left = (session_utc_start + offset) % 24`
- SessionClocks use `Intl.DateTimeFormat` with timeZone parameter for accurate local time display

### Rendering Details

**ForexChart.tsx - Bar Layers:**
- Main sessions: 90% row height
- Overlaps/Killzones: 40% row height
- Split rendering for sessions crossing midnight (p1/p2 parts)

**SessionClocks.tsx:**
- Updates via 100ms interval for smooth movement
- Uses milliseconds for sub-second precision: `secondProgress = second + millisecond / 1000`
- Session highlighting via `sessionStatus` prop from App
- Color theme: Sydney (cyan), Asia (pink), London (yellow), New York (green)

## Data Structure Reference

### Session Configuration (constants.ts)
Each session in `SESSIONS` array contains:
- `name`: Display name on Y-axis
- `main`: Main session bar `{ range: [start, end], key, name, color, opacity, tooltip }`
- Optional overlaps/killzones: `overlapAsia`, `overlapLondon`, `killzone`, `killzoneAM`, `killzonePM`

Example:
```typescript
{
  name: 'London',
  main: { range: [7, 16], key: 'london_session', name: 'Main', color: '#facc15', opacity: 1, tooltip: {...} }
}
```

### Naming Conventions

- Session bar keys: `{sessionName}_{type}[_part]`
  - Examples: `london_session`, `london_killzone_p1`, `asia_london_overlap`
- Types: `session`, `overlap`, `killzone`
- Export type: `SessionStatus = 'OPEN' | 'CLOSED' | 'WARNING'` (App.tsx:10)

## Deployment Strategy

### Cloud Run (Full-Stack)
Deployed via GitHub Actions workflow (`.github/workflows/deploy.yml`):
- Builds React frontend with `VITE_API_BASE_URL` pointing to Cloud Run backend
- Builds and deploys containerized Node.js backend using `Dockerfile`
- Uses GCP Workload Identity Federation for secure authentication
- Serves both frontend (static files) and API from same Cloud Run service
- Environment: `social-data-pipeline-and-push` project, `us-central1` region
- Service: `forex-dashboard` (hosted at `https://forex-dashboard-963362833537.us-central1.run.app`)

### GitHub Pages (Frontend-Only)
Deployed via workflow (`.github/workflows/pages.yml`):
- Builds React frontend with `VITE_BASE_PATH: /Forex-Session-Dashboard/`
- Deploys dist/ to GitHub Pages at `https://{username}.github.io/Forex-Session-Dashboard/`
- Points API calls to Cloud Run backend for economic calendar data

**Key Files:**
- `Dockerfile` - Multi-stage: builds React frontend, serves with Node.js backend
- `env.yaml` - Cloud Run environment variables (VITE_API_BASE_URL, DATABASE_URL)
- `server/server.js` - Configured to serve React dist/ and handle SPA routing

## Important Technical Notes

- **1-second update cycle** - App.tsx updates currentTime every 1s. Clocks update every 100ms for smooth animation.
- **Blinking "Now" Line** - ForexChart renders the "Now" line with opacity toggle (1 → 0.15) and glow effect every second.
- **No frontend state management** - Uses React hooks only; no Redux or Context API.
- **Session definitions hardcoded** - Session ranges stored in constants.ts; economic calendar data fetched from backend API.
- **Base path handling** - vite.config.ts reads `VITE_BASE_PATH` from env (GitHub Pages: `/Forex-Session-Dashboard/`, Cloud Run: `/`)
- **API proxy in dev** - vite.config.ts proxies `/api/` requests to `localhost:5000` during development
- **Database-driven calendar** - EconomicCalendar component fetches events from PostgreSQL via Express API
- **1:3 Layout with Collapsible Left Pane**:
  - Left pane: w-1/4 on desktop (> 768px), collapsible to w-0 on mobile
  - Right pane: flex-1, always visible with 4 tabs
  - localStorage: Persists `leftPaneOpen` state for user preference
  - Mobile-first: Left pane closed by default on small screens, toggle via hamburger icon
  - Desktop: Left pane always visible, toggle hidden but accessible
- **4-Tab Navigation**:
  - Calendar, Clock, Charts (timeline), Guide (reference tables)
  - Active tab persists during session but not across page reloads
  - Each tab renders its own component in the right pane content area

## Common Development Tasks

### Running Both Frontend and Backend
```bash
# Terminal 1: Frontend
npm run dev        # Listens on localhost:3000

# Terminal 2: Backend
cd server
npm run dev        # Listens on localhost:5000
# or for production simulation:
npm run start
```

### Debugging Economic Calendar API
```bash
# Check what events the backend returns
curl "http://localhost:5000/api/calendar/events?startDate=2024-01-01&endDate=2024-01-31"

# Inspect database schema
cd server && npm run inspect-schema

# Check database migrations
less MIGRATE_TO_TIMESTAMP.txt
```

### Modifying Date Filtering Logic
- Frontend: `EconomicCalendar.tsx` - Date range calculations and API params
- Backend: `server/api/calendar/events.js` - SQL query date filtering with `AT TIME ZONE`
- Note: Backend handles timezone conversion; frontend uses simple YYYY-MM-DD format

### Testing Deployment Locally
```bash
# Build and preview as production
npm run build
npm run preview

# Test Docker build (requires Docker installed)
docker build -t forex-dashboard .
docker run -p 3000:5000 -e VITE_API_BASE_URL=http://localhost:5000 forex-dashboard
```

## Adding New Features

**New Session:**
1. Add to `SESSIONS` in constants.ts with required `main` field and optional overlap/killzone fields
2. If new timezone needed, add to `TIMEZONES` array with offset value
3. Status calculations and highlights happen automatically

**New Calendar API Endpoint:**
1. Create handler in `server/api/calendar/` (e.g., `impact.js`)
2. Register route in `server/routes/` or add to `server.js` directly
3. Return JSON with proper CORS headers
4. Call from frontend with fetch to `/api/calendar/impact`

**Modifying Update Frequency:**
- Real-time updates: Change interval in App.tsx line 24 (currently 1000ms)
- Clock smoothness: Change interval in SessionClocks.tsx (currently 100ms)
- "Now" line blink: Change interval in ForexChart.tsx (currently 1000ms)

**Styling Customization:**
- Clock colors: Modify `accent` field in `CLOCKS` array (SessionClocks.tsx)
- Session colors: Modify `color` field in session definitions (constants.ts)
- Custom CSS: Edit `index.html` for scrollbar, animations, Recharts overrides

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/calendar/events" | Ensure backend is running on port 5000; check vite.config.ts proxy settings |
| Economic calendar shows no events | Verify DATABASE_URL and PostgreSQL connection; run `npm run inspect-schema` in server/ |
| Timezone offsets incorrect | Check TIMEZONES array in constants.ts matches your requirements |
| GitHub Pages 404 errors | Verify VITE_BASE_PATH is `/Forex-Session-Dashboard/` in pages.yml workflow |
| Cloud Run build fails | Check env.yaml has all required vars; verify Dockerfile multi-stage build is correct |
