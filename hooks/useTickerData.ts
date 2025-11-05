import { useState, useEffect } from 'react';

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'Forex' | 'Indices' | 'Crypto' | 'Commodities';
}

export type CategoryFilter = 'All' | 'Crypto' | 'Indices' | 'Forex' | 'Commodities';

const ALPHA_VANTAGE_KEY = 'PURNU4E3JJHSKPOX';
const ALPHA_VANTAGE_BASE = 'https://www.alphavantage.co/query';

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

// Fetch crypto data from CoinGecko (10 second polling)
const fetchCryptoData = async (): Promise<TickerData[]> => {
  try {
    const ids = CRYPTO_ASSETS.join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );

    if (!response.ok) throw new Error('Failed to fetch crypto data');
    const data = await response.json();

    const cryptoData = CRYPTO_ASSETS.map((cryptoId) => {
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
        category: 'Crypto' as const,
      };
    }).filter((item): item is TickerData => item !== null);

    setCachedData('Crypto', cryptoData);
    return cryptoData;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    const cached = getCachedData('Crypto');
    return cached || [];
  }
};

// Fetch Forex data from Alpha Vantage
const fetchForexData = async (): Promise<TickerData[]> => {
  try {
    const results: TickerData[] = [];

    for (const pair of FOREX_PAIRS) {
      const params = new URLSearchParams({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: pair.from,
        to_currency: pair.to,
        apikey: ALPHA_VANTAGE_KEY,
      });

      const response = await fetch(`${ALPHA_VANTAGE_BASE}?${params}`);
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
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    // Fetch precious metals (Gold, Silver) via Forex API
    for (const metal of PRECIOUS_METALS) {
      const params = new URLSearchParams({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: metal.from,
        to_currency: metal.to,
        apikey: ALPHA_VANTAGE_KEY,
      });

      const response = await fetch(`${ALPHA_VANTAGE_BASE}?${params}`);
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

      await new Promise(resolve => setTimeout(resolve, 250));
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
  try {
    const results: TickerData[] = [];

    for (const commodity of COMMODITIES) {
      const params = new URLSearchParams({
        function: commodity.function,
        interval: 'daily',
        apikey: ALPHA_VANTAGE_KEY,
      });

      const response = await fetch(`${ALPHA_VANTAGE_BASE}?${params}`);
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

      await new Promise(resolve => setTimeout(resolve, 250));
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
    // Initial load - try to get from cache first
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Always fetch crypto (CoinGecko - fast and free)
        const cryptoData = await fetchCryptoData();

        // Try to use cached forex/commodities if available
        let forexData = getCachedData('Forex') || [];
        let commoditiesData = getCachedData('Commodities') || [];

        // If no cache, fetch from Alpha Vantage
        if (forexData.length === 0) {
          forexData = await fetchForexData();
        }

        if (commoditiesData.length === 0) {
          commoditiesData = await fetchCommoditiesData();
        }

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

    initializeData();

    // Crypto: Poll every 10 seconds (CoinGecko is generous)
    const cryptoInterval = setInterval(async () => {
      const cryptoData = await fetchCryptoData();
      setTickers((prev) => {
        const nonCryptoData = prev.filter((t) => t.category !== 'Crypto');
        return [...cryptoData, ...nonCryptoData];
      });
      setLastFetched(new Date());
    }, 10000);

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
