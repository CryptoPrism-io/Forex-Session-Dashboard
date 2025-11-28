# 🌍 Forex Session Trading Dashboard

<div align="center">

**Real-time forex market session tracker with economic calendar, volume analysis, and timezone-aware visualization**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://forex-dashboard-963362833537.us-central1.run.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://cryptoprism-io.github.io/Forex-Session-Dashboard/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API](#-api-documentation) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## 🎯 What is This?

A professional-grade web application for forex traders to track global market sessions, economic events, and trading opportunities. Features include:

- **24-hour session visualization** with overlaps and institutional killzones
- **Live economic calendar** with countdown timers and multi-currency filtering
- **Volume profile analysis** showing liquidity patterns across trading sessions
- **World clocks** for major trading hubs (Sydney, Tokyo, London, New York)
- **Progressive Web App** with offline support and mobile-optimized UI
- **Timezone-aware** calculations converting all times to your local timezone

Built with React 18, TypeScript, Framer Motion, and PostgreSQL.

---

## ✨ Features

### 🕒 Real-Time Session Tracking

- **Live Status Updates**: Session states (OPEN/CLOSED/WARNING) update every second
- **Timezone Conversion**: Automatic conversion to your selected timezone
- **Session Overlaps**: Visual indicators for high-liquidity overlap periods
  - **Asia-London Overlap**: 07:00-09:00 UTC (2 hours)
  - **London-NY Overlap**: 12:00-16:00 UTC (4 hours)
- **Killzones**: Institutional trading zones with highest volume
  - **London Killzone**: 07:00-10:00 UTC (market open surge)
  - **NY AM Killzone**: 12:00-15:00 UTC (overlap with London)
  - **NY PM Killzone**: 18:00-20:00 UTC (last chance liquidity)
- **Smart Alerts**: Browser notifications 15 min before and at session open/close

### 📊 Economic Calendar

- **Modern Table Layout**: 7-column responsive table with sticky headers
  - Date | Time Left | Event | Impact | Previous | Forecast | Actual
- **Live Countdown Timers**: Real-time countdown to each event with color-coded urgency
  - 🔴 Red: <2 hours (urgent)
  - 🟡 Amber: 2-6 hours (soon)
  - 🔵 Cyan: >6 hours (normal)
  - ⚫ Grey: Past events
- **Multi-Select Filters**: Filter by multiple currencies and impact levels simultaneously
  - Currencies: USD, EUR, GBP, JPY, AUD, CAD, NZD, CHF, CNY
  - Impact: High, Medium, Low
- **Smart Sorting**: Sort by date, impact, currency, or event name
- **Daily Quick Filters**: Yesterday, Today, Tomorrow buttons
- **Auto-Refresh**: Updates every 15 minutes
- **Chart Integration**: Event indicators appear on volume timeline

### 📈 Volume Analysis

- **24-Hour Profile**: Trading volume histogram with 30-minute intervals
- **Session Overlays**: Color-coded layers showing:
  - Main sessions (60-100 volume range)
  - Session overlaps (35-60 range)
  - Killzones (12-35 range)
- **Gradient Visualization**: Red (low) → Orange → Green (high) color scale
- **Now Line**: Vertical indicator with current time display
- **Timezone Rotation**: Volume data rotates to match your selected timezone
- **Economic Event Markers**: Circular indicators showing scheduled releases

### 🌐 World Clocks

- **4 Analog Clocks**: Sydney, Tokyo, London, New York
- **Smooth Animation**: 100ms update interval for fluid second hand movement
- **Session Status Indicators**:
  - Glowing borders when session is active (OPEN)
  - Pulsing glow when approaching open/close (WARNING)
- **Color Theme**: Cyan (Sydney), Pink (Tokyo), Yellow (London), Green (New York)
- **Timezone Labels**: Clear UTC offset display

### 🎨 Modern UI/UX

- **Glass Morphism Design**: Backdrop blur and semi-transparent cards
- **Mobile-First Responsive**: Touch-optimized with bottom tab navigation
- **Swipe Gestures**: Drag left pane to open/close on mobile
- **Smooth Animations**: Framer Motion with reduced-motion support
- **Accessible**: React Aria components with keyboard navigation and ARIA labels
- **PWA Support**: Install as standalone app on mobile/desktop
- **Dark Mode Optimized**: Clean interface designed for extended viewing

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (18.17.0 or higher recommended)
- **PostgreSQL** 14+ (for economic calendar data)
- **npm** or **yarn**

### Local Development

#### 1. Clone Repository

```bash
git clone https://github.com/CryptoPrism-io/Forex-Session-Dashboard.git
cd Forex-Session-Dashboard
```

#### 2. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

#### 3. Configure Environment

Create `.env.local` for frontend:
```env
VITE_API_BASE_URL=http://localhost:5000
```

Create `server/.env` for backend:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=forex_db
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
NODE_ENV=development
PORT=5000
```

#### 4. Start Development Servers

```bash
# Terminal 1 - Frontend (port 3000)
npm run dev

# Terminal 2 - Backend (port 5000)
cd server
npm run dev
```

**Frontend**: http://localhost:3000
**Backend API**: http://localhost:5000

---

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: React 18.3.1 + TypeScript 5.5
- **Build Tool**: Vite 6.4.1
- **Animation**: Framer Motion 11.18.2
- **Accessibility**: React Aria Components 1.13.0
- **Charts**: Recharts (area, bar, custom renderers)
- **Styling**: Tailwind CSS (via CDN)
- **State**: React Hooks (useState, useEffect, useMemo, useCallback)

#### Backend
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL Cloud SQL
- **Query**: Raw SQL with pg library (connection pooling)
- **API**: RESTful JSON endpoints with CORS

#### DevOps
- **CI/CD**: GitHub Actions (automated deployment on push)
- **Hosting**: Google Cloud Run (production), GitHub Pages (demo)
- **Container**: Docker multi-stage builds (React + Node.js)
- **Auth**: Workload Identity Federation (no service account keys)

### Project Structure

```
Forex-Session-Dashboard/
├── components/              # React components
│   ├── AlertsToggle.tsx    # Session notification settings
│   ├── ChartTooltip.tsx    # Hover information display
│   ├── EconomicCalendar.tsx # Economic event table
│   ├── ForexChart.tsx      # 24-hour session timeline
│   ├── Menu.tsx            # Accessible popover menu
│   ├── SessionClocks.tsx   # Analog clocks
│   ├── SessionGuide.tsx    # Reference tables
│   ├── Tooltip.tsx         # Unified tooltip system
│   ├── VolumeChart.tsx     # Volume profile
│   └── WorldClockPanel.tsx # Clocks + calendar panel
├── hooks/                  # Custom React hooks
│   ├── useEconomicCalendar.ts # Calendar data fetching
│   └── useReducedMotion.ts    # Accessibility hook
├── server/                 # Backend Express API
│   ├── api/
│   │   └── calendar/       # Economic calendar endpoints
│   │       ├── events.js   # Event query handler
│   │       ├── today.js    # Today's events
│   │       ├── stats.js    # Event statistics
│   │       └── currencies.js # Available currencies
│   ├── db.js               # PostgreSQL connection pool
│   └── server.js           # Express app + static serving
├── constants.ts            # Session definitions & timezones
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main app component
├── index.tsx               # React entry point
├── vite.config.ts          # Vite configuration
├── Dockerfile              # Multi-stage container build
├── CHANGELOG.md            # Version history
├── ANIMATIONS.md           # Animation system docs
└── CLAUDE.md               # AI assistant instructions
```

### System Flow

```
User Browser
    ↓
Vite Dev Server (localhost:3000)
    ↓
React Components (App.tsx orchestrates state)
    ↓
API Hooks (useEconomicCalendar fetches data)
    ↓
Express Backend (localhost:5000)
    ↓
PostgreSQL Database (Cloud SQL)
    ↓
economic_calendar_ff table (18 columns, UTC-indexed)
```

### Key Design Patterns

#### 1. Session Status Calculation (`App.tsx:42-86`)

```typescript
// Checks UTC hours against session ranges every 1 second
// Returns: OPEN, CLOSED, or WARNING (15 min window)
const checkSession = (utcHours: number, session: Session) => {
  const [start, end] = session.main.range;

  // Handle overnight sessions crossing midnight
  const isActive = (utcHours >= start && utcHours < end) ||
                   (utcHours >= start - 24 && utcHours < end - 24);

  if (isActive) return 'OPEN';
  if (Math.abs(utcHours - start) < 0.25) return 'WARNING'; // 15 min
  if (Math.abs(utcHours - end) < 0.25) return 'WARNING';
  return 'CLOSED';
};
```

#### 2. Timezone Conversion

```typescript
// UTC to Local: (utcHours + offset) % 24
// All session times stored in UTC hours (0-24+)
// ForexChart adjusts bar positions: left = (session_utc_start + offset) % 24
// SessionClocks use Intl.DateTimeFormat with timeZone parameter
```

#### 3. Animation System (Framer Motion + React Aria)

- **Left Pane Slide**: Spring animation (stiffness 300, damping 30)
- **Tooltips**: Fade + scale (200ms entrance, 150ms exit)
- **Session Bars**: Staggered scale (50ms delay, 300ms duration)
- **Event Indicators**: Spring bounce (30ms delay, 400ms duration)
- **Now Line**: Blink + glow (1s cycle, opacity 1 → 0.15)

All animations respect `prefers-reduced-motion` OS setting via `useReducedMotion` hook.

---

## 📡 API Documentation

### Base URLs

- **Development**: `http://localhost:5000`
- **Production**: `https://forex-dashboard-963362833537.us-central1.run.app`

### Endpoints

#### `GET /api/calendar/events`

Fetch economic calendar events with filtering.

**Query Parameters**:
- `startDate` (string, optional): Start date in YYYY-MM-DD format
- `endDate` (string, optional): End date in YYYY-MM-DD format
- `currency` (string, optional): Currency code (USD, EUR, GBP, etc.)
- `impact` (string, optional): Impact level (low, medium, high)

**Response**:
```json
{
  "success": true,
  "count": 42,
  "dateRange": { "start": "2025-11-18", "end": "2025-11-25" },
  "filters": { "currency": "USD", "impact": "high" },
  "data": [
    {
      "id": 123,
      "date": "2025-11-18T00:00:00.000Z",
      "time": "13:30",
      "time_utc": "13:30",
      "date_utc": "2025-11-18",
      "currency": "USD",
      "impact": "high",
      "event": "FOMC Meeting Minutes",
      "actual": null,
      "forecast": "5.2%",
      "previous": "5.0%",
      "source": "forexfactory",
      "event_uid": "ff_2025-11-18_fomc_minutes",
      "created_at": "2025-11-01T00:00:00.000Z",
      "updated_at": "2025-11-18T12:00:00.000Z"
    }
  ]
}
```

#### `GET /api/calendar/today`

Get today's events (timezone-aware).

**Query Parameters**:
- `date` (string, optional): User's local date in YYYY-MM-DD format (defaults to server UTC date)

**Response**: Same structure as `/api/calendar/events`

#### `GET /api/calendar/stats`

Get event statistics.

**Response**:
```json
{
  "success": true,
  "stats": {
    "total_events": "1205",
    "currencies": "15",
    "high_impact": "342",
    "medium_impact": "568",
    "low_impact": "295",
    "earliest_date": "2025-10-01",
    "latest_date": "2025-12-31"
  }
}
```

#### `GET /api/calendar/currencies`

Get list of available currencies.

**Response**:
```json
{
  "success": true,
  "currencies": ["AUD", "CAD", "CHF", "CNY", "EUR", "GBP", "JPY", "NZD", "USD"]
}
```

#### `GET /health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T00:00:00.000Z",
  "database": "connected"
}
```

---

## 🐳 Deployment

### Cloud Run (Production)

**Automatic Deployment**: Push to `main` branch triggers GitHub Actions workflow.

**Manual Deployment**:
```bash
# Build Docker image
docker build -t forex-dashboard .

# Run locally
docker run -p 3000:5000 \
  -e VITE_API_BASE_URL=http://localhost:5000 \
  forex-dashboard

# Deploy via GitHub Actions (automatic on push)
git push origin main
```

**Environment Variables** (configured in `env.yaml`):
```yaml
VITE_API_BASE_URL: https://forex-dashboard-963362833537.us-central1.run.app
POSTGRES_HOST: 34.55.195.199
POSTGRES_PORT: 5432
POSTGRES_DB: dbcp
POSTGRES_USER: yogass09
POSTGRES_PASSWORD: jaimaakamakhya
NODE_ENV: production
```

**Deployment Configuration**:
- **Region**: us-central1
- **Service**: forex-dashboard
- **Min Instances**: 0 (scales to zero when idle)
- **Max Instances**: 10
- **Memory**: 512Mi
- **CPU**: 1
- **Timeout**: 300s

### GitHub Pages (Demo)

**Automatic Deployment**: Separate workflow deploys frontend-only to GitHub Pages.

**URL**: https://cryptoprism-io.github.io/Forex-Session-Dashboard/

**Configuration**:
- Base path: `/Forex-Session-Dashboard/`
- API calls: Points to Cloud Run backend
- Static hosting: GitHub Pages with custom domain support

---

## 🛠️ Development

### Common Commands

```bash
# Development
npm run dev                  # Start frontend dev server (port 3000)
cd server && npm run dev     # Start backend dev server (port 5000)

# Build
npm run build               # Build production frontend
npm run preview             # Preview production build locally

# Database
cd server && npm run inspect-schema  # View database schema
cd server && npm run migrate         # Run database migrations

# Testing
npm run test                # Run unit tests (if configured)
npm run lint                # Lint TypeScript/React code

# Performance
npm run lighthouse          # Run Lighthouse performance audit

# Deployment
git push origin main        # Triggers CI/CD pipeline (auto-deploy)
```

### Adding New Features

#### New Trading Session

1. Add to `constants.ts` in `SESSIONS` array:
```typescript
{
  name: 'Frankfurt',
  main: {
    range: [6, 15],
    key: 'frankfurt_session',
    name: 'Main',
    color: '#3b82f6',
    opacity: 1,
    tooltip: {
      volatility: 'Medium',
      pairs: 'EUR/USD, EUR/GBP, EUR/JPY',
      strategy: 'Breakout trading during ECB announcements'
    }
  },
  overlapLondon: { range: [7, 9], key: 'frankfurt_london_overlap', ... }
}
```
2. Status calculations and highlights happen automatically via `checkSession()`.

#### New API Endpoint

1. Create handler in `server/api/calendar/`:
```javascript
// server/api/calendar/impact.js
import { pool } from '../../db.js';

export default async (req, res) => {
  try {
    const { impact } = req.params;
    const query = `SELECT * FROM economic_calendar_ff WHERE impact = $1`;
    const result = await pool.query(query, [impact]);
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

2. Register route in `server/server.js`:
```javascript
import impactHandler from './api/calendar/impact.js';
app.get('/api/calendar/impact/:impact', impactHandler);
```

#### New Animation

1. Import dependencies:
```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
```

2. Create animation variants:
```typescript
const prefersReducedMotion = useReducedMotion();

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: prefersReducedMotion
      ? { duration: 0 }
      : { duration: 0.3, type: 'tween' }
  },
  exit: { opacity: 0, y: -20 }
};
```

3. Apply to component:
```typescript
<AnimatePresence>
  {isVisible && (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

Refer to [ANIMATIONS.md](ANIMATIONS.md) for comprehensive animation documentation.

---

## 🧪 Testing

### Local Testing

```bash
# Test API endpoints
curl http://localhost:5000/api/calendar/events?startDate=2025-11-18&endDate=2025-11-18

# Test health check
curl http://localhost:5000/health

# Test database connection
cd server && npm run inspect-schema

# Test frontend build
npm run build && npm run preview
```

### Production Testing

```bash
# Test Cloud Run deployment
curl https://forex-dashboard-963362833537.us-central1.run.app/health

# Test GitHub Pages deployment
open https://cryptoprism-io.github.io/Forex-Session-Dashboard/

# Run Lighthouse audit
npm run lighthouse
```

---

## 📝 Configuration

### Timezone Support

All times convert automatically based on user's selected timezone:

- **Session times**: Adjusted from UTC to local via offset calculation
- **Economic events**: Backend stores in UTC, frontend converts to local
- **Clocks**: Use `Intl.DateTimeFormat` with `timeZone` parameter for accuracy

Example:
```typescript
// UTC offset calculation
const offset = TIMEZONES.find(tz => tz.label === selectedTimezone)?.offset || 0;
const localTime = (utcHours + offset + 24) % 24; // +24 to handle negative offsets
```

### Session Definitions

Configured in [constants.ts](constants.ts):

```typescript
SESSIONS: [
  {
    name: 'Sydney',
    main: {
      range: [21, 30], // UTC hours (21:00 - 06:00 next day)
      key: 'sydney_session',
      name: 'Main',
      color: '#06b6d4', // Cyan
      opacity: 1,
      tooltip: {
        volatility: 'Low-Medium',
        pairs: 'AUD/USD, AUD/JPY, NZD/USD',
        strategy: 'Range trading, await London volume'
      }
    }
  },
  // ... more sessions
]
```

### Database Schema

Economic calendar events stored in `economic_calendar_ff` table:

```sql
CREATE TABLE economic_calendar_ff (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time VARCHAR(10),
  time_utc VARCHAR(10),
  date_utc DATE, -- Added Nov 2025 for UTC-based queries
  currency VARCHAR(10),
  impact VARCHAR(20),
  event TEXT,
  actual VARCHAR(50),
  forecast VARCHAR(50),
  previous VARCHAR(50),
  source VARCHAR(50),
  event_uid TEXT UNIQUE,
  actual_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP
);

CREATE INDEX idx_date ON economic_calendar_ff(date);
CREATE INDEX idx_date_utc ON economic_calendar_ff(date_utc);
CREATE INDEX idx_currency ON economic_calendar_ff(currency);
CREATE INDEX idx_impact ON economic_calendar_ff(impact);
```

---

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:

### Code Style

- **TypeScript**: Strict mode enabled, no implicit `any`
- **React**: Functional components with hooks (no class components)
- **Formatting**: ESLint + Prettier (run `npm run lint` before commit)
- **Commits**: Conventional commits format (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`)
- **Comments**: JSDoc for exported functions, inline comments for complex logic

### Contribution Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Implement** your changes with tests
4. **Lint** your code (`npm run lint`)
5. **Commit** with conventional commit message (`git commit -m 'feat: add amazing feature'`)
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request with detailed description

### What to Contribute

- **Bug fixes**: Check [GitHub Issues](https://github.com/CryptoPrism-io/Forex-Session-Dashboard/issues)
- **New features**: Economic indicators, chart types, session alerts
- **Performance**: Bundle size reduction, render optimization
- **Documentation**: Tutorials, API examples, architecture diagrams
- **Accessibility**: ARIA improvements, keyboard navigation
- **Testing**: Unit tests, integration tests, E2E tests

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Recharts** - Beautiful React charting library
- **Framer Motion** - Production-ready animation library
- **React Aria** - Accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Google Cloud Platform** - Reliable cloud infrastructure
- **ForexFactory** - Economic calendar data source
- **Vite** - Lightning-fast build tool

---

## 📞 Support

- **Live Demo**: [forex-dashboard-963362833537.us-central1.run.app](https://forex-dashboard-963362833537.us-central1.run.app)
- **GitHub Pages**: [cryptoprism-io.github.io/Forex-Session-Dashboard](https://cryptoprism-io.github.io/Forex-Session-Dashboard/)
- **Issues**: [GitHub Issues](https://github.com/CryptoPrism-io/Forex-Session-Dashboard/issues)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Animation Docs**: [ANIMATIONS.md](ANIMATIONS.md)

---

<div align="center">

**Made with ❤️ by the CryptoPrism team**

⭐ Star this repo if you find it useful!

[⬆ Back to Top](#-forex-session-trading-dashboard)

</div>
