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
const REFRESH_INTERVAL_NORMAL = 5 * 60 * 1000; // 5 minutes normally
const REFRESH_INTERVAL_IMMINENT = 30 * 1000; // 30 seconds when events are imminent
const IMMINENT_THRESHOLD_MS = 5 * 60 * 1000; // Events within 5 minutes are "imminent"

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

  // Check if any events are imminent (within 5 minutes of release or just passed)
  const hasImminentEvents = useCallback(() => {
    const now = Date.now();
    return data.some(event => {
      if (!event.time_utc || !event.date_utc) return false;
      try {
        const [hours, minutes] = event.time_utc.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return false;

        const eventDate = new Date(event.date_utc);
        eventDate.setUTCHours(hours, minutes, 0, 0);
        const eventTime = eventDate.getTime();

        // Check if event is within threshold (before or after release)
        // Also refresh frequently for 2 minutes after release to catch actual values
        const timeDiff = eventTime - now;
        const isImminent = timeDiff > 0 && timeDiff <= IMMINENT_THRESHOLD_MS;
        const justPassed = timeDiff <= 0 && timeDiff > -2 * 60 * 1000 && !event.actual;

        return isImminent || justPassed;
      } catch {
        return false;
      }
    });
  }, [data]);

  // Smart auto-refresh: faster when events are imminent
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const scheduleRefresh = () => {
      const interval = hasImminentEvents() ? REFRESH_INTERVAL_IMMINENT : REFRESH_INTERVAL_NORMAL;

      intervalId = setInterval(() => {
        console.log(`Auto-refreshing economic calendar (${hasImminentEvents() ? 'imminent mode' : 'normal mode'})...`);
        fetchCalendarData();
      }, interval);
    };

    scheduleRefresh();

    // Re-check interval when data changes (events may become imminent)
    return () => clearInterval(intervalId);
  }, [fetchCalendarData, hasImminentEvents]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchCalendarData,
  };
}
