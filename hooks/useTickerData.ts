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

const CRYPTO_ASSETS = Object.keys(CRYPTO_SYMBOL_MAP);

// Forex pairs for Frankfurter API
const FOREX_PAIRS = [
  { symbol: 'EURUSD', base: 'EUR', quote: 'USD' },
  { symbol: 'GBPUSD', base: 'GBP', quote: 'USD' },
  { symbol: 'USDJPY', base: 'USD', quote: 'JPY' },
  { symbol: 'USDCAD', base: 'USD', quote: 'CAD' },
  { symbol: 'EURGBP', base: 'EUR', quote: 'GBP' },
];

// Commodities for Commodities-API
const COMMODITIES_MAP: Record<string, string> = {
  'GOLD': 'XAUUSD',    // Gold in USD
  'SILVER': 'XAGUSD',  // Silver in USD
  'OIL': 'OILWTI',     // WTI Crude Oil
  'NATGAS': 'GASUSD',  // Natural Gas
  'WHEAT': 'WHEAT',    // Wheat
};

// Fetch crypto data from CoinGecko (10 second polling)
const fetchCryptoData = async (): Promise<TickerData[]> => {
  try {
    const ids = CRYPTO_ASSETS.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
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

// Fetch forex data from Frankfurter API (free, no auth, daily updates)
const fetchForexData = async (): Promise<TickerData[]> => {
  try {
    const response = await fetch('https://api.frankfurter.dev/v1/latest?base=USD');

    if (!response.ok) throw new Error('Failed to fetch forex data');
    const data = await response.json();

    return FOREX_PAIRS.map((pair) => {
      const rate = data.rates[pair.quote];
      if (!rate) return null;

      // Calculate the price in USD for display
      let price: number;
      let changePercent = 0; // Frankfurter doesn't provide historical by default

      if (pair.base === 'USD') {
        // For USD base pairs, show the rate directly
        price = rate;
      } else {
        // For other pairs like EUR/USD, calculate
        const baseRate = data.rates[pair.base];
        price = rate / baseRate;
      }

      return {
        symbol: pair.symbol,
        price,
        change: 0,
        changePercent,
        category: 'Forex',
      };
    }).filter((item): item is TickerData => item !== null);
  } catch (error) {
    console.error('Error fetching forex data:', error);
    return [];
  }
};

// Fetch commodities data from Commodities-API (requires free API key signup)
const fetchCommoditiesData = async (): Promise<TickerData[]> => {
  try {
    // Using commodities-api.com - requires signup for free key
    const apiKey = 'YOUR_COMMODITIES_API_KEY'; // User needs to signup and add their key

    const commoditiesSymbols = Object.values(COMMODITIES_MAP).join(',');
    const response = await fetch(
      `https://commodities-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=${commoditiesSymbols}`
    );

    if (!response.ok) throw new Error('Failed to fetch commodities data');
    const data = await response.json();

    if (!data.success) {
      console.warn('Commodities API error:', data.error);
      return [];
    }

    return Object.entries(COMMODITIES_MAP).map(([symbol, apiSymbol]) => {
      const rate = data.rates[apiSymbol];
      if (!rate) return null;

      return {
        symbol,
        price: rate,
        change: 0,
        changePercent: 0,
        category: 'Commodities',
      };
    }).filter((item): item is TickerData => item !== null);
  } catch (error) {
    console.error('Error fetching commodities data:', error);
    return [];
  }
};

// Placeholder for indices (no free real-time API available)
const getPlaceholderIndicesData = (): TickerData[] => {
  const INDICES_ASSETS = [
    { symbol: 'SPY', display: 'S&P 500' },
    { symbol: 'QQQ', display: 'Nasdaq-100' },
    { symbol: 'VIX', display: 'Volatility Index' },
  ];

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

  useEffect(() => {
    // Initial fetch
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [cryptoData, forexData, commoditiesData] = await Promise.all([
          fetchCryptoData(),
          fetchForexData(),
          fetchCommoditiesData(),
        ]);

        const indicesData = getPlaceholderIndicesData();
        const allData = [...cryptoData, ...forexData, ...commoditiesData, ...indicesData];

        setTickers(allData.length > 0 ? allData : []);
        setLastFetched(new Date());
      } catch (err) {
        setError('Failed to load ticker data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();

    // Setup different polling intervals
    // Crypto: 10 seconds (most frequent)
    const cryptoInterval = setInterval(async () => {
      const cryptoData = await fetchCryptoData();
      setTickers((prev) => {
        const nonCryptoData = prev.filter((t) => t.category !== 'Crypto');
        return [...cryptoData, ...nonCryptoData];
      });
      setLastFetched(new Date());
    }, 10000);

    // Forex: 2 hours (Frankfurter updates daily, so no point polling more often)
    const forexInterval = setInterval(async () => {
      const forexData = await fetchForexData();
      setTickers((prev) => {
        const nonForexData = prev.filter((t) => t.category !== 'Forex');
        return [...nonForexData, ...forexData];
      });
      setLastFetched(new Date());
    }, 2 * 60 * 60 * 1000); // 2 hours

    // Commodities: 1 hour (reasonable rate limit approach)
    const commoditiesInterval = setInterval(async () => {
      const commoditiesData = await fetchCommoditiesData();
      setTickers((prev) => {
        const nonCommoditiesData = prev.filter((t) => t.category !== 'Commodities');
        return [...nonCommoditiesData, ...commoditiesData];
      });
      setLastFetched(new Date());
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearInterval(cryptoInterval);
      clearInterval(forexInterval);
      clearInterval(commoditiesInterval);
    };
  }, []);

  return { tickers, loading, error, lastFetched };
};
