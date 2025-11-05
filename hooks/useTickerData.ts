import { useState, useEffect } from 'react';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'Forex' | 'Indices' | 'Crypto' | 'Commodities';
}

export type CategoryFilter = 'All' | 'Crypto' | 'Indices' | 'Forex' | 'Commodities';

// Crypto symbol mapping from CoinGecko IDs to proper crypto symbols
const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'binancecoin': 'BNB',
  'cardano': 'ADA',
  'solana': 'SOL',
  'ripple': 'XRP',
  'dogecoin': 'DOGE',
  'polkadot': 'DOT',
  'litecoin': 'LTC',
  'chainlink': 'LINK',
  'uniswap': 'UNI',
  'cosmos': 'ATOM',
  'avalanche-2': 'AVAX',
  'filecoin': 'FIL',
  'polygon': 'MATIC'
};

// Crypto assets for CoinGecko API (free, no auth required)
const CRYPTO_ASSETS = Object.keys(CRYPTO_SYMBOL_MAP);

// Indices/Stocks (placeholder)
const INDICES_ASSETS = [
  { symbol: 'SPY', display: 'S&P 500' },
  { symbol: 'QQQ', display: 'Nasdaq-100' },
  { symbol: 'VIX', display: 'Volatility Index' },
];

// Forex pairs (placeholder)
const FOREX_ASSETS = [
  { symbol: 'EURUSD', display: 'EUR/USD' },
  { symbol: 'GBPUSD', display: 'GBP/USD' },
  { symbol: 'USDJPY', display: 'USD/JPY' },
  { symbol: 'USDCAD', display: 'USD/CAD' },
  { symbol: 'EURGBP', display: 'EUR/GBP' },
];

// Commodities (placeholder)
const COMMODITIES_ASSETS = [
  { symbol: 'GOLD', display: 'Gold' },
  { symbol: 'SILVER', display: 'Silver' },
  { symbol: 'OIL', display: 'Crude Oil' },
  { symbol: 'NATGAS', display: 'Natural Gas' },
  { symbol: 'WHEAT', display: 'Wheat' },
];

// Fetch crypto data from CoinGecko (completely free, no auth)
const fetchCryptoData = async (): Promise<TickerData[]> => {
  try {
    const ids = CRYPTO_ASSETS.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&order=market_cap_desc`
    );

    if (!response.ok) throw new Error('Failed to fetch crypto data');
    const data = await response.json();

    return CRYPTO_ASSETS.map((cryptoId) => {
      const cryptoData = data[cryptoId];
      if (!cryptoData) return null;

      const price = cryptoData.usd || 0;
      const changePercent = cryptoData.usd_24h_change || 0;
      const change = (price * changePercent) / 100;

      return {
        symbol: CRYPTO_SYMBOL_MAP[cryptoId],
        price,
        change,
        changePercent,
        category: 'Crypto',
      };
    }).filter((item): item is TickerData => item !== null);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return [];
  }
};

// Placeholder for indices data
const getPlaceholderIndicesData = (): TickerData[] => {
  return INDICES_ASSETS.map((asset) => ({
    symbol: asset.symbol,
    price: Math.random() * 500 + 50,
    change: (Math.random() - 0.5) * 50,
    changePercent: (Math.random() - 0.5) * 5,
    category: 'Indices',
  }));
};

// Placeholder for forex data
const getPlaceholderForexData = (): TickerData[] => {
  return FOREX_ASSETS.map((asset) => ({
    symbol: asset.symbol,
    price: Math.random() * 0.5 + 1.0, // Forex pairs typically range 0.5-2.0
    change: (Math.random() - 0.5) * 0.1,
    changePercent: (Math.random() - 0.5) * 2,
    category: 'Forex',
  }));
};

// Placeholder for commodities data
const getPlaceholderCommoditiesData = (): TickerData[] => {
  return COMMODITIES_ASSETS.map((asset) => ({
    symbol: asset.symbol,
    price: Math.random() * 3000 + 100,
    change: (Math.random() - 0.5) * 100,
    changePercent: (Math.random() - 0.5) * 3,
    category: 'Commodities',
  }));
};

export const useTickerData = () => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch crypto data from CoinGecko (real data)
      const cryptoData = await fetchCryptoData();

      // Get placeholder data for other asset types
      const indicesData = getPlaceholderIndicesData();
      const forexData = getPlaceholderForexData();
      const commoditiesData = getPlaceholderCommoditiesData();

      const allData = [...cryptoData, ...indicesData, ...forexData, ...commoditiesData];
      setTickers(allData.length > 0 ? allData : []);
      setLastFetched(new Date());
    } catch (err) {
      setError('Failed to load ticker data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup polling interval (10 seconds)
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  return { tickers, loading, error, lastFetched };
};
