import { useState, useEffect, useCallback } from 'react';

interface SparklineData {
  [instrument: string]: number[];
}

interface UseFXSparklinesResult {
  sparklines: SparklineData;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function useFXSparklines(hours = 24, refreshInterval = 300000): UseFXSparklinesResult {
  const [sparklines, setSparklines] = useState<SparklineData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSparklines = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/fx/prices/sparklines?hours=${hours}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setSparklines(result.data);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sparklines');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchSparklines();

    // Refresh every 5 minutes by default (sparklines don't need frequent updates)
    const intervalId = setInterval(fetchSparklines, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchSparklines, refreshInterval]);

  return { sparklines, loading, error, refetch: fetchSparklines };
}
