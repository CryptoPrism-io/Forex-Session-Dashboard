import React, { useState, useMemo, useCallback } from 'react';
import { useEconomicCalendar } from '../hooks/useEconomicCalendar';
import { Timezone } from '../types';
import { IconEyeOff, IconEye, IconRefreshCcw } from './icons';
import { FilterChip, FilterChipGroup } from './FilterChip';
import { FilterSummaryBar } from './FilterSummaryBar';
import { BottomSheetDrawer, BottomSheetCTABar } from './BottomSheetDrawer';
import { CompactFilterBar } from './CompactFilterBar';

type DateRangeFilter = 'yesterday' | 'today' | 'tomorrow' | 'lastWeek' | 'thisWeek' | 'nextWeek' | 'lastMonth' | 'thisMonth' | 'nextMonth';
type FilterCategory = 'daily' | 'weekly' | 'monthly';

const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  yesterday: 'Yesterday',
  today: 'Today',
  tomorrow: 'Tomorrow',
  lastWeek: 'Last Week',
  thisWeek: 'This Week',
  nextWeek: 'Next Week',
  lastMonth: 'Last Month',
  thisMonth: 'This Month',
  nextMonth: 'Next Month',
};

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const DATE_RANGE_GROUPS: Record<FilterCategory, DateRangeFilter[]> = {
  daily: ['yesterday', 'today', 'tomorrow'],
  weekly: ['lastWeek', 'thisWeek', 'nextWeek'],
  monthly: ['lastMonth', 'thisMonth', 'nextMonth'],
};

// Convert UTC time to selected timezone
// Database now stores time_utc (already in UTC) so we just apply the target offset
const convertUTCToTimezone = (utcTimeString: string | undefined, targetOffsetHours: number): string => {
  if (!utcTimeString) return '';

  const [hStr = '0', mStr = '0'] = utcTimeString.split(':');
  const utcMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);

  // Apply target timezone offset
  const offsetMinutes = Math.round(targetOffsetHours * 60);
  let targetMinutes = (utcMinutes + offsetMinutes) % (24 * 60);
  if (targetMinutes < 0) targetMinutes += 24 * 60;

  const hh = String(Math.floor(targetMinutes / 60)).padStart(2, '0');
  const mm = String(targetMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

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
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<Set<'high' | 'medium' | 'low'>>(new Set(['high']));
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('today');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('daily');
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

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
    undefined,
    undefined // Don't filter by impact at API level, do it client-side for multi-select
  );

  // Client-side filtering to ensure UI filters even if API returns a superset
  const filteredData = useMemo(() => {
    return data.filter(ev => {
      const byCcy = selectedCurrencies.length === 0 || selectedCurrencies.includes(ev.currency);
      const byImpact = selectedImpacts.size === 0 || selectedImpacts.has((ev.impact ?? '').toLowerCase() as 'high' | 'medium' | 'low');
      return byCcy && byImpact;
    });
  }, [data, selectedCurrencies, selectedImpacts]);

  // Get unique currencies from full dataset so multi-select options stay available
  const currencies = useMemo(
    () => Array.from(new Set(data.map(e => e.currency))).sort(),
    [data]
  );
  const currencyTiles = useMemo(() => ['ALL', ...currencies], [currencies]);
  const impactOptions = useMemo(() => ['all', 'high', 'medium', 'low'], []);
  const impactVisualStyles = useMemo(() => ({
    all: {
      selected: 'border-slate-400/70 bg-slate-600/40 text-slate-50',
      unselected: 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-500/60'
    },
    high: {
      selected: 'border-red-500/70 bg-red-500/20 text-red-50',
      unselected: 'border-red-500/40 bg-red-500/10 text-red-200 hover:border-red-400/70'
    },
    medium: {
      selected: 'border-amber-400/70 bg-amber-400/20 text-amber-50',
      unselected: 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:border-amber-300/70'
    },
    low: {
      selected: 'border-emerald-400/70 bg-emerald-400/20 text-emerald-50',
      unselected: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:border-emerald-300/70'
    }
  }), []);

  const timezoneLabel = useMemo(() => {
    return selectedTimezone.label.includes('UTC+5:30') ? 'IST' : selectedTimezone.label;
  }, [selectedTimezone]);

  const lastUpdatedStamp = useMemo(() => {
    if (!lastUpdated) return null;
    const datePart = lastUpdated.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timePart = lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${datePart} · ${timePart}`;
  }, [lastUpdated]);

  const filterSummary = useMemo(() => {
    const impactLabel = selectedImpacts.size === 0
      ? 'All Impact Levels'
      : Array.from(selectedImpacts).map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ');
    const currencyLabel = selectedCurrencies.length === 0 ? 'All Currencies' : selectedCurrencies.join(', ');
    const rangeLabel = DATE_RANGE_LABELS[dateRangeFilter];
    const categoryLabel = CATEGORY_LABELS[activeCategory];
    return `${categoryLabel} · ${rangeLabel} · ${currencyLabel} · ${impactLabel}`;
  }, [activeCategory, dateRangeFilter, selectedCurrencies, selectedImpacts]);

  const handleResetFilters = useCallback(() => {
    setSelectedCurrencies([]);
    setSelectedImpacts(new Set(['high']));
    setActiveCategory('daily');
    setDateRangeFilter('today');
  }, []);

  const handleCategoryChange = useCallback((category: FilterCategory) => {
    setActiveCategory(category);
    if (category === 'daily') {
      setDateRangeFilter('today');
    } else if (category === 'weekly') {
      setDateRangeFilter('thisWeek');
    } else {
      setDateRangeFilter('thisMonth');
    }
  }, []);

  // Toggle currency selection
  const toggleCurrency = useCallback((currency: string) => {
    setSelectedCurrencies(prev =>
      prev.includes(currency)
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    );
  }, []);

  // Toggle impact selection (multi-select)
  const toggleImpact = useCallback((impact: 'high' | 'medium' | 'low') => {
    setSelectedImpacts(prev => {
      const next = new Set(prev);
      if (next.has(impact)) {
        next.delete(impact);
      } else {
        next.add(impact);
      }
      return next;
    });
  }, []);

  // Navigate to previous date range
  const handlePrevious = useCallback(() => {
    if (activeCategory === 'daily') {
      if (dateRangeFilter === 'today') setDateRangeFilter('yesterday');
      else if (dateRangeFilter === 'tomorrow') setDateRangeFilter('today');
      else if (dateRangeFilter === 'yesterday') setDateRangeFilter('yesterday'); // Stay at yesterday
    } else if (activeCategory === 'weekly') {
      if (dateRangeFilter === 'thisWeek') setDateRangeFilter('lastWeek');
      else if (dateRangeFilter === 'nextWeek') setDateRangeFilter('thisWeek');
      else if (dateRangeFilter === 'lastWeek') setDateRangeFilter('lastWeek'); // Stay at last week
    } else {
      if (dateRangeFilter === 'thisMonth') setDateRangeFilter('lastMonth');
      else if (dateRangeFilter === 'nextMonth') setDateRangeFilter('thisMonth');
      else if (dateRangeFilter === 'lastMonth') setDateRangeFilter('lastMonth'); // Stay at last month
    }
  }, [activeCategory, dateRangeFilter]);

  // Navigate to next date range
  const handleNext = useCallback(() => {
    if (activeCategory === 'daily') {
      if (dateRangeFilter === 'yesterday') setDateRangeFilter('today');
      else if (dateRangeFilter === 'today') setDateRangeFilter('tomorrow');
      else if (dateRangeFilter === 'tomorrow') setDateRangeFilter('tomorrow'); // Stay at tomorrow
    } else if (activeCategory === 'weekly') {
      if (dateRangeFilter === 'lastWeek') setDateRangeFilter('thisWeek');
      else if (dateRangeFilter === 'thisWeek') setDateRangeFilter('nextWeek');
      else if (dateRangeFilter === 'nextWeek') setDateRangeFilter('nextWeek'); // Stay at next week
    } else {
      if (dateRangeFilter === 'lastMonth') setDateRangeFilter('thisMonth');
      else if (dateRangeFilter === 'thisMonth') setDateRangeFilter('nextMonth');
      else if (dateRangeFilter === 'nextMonth') setDateRangeFilter('nextMonth'); // Stay at next month
    }
  }, [activeCategory, dateRangeFilter]);

  // Select all currencies
  const selectAllCurrencies = useCallback(() => {
    setSelectedCurrencies([]);
  }, []);

  // Apply mobile filters and close drawer
  const applyMobileFilters = useCallback(() => {
    setIsMobileFilterOpen(false);
  }, []);

  // Filtered currencies based on search
  const filteredCurrencies = useMemo(() => {
    if (!currencySearchQuery) return currencies;
    return currencies.filter(currency =>
      currency.toLowerCase().includes(currencySearchQuery.toLowerCase())
    );
  }, [currencies, currencySearchQuery]);

  const impactCounts = useMemo(() => {
    return filteredData.reduce(
      (acc, event) => {
        const level = (event.impact || 'low').toLowerCase();
        if (level.includes('high')) acc.high += 1;
        else if (level.includes('medium')) acc.medium += 1;
        else acc.low += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [filteredData]);

  // Get impact color
  const getImpactColor = (impact: string): string => {
    switch (impact.toLowerCase()) {
      case 'high': return '#ef4444'; // red-500
      case 'medium': return '#f59e0b'; // amber-500
      case 'low': return '#10b981'; // green-500
      default: return '#64748b'; // slate-500
    }
  };

  // Get currency flag emoji (basic mapping)
  const getCurrencyFlag = (currency: string): string => {
    const flagMap: Record<string, string> = {
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      JPY: '🇯🇵',
      AUD: '🇦🇺',
      NZD: '🇳🇿',
      CAD: '🇨🇦',
      CHF: '🇨🇭',
      CNY: '🇨🇳',
      INR: '🇮🇳',
      SGD: '🇸🇬',
      HKD: '🇭🇰',
    };
    return flagMap[currency] || '🌐';
  };

  // Calculate time left until event
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for countdown
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to get time left in minutes for sorting
  // Note: times are in UTC (time_utc column from database)
  const getTimeLeftMinutes = (dateStr: string, timeStr: string | undefined, timezoneOffset: number): number => {
    if (!timeStr || timeStr.toLowerCase() === 'tentative' || timeStr.includes('th')) return Infinity;

    try {
      // Handle time format
      if (!timeStr.includes(':')) return Infinity;

      const [utcHours, utcMinutes] = timeStr.split(':').map(Number);
      if (isNaN(utcHours) || isNaN(utcMinutes)) return Infinity;

      // Convert UTC time to local time using timezone offset
      const totalMinutesUTC = utcHours * 60 + utcMinutes;
      const offsetMinutes = Math.round(timezoneOffset * 60);
      let totalMinutesLocal = totalMinutesUTC + offsetMinutes;

      // Handle day boundary crossing
      let dayOffset = 0;
      if (totalMinutesLocal < 0) {
        dayOffset = -1;
        totalMinutesLocal += 24 * 60;
      } else if (totalMinutesLocal >= 24 * 60) {
        dayOffset = 1;
        totalMinutesLocal -= 24 * 60;
      }

      const localHours = Math.floor(totalMinutesLocal / 60);
      const localMinutes = totalMinutesLocal % 60;

      // Parse date properly - handle both ISO and simple date formats
      let year, month, day;
      if (dateStr.includes('T')) {
        // ISO format: "2025-11-18T00:00:00.000Z"
        const isoDate = new Date(dateStr);
        year = isoDate.getUTCFullYear();
        month = isoDate.getUTCMonth();
        day = isoDate.getUTCDate();
      } else {
        // Simple format: "2025-11-18"
        const dateParts = dateStr.split('-');
        year = parseInt(dateParts[0]);
        month = parseInt(dateParts[1]) - 1;
        day = parseInt(dateParts[2]);
      }

      // Apply day offset if time conversion crossed midnight
      if (dayOffset !== 0) {
        const tempDate = new Date(year, month, day + dayOffset);
        year = tempDate.getFullYear();
        month = tempDate.getMonth();
        day = tempDate.getDate();
      }

      // Create local date object (time is now in user's local timezone)
      const eventDate = new Date(year, month, day, localHours, localMinutes, 0, 0);
      const diff = currentTime.getTime() - eventDate.getTime();

      // If passed, return Infinity to push to bottom
      if (diff > 0) return Infinity;

      // Otherwise return minutes left (negative of diff in minutes)
      return Math.floor(Math.abs(diff) / 1000 / 60);
    } catch {
      return Infinity;
    }
  };

  // Calculate time left until event
  // Note: times are in UTC (time_utc column from database), converted to local timezone for display
  const getTimeLeft = (dateStr: string, timeStr: string | undefined, timezoneOffset: number): string => {
    if (!timeStr || timeStr.toLowerCase() === 'tentative' || timeStr.includes('th')) return '--';

    try {
      // Handle time format validation
      if (!timeStr.includes(':')) return '--';

      const [utcHours, utcMinutes] = timeStr.split(':').map(Number);
      if (isNaN(utcHours) || isNaN(utcMinutes)) return '--';

      // Convert UTC time to local time using timezone offset
      const totalMinutesUTC = utcHours * 60 + utcMinutes;
      const offsetMinutes = Math.round(timezoneOffset * 60);
      let totalMinutesLocal = totalMinutesUTC + offsetMinutes;

      // Handle day boundary crossing
      let dayOffset = 0;
      if (totalMinutesLocal < 0) {
        dayOffset = -1;
        totalMinutesLocal += 24 * 60;
      } else if (totalMinutesLocal >= 24 * 60) {
        dayOffset = 1;
        totalMinutesLocal -= 24 * 60;
      }

      const localHours = Math.floor(totalMinutesLocal / 60);
      const localMinutes = totalMinutesLocal % 60;

      // Parse date properly - handle both ISO and simple date formats
      let year, month, day;
      if (dateStr.includes('T')) {
        // ISO format: "2025-11-18T00:00:00.000Z"
        const isoDate = new Date(dateStr);
        year = isoDate.getUTCFullYear();
        month = isoDate.getUTCMonth();
        day = isoDate.getUTCDate();
      } else {
        // Simple format: "2025-11-18"
        const dateParts = dateStr.split('-');
        year = parseInt(dateParts[0]);
        month = parseInt(dateParts[1]) - 1;
        day = parseInt(dateParts[2]);
      }

      // Apply day offset if time conversion crossed midnight
      if (dayOffset !== 0) {
        const tempDate = new Date(year, month, day + dayOffset);
        year = tempDate.getFullYear();
        month = tempDate.getMonth();
        day = tempDate.getDate();
      }

      // Create local date object (time is now in user's local timezone)
      const eventDate = new Date(year, month, day, localHours, localMinutes, 0, 0);

      // Calculate difference: currentTime - eventTime
      const diff = currentTime.getTime() - eventDate.getTime();

      // If positive (current time > event time), event has passed
      if (diff > 0) return 'Passed';

      // Otherwise, calculate time left (use absolute value)
      const totalMinutes = Math.floor(Math.abs(diff) / 1000 / 60);
      const hours_left = Math.floor(totalMinutes / 60);
      const minutes_left = totalMinutes % 60;

      if (hours_left > 24) {
        const days = Math.floor(hours_left / 24);
        return `${days}d ${hours_left % 24}h`;
      }

      return `${hours_left}h ${minutes_left}m`;
    } catch (err) {
      console.error('Error calculating time left:', err, dateStr, timeStr);
      return '--';
    }
  };

  const currencyTintMap: Record<string, string> = {
    USD: 'bg-cyan-500/20 text-cyan-100',
    EUR: 'bg-blue-500/20 text-blue-100',
    GBP: 'bg-pink-500/20 text-pink-100',
    JPY: 'bg-rose-500/20 text-rose-100',
    AUD: 'bg-emerald-500/20 text-emerald-100',
    NZD: 'bg-violet-500/20 text-violet-100',
    CAD: 'bg-red-500/20 text-red-100',
    CHF: 'bg-slate-500/20 text-slate-100',
    CNY: 'bg-orange-500/20 text-orange-100',
    INR: 'bg-amber-500/20 text-amber-100',
    SGD: 'bg-teal-500/20 text-teal-100',
    HKD: 'bg-fuchsia-500/20 text-fuchsia-100',
  };

  const getCurrencyTintClass = (currency: string): string => {
    return currencyTintMap[currency] || 'bg-slate-600/30 text-slate-100';
  };

  // Group events by UTC date (using date_utc from database)
  const eventsByDate = filteredData.reduce((acc, event) => {
    // Use date_utc which already accounts for timezone rollover
    const dateKey = event.date_utc || event.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof filteredData>);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with Filters */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-2 pb-3 border-b border-slate-700/30">
        <span className="absolute inset-x-0 -top-[6px] h-px bg-red-500/20 pointer-events-none" />
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-cyan-400">Economic Calendar</h2>
          <span className="text-xs text-slate-400">
            ({filteredData.length} events)
          </span>
          {lastUpdatedStamp && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <span aria-hidden="true">•</span>
              Updated {lastUpdatedStamp}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* Timezone Indicator */}
          <div className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-200">
            Times: {timezoneLabel}
          </div>

          <button
            onClick={refetch}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700/50 bg-slate-800/40 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-slate-200 transition-all disabled:opacity-50 disabled:pointer-events-none"
            title="Refresh feed"
            aria-label="Refresh feed"
            disabled={loading}
          >
            <IconRefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Compact Filter Bar - Desktop & Mobile */}
      <CompactFilterBar
        currentRange={dateRangeFilter}
        currentCategory={activeCategory}
        onPrevious={handlePrevious}
        onNext={handleNext}
        rangeLabel={DATE_RANGE_LABELS[dateRangeFilter]}
        selectedImpacts={selectedImpacts}
        onToggleImpact={toggleImpact}
        impactCounts={impactCounts}
        isExpanded={!filtersCollapsed}
        onToggleExpand={() => setFiltersCollapsed(prev => !prev)}
      />

      {/* Mobile Currency Filter Button */}
      <div className="sm:hidden mb-3">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full px-4 py-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 text-xs text-cyan-100 shadow-lg shadow-cyan-500/20 flex items-center justify-between active:scale-95 transition-transform"
        >
          <span className="font-medium">
            {selectedCurrencies.length === 0 ? 'All Currencies' : `${selectedCurrencies.length} currencies selected`}
          </span>
          <span className="text-cyan-400">Edit</span>
        </button>
      </div>

      {!filtersCollapsed && (
        <div className="mb-2 rounded-[28px] border border-slate-800/60 bg-slate-950/40 backdrop-blur-2xl p-3 shadow-inner shadow-black/30">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
          {/* Currency Filter (Left) */}
          <div className="lg:w-44 xl:w-56 rounded-2xl border border-slate-800/50 bg-slate-900/35 p-3 backdrop-blur-md shadow-inner shadow-black/20">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] uppercase text-slate-500 tracking-wide">Currencies</div>
              <button
                onClick={selectAllCurrencies}
                className="text-[9px] text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {selectedCurrencies.length === 0 ? 'All Selected' : 'Select All'}
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search..."
              value={currencySearchQuery}
              onChange={(e) => setCurrencySearchQuery(e.target.value)}
              className="w-full px-2 py-1.5 mb-2 text-[10px] rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
            />

            {/* Currency Chips */}
            <div className="max-h-40 overflow-y-auto pr-1">
              <FilterChipGroup columns={2} gap={1}>
                {filteredCurrencies.map((currency) => (
                  <FilterChip
                    key={currency}
                    label={currency}
                    value={currency}
                    isSelected={selectedCurrencies.length === 0 || selectedCurrencies.includes(currency)}
                    onClick={() => toggleCurrency(currency)}
                    variant="currency"
                    size="sm"
                    icon={
                      <span className="text-xs">{getCurrencyFlag(currency)}</span>
                    }
                  />
                ))}
              </FilterChipGroup>
            </div>
          </div>

          {/* Central Tabs */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-md p-2.5 shadow-inner shadow-black/15">
              <div className="flex flex-col gap-2.5">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.35em] text-slate-500 mb-1">View</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['daily', 'weekly', 'monthly'] as FilterCategory[]).map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`px-2 py-1.5 text-[10px] font-semibold rounded-lg border focus:outline-none transition-all ${
                          activeCategory === category
                            ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-50 shadow-cyan-500/30 shadow'
                            : 'bg-slate-800/30 border-slate-700/70 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {CATEGORY_LABELS[category]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-2">
                  <div className="text-[9px] uppercase tracking-[0.35em] text-slate-500 mb-1">Range</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {DATE_RANGE_GROUPS[activeCategory].map(option => (
                      <button
                        key={option}
                        onClick={() => setDateRangeFilter(option)}
                        className={`px-2 py-1.5 text-[10px] rounded-lg border transition-all ${
                          dateRangeFilter === option
                            ? 'border-amber-400/60 bg-amber-400/15 text-amber-50 shadow-inner shadow-amber-500/40'
                            : 'border-slate-700/70 bg-slate-800/30 text-slate-300 hover:text-amber-200 hover:border-amber-400/40'
                        }`}
                      >
                        {DATE_RANGE_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-2">
                  <div className="text-[9px] uppercase tracking-[0.35em] text-slate-500 mb-1">Controls</div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="w-full px-3 py-1.5 rounded-lg border border-cyan-400/60 text-[10px] font-semibold text-cyan-100 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Filter (Right) */}
          <div className="lg:w-48 xl:w-60 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-[0.35em] text-slate-500">Impact</span>
              <div className="flex gap-1.5">
                {[
                  { label: 'High', value: impactCounts.high, color: 'bg-red-500/20 text-red-50 border border-red-500/40' },
                  { label: 'Med', value: impactCounts.medium, color: 'bg-amber-400/20 text-amber-50 border border-amber-400/40' },
                  { label: 'Low', value: impactCounts.low, color: 'bg-teal-400/20 text-teal-50 border border-teal-400/40' },
                ].map((badge) => (
                  <span
                    key={badge.label}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${badge.color}`}
                  >
                    {badge.label}: {badge.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-3 backdrop-blur-md shadow-inner shadow-black/20">
              <div className="text-[10px] text-slate-400 mb-2">Multi-select (visible in compact bar above)</div>
              <FilterChipGroup columns={3} gap={1}>
                <FilterChip
                  label="High"
                  value="high"
                  isSelected={selectedImpacts.has('high')}
                  onClick={() => toggleImpact('high')}
                  variant="impact"
                  size="sm"
                  count={impactCounts.high}
                />
                <FilterChip
                  label="Medium"
                  value="medium"
                  isSelected={selectedImpacts.has('medium')}
                  onClick={() => toggleImpact('medium')}
                  variant="impact"
                  size="sm"
                  count={impactCounts.medium}
                />
                <FilterChip
                  label="Low"
                  value="low"
                  isSelected={selectedImpacts.has('low')}
                  onClick={() => toggleImpact('low')}
                  variant="impact"
                  size="sm"
                  count={impactCounts.low}
                />
              </FilterChipGroup>
            </div>
          </div>
          </div>
        </div>
      )}

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

      {/* Mobile Card View (visible on mobile) */}
      <div className="md:hidden flex-1 overflow-auto space-y-2 pb-4">
        {Object.entries(eventsByDate)
          .flatMap(([date, events]) =>
            events.map((event, idx) => ({ date, event, idx }))
          )
          .sort((a, b) => {
            const aMinutes = getTimeLeftMinutes(a.event.date_utc, a.event.time_utc, selectedTimezone.offset);
            const bMinutes = getTimeLeftMinutes(b.event.date_utc, b.event.time_utc, selectedTimezone.offset);
            return aMinutes - bMinutes;
          })
          .map(({ date, event, idx }) => {
            const impactColor = getImpactColor(event.impact || 'low');
            const rawTime = event.time_utc || '';
            const isTentative = rawTime.toLowerCase() === 'tentative';
            const convertedTime = isTentative ? '' : convertUTCToTimezone(event.time_utc, selectedTimezone.offset);
            const displayTime = convertedTime || rawTime;
            const timeLeft = getTimeLeft(event.date_utc, event.time_utc, selectedTimezone.offset);

            return (
              <div
                key={`${date}-${event.id}-${idx}-mobile`}
                className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-lg hover:border-slate-600/60 transition-all"
              >
                {/* Header Row: Flag + Event Name + Impact */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{getCurrencyFlag(event.currency)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 mb-1">{event.event}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span>{displayTime}</span>
                    </div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{
                      backgroundColor: impactColor,
                      boxShadow: `0 0 8px ${impactColor}`,
                    }}
                    title={event.impact || 'low'}
                  />
                </div>

                {/* Time Left Badge */}
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${
                    timeLeft === 'Passed' ? 'bg-slate-700/40 text-slate-400' :
                    timeLeft.includes('d') ? 'bg-slate-700/40 text-slate-300' :
                    parseInt(timeLeft) < 2 ? 'bg-red-500/20 text-red-300 border border-red-400/40' :
                    parseInt(timeLeft) < 6 ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' :
                    'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                  }`}>
                    {timeLeft === 'Passed' ? '✓ Passed' : `⏱ ${timeLeft}`}
                  </span>
                </div>

                {/* Data Row: Previous, Forecast, Actual */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
                  <div className="bg-slate-900/40 rounded-lg p-2">
                    <div className="text-[10px] uppercase text-slate-500 mb-1">Previous</div>
                    <div className="text-sm font-mono text-slate-300">{event.previous || '--'}</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-2">
                    <div className="text-[10px] uppercase text-slate-500 mb-1">Forecast</div>
                    <div className="text-sm font-mono text-slate-300">{event.forecast || '--'}</div>
                  </div>
                  <div className="bg-slate-900/40 rounded-lg p-2">
                    <div className="text-[10px] uppercase text-slate-500 mb-1">Actual</div>
                    <div className={`text-sm font-mono font-semibold ${
                      !event.actual ? 'text-slate-500' :
                      event.actual_status === 'better' ? 'text-green-400' :
                      event.actual_status === 'worse' ? 'text-red-400' :
                      'text-cyan-300'
                    }`}>
                      {event.actual || '--'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden md:block flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
            <tr className="border-b border-slate-700/50">
              <th className="px-3 py-2 text-left font-semibold text-slate-300 whitespace-nowrap">Date</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-300 whitespace-nowrap">Time Left</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-300">Event</th>
              <th className="px-3 py-2 text-center font-semibold text-slate-300">Impact</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-300 whitespace-nowrap">Previous</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-300 whitespace-nowrap">Forecast</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-300 whitespace-nowrap">Actual</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(eventsByDate)
              .flatMap(([date, events]) =>
                events.map((event, idx) => ({ date, event, idx }))
              )
              .sort((a, b) => {
                // Sort by time left ascending (soonest first), with passed/blank events at bottom
                const aMinutes = getTimeLeftMinutes(a.event.date_utc, a.event.time_utc, selectedTimezone.offset);
                const bMinutes = getTimeLeftMinutes(b.event.date_utc, b.event.time_utc, selectedTimezone.offset);
                return aMinutes - bMinutes;
              })
              .map(({ date, event, idx }) => {
                const impactColor = getImpactColor(event.impact || 'low');
                const rawTime = event.time_utc || '';
                const isTentative = rawTime.toLowerCase() === 'tentative';
                const convertedTime = isTentative ? '' : convertUTCToTimezone(event.time_utc, selectedTimezone.offset);
                const displayTime = convertedTime || rawTime;
                const timeLeft = getTimeLeft(event.date_utc, event.time_utc, selectedTimezone.offset);

                return (
                  <tr
                    key={`${date}-${event.id}-${idx}`}
                    className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Date */}
                    <td className="px-3 py-2 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <br />
                      <span className="text-slate-500">{displayTime}</span>
                    </td>

                    {/* Time Left */}
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      <span className={`${
                        timeLeft === 'Passed' ? 'text-slate-500' :
                        timeLeft.includes('d') ? 'text-slate-400' :
                        parseInt(timeLeft) < 2 ? 'text-red-400 font-semibold' :
                        parseInt(timeLeft) < 6 ? 'text-amber-400' :
                        'text-cyan-400'
                      }`}>
                        {timeLeft}
                      </span>
                    </td>

                    {/* Event */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getCurrencyFlag(event.currency)}</span>
                        <span className="text-slate-200 font-medium">{event.event}</span>
                      </div>
                    </td>

                    {/* Impact */}
                    <td className="px-3 py-2 text-center">
                      <div className="inline-flex items-center justify-center">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: impactColor,
                            boxShadow: `0 0 6px ${impactColor}`,
                          }}
                          title={event.impact || 'low'}
                        />
                      </div>
                    </td>

                    {/* Previous */}
                    <td className="px-3 py-2 text-right text-slate-300 font-mono whitespace-nowrap">
                      {event.previous || '--'}
                    </td>

                    {/* Forecast */}
                    <td className="px-3 py-2 text-right text-slate-300 font-mono whitespace-nowrap">
                      {event.forecast || '--'}
                    </td>

                    {/* Actual */}
                    <td className="px-3 py-2 text-right font-mono whitespace-nowrap">
                      <span className={
                        !event.actual ? 'text-slate-500' :
                        event.actual_status === 'better' ? 'text-green-400 font-semibold' :
                        event.actual_status === 'worse' ? 'text-red-400 font-semibold' :
                        'text-cyan-300 font-semibold'
                      }>
                        {event.actual || '--'}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <BottomSheetDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter Events"
        maxHeight="85vh"
      >
        <div className="p-4 space-y-4">
          {/* Currency Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase text-slate-400 tracking-wide font-semibold">Currencies</div>
              <button
                onClick={selectAllCurrencies}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                {selectedCurrencies.length === 0 ? 'All Selected' : 'Select All'}
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search currencies..."
              value={currencySearchQuery}
              onChange={(e) => setCurrencySearchQuery(e.target.value)}
              className="w-full px-3 py-2 mb-3 text-sm rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />

            {/* Currency Chips */}
            <FilterChipGroup columns={3} gap={2}>
              {filteredCurrencies.map((currency) => (
                <FilterChip
                  key={currency}
                  label={currency}
                  value={currency}
                  isSelected={selectedCurrencies.length === 0 || selectedCurrencies.includes(currency)}
                  onClick={() => toggleCurrency(currency)}
                  variant="currency"
                  size="md"
                  icon={
                    <span className="text-sm">{getCurrencyFlag(currency)}</span>
                  }
                />
              ))}
            </FilterChipGroup>
          </div>

          {/* Impact Filter */}
          <div>
            <div className="text-xs uppercase text-slate-400 tracking-wide font-semibold mb-2">Impact Level (Multi-Select)</div>
            <FilterChipGroup columns={3} gap={2}>
              <FilterChip
                label="High"
                value="high"
                isSelected={selectedImpacts.has('high')}
                onClick={() => toggleImpact('high')}
                variant="impact"
                size="md"
                count={impactCounts.high}
              />
              <FilterChip
                label="Medium"
                value="medium"
                isSelected={selectedImpacts.has('medium')}
                onClick={() => toggleImpact('medium')}
                variant="impact"
                size="md"
                count={impactCounts.medium}
              />
              <FilterChip
                label="Low"
                value="low"
                isSelected={selectedImpacts.has('low')}
                onClick={() => toggleImpact('low')}
                variant="impact"
                size="md"
                count={impactCounts.low}
              />
            </FilterChipGroup>
          </div>

          {/* Date Range Filter */}
          <div>
            <div className="text-xs uppercase text-slate-400 tracking-wide font-semibold mb-2">View</div>
            <FilterChipGroup columns={3} gap={2}>
              {(['daily', 'weekly', 'monthly'] as FilterCategory[]).map(category => (
                <FilterChip
                  key={category}
                  label={CATEGORY_LABELS[category]}
                  value={category}
                  isSelected={activeCategory === category}
                  onClick={() => handleCategoryChange(category)}
                  variant="range"
                  size="md"
                />
              ))}
            </FilterChipGroup>
          </div>

          <div>
            <div className="text-xs uppercase text-slate-400 tracking-wide font-semibold mb-2">Range</div>
            <FilterChipGroup columns={3} gap={2}>
              {DATE_RANGE_GROUPS[activeCategory].map(option => (
                <FilterChip
                  key={option}
                  label={DATE_RANGE_LABELS[option]}
                  value={option}
                  isSelected={dateRangeFilter === option}
                  onClick={() => setDateRangeFilter(option)}
                  variant="range"
                  size="md"
                />
              ))}
            </FilterChipGroup>
          </div>
        </div>

        <BottomSheetCTABar
          onApply={applyMobileFilters}
          onReset={handleResetFilters}
          applyLabel="Apply Filters"
          resetLabel="Reset All"
        />
      </BottomSheetDrawer>
    </div>
  );
};

export default EconomicCalendar;
