import { useState, useEffect, useCallback } from 'react';

export interface EconomicEvent {
  id: number;
  date: string;
  date_utc: string;
  time: string;
  time_utc: string;
  time_zone: string;
  currency: string;
  impact: string;
  event: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  source: string;
  event_uid: string;
  actual_status?: string | null;
}

export interface EconomicCalendarResponse {
  success: boolean;
  count: number;
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    currency?: string;
    impact?: string;
  };
  data: EconomicEvent[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in milliseconds

export function useEconomicCalendar(
  startDate?: string,
  endDate?: string,
  currency?: string,
  impact?: string
) {
  const [data, setData] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (currency) params.append('currency', currency);
      if (impact) params.append('impact', impact);

      const url = `${API_BASE_URL}/api/calendar/events${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: EconomicCalendarResponse = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to fetch calendar data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching economic calendar:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, currency, impact]);

  // Initial fetch
  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing economic calendar data...');
      fetchCalendarData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchCalendarData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchCalendarData,
  };
}
