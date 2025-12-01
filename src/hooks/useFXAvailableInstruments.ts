import { useEffect, useState } from 'react';
import { FXPrice } from '../types';

interface UseFXAvailableInstrumentsResult {
  instruments: string[] | null;
  loading: boolean;
  error: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useFXAvailableInstruments(): UseFXAvailableInstrumentsResult {
  const [instruments, setInstruments] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInstruments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/fx/prices/all`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          if (result.success && Array.isArray(result.data)) {
            const names = (result.data as FXPrice[]).map((item) => item.instrument).filter(Boolean);
            setInstruments(names);
          } else {
            throw new Error('Invalid response format');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load instruments');
          setInstruments(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInstruments();

    const intervalId = setInterval(fetchInstruments, 5 * 60 * 1000); // refresh every 5 minutes

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { instruments, loading, error };
}
