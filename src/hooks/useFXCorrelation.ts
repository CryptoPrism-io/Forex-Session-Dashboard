import { useState, useEffect } from 'react';
import { FXCorrelationPair } from '../types';

interface UseFXCorrelationResult {
  correlations: FXCorrelationPair[] | null;
  loading: boolean;
  error: string | null;
}

interface CorrelationCache {
  data: FXCorrelationPair[];
  timestamp: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const CACHE_KEY = 'fx_correlation_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch correlation pairs with daily caching
 * @param filters - Optional query parameters (e.g., { instrument: 'EUR_USD', minCorrelation: '0.5' })
 * @returns { correlations, loading, error }
 */
export function useFXCorrelation(
  filters?: Record<string, string>
): UseFXCorrelationResult {
  const [correlations, setCorrelations] = useState<FXCorrelationPair[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCorrelations = async () => {
      try {
        setError(null);

        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsedCache: CorrelationCache = JSON.parse(cached);
          const now = Date.now();

          // Use cache if less than 24 hours old
          if (now - parsedCache.timestamp < CACHE_DURATION) {
            if (isMounted) {
              setCorrelations(parsedCache.data);
              setLoading(false);
            }
            return;
          }
        }

        // Build query string from filters
        const queryParams = new URLSearchParams(filters || {});
        const endpoint = `${API_BASE_URL}/api/fx/correlation/pairs${
          queryParams.toString() ? `?${queryParams.toString()}` : ''
        }`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          if (result.success && result.data) {
            const data = result.data;

            // Cache the result
            const cacheData: CorrelationCache = {
              data,
              timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

            setCorrelations(data);
          } else {
            throw new Error('Invalid response format');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch correlations');
          setLoading(false);
        }
      }
    };

    fetchCorrelations();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [filters]);

  return { correlations, loading, error };
}
