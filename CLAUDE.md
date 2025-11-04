# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Forex Session Trading Dashboard** is a React-based web application that visualizes global forex market trading sessions, session overlaps, and "killzones" (institutional liquidity zones). The dashboard uses timezone-aware calculations to display sessions and allows users to switch between multiple timezones to view market activity.

**Key Tech Stack:**
- React 19.2 with TypeScript
- Vite (build tool)
- Recharts (charting library)
- Tailwind CSS (via CDN)

## Project Structure

- **App.tsx** - Main component that orchestrates the entire dashboard. Handles:
  - Timezone selection and management
  - Real-time clock updates (every 30 seconds)
  - Session status calculation (OPEN/CLOSED/WARNING)
  - Active sessions display in the header
  - Layout structure with timezone selector, charts, and legend

- **components/**
  - **ForexChart.tsx** - Main horizontal bar chart showing all trading sessions across 24 hours. Features custom bar rendering with layering effects for sessions, overlaps, and killzones. Includes hover effects and timezone-aware positioning.
  - **DayChart.tsx** - Secondary chart showing session details for the current day
  - **ChartTooltip.tsx** - Custom tooltip component for chart interactions
  - **icons.tsx** - SVG icon components (Clock, Globe, Target, BarChart, ChevronDown)

- **types.ts** - TypeScript interfaces:
  - `Timezone` - timezone label and UTC offset
  - `SessionData` - session configuration with main session and optional overlaps/killzones
  - `ChartBarDetails` - bar properties (name, color, opacity, tooltip info)

- **constants.ts** - Session and timezone data:
  - `TIMEZONES` - List of major forex timezones (UTC, BST, EST, JST, etc.)
  - `SESSIONS` - Detailed configuration for Sydney, Asia, London, and New York sessions with ranges, colors, and trading tooltips

## Core Architecture Concepts

### Session Status Logic
Sessions have three states determined by current UTC time:
- **OPEN**: Currently within session time range
- **CLOSED**: Not currently active
- **WARNING**: Opening or closing within 15 minutes

The logic checks both "today" and "yesterday" ranges to handle overnight sessions crossing the 00:00 UTC boundary (see `checkSession` in App.tsx:38-61).

### Timezone Calculations
All session times are stored in UTC hours (0-24+). Conversion to local timezone happens in two places:
1. **App.tsx** - Converts current UTC time to local time for the "now" line
2. **ForexChart.tsx** - Adjusts session bar positions based on timezone offset for correct chart positioning

### Chart Bar Rendering
`ForexChart.tsx` uses a custom `CustomBarShape` component to:
- Render main sessions at 90% row height (thick bars)
- Render overlaps and killzones at 40% of main session height (thinner bars)
- Support layering (sessions → overlaps → killzones) via render order
- Apply hover effects and special styling for killzones

Sessions may span day boundaries, so `ForexChart` splits them into two parts (p1/p2) when they cross midnight.

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

## Adding New Sessions

1. Add session data to `SESSIONS` array in `constants.ts` with:
   - `name` - Display name for Y-axis
   - `main` - Main session bar with `range: [start, end]` in UTC hours
   - Optional: `overlapAsia`, `overlapLondon`, `killzone`, `killzoneAM`, `killzonePM`
   - Each session part needs `key`, `name`, `color`, `opacity`, and `tooltip`

2. Add any new timezones to `TIMEZONES` array in `constants.ts`

3. Session status indicators in the header will automatically be calculated based on the session's status

## Modifying Session Times

Session times are specified as UTC hour ranges (0-24). For example:
- London: `[7, 16]` = 7am-4pm UTC
- Overnight sessions exceed 24 (e.g., Tokyo: `[23, 32]` = 11pm UTC to 8am next day UTC)

When updating times, ensure any overlaps with other sessions are intentional and test in multiple timezones.

## Custom Styling Notes

- Uses Tailwind CSS from CDN (in `index.html`)
- Dark theme colors based on slate palette (bg-slate-950, slate-900, etc.)
- Cyan/indigo gradient for header
- Custom CSS in `index.html` includes:
  - Custom scrollbar styling
  - `pulse-glow` keyframe animation for warning indicators
  - Recharts bar hover transition effects

## Key Dependencies & Versions

- `react@19.2.0` - Modern React with latest hooks
- `recharts@3.3.0` - Used for chart rendering
- `typescript@5.8.2` - For type checking
- `vite@6.2.0` - Fast build tool
- No state management library (uses React local state)
- No routing (single-page application)

## Naming Conventions

- Session bar data keys follow pattern: `{session}_{type}[_partN]`
  - Example: `london_killzone_p1`, `ny_am_killzone`, `asia_london_overlap_p1`
- Type identifiers: `session`, `overlap`, `killzone`
- Session status type: `SessionStatus = 'OPEN' | 'CLOSED' | 'WARNING'`

## Important Notes for Future Development

- **No API integration** - All data is hardcoded in constants.ts. Any dynamic data would require API setup.
- **30-second update interval** - Chart updates every 30 seconds for responsiveness (see App.tsx:23). Adjust if finer granularity needed.
- **15-minute warning window** - Sessions show WARNING status 15 minutes before opening/closing (see `fifteenMinutesInHours` constant logic).
- **No tests currently** - This is a dashboard without test infrastructure. Add Jest/Vitest if needed.
- **Env variable** - `GEMINI_API_KEY` is loaded in vite.config.ts but not currently used in the app.
