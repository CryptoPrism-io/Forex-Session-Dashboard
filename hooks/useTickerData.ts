import { useState, useEffect } from 'react';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'Forex' | 'Indices' | 'Crypto' | 'Commodities';
}

// Asset list: mix of forex, indices, crypto, and commodities
const ASSETS = [
  // Forex pairs (20)
  { symbol: 'EURUSD', category: 'Forex' as const },
  { symbol: 'GBPUSD', category: 'Forex' as const },
  { symbol: 'JPYUSD', category: 'Forex' as const },
  { symbol: 'AUDUSD', category: 'Forex' as const },
  { symbol: 'NZDUSD', category: 'Forex' as const },
  { symbol: 'USDJPY', category: 'Forex' as const },
  { symbol: 'USDCAD', category: 'Forex' as const },
  { symbol: 'USDCHF', category: 'Forex' as const },
  { symbol: 'EURGBP', category: 'Forex' as const },
  { symbol: 'EURJPY', category: 'Forex' as const },

  // Indices (12)
  { symbol: 'SPY', category: 'Indices' as const },
  { symbol: 'QQQ', category: 'Indices' as const },
  { symbol: 'IWM', category: 'Indices' as const },
  { symbol: 'EEM', category: 'Indices' as const },
  { symbol: 'VTI', category: 'Indices' as const },
  { symbol: 'GLD', category: 'Indices' as const },
  { symbol: 'USO', category: 'Indices' as const },
  { symbol: 'TLT', category: 'Indices' as const },
  { symbol: 'DBC', category: 'Indices' as const },
  { symbol: 'DXY', category: 'Indices' as const },
  { symbol: 'VIX', category: 'Indices' as const },
  { symbol: 'TNX', category: 'Indices' as const },

  // Crypto (15)
  { symbol: 'BINANCE:BTCUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:ETHUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:BNBUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:XRPUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:ADAUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:SOLUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:DOGEUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:AVAXUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:LTCUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:LINKUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:POLKAUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:MATICUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:FILUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:UNIUSDT', category: 'Crypto' as const },
  { symbol: 'BINANCE:ATOMUSDT', category: 'Crypto' as const },

  // Commodities (10)
  { symbol: 'GC=F', category: 'Commodities' as const },
  { symbol: 'SI=F', category: 'Commodities' as const },
  { symbol: 'CL=F', category: 'Commodities' as const },
  { symbol: 'NG=F', category: 'Commodities' as const },
  { symbol: 'ZC=F', category: 'Commodities' as const },
  { symbol: 'ZS=F', category: 'Commodities' as const },
  { symbol: 'ZW=F', category: 'Commodities' as const },
  { symbol: 'CT=F', category: 'Commodities' as const },
  { symbol: 'CC=F', category: 'Commodities' as const },
  { symbol: 'KC=F', category: 'Commodities' as const },
];

// Generate mock data for development (since Finnhub free tier has limitations)
const generateMockTicker = (asset: typeof ASSETS[0]): TickerData => {
  const basePrice = Math.random() * 1000 + 10;
  const change = (Math.random() - 0.5) * 100;
  const changePercent = (change / basePrice) * 100;

  return {
    symbol: asset.symbol,
    price: basePrice,
    change,
    changePercent,
    category: asset.category,
  };
};

export const useTickerData = () => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with mock data
    setTickers(ASSETS.map(generateMockTicker));

    // Setup polling interval (8 seconds)
    const interval = setInterval(() => {
      // Regenerate mock data to simulate price updates
      setTickers(ASSETS.map(generateMockTicker));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return { tickers, loading, error };
};
