import { useState, useEffect } from 'react';
import { FXVolatility } from '../types';

interface UseFXVolatilityResult {
  volatility: FXVolatility | FXVolatility[] | null;
  loading: boolean;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Fetch volatility metrics for a single instrument or all instruments
 * @param instrument - Optional. If provided, fetches single instrument. If null/undefined, fetches all.
 * @returns { volatility, loading, error }
 */
export function useFXVolatility(instrument?: string | null): UseFXVolatilityResult {
  const [volatility, setVolatility] = useState<FXVolatility | FXVolatility[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchVolatility = async () => {
      try {
        setError(null);

        const endpoint = instrument
          ? `${API_BASE_URL}/api/fx/volatility/${instrument}`
          : `${API_BASE_URL}/api/fx/volatility`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) {
              setVolatility(null);
              setError(null);
              setLoading(false);
            }
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          if (result.success && result.data) {
            setVolatility(result.data);
          } else {
            throw new Error('Invalid response format');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch volatility');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchVolatility();

    // Auto-refresh every 1 hour (3600000ms)
    const intervalId = setInterval(fetchVolatility, 3600000);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [instrument]);

  return { volatility, loading, error };
}
