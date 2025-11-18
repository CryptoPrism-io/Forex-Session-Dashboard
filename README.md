# 🌍 Forex Session Trading Dashboard

<div align="center">

**Real-time forex market session tracker with economic calendar, volume analysis, and timezone-aware visualization**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://forex-dashboard-963362833537.us-central1.run.app)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://cryptoprism-io.github.io/Forex-Session-Dashboard/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [API](#api-documentation) • [Deployment](#deployment) • [Contributing](#contributing)

</div>

---

## 📸 Screenshots

### Dashboard Overview
- **Session Timeline**: 24-hour visualization with session overlaps and killzones
- **Economic Calendar**: Live event tracker with countdown timers
- **World Clocks**: 4 analog clocks for major trading hubs
- **Volume Profile**: Trading volume analysis across sessions

## ✨ Features

### 🕒 Real-Time Session Tracking
- **Live Updates**: Session status updates every second
- **Timezone Aware**: Automatic conversion to user's local timezone
- **Session Overlaps**: Visual indicators for London-NY, Asia-London overlaps
- **Killzones**: Institutional liquidity zones (London 07:00-10:00 UTC, NY AM 12:00-15:00 UTC, NY PM 18:00-20:00 UTC)

### 📊 Economic Calendar
- **Table Format**: Clean 7-column layout (Date, Time Left, Event, Impact, Previous, Forecast, Actual)
- **Live Countdown**: Real-time countdown to each economic event
- **Color-Coded Urgency**: Red (<2h), Amber (2-6h), Cyan (>6h), Grey (passed)
- **Smart Filters**: Currency, impact level, and date range filtering
- **Auto-Refresh**: Updates every 15 minutes

### 📈 Volume Analysis
- **24-Hour Profile**: Trading volume visualization with session overlays
- **Session Bands**: Color-coded layers for main sessions, overlaps, and killzones
- **Now Line**: Vertical indicator showing current time
- **Volume Gradient**: Red (low) → Orange → Green (high) color scale

### 🌐 World Clocks
- **4 Analog Clocks**: Sydney, Tokyo, London, New York
- **Smooth Animation**: 100ms update interval for fluid second hand movement
- **Status Indicators**: Glowing borders when session is active
- **Color Theme**: Cyan (Sydney), Pink (Tokyo), Yellow (London), Green (New York)

### 🔔 Session Alerts
- **Smart Notifications**: Alerts at 15 min before open, at open, 15 min before close, at close
- **Sound Toggle**: Optional audio notifications
- **Visual Indicator**: Green glow when ON, Red glow when OFF
- **Persistent State**: Alert preferences saved to localStorage

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (for frontend and backend)
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

Create `.env.local` for development:
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

Frontend: `http://localhost:3000`
Backend API: `http://localhost:5000`

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: React 19.2 + TypeScript
- **Build Tool**: Vite 6.4.1
- **Charts**: Recharts (area, bar, custom renderers)
- **Styling**: Tailwind CSS (via CDN)
- **State**: React Hooks (useState, useEffect, useMemo)

#### Backend
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL Cloud SQL
- **Query**: Raw SQL with pg library
- **API**: RESTful JSON endpoints

#### DevOps
- **CI/CD**: GitHub Actions
- **Hosting**: Google Cloud Run (production), GitHub Pages (demo)
- **Container**: Docker multi-stage builds
- **Auth**: Workload Identity Federation

### Project Structure
```
Forex-Session-Dashboard/
├── components/           # React components
│   ├── AlertsToggle.tsx
│   ├── EconomicCalendar.tsx
│   ├── ForexChart.tsx
│   ├── SessionClocks.tsx
│   ├── SessionGuide.tsx
│   ├── VolumeChart.tsx
│   └── WorldClockPanel.tsx
├── hooks/               # Custom React hooks
│   └── useEconomicCalendar.ts
├── server/              # Backend Express API
│   ├── api/
│   │   └── calendar/   # Economic calendar endpoints
│   ├── routes/
│   ├── db.js          # PostgreSQL connection
│   └── server.js      # Express app
├── constants.ts        # Session definitions
├── types.ts           # TypeScript types
├── App.tsx            # Main app component
├── index.tsx          # React entry point
├── vite.config.ts     # Vite configuration
├── Dockerfile         # Multi-stage container build
└── CHANGELOG.md       # Version history

```

### System Flow
```
User Browser
    ↓
Vite Dev Server (localhost:3000)
    ↓
React Components
    ↓
API Hooks (useEconomicCalendar)
    ↓
Express Backend (localhost:5000)
    ↓
PostgreSQL Database (Cloud SQL)
```

## 📡 API Documentation

### Base URLs
- **Development**: `http://localhost:5000`
- **Production**: `https://forex-dashboard-963362833537.us-central1.run.app`

### Endpoints

#### GET `/api/calendar/events`
Fetch economic calendar events with filtering.

**Query Parameters**:
- `startDate` (string, optional): Start date (YYYY-MM-DD)
- `endDate` (string, optional): End date (YYYY-MM-DD)
- `currency` (string, optional): Currency filter (USD, EUR, GBP, etc.)
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
      "currency": "USD",
      "impact": "high",
      "event": "FOMC Meeting Minutes",
      "actual": null,
      "forecast": "5.2%",
      "previous": "5.0%",
      "source": "forexfactory",
      "event_uid": "..."
    }
  ]
}
```

#### GET `/api/calendar/today`
Get today's events (timezone-aware).

**Query Parameters**:
- `date` (string, optional): User's local date (YYYY-MM-DD). Defaults to server UTC date.

**Response**: Same as `/api/calendar/events`

#### GET `/api/calendar/stats`
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

#### GET `/api/calendar/currencies`
Get list of available currencies.

**Response**:
```json
{
  "success": true,
  "currencies": ["AUD", "CAD", "CHF", "CNY", "EUR", "GBP", "JPY", "NZD", "USD"]
}
```

#### GET `/health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T00:00:00.000Z",
  "database": "connected"
}
```

## 🐳 Deployment

### Cloud Run (Production)

**Automatic Deployment**: Pushes to `main` branch trigger GitHub Actions workflow.

**Manual Deployment**:
```bash
# Build Docker image
docker build -t forex-dashboard .

# Run locally
docker run -p 3000:5000 \
  -e VITE_API_BASE_URL=http://localhost:5000 \
  forex-dashboard

# Deploy to Cloud Run (via GitHub Actions)
git push origin main
```

**Environment Variables** (set in `env.yaml`):
```yaml
VITE_API_BASE_URL: https://forex-dashboard-963362833537.us-central1.run.app
POSTGRES_HOST: 34.55.195.199
POSTGRES_PORT: 5432
POSTGRES_DB: dbcp
POSTGRES_USER: yogass09
POSTGRES_PASSWORD: jaimaakamakhya
NODE_ENV: production
```

### GitHub Pages (Demo)

**Automatic Deployment**: Separate workflow deploys frontend-only to GitHub Pages.

**URL**: https://cryptoprism-io.github.io/Forex-Session-Dashboard/

**Configuration**:
- Base path: `/Forex-Session-Dashboard/`
- API calls: Points to Cloud Run backend

## 🛠️ Development

### Common Commands
```bash
# Development
npm run dev                  # Start frontend dev server
cd server && npm run dev     # Start backend dev server

# Build
npm run build               # Build production frontend
npm run preview             # Preview production build

# Database
cd server && npm run inspect-schema  # View database schema

# Deployment
git push origin main        # Triggers CI/CD pipeline
```

### Adding New Features

#### New Trading Session
1. Add to `constants.ts` in `SESSIONS` array:
```typescript
{
  name: 'Frankfurt',
  main: { range: [6, 15], key: 'frankfurt_session', name: 'Main', color: '#3b82f6', opacity: 1, tooltip: {...} }
}
```
2. Status calculations and highlights happen automatically.

#### New API Endpoint
1. Create handler in `server/api/calendar/`:
```javascript
// server/api/calendar/impact.js
export default async (req, res) => {
  const query = `SELECT * FROM economic_calendar_ff WHERE impact = $1`;
  const result = await pool.query(query, [req.params.impact]);
  res.json({ success: true, data: result.rows });
};
```
2. Register route in `server/server.js`:
```javascript
app.use('/api/calendar/impact', require('./api/calendar/impact'));
```

## 🧪 Testing

### Local Testing
```bash
# Test API endpoints
curl http://localhost:5000/api/calendar/events?startDate=2025-11-18&endDate=2025-11-18

# Test health check
curl http://localhost:5000/health

# Test database connection
cd server && npm run inspect-schema
```

### Production Testing
```bash
# Test Cloud Run deployment
curl https://forex-dashboard-963362833537.us-central1.run.app/health

# Test GitHub Pages deployment
open https://cryptoprism-io.github.io/Forex-Session-Dashboard/
```

## 📝 Configuration

### Timezone Support
All times convert automatically based on user's selected timezone:
- **Session times**: Adjusted from UTC to local
- **Economic events**: Converted from UTC to local
- **Clocks**: Use `Intl.DateTimeFormat` with timezone parameter

### Session Definitions
Configured in `constants.ts`:
```typescript
SESSIONS: [
  {
    name: 'Sydney',
    main: { range: [21, 30], key: 'sydney_session', ... },
    // range values are UTC hours (21 = 21:00 UTC, 30 = 06:00 UTC next day)
  }
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
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style
- TypeScript for type safety
- ESLint + Prettier for formatting
- Meaningful commit messages (conventional commits)
- Comments for complex logic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Recharts** - Beautiful charting library
- **Tailwind CSS** - Utility-first CSS framework
- **Google Cloud Platform** - Cloud hosting infrastructure
- **ForexFactory** - Economic calendar data source

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/CryptoPrism-io/Forex-Session-Dashboard/issues)
- **Demo**: [Live Demo](https://forex-dashboard-963362833537.us-central1.run.app)
- **Documentation**: [CHANGELOG.md](CHANGELOG.md)

---

<div align="center">

**Made with ❤️ by the CryptoPrism team**

[⬆ Back to Top](#-forex-session-trading-dashboard)

</div>
