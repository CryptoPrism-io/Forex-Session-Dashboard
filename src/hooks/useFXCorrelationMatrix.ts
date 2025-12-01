import { useEffect, useState } from 'react';
import { FXCorrelationPair } from '../types';

interface UseFXCorrelationMatrixResult {
  matrix: FXCorrelationPair[] | null;
  loading: boolean;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useFXCorrelationMatrix(): UseFXCorrelationMatrixResult {
  const [matrix, setMatrix] = useState<FXCorrelationPair[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMatrix = async () => {
      try {
        setError(null);
        setLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/fx/correlation/matrix`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          if (result.success && Array.isArray(result.data)) {
            setMatrix(result.data);
          } else {
            throw new Error('Invalid response format');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load correlation matrix');
          setMatrix(null);
          setLoading(false);
        }
      }
    };

    fetchMatrix();
    const intervalId = setInterval(fetchMatrix, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { matrix, loading, error };
}
