import React, { useState, useMemo } from 'react';
import { useEconomicCalendar } from '../hooks/useEconomicCalendar';
import { Timezone } from '../types';

type DateRangeFilter = 'yesterday' | 'today' | 'tomorrow' | 'lastWeek' | 'thisWeek' | 'nextWeek' | 'lastMonth' | 'thisMonth' | 'nextMonth';
type FilterCategory = 'daily' | 'weekly' | 'monthly';

// Helper function to convert Date to ISO string respecting timezone offset
const toLocalISO = (d: Date, offsetHours: number): string => {
  const offsetMs = Math.round(offsetHours * 60) * 60 * 1000; // supports 5.5, etc.
  const adjusted = new Date(d.getTime() - offsetMs); // shift so that local midnight maps to UTC date split
  return adjusted.toISOString().split('T')[0];
};

interface EconomicCalendarProps {
  selectedTimezone: Timezone;
}

const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ selectedTimezone }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>(undefined);
  const [selectedImpact, setSelectedImpact] = useState<string | undefined>(undefined);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('thisWeek');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('weekly');

  // Calculate date ranges based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let endDate: Date;

    switch (dateRangeFilter) {
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(startDate);
        break;

      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;

      case 'tomorrow':
        startDate = new Date(today);
        startDate.setDate(today.getDate() + 1);
        endDate = new Date(startDate);
        break;

      case 'lastWeek':
        const lastWeekStart = new Date(today);
        const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
        // Go back to last Sunday
        lastWeekStart.setDate(today.getDate() - dayOfWeek - 7);
        startDate = lastWeekStart;
        endDate = new Date(lastWeekStart);
        endDate.setDate(lastWeekStart.getDate() + 6); // Last Saturday
        break;

      case 'thisWeek':
        const thisWeekStart = new Date(today);
        const thisDayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
        // Go back to this Sunday
        thisWeekStart.setDate(today.getDate() - thisDayOfWeek);
        startDate = thisWeekStart;
        endDate = new Date(thisWeekStart);
        endDate.setDate(thisWeekStart.getDate() + 6); // This Saturday
        break;

      case 'nextWeek':
        const nextWeekStart = new Date(today);
        const nextDayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
        // Go forward to next Sunday
        nextWeekStart.setDate(today.getDate() + (7 - nextDayOfWeek));
        startDate = nextWeekStart;
        endDate = new Date(nextWeekStart);
        endDate.setDate(nextWeekStart.getDate() + 6); // Next Saturday
        break;

      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;

      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;

      case 'nextMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;

      default:
        // Default to this week (Sunday-Saturday)
        const defaultStart = new Date(today);
        const defaultDayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
        defaultStart.setDate(today.getDate() - defaultDayOfWeek); // Go back to Sunday
        startDate = defaultStart;
        endDate = new Date(defaultStart);
        endDate.setDate(defaultStart.getDate() + 6); // This Saturday
    }

    // Convert to ISO date strings (YYYY-MM-DD)
    // Don't apply timezone offset here - the backend handles timezone conversion
    const startISO = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endISO = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    return {
      start: startISO,
      end: endISO
    };
  }, [dateRangeFilter]);

  const { data, loading, error, lastUpdated, refetch } = useEconomicCalendar(
    dateRange.start,
    dateRange.end,
    selectedCurrency,
    selectedImpact
  );

  // Client-side filtering to ensure UI filters even if API returns a superset
  const filteredData = useMemo(() => {
    return data.filter(ev => {
      const byCcy = !selectedCurrency || ev.currency === selectedCurrency;
      const byImpact = !selectedImpact || (ev.impact ?? '').toLowerCase() === selectedImpact.toLowerCase();
      return byCcy && byImpact;
    });
  }, [data, selectedCurrency, selectedImpact]);

  // Get unique currencies from filtered data
  const currencies = useMemo(
    () => Array.from(new Set(filteredData.map(e => e.currency))).sort(),
    [filteredData]
  );
  const impacts = ['low', 'medium', 'high'];

  // Get impact color
  const getImpactColor = (impact: string): string => {
    switch (impact.toLowerCase()) {
      case 'high': return '#ef4444'; // red-500
      case 'medium': return '#f59e0b'; // amber-500
      case 'low': return '#10b981'; // green-500
      default: return '#64748b'; // slate-500
    }
  };

  // Convert UTC time to user's selected timezone
  const convertUTCToTimezone = (utcTimeString: string): string => {
    if (!utcTimeString) return '';

    // Parse UTC time (format: "19:30" or "9:30")
    const [hStr, mStr] = utcTimeString.split(':');
    const baseMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);

    // Handle fractional offsets correctly (e.g., IST +5.5 hours = 330 minutes)
    const offsetMinutes = Math.round(selectedTimezone.offset * 60);
    let localMinutes = (baseMinutes + offsetMinutes) % (24 * 60);

    // Handle negative wraparound
    if (localMinutes < 0) localMinutes += 24 * 60;

    // Convert back to hours and minutes
    const hh = String(Math.floor(localMinutes / 60)).padStart(2, '0');
    const mm = String(localMinutes % 60).padStart(2, '0');

    return `${hh}:${mm}`;
  };

  // Get currency flag emoji (basic mapping)
  const getCurrencyFlag = (currency: string): string => {
    const flagMap: { [key: string]: string } = {
      'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵',
      'AUD': '🇦🇺', 'NZD': '🇳🇿', 'CAD': '🇨🇦', 'CHF': '🇨🇭',
      'CNY': '🇨🇳', 'INR': '🇮🇳', 'SGD': '🇸🇬', 'HKD': '🇭🇰',
    };
    return flagMap[currency] || '🌐';
  };

  // Convert UTC date to IST date string for grouping
  const getISTDateKey = (utcDateString: string): string => {
    const date = new Date(utcDateString);
    // Add IST offset (+5:30 = 330 minutes)
    const istDate = new Date(date.getTime() + (330 * 60 * 1000));
    return istDate.toISOString().split('T')[0];
  };

  // Format date for display in IST
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    // Add IST offset (+5:30 = 330 minutes)
    const istDate = new Date(date.getTime() + (330 * 60 * 1000));
    return istDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group events by IST date (not UTC date) - using filtered data
  const eventsByDate = filteredData.reduce((acc, event) => {
    const dateKey = getISTDateKey(event.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof filteredData>);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with Filters */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-cyan-400">Economic Calendar</h2>
          <span className="text-xs text-slate-400">
            ({filteredData.length} events)
          </span>
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              • Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Timezone Indicator */}
          <div className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-200">
            Times: {selectedTimezone.label.includes('UTC+5:30') ? 'IST' : selectedTimezone.label}
          </div>

          <button
            onClick={refetch}
            className="px-2 py-1 text-xs font-medium rounded bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Date Range Quick Filters - Tab Style */}
      <div className="mb-3">
        {/* Row 1: Category Tabs */}
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => setActiveCategory('daily')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === 'daily'
                ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                : 'bg-slate-700/20 border border-slate-700/40 text-slate-400 hover:bg-slate-700/40 hover:text-slate-300'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveCategory('weekly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === 'weekly'
                ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                : 'bg-slate-700/20 border border-slate-700/40 text-slate-400 hover:bg-slate-700/40 hover:text-slate-300'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveCategory('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === 'monthly'
                ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                : 'bg-slate-700/20 border border-slate-700/40 text-slate-400 hover:bg-slate-700/40 hover:text-slate-300'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Row 2: Specific Filters based on active category */}
        <div className="flex justify-center gap-3">
          {activeCategory === 'daily' && (
            <>
              <button
                onClick={() => setDateRangeFilter('yesterday')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'yesterday'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setDateRangeFilter('today')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'today'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateRangeFilter('tomorrow')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'tomorrow'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                Tomorrow
              </button>
            </>
          )}

          {activeCategory === 'weekly' && (
            <>
              <button
                onClick={() => setDateRangeFilter('lastWeek')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'lastWeek'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setDateRangeFilter('thisWeek')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'thisWeek'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setDateRangeFilter('nextWeek')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'nextWeek'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                Next Week
              </button>
            </>
          )}

          {activeCategory === 'monthly' && (
            <>
              <button
                onClick={() => setDateRangeFilter('lastMonth')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'lastMonth'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setDateRangeFilter('thisMonth')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'thisMonth'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setDateRangeFilter('nextMonth')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  dateRangeFilter === 'nextMonth'
                    ? 'bg-yellow-500/30 border border-yellow-400/60 text-yellow-200'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40'
                }`}
              >
                Next Month
              </button>
            </>
          )}
        </div>
      </div>

      {/* Currency and Impact Filters */}
      <div className="flex gap-2 mb-3">
        {/* Currency Filter */}
        <div className="flex-1">
          <select
            value={selectedCurrency || ''}
            onChange={(e) => setSelectedCurrency(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs rounded bg-slate-800/50 border border-slate-700/40 text-slate-300 focus:border-cyan-400/60 focus:outline-none"
          >
            <option value="">All Currencies</option>
            {currencies.map(curr => (
              <option key={curr} value={curr}>
                {getCurrencyFlag(curr)} {curr}
              </option>
            ))}
          </select>
        </div>

        {/* Impact Filter */}
        <div className="flex-1">
          <select
            value={selectedImpact || ''}
            onChange={(e) => setSelectedImpact(e.target.value || undefined)}
            className="w-full px-2 py-1 text-xs rounded bg-slate-800/50 border border-slate-700/40 text-slate-300 focus:border-cyan-400/60 focus:outline-none"
          >
            <option value="">All Impact Levels</option>
            {impacts.map(imp => (
              <option key={imp} value={imp}>
                {imp.charAt(0).toUpperCase() + imp.slice(1)} Impact
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && data.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-slate-400">Loading economic events...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-3">
          <p className="text-xs text-red-400">Error: {error}</p>
          <button
            onClick={refetch}
            className="mt-2 px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 rounded text-red-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Events List */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-400">
          No economic events found for the selected filters.
        </div>
      )}

      {/* Events Grouped by Date */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {Object.entries(eventsByDate)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()) // Newest first using Date objects
          .map(([date, events]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="sticky top-0 bg-slate-800/60 backdrop-blur-sm px-2 py-1.5 mb-2 rounded-lg">
              <h3 className="text-xs font-semibold text-slate-300">
                {formatDate(date)}
              </h3>
            </div>

            {/* Events for this date */}
            <div className="space-y-1.5">
              {events.map(event => {
                const impactColor = getImpactColor(event.impact || 'low');

                const convertedTime = convertUTCToTimezone(event.time_utc);

                return (
                  <div
                    key={event.id}
                    className="bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-2 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {/* Time - Converted to User's Timezone */}
                      <div className="min-w-12 text-xs text-slate-400 font-mono">
                        {convertedTime || event.time_utc || event.time}
                      </div>

                      {/* Currency Flag */}
                      <div className="text-sm flex-shrink-0">
                        {getCurrencyFlag(event.currency)}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Impact Indicator */}
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: impactColor,
                              boxShadow: `0 0 4px ${impactColor}`,
                            }}
                          />
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {event.event}
                          </div>
                        </div>

                        {/* Values Row */}
                        {(event.actual || event.forecast || event.previous) && (
                          <div className="flex gap-3 mt-1 text-xs text-slate-400">
                            {event.previous && (
                              <span>Prev: <span className="text-slate-300">{event.previous}</span></span>
                            )}
                            {event.forecast && (
                              <span>Forecast: <span className="text-slate-300">{event.forecast}</span></span>
                            )}
                            {event.actual && (
                              <span>Actual: <span className="text-cyan-300 font-semibold">{event.actual}</span></span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Currency Badge */}
                      <div className="text-xs font-semibold text-slate-400">
                        {event.currency}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EconomicCalendar;
