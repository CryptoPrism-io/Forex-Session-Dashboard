import { useState, useEffect } from 'react';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'Forex' | 'Indices' | 'Crypto' | 'Commodities';
}

export type CategoryFilter = 'All' | 'Crypto' | 'Indices' | 'Forex' | 'Commodities';

const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || '';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

const ensureAlphaVantageKey = () => {
  if (!ALPHA_VANTAGE_KEY) {
    console.warn('Missing Alpha Vantage API key. Set VITE_ALPHA_VANTAGE_KEY in your environment.');
    return false;
  }
  return true;
};

// Crypto symbol mapping from CoinGecko IDs to proper crypto symbols
const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  ripple: 'XRP',
  dogecoin: 'DOGE',
};

const CRYPTO_ASSETS = Object.keys(CRYPTO_SYMBOL_MAP);

// Forex pairs for Alpha Vantage
const FOREX_PAIRS = [
  { symbol: 'EURUSD', from: 'EUR', to: 'USD' },
  { symbol: 'GBPUSD', from: 'GBP', to: 'USD' },
  { symbol: 'USDJPY', from: 'USD', to: 'JPY' },
  { symbol: 'USDCAD', from: 'USD', to: 'CAD' },
  { symbol: 'EURGBP', from: 'EUR', to: 'GBP' },
];

// Commodities for Alpha Vantage
const COMMODITIES = [
  { symbol: 'OIL', function: 'WTI', display: 'Crude Oil (WTI)' },
  { symbol: 'NATGAS', function: 'NATURAL_GAS', display: 'Natural Gas' },
  { symbol: 'WHEAT', function: 'WHEAT', display: 'Wheat' },
];

// Precious metals via Forex API
const PRECIOUS_METALS = [
  { symbol: 'GOLD', from: 'XAU', to: 'USD', display: 'Gold' },
  { symbol: 'SILVER', from: 'XAG', to: 'USD', display: 'Silver' },
];

// Cache utilities
const getCacheKey = (category: string) => `ticker_cache_${category}`;
const getCacheTimestampKey = (category: string) => `ticker_timestamp_${category}`;

const getCachedData = (category: string): TickerData[] | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(category));
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
};

const setCachedData = (category: string, data: TickerData[]) => {
  try {
    localStorage.setItem(getCacheKey(category), JSON.stringify(data));
    localStorage.setItem(getCacheTimestampKey(category), new Date().toISOString());
  } catch (e) {
    console.warn('Failed to cache data:', e);
  }
};

const getCacheTimestamp = (category: string): Date | null => {
  try {
    const timestamp = localStorage.getItem(getCacheTimestampKey(category));
    return timestamp ? new Date(timestamp) : null;
  } catch {
    return null;
  }
};

// Fetch crypto data from Alpha Vantage with throttling
const fetchCryptoData = async (): Promise<TickerData[]> => {
  if (!ensureAlphaVantageKey()) {
    return getCachedData('Crypto') || [];
  }

  try {
    const cached = getCachedData('Crypto');
    const results: TickerData[] = [];

    for (const [cryptoId, symbol] of Object.entries(CRYPTO_SYMBOL_MAP)) {
      const params = new URLSearchParams({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: symbol,
        to_currency: 'USD',
        apikey: ALPHA_VANTAGE_KEY,
      });

      const response = await fetchWithTimeout(`${ALPHA_VANTAGE_BASE}?${params}`, 5000);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${symbol} data`);
      }

      const payload = await response.json();
      const rate = payload['Realtime Currency Exchange Rate'];
      if (!rate) {
        continue;
      }

      const price = parseFloat(rate['5. Exchange Rate']);
      if (Number.isNaN(price)) {
        continue;
      }

      const previous = cached?.find((item) => item.symbol === symbol);
      const prevPrice = previous?.price ?? price;
      const change = price - prevPrice;
      const changePercent = prevPrice ? (change / prevPrice) * 100 : 0;

      results.push({
        symbol,
        price,
        change,
        changePercent,
        category: 'Crypto',
      });

      // Alpha Vantage free tier: 5 requests/min. Wait to stay within limits.
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }

    if (results.length > 0) {
      setCachedData('Crypto', results);
      return results;
    }

    return cached || [];
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    const cached = getCachedData('Crypto');
    return cached || [];
  }
};

// Helper to fetch with timeout
const fetchWithTimeout = async (url: string, timeout = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

// Fetch Forex data from Alpha Vantage
const fetchForexData = async (): Promise<TickerData[]> => {
  if (!ensureAlphaVantageKey()) {
    return getCachedData('Forex') || [];
  }
  try {
    const results: TickerData[] = [];

    for (const pair of FOREX_PAIRS) {
      const params = new URLSearchParams({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: pair.from,
        to_currency: pair.to,
        apikey: ALPHA_VANTAGE_KEY,
      });

      const response = await fetchWithTimeout(`${ALPHA_VANTAGE_BASE}?${params}`, 5000);
      if (!response.ok) throw new Error('Failed to fetch forex data');

      const data = await response.json();

      if (data['Realtime Currency Exchange Rate']) {
        const rate = data['Realtime Currency Exchange Rate'];
        const price = parseFloat(rate['5. Exchange Rate']);

        results.push({
          symbol: pair.symbol,
          price,
          change: 0,
          changePercent: 0,
          category: 'Forex',
        });
      }

      // Respect rate limits - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Fetch precious metals (Gold, Silver) via Forex API
    for (const metal of PRECIOUS_METALS) {
      const params = new URLSearchParams({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: metal.from,
        to_currency: metal.to,
        apikey: ALPHA_VANTAGE_KEY,
      });

      const response = await fetchWithTimeout(`${ALPHA_VANTAGE_BASE}?${params}`, 5000);
      if (!response.ok) throw new Error('Failed to fetch metals data');

      const data = await response.json();

      if (data['Realtime Currency Exchange Rate']) {
        const rate = data['Realtime Currency Exchange Rate'];
        const price = parseFloat(rate['5. Exchange Rate']);

        results.push({
          symbol: metal.symbol,
          price,
          change: 0,
          changePercent: 0,
          category: 'Commodities',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setCachedData('Forex', results);
    return results;
  } catch (error) {
    console.error('Error fetching forex data:', error);
    const cached = getCachedData('Forex');
    return cached || [];
  }
};

// Fetch Commodities data from Alpha Vantage
const fetchCommoditiesData = async (): Promise<TickerData[]> => {
  if (!ensureAlphaVantageKey()) {
    return getCachedData('Commodities') || [];
  }
  try {
    const results: TickerData[] = [];

    for (const commodity of COMMODITIES) {
      const params = new URLSearchParams({
        function: commodity.function,
        interval: 'daily',
        apikey: ALPHA_VANTAGE_KEY,
      });

      const response = await fetchWithTimeout(`${ALPHA_VANTAGE_BASE}?${params}`, 5000);
      if (!response.ok) throw new Error(`Failed to fetch ${commodity.symbol} data`);

      const data = await response.json();

      // Alpha Vantage returns different structures for different commodities
      // Extract the most recent price from the data
      let price = 0;
      const dataKey = Object.keys(data).find(key => key !== 'Meta Data' && key !== 'name' && key !== 'interval' && key !== 'unit');

      if (dataKey && data[dataKey]) {
        const timeSeries = data[dataKey];
        const mostRecentKey = Object.keys(timeSeries)[0];
        if (mostRecentKey && timeSeries[mostRecentKey]) {
          const valueKey = Object.keys(timeSeries[mostRecentKey]).find(key => key.includes('value'));
          if (valueKey) {
            price = parseFloat(timeSeries[mostRecentKey][valueKey]);
          }
        }
      }

      if (price > 0) {
        results.push({
          symbol: commodity.symbol,
          price,
          change: 0,
          changePercent: 0,
          category: 'Commodities',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setCachedData('Commodities', results);
    return results;
  } catch (error) {
    console.error('Error fetching commodities data:', error);
    const cached = getCachedData('Commodities');
    return cached || [];
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
    category: 'Indices' as const,
  }));
};

export const useTickerData = () => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    // Initial load - show cached data immediately, then fetch fresh data in background
    const initializeData = async () => {
      try {
        setError(null);

        // Load cached data immediately for fast initial render
        const cachedCrypto = getCachedData('Crypto') || [];
        const cachedForex = getCachedData('Forex') || [];
        const cachedCommodities = getCachedData('Commodities') || [];
        const indicesData = getPlaceholderIndicesData();

        // Show cached data immediately
        const cachedData = [...cachedCrypto, ...cachedForex, ...cachedCommodities, ...indicesData];
        if (cachedData.length > 0) {
          setTickers(cachedData);
          setLoading(false);
        } else {
          setLoading(true);
        }

        // Fetch fresh data in the background without blocking
        const fetchFreshData = async () => {
          const [cryptoData, forexData, commoditiesData] = await Promise.all([
            fetchCryptoData(),
            fetchForexData(),
            fetchCommoditiesData(),
          ]);

          const allData = [...cryptoData, ...forexData, ...commoditiesData, ...indicesData];
          setTickers(allData.length > 0 ? allData : []);
          setLastFetched(new Date());
          setLoading(false);
        };

        fetchFreshData().catch((err) => {
          console.error(err);
          if (cachedData.length === 0) {
            setError('Failed to load ticker data');
          }
          setLoading(false);
        });
      } catch (err) {
        setError('Failed to load ticker data');
        console.error(err);
        setLoading(false);
      }
    };

    initializeData();

    // Crypto: Poll every 5 minutes to respect Alpha Vantage limits
    const cryptoInterval = setInterval(async () => {
      const cryptoData = await fetchCryptoData();
      setTickers((prev) => {
        const nonCryptoData = prev.filter((t) => t.category !== 'Crypto');
        return [...cryptoData, ...nonCryptoData];
      });
      setLastFetched(new Date());
    }, 5 * 60 * 1000);

    // Forex & Commodities: Poll every 6 hours (respect 25 calls/day limit)
    const forexCommoditiesInterval = setInterval(async () => {
      const [forexData, commoditiesData] = await Promise.all([
        fetchForexData(),
        fetchCommoditiesData(),
      ]);

      setTickers((prev) => {
        const otherData = prev.filter(
          (t) => t.category !== 'Forex' && t.category !== 'Commodities'
        );
        return [...otherData, ...forexData, ...commoditiesData];
      });
      setLastFetched(new Date());
    }, 6 * 60 * 60 * 1000); // 6 hours

    return () => {
      clearInterval(cryptoInterval);
      clearInterval(forexCommoditiesInterval);
    };
  }, []);

  return { tickers, loading, error, lastFetched };
};
