import { useEffect, useState } from 'react';
import { FXCorrelationPair } from '../types';

interface UseFXCorrelationPairsResult {
  pairs: FXCorrelationPair[] | null;
  loading: boolean;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useFXCorrelationPairs(pair1?: string | null): UseFXCorrelationPairsResult {
  const [pairs, setPairs] = useState<FXCorrelationPair[] | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(pair1));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pair1) {
      setPairs(null);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchPairs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/fx/correlation/pairs?pair1=${pair1}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          if (result.success && Array.isArray(result.data)) {
            setPairs(result.data);
          } else {
            throw new Error('Invalid response format');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch correlation pairs');
          setPairs(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPairs();

    const intervalId = setInterval(fetchPairs, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [pair1]);

  return { pairs, loading, error };
}
