import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import calendarRoutes from './routes/calendar.js';
import fxRoutes from './routes/fx.js';
import pool from './db.js';

dotenv.config();

const app = express();
// Container platforms inject PORT; 8080 is the Lightsail/App Runner convention.
const PORT = process.env.PORT || 8080;

// Get directory name for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The frontend is served from GitHub Pages, so this is a genuinely cross-origin
// API. `origin: '*'` together with `credentials: true` is rejected outright by
// browsers, so the allow-list has to be explicit. Override with ALLOWED_ORIGINS
// (comma-separated) rather than editing this file.
const DEFAULT_ORIGINS = [
  'https://cryptoprism-io.github.io',
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const originAllowList = allowedOrigins.length ? allowedOrigins : DEFAULT_ORIGINS;

app.use(cors({
  origin(origin, callback) {
    // Same-origin/curl/server-to-server requests send no Origin header.
    if (!origin) return callback(null, true);
    if (originAllowList.includes(origin)) return callback(null, true);
    if (/^https?:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// A frontend bundle is only present in the legacy single-container image. When
// the backend runs standalone (the AWS deployment) this directory does not exist.
const staticDir = path.join(__dirname, 'public');
const hasBundledFrontend = fs.existsSync(path.join(staticDir, 'index.html'));
if (hasBundledFrontend) {
  app.use(express.static(staticDir));
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Read a real row from a real table. `SELECT NOW()` only proves a socket is
    // open — a green check that never touched application data is exactly how the
    // June migration outage stayed invisible for days.
    const { rows } = await pool.query('SELECT count(*)::int AS events FROM economic_calendar_ff');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      calendar_events: rows[0].events
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API routes
app.use('/api/calendar', calendarRoutes);
app.use('/api/fx', fxRoutes);

// Serve React app for all other routes (SPA routing) when the bundle is present.
// Standalone API deployments must return a JSON 404 instead of trying to send a
// file that isn't there — otherwise every unmatched path 500s.
app.get('*', (req, res) => {
  if (hasBundledFrontend) {
    return res.sendFile(path.join(staticDir, 'index.html'));
  }
  return res.status(404).json({
    success: false,
    error: 'Not found',
    message: `No such route: ${req.method} ${req.path}. This host serves the API only.`,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Forex Dashboard API Server`);
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${process.env.POSTGRES_DB}@${process.env.POSTGRES_HOST}`);
  console.log(`🌐 CORS enabled for: http://localhost:3000`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET  /health                              - Health check`);
  console.log(`\n📅 Calendar API:`);
  console.log(`  GET  /api/calendar/events                 - Get calendar events`);
  console.log(`  GET  /api/calendar/today                  - Get today's events`);
  console.log(`  GET  /api/calendar/stats                  - Get statistics`);
  console.log(`  GET  /api/calendar/currencies             - Get currency list`);
  console.log(`\n💱 FX Data API:`);
  console.log(`  GET  /api/fx/prices/current?instrument=X  - Get current price`);
  console.log(`  GET  /api/fx/prices/all                   - Get all prices`);
  console.log(`  GET  /api/fx/volatility/:instrument       - Get volatility metrics`);
  console.log(`  GET  /api/fx/volatility                   - Get all volatility`);
  console.log(`  GET  /api/fx/candles/:instrument          - Get OHLC candles`);
  console.log(`  GET  /api/fx/correlation/matrix           - Get correlation matrix`);
  console.log(`  GET  /api/fx/correlation/pairs            - Get correlation pairs`);
  console.log(`  GET  /api/fx/best-pairs                   - Get best pair recommendations`);
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});
