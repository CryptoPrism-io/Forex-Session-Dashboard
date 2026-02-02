import { useState, useEffect, useCallback } from 'react';
import { FXPrice } from '../types';

interface UseFXPricesResult {
  prices: FXPrice[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useFXPrices(refreshInterval = 60000): UseFXPricesResult {
  const [prices, setPrices] = useState<FXPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/fx/prices/all`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPrices(result.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();

    const intervalId = setInterval(fetchPrices, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchPrices, refreshInterval]);

  return { prices, loading, error, lastUpdated, refetch: fetchPrices };
}
