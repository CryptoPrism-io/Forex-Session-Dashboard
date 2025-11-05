# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Forex Session Trading Dashboard** is a React-based web application that visualizes global forex market trading sessions, session overlaps, and "killzones" (institutional liquidity zones). The dashboard uses timezone-aware calculations to display sessions and allows users to switch between multiple timezones to view market activity.

**Key Tech Stack:**
- React 19.2 with TypeScript
- Vite (build tool)
- Recharts (charting library)
- Tailwind CSS (via CDN)

## Common Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Install dependencies
npm install
```

## Project Architecture

### High-Level Data Flow

1. **App.tsx** (main orchestrator)
   - Manages timezone selection and global time state (updates every 1 second)
   - Calculates `nowLine` position (current UTC time as percentage of 24 hours)
   - Runs `checkSession()` logic on each update to determine `sessionStatus` for all sessions
   - Passes timezone, nowLine, and sessionStatus down to child components
   - Maintains `activeSessions` array for header display

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

4. **ChartTooltip.tsx** (hover information)
   - Shows detailed session info when hovering over chart bars
   - Displays elapsed/remaining time for active sessions

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

## Important Technical Notes

- **1-second update cycle** - App.tsx updates currentTime every 1s (not 30s as previously documented). Clocks update every 100ms for smooth animation.
- **Blinking "Now" Line** - ForexChart renders the "Now" line with opacity toggle (1 → 0.15) and glow effect every second.
- **No state management** - Uses React hooks only; no Redux or Context API.
- **All data hardcoded** - Session definitions in constants.ts; no API integration.
- **GitHub Pages deployment** - vite.config.ts sets base path to `/Forex-Session-Dashboard/` in production.
- **Env variable** - `GEMINI_API_KEY` loaded in vite.config.ts but not used in app code.

## Adding New Features

**New Session:**
1. Add to `SESSIONS` in constants.ts with required `main` field and optional overlap/killzone fields
2. If new timezone needed, add to `TIMEZONES` array with offset value
3. Status calculations and highlights happen automatically

**Modifying Update Frequency:**
- Real-time updates: Change interval in App.tsx line 24 (currently 1000ms)
- Clock smoothness: Change interval in SessionClocks.tsx (currently 100ms)
- "Now" line blink: Change interval in ForexChart.tsx (currently 1000ms)

**Styling Customization:**
- Clock colors: Modify `accent` field in `CLOCKS` array (SessionClocks.tsx)
- Session colors: Modify `color` field in session definitions (constants.ts)
- Custom CSS: Edit `index.html` for scrollbar, animations, Recharts overrides
