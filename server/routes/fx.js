import express from 'express';
import { getCurrentPrice, getAllPrices, getSparklines } from '../api/fx/prices.js';
import { getVolatility, getAllVolatility } from '../api/fx/volatility.js';
import { getCandles } from '../api/fx/candles.js';
import { getCorrelationMatrix, getCorrelationPairs } from '../api/fx/correlation.js';
import { getBestPairs } from '../api/fx/bestPairs.js';

const router = express.Router();

// Price endpoints
router.get('/prices/current', getCurrentPrice);  // GET /api/fx/prices/current?instrument=EUR_USD
router.get('/prices/all', getAllPrices);         // GET /api/fx/prices/all
router.get('/prices/sparklines', getSparklines); // GET /api/fx/prices/sparklines?hours=24

// Volatility endpoints
router.get('/volatility/:instrument', getVolatility);  // GET /api/fx/volatility/EUR_USD
router.get('/volatility', getAllVolatility);           // GET /api/fx/volatility

// Candles endpoint
router.get('/candles/:instrument', getCandles);  // GET /api/fx/candles/EUR_USD?limit=100&granularity=H1

// Correlation endpoints
router.get('/correlation/matrix', getCorrelationMatrix);  // GET /api/fx/correlation/matrix
router.get('/correlation/pairs', getCorrelationPairs);    // GET /api/fx/correlation/pairs?pair1=EUR_USD

// Best pairs endpoint
router.get('/best-pairs', getBestPairs);  // GET /api/fx/best-pairs?category=hedging&limit=10

export default router;
