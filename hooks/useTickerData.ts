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

// Indices/Stocks (placeholder - will use Alpha Vantage or similar)
const INDICES_ASSETS = [
  { symbol: 'SPY', display: 'S&P 500' },
  { symbol: 'QQQ', display: 'Nasdaq-100' },
  { symbol: 'VIX', display: 'Volatility Index' },
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

// Placeholder for stock/forex/indices data
const getPlaceholderIndicesData = (): TickerData[] => {
  return INDICES_ASSETS.map((asset) => ({
    symbol: asset.symbol,
    price: Math.random() * 500 + 50,
    change: (Math.random() - 0.5) * 50,
    changePercent: (Math.random() - 0.5) * 5,
    category: 'Indices',
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

      // Get placeholder indices data (for now)
      const indicesData = getPlaceholderIndicesData();

      const allData = [...cryptoData, ...indicesData];
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
