import { useState, useEffect } from 'react';
import { FXPrice } from '../types';

interface UseFXPriceResult {
  price: FXPrice | null;
  loading: boolean;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useFXPrice(instrument?: string | null): UseFXPriceResult {
  const [price, setPrice] = useState<FXPrice | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(instrument));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!instrument) {
      setPrice(null);
      setLoading(false);
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    const fetchPrice = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/fx/prices/current?instrument=${instrument}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) {
              setPrice(null);
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
            setPrice(result.data);
            setError(null);
          } else {
            throw new Error('Invalid response format');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch price');
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchPrice();

    // Auto-refresh every 60 seconds
    const intervalId = setInterval(fetchPrice, 60000);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [instrument]);

  return { price, loading, error };
}
