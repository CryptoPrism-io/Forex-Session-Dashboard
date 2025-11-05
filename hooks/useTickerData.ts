import { useState, useEffect } from 'react';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'Forex' | 'Indices' | 'Crypto' | 'Commodities';
}

export type CategoryFilter = 'All' | 'Crypto' | 'Indices' | 'Forex' | 'Commodities';

// Crypto assets for CoinGecko API (free, no auth required)
const CRYPTO_ASSETS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'cardano',
  'solana',
  'ripple',
  'dogecoin',
  'polkadot',
  'litecoin',
  'chainlink',
  'uniswap',
  'cosmos',
  'avalanche-2',
  'filecoin',
  'polygon',
];

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
        symbol: cryptoId.split('-')[0].toUpperCase().slice(0, 4),
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

  return { tickers, loading, error };
};
