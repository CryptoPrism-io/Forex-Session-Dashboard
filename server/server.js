import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import calendarRoutes from './routes/calendar.js';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
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
  console.log(`  GET  /health                    - Health check`);
  console.log(`  GET  /api/calendar/events       - Get calendar events`);
  console.log(`  GET  /api/calendar/stats        - Get statistics`);
  console.log(`  GET  /api/calendar/currencies   - Get currency list`);
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
