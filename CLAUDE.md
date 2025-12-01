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
- Framer Motion 11.18.2 (animations)
- React Aria Components 1.13.0 (accessibility)
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

### Directory Structure

**IMPORTANT**: All frontend source code is located in the `/src` directory following standard Vite/React conventions.

```
Forex-Session-Dashboard/
├── src/                          # Frontend source code (ALL imports reference this)
│   ├── components/               # React components
│   │   ├── AlertsToggle.tsx
│   │   ├── BestPairsWidget.tsx  # Sprint 2: FX Data
│   │   ├── BottomNavBar.tsx
│   │   ├── EconomicCalendar.tsx
│   │   ├── ForexChart.tsx
│   │   ├── RiskCalculator.tsx   # Sprint 2: FX Data
│   │   ├── SessionGuide.tsx
│   │   ├── VolatilityMeter.tsx  # Sprint 2: FX Data
│   │   ├── VolatilityPanel.tsx  # Sprint 2: FX Data
│   │   └── ... (40+ components)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useFXCorrelation.ts  # Sprint 2: FX Data
│   │   ├── useFXPrice.ts        # Sprint 2: FX Data
│   │   ├── useFXVolatility.ts   # Sprint 2: FX Data
│   │   ├── usePWAInstall.ts
│   │   ├── useReducedMotion.ts
│   │   └── useSessionAlerts.ts
│   ├── utils/                    # Utility functions
│   │   ├── dstUtils.ts
│   │   ├── reportWebVitals.ts
│   │   └── notificationManager.ts
│   ├── workers/                  # Web Workers
│   │   └── sessionWorker.ts
│   ├── styles/                   # CSS files
│   │   └── ag-grid-custom.css
│   ├── App.tsx                   # Main app component
│   ├── index.tsx                 # Entry point
│   ├── constants.ts              # App constants & session configs
│   ├── types.ts                  # TypeScript type definitions
│   └── vite-env.d.ts            # Vite environment types
├── server/                       # Backend API (Node.js/Express)
│   ├── api/calendar/            # Calendar API endpoints
│   ├── api/fx/                  # FX Data API endpoints (Sprint 1)
│   ├── db.js                    # PostgreSQL connection
│   └── server.js                # Express server
├── public/                      # Static assets
├── dist/                        # Build output (generated)
├── index.html                   # HTML entry point
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies
```

**Import Path Rules:**
- From `src/App.tsx`: Use `'./components/ComponentName'`, `'./hooks/hookName'`, `'./utils/utilName'`
- From `src/components/*.tsx`: Use `'../types'`, `'../constants'`, `'../hooks/hookName'`
- From `src/hooks/*.ts`: Use `'../types'`, `'../constants'`
- All paths are relative to the `/src` directory

**DO NOT:**
- Reference components/hooks/utils from root directories (they don't exist there)
- Use absolute paths like `/components/` or `/hooks/`
- Import from `../components/` when already in App.tsx (use `./components/`)

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
- **Right Pane (flex-1)**: 6 main tabs with tabbed content area
  - Tab 1: **Overview** - Active sessions overview (OverviewPanel.tsx)
  - Tab 2: **Calendar** - Economic calendar events (EconomicCalendar.tsx)
  - Tab 3: **Charts** - Session timeline charts (ForexChart.tsx)
  - Tab 4: **Guide** - Trading session reference tables (SessionGuide.tsx)
  - Tab 5: **World Clock** - Global time zones (WorldClockPanel.tsx)
  - Tab 6: **FX Data** - Position calculator, volatility, best pairs (Sprint 2)

**Key Components:**

1. **App.tsx** (main orchestrator)
   - Manages timezone selection and global time state (updates every 1 second)
   - Manages `leftPaneOpen` state with localStorage persistence (for mobile responsiveness)
   - Manages `activeView` state: 'overview' | 'calendar' | 'clocks' | 'charts' | 'guide' | 'fxdata'
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

7. **RiskCalculator.tsx** (Sprint 2: position size calculator)
   - Input: Account balance, risk %, stop loss pips, currency pair
   - Calculate: Position size in lots based on ATR
   - Display: Recommended lot size, max risk amount, current ATR
   - Uses `useFXVolatility` hook to get real-time ATR values

8. **VolatilityPanel.tsx** (Sprint 2: volatility overview)
   - Table/grid showing all 28 instruments from fx_global database
   - Columns: Instrument, HV-20, ATR, SMA-30, BB Width
   - Sortable by any column
   - Color-coded rows: Green (low), Yellow (medium), Red (high volatility)

9. **BestPairsWidget.tsx** (Sprint 2: pair recommendations)
   - Display top 10 recommended pairs for hedging/trending/reversal
   - Fetch from `/api/fx/best-pairs?category=hedging`
   - Show: Pair 1, Pair 2, Correlation, Score
   - Gracefully handles empty state (table currently being populated)

### Animation System (Framer Motion + React Aria)

**Core Components:**

1. **components/Tooltip.tsx** - Unified accessible tooltip system
   - `AccessibleTooltip`: Main tooltip with fade + scale animation (200ms)
   - `SimpleTooltip`: Lightweight text-only tooltip
   - Supports both session tooltips (with volatility, pairs, strategy) and event tooltips (impact, time, forecast/previous/actual)
   - Automatic viewport collision detection and ARIA attributes
   - Keyboard accessible (Tab to focus, Escape to close)

2. **components/Menu.tsx** - Accessible popover menu system
   - `PopoverMenu`: Base menu with automatic click-outside and Escape handling
   - `CheckboxMenuItem`: Styled checkbox with hover states
   - `MenuSection`: Grouped menu items with headers and dividers
   - `MenuButton`: Clickable action buttons with active states

3. **hooks/useReducedMotion.ts** - Accessibility hook
   - Detects `prefers-reduced-motion` OS/browser setting
   - All animations respect this preference (duration becomes 0ms)
   - Utility functions: `getAnimationDuration()`, `getMotionTransition()`

**Animation Inventory:**

1. **Left Pane (Mobile Slide)** - App.tsx:73-98, 287-306
   - Spring animation: stiffness 300, damping 30
   - Mobile-only (< 768px): slides in from left with opacity fade
   - Swipe gesture: Drag left to close (100px threshold or 500px/s velocity)
   - 20% elastic drag for natural feel

2. **Tooltips (Fade + Scale)** - Tooltip.tsx:100-116
   - 200ms entrance with scale from 95% to 100%
   - 150ms exit with fade out
   - GPU-accelerated with `type: 'tween'`

3. **Session Bars (Staggered Scale)** - ForexChart.tsx:134-162
   - 50ms stagger delay between each bar
   - 300ms entrance with scaleY from 80% to 100%
   - Hover: scales to 125% in 200ms

4. **Event Indicators (Spring Bounce)** - ForexChart.tsx:164-193
   - 30ms stagger delay between each event
   - 400ms entrance with spring overshoot (custom cubic bezier)
   - Hover: scales to 110% with full opacity
   - Exit animations via `AnimatePresence` when toggled off

5. **"Now" Line (Blink + Glow)** - ForexChart.tsx:232-237, 752-768, 935-951
   - 1-second blink cycle: opacity 1 → 0.15
   - Synced glow effect via boxShadow
   - Position updates optimized with `useMemo` (no transition needed)

**Performance Optimizations:**
- All animations use GPU-accelerated properties (transform, opacity)
- `type: 'tween'` for predictable GPU rendering
- `AnimatePresence` for smooth exit animations
- `useMemo` prevents unnecessary recalculations
- 60fps target maintained across all devices

**Accessibility Features:**
- All animations respect `prefers-reduced-motion` (instant transitions when enabled)
- Full keyboard navigation (Tab, Escape, Arrow keys)
- Automatic ARIA attributes via React Aria
- Screen reader compatible
- Focus management

**Documentation:**
See `ANIMATIONS.md` for comprehensive documentation including:
- Detailed animation specs and timing
- Usage patterns and code examples
- Best practices and anti-patterns
- Debugging guide and performance profiling
- Future enhancement suggestions

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
- **6-Tab Navigation** (Mobile & Desktop):
  - Overview, Calendar, Charts (timeline), Guide (reference tables), World Clock, FX Data
  - Active tab persists during session but not across page reloads
  - Each tab renders its own component in the right pane content area
  - FX Data tab (Sprint 2) includes: RiskCalculator, VolatilityPanel, BestPairsWidget

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

**Adding Animations:**
1. Import Framer Motion and useReducedMotion hook:
   ```typescript
   import { motion } from 'framer-motion';
   import { useReducedMotion } from '../hooks/useReducedMotion';
   ```

2. Create animation variants that respect reduced motion:
   ```typescript
   const prefersReducedMotion = useReducedMotion();

   const variants = {
     hidden: { opacity: 0, y: 20 },
     visible: {
       opacity: 1,
       y: 0,
       transition: prefersReducedMotion
         ? { duration: 0 }
         : { duration: 0.3, type: 'tween' }
     }
   };
   ```

3. Apply to component:
   ```typescript
   <motion.div
     variants={variants}
     initial="hidden"
     animate="visible"
   >
     Content
   </motion.div>
   ```

4. For exit animations, wrap in `AnimatePresence`:
   ```typescript
   import { AnimatePresence } from 'framer-motion';

   <AnimatePresence>
     {isVisible && (
       <motion.div exit="hidden">Content</motion.div>
     )}
   </AnimatePresence>
   ```

**Best Practices:**
- Always use GPU-accelerated properties (transform, opacity, scale)
- Set `type: 'tween'` for predictable rendering
- Respect `prefers-reduced-motion` in all animations
- Use `useMemo` for static variant objects
- Refer to `ANIMATIONS.md` for detailed guidelines

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/calendar/events" | Ensure backend is running on port 5000; check vite.config.ts proxy settings |
| Economic calendar shows no events | Verify DATABASE_URL and PostgreSQL connection; run `npm run inspect-schema` in server/ |
| Timezone offsets incorrect | Check TIMEZONES array in constants.ts matches your requirements |
| GitHub Pages 404 errors | Verify VITE_BASE_PATH is `/Forex-Session-Dashboard/` in pages.yml workflow |
| Cloud Run build fails | Check env.yaml has all required vars; verify Dockerfile multi-stage build is correct |
| Animations not smooth/janky | Check DevTools Performance tab for layout thrashing; ensure using transform properties (not left/top); verify GPU acceleration is active in DevTools Layers panel |
| Animation not firing | Verify `initial` prop is set on motion component; check variant names match between `variants` and `animate` props |
| Exit animation skipped | Wrap in `<AnimatePresence>` and add `exit` prop to motion component; ensure unique `key` prop on each element |
| Reduced motion not working | Check `prefers-reduced-motion` in browser DevTools (Chrome: Rendering tab → Emulate CSS prefers-reduced-motion) |
