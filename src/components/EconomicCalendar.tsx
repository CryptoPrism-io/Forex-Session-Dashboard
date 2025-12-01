import React, { useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, type GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../styles/ag-grid-custom.css';
import { useEconomicCalendar } from '../hooks/useEconomicCalendar';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import { Timezone } from '../types';
import { IconEyeOff, IconEye, IconRefreshCcw } from './icons';
import { FilterChip, FilterChipGroup } from './FilterChip';
import { BottomSheetDrawer, BottomSheetCTABar } from './BottomSheetDrawer';
import { MultiSelectDropdown, DropdownOption } from './MultiSelectDropdown';
import { DateFilterPills, DateRangeFilter } from './DateFilterPills';
import { useEventTypes, eventMatchesTypes, categorizeEvent } from '../hooks/useEventTypes';

const DATE_RANGE_LABELS: Record<DateRangeFilter, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  nextWeek: 'Next Week',
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
  fullscreenButton?: React.ReactNode;
}

const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ selectedTimezone, fullscreenButton }) => {
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['high']);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('today');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'timeLeft' | 'date'>('timeLeft');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Calculate date ranges based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate: Date;
    let endDate: Date;

    switch (dateRangeFilter) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;

      case 'tomorrow':
        startDate = new Date(today);
        startDate.setDate(today.getDate() + 1);
        endDate = new Date(startDate);
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

      default:
        // Default to today
        startDate = new Date(today);
        endDate = new Date(today);
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

  // Extract event types from data
  const eventTypes = useEventTypes(data);

  // Client-side filtering to ensure UI filters even if API returns a superset
  const filteredData = useMemo(() => {
    return data.filter(ev => {
      const byCcy = selectedCurrencies.length === 0 || selectedCurrencies.includes(ev.currency);
      const byImpact = selectedImpacts.length === 0 || selectedImpacts.includes((ev.impact ?? '').toLowerCase());
      const byEventType = selectedEventTypes.length === 0 || eventMatchesTypes(ev, selectedEventTypes);
      return byCcy && byImpact && byEventType;
    });
  }, [data, selectedCurrencies, selectedImpacts, selectedEventTypes]);

  // NOTE: we no longer push chip filters into AG Grid filter model; chips remain external visual presets.

  // Get unique currencies from full dataset so multi-select options stay available
  const currencies = useMemo(
    () => Array.from(new Set(data.map(e => e.currency))).sort(),
    [data]
  );
  const currencyTiles = useMemo(() => ['ALL', ...currencies], [currencies]);
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
    const impactLabel = selectedImpacts.length === 0
      ? 'All Impact Levels'
      : selectedImpacts.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ');
    const currencyLabel = selectedCurrencies.length === 0 ? 'All Currencies' : selectedCurrencies.join(', ');
    const rangeLabel = DATE_RANGE_LABELS[dateRangeFilter];
    const eventTypeLabel = selectedEventTypes.length === 0 ? 'All Event Types' : `${selectedEventTypes.length} types`;
    return `${rangeLabel} · ${currencyLabel} · ${impactLabel} · ${eventTypeLabel}`;
  }, [dateRangeFilter, selectedCurrencies, selectedImpacts, selectedEventTypes]);

  const handleResetFilters = useCallback(() => {
    setSelectedCurrencies([]);
    setSelectedImpacts(['high']);
    setSelectedEventTypes([]);
    setDateRangeFilter('today');
  }, []);

  const toggleImpact = useCallback((impact: string) => {
    setSelectedImpacts(prev =>
      prev.includes(impact)
        ? prev.filter(i => i !== impact)
        : [...prev, impact]
    );
  }, []);

  const toggleEventType = useCallback((type: string) => {
    setSelectedEventTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Toggle currency selection
  const toggleCurrency = useCallback((currency: string) => {
    setSelectedCurrencies(prev =>
      prev.includes(currency)
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    );
  }, []);

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

  // Calculate impact counts from data filtered only by currency (not by impact)
  // This ensures counts show the true number of events regardless of which impacts are selected
  const impactCounts = useMemo(() => {
    const currencyFilteredData = data.filter(ev => {
      return selectedCurrencies.length === 0 || selectedCurrencies.includes(ev.currency);
    });

    return currencyFilteredData.reduce(
      (acc, event) => {
        const level = (event.impact || 'low').toLowerCase();
        if (level.includes('high')) acc.high += 1;
        else if (level.includes('medium')) acc.medium += 1;
        else acc.low += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [data, selectedCurrencies]);

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

  // Update current time every 10 seconds for countdown (reduced frequency to prevent flickering)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
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

  // Sort comparator based on sortBy state
  const sortEvents = useCallback((a: { date: string; event: typeof filteredData[0]; idx: number }, b: { date: string; event: typeof filteredData[0]; idx: number }) => {
    if (sortBy === 'timeLeft') {
      // Sort by time left ascending (soonest first), with passed/blank events at bottom
      const aMinutes = getTimeLeftMinutes(a.event.date_utc, a.event.time_utc, selectedTimezone.offset);
      const bMinutes = getTimeLeftMinutes(b.event.date_utc, b.event.time_utc, selectedTimezone.offset);
      return aMinutes - bMinutes;
    } else {
      // Sort by date ascending (earliest first)
      const aDate = new Date(a.event.date_utc || a.event.date).getTime();
      const bDate = new Date(b.event.date_utc || b.event.date).getTime();
      if (aDate !== bDate) return aDate - bDate;

      // If same date, sort by time
      const aTime = a.event.time_utc || '';
      const bTime = b.event.time_utc || '';
      return aTime.localeCompare(bTime);
    }
  }, [sortBy, selectedTimezone.offset]);

  // Prepare row data for AG Grid
  const baseGridRowData = useMemo(() => {
    const rows = Object.entries(eventsByDate)
      .flatMap(([date, events]) =>
        events.map((event, idx) => {
          const rawTime = event.time_utc || '';
          const isTentative = rawTime.toLowerCase() === 'tentative';
          const convertedTime = isTentative ? '' : convertUTCToTimezone(event.time_utc, selectedTimezone.offset);
          const displayTime = convertedTime || rawTime;
          const timeLeft = getTimeLeft(event.date_utc, event.time_utc, selectedTimezone.offset);
          const timeLeftMinutes = getTimeLeftMinutes(event.date_utc, event.time_utc, selectedTimezone.offset);
          const categories = categorizeEvent(event.event || '');

          return {
            id: `${date}-${event.id}-${idx}`,
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dateTime: new Date(date).getTime(),
            displayTime,
            timeLeft,
            timeLeftMinutes,
            currency: event.currency,
            event: event.event,
            impact: event.impact || 'low',
            previous: event.previous || '--',
            forecast: event.forecast || '--',
            actual: event.actual || '--',
            actualStatus: event.actual_status,
            rawEvent: event,
            categories,
            description: event.source || event.event,
          };
        })
      )
      .sort((a, b) => {
        if (sortBy === 'timeLeft') {
          return a.timeLeftMinutes - b.timeLeftMinutes;
        } else {
          if (a.dateTime !== b.dateTime) return a.dateTime - b.dateTime;
          const timeCompare = a.displayTime.localeCompare(b.displayTime);
          if (timeCompare !== 0) return timeCompare;
          return a.event.localeCompare(b.event);
        }
      });

    return rows.map((row, index) => ({
      ...row,
      stripeIndex: index,
    }));
  }, [eventsByDate, selectedTimezone.offset, sortBy, currentTime]);

  const gridRowData = useMemo(() => {
    if (!expandedRowId) return baseGridRowData;
    const idx = baseGridRowData.findIndex((row) => row.id === expandedRowId);
    if (idx === -1) return baseGridRowData;
    const detailRow = {
      ...baseGridRowData[idx],
      id: `${expandedRowId}-detail`,
      isDetailRow: true,
    };
    return [
      ...baseGridRowData.slice(0, idx + 1),
      detailRow,
      ...baseGridRowData.slice(idx + 1),
    ];
  }, [baseGridRowData, expandedRowId]);

  React.useEffect(() => {
    if (expandedRowId && !baseGridRowData.some((row) => row.id === expandedRowId)) {
      setExpandedRowId(null);
    }
  }, [baseGridRowData, expandedRowId]);

  // Stable AG Grid row style objects
  const defaultRowStyle = useMemo(() => ({
    backgroundColor: 'transparent',
    borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
  }), []);

  const getRowStyle = useCallback((params: any) => {
    if (params.data?.isDetailRow) {
      return { backgroundColor: 'transparent' };
    }
    const stripeIndex = params.data?.stripeIndex ?? params.node.rowIndex ?? 0;
    if (stripeIndex % 2 === 0) {
      return { backgroundColor: 'rgba(15, 23, 42, 0.3)' };
    }
    return {};
  }, []);

  const getRowHeight = useCallback((params: any) => {
    if (params.data?.isDetailRow) {
      return 160;
    }
    return 50;
  }, []);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      sortingOrder: ['asc', 'desc', null],
    }),
    []
  );

  const renderDetailRow = useCallback((row: any) => {
    if (!row) return null;
    const categories = row.categories || [];
    return (
      <div className="w-full pl-8 pr-4">
        <div className="rounded-2xl bg-slate-900/50 border border-slate-700/40 p-4 shadow-inner shadow-black/30 transition-all duration-300 ease-out">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Event Summary</p>
              <p className="text-sm text-slate-100 font-semibold">{row.event}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {row.displayTime} · {row.timeLeft === 'Passed' ? 'Released' : `Starts in ${row.timeLeft}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.length > 0 ? categories.map((cat: string) => (
                <span
                  key={`${row.id}-${cat}`}
                  className="px-2 py-1 text-[10px] rounded-full bg-slate-800/70 border border-slate-700/70 text-slate-200 uppercase tracking-wide"
                >
                  {cat}
                </span>
              )) : (
                <span className="px-2 py-1 text-[10px] rounded-full bg-slate-800/70 border border-slate-700/70 text-slate-400 uppercase tracking-wide">
                  General
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Previous', value: row.previous },
              { label: 'Forecast', value: row.forecast },
              { label: 'Actual', value: row.actual, status: row.actualStatus },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-900/60 border border-slate-800/50 p-2 shadow-inner shadow-black/20">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{item.label}</div>
                <div
                  className={`text-sm font-mono ${
                    item.label === 'Actual'
                      ? item.value === '--'
                        ? 'text-slate-500'
                        : item.status === 'better'
                        ? 'text-emerald-400'
                        : item.status === 'worse'
                        ? 'text-rose-400'
                        : 'text-cyan-300'
                      : 'text-slate-200'
                  }`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Reaction Sparkline</div>
            <div className="relative h-12 rounded-xl bg-slate-900/70 overflow-hidden border border-slate-800/60">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-slate-700/50" />
              </div>
              <div
                className="absolute inset-2 rounded-lg bg-gradient-to-r from-cyan-500/20 via-emerald-400/20 to-transparent"
                style={{ clipPath: 'polygon(0% 70%, 20% 40%, 40% 60%, 60% 30%, 80% 55%, 100% 20%, 100% 100%, 0% 100%)' }}
              />
              <div className="absolute inset-0 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const handleRowToggle = useCallback((rowId: string) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  const handleGridRowClick = useCallback(
    (event: any) => {
      if (!event.data || event.data.isDetailRow) return;
      handleRowToggle(event.data.id);
    },
    [handleRowToggle]
  );

  const getRowId = useCallback((params: any) => params?.data?.id, []);

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      headerName: '',
      field: 'expander',
      width: 46,
      suppressHeaderMenuButton: true,
      suppressHeaderContextMenu: true,
      resizable: false,
      lockPosition: true,
      cellRenderer: (params: any) => {
        if (params.data?.isDetailRow) return null;
        const isExpanded = expandedRowId === params.data?.id;
        return (
          <button
            aria-label="Toggle details"
            className="w-7 h-7 rounded-full bg-slate-900/60 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-cyan-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleRowToggle(params.data.id);
            }}
          >
            <svg
              className="w-3 h-3 transition-transform duration-200"
              style={{ transform: `rotate(${isExpanded ? 90 : 0}deg)` }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        );
      },
      cellClass: (params: any) =>
        params.data?.isDetailRow ? 'ag-cell-detail' : 'ag-cell-expander',
    },
    {
      headerName: 'Date',
      field: 'date',
      width: 120,
      cellStyle: { fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' },
      cellRenderer: (params: any) => {
        if (params.data?.isDetailRow) return null;
        return (
          <div>
            <div>{params.value}</div>
            <div style={{ color: '#64748b' }}>{params.data.displayTime}</div>
          </div>
        );
      },
    },
    {
      headerName: 'Time Left',
      field: 'timeLeft',
      width: 120,
      comparator: (_valueA: any, _valueB: any, nodeA: any, nodeB: any) => {
        const a = nodeA.data?.timeLeftMinutes ?? Infinity;
        const b = nodeB.data?.timeLeftMinutes ?? Infinity;
        return a - b;
      },
      cellStyle: (params: any) => {
        if (params.data?.isDetailRow) return { display: 'none' };
        const timeLeft = params.value;
        let color = '#22d3ee'; // cyan-400
        if (timeLeft === 'Passed') color = '#64748b'; // slate-500
        else if (timeLeft === '--') color = '#64748b';
        else if (timeLeft.includes('d')) color = '#94a3b8'; // slate-400
        else if (parseInt(timeLeft) < 2) color = '#f87171'; // red-400
        else if (parseInt(timeLeft) < 6) color = '#fbbf24'; // amber-400
        return { fontFamily: 'monospace', color, fontWeight: parseInt(timeLeft) < 2 ? 'bold' : 'normal' };
      },
    },
    {
      headerName: 'Event',
      field: 'event',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => {
        if (params.data?.isDetailRow) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>{getCurrencyFlag(params.data.currency)}</span>
            <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{params.value}</span>
          </div>
        );
      },
    },
    {
      headerName: 'Impact',
      field: 'impact',
      width: 100,
      cellStyle: { textAlign: 'center' },
      cellRenderer: (params: any) => {
        if (params.data?.isDetailRow) return null;
        const impactColor = getImpactColor(params.value);
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: impactColor,
                boxShadow: `0 0 6px ${impactColor}`,
              }}
              title={params.value}
            />
          </div>
        );
      },
    },
  ], [currencies, expandedRowId, handleRowToggle, renderDetailRow, selectedTimezone.offset]);

  // Prepare dropdown options
  const impactOptions: DropdownOption[] = useMemo(() => [
    {
      value: 'high',
      label: 'High',
      count: impactCounts.high,
      icon: <span className="w-2 h-2 rounded-full bg-red-500" />
    },
    {
      value: 'medium',
      label: 'Medium',
      count: impactCounts.medium,
      icon: <span className="w-2 h-2 rounded-full bg-amber-500" />
    },
    {
      value: 'low',
      label: 'Low',
      count: impactCounts.low,
      icon: <span className="w-2 h-2 rounded-full bg-emerald-500" />
    },
  ], [impactCounts]);

  const currencyOptions: DropdownOption[] = useMemo(() => {
    return currencies.map(currency => ({
      value: currency,
      label: currency,
      icon: <span className="text-sm">{getCurrencyFlag(currency)}</span>,
    }));
  }, [currencies]);

  const eventTypeOptions: DropdownOption[] = useMemo(() => {
    // Count events for each type (single pass through data)
    const typeCounts: Record<string, number> = {};

    // Initialize counts
    eventTypes.forEach(type => {
      typeCounts[type] = 0;
    });

    // Single pass through data to count all types
    data.forEach(ev => {
      if (ev.event) {
        const categories = categorizeEvent(ev.event);
        categories.forEach(cat => {
          if (typeCounts[cat] !== undefined) {
            typeCounts[cat]++;
          }
        });
      }
    });

    return eventTypes.map(type => ({
      value: type,
      label: type,
      count: typeCounts[type],
    }));
  }, [eventTypes, data]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden glass-soft rounded-2xl p-3 shadow-2xl shadow-black/35 text-[11px] font-normal">
      {/* Header with Filters */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 mb-2 flex-shrink-0 text-[11px] font-normal">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-100">Economic Calendar</h2>
          {fullscreenButton}
          <span className="text-xs text-slate-300/90">
            ({filteredData.length} events)
          </span>
          {lastUpdatedStamp && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span aria-hidden="true">•</span>
              Updated {lastUpdatedStamp}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end text-[10px] sm:text-[11px]">
          {/* Timezone Indicator */}
          <div className="px-3 py-1.5 text-xs font-semibold rounded-full bg-yellow-500/20 border border-yellow-400/40 text-yellow-100 shadow-inner shadow-yellow-500/30">
            Times: {timezoneLabel}
          </div>

          <button
            onClick={refetch}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/40 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-slate-100 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-inner shadow-black/25"
            title="Refresh feed"
            aria-label="Refresh feed"
            disabled={loading}
          >
            <IconRefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Filter Pills */}
      <div className="text-[8px] font-normal">
        <DateFilterPills
          selected={dateRangeFilter}
          onChange={setDateRangeFilter}
          showDatePicker={false}
        />
      </div>

      {/* Multi-Select Filter Dropdowns - Desktop Only */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 mb-3 text-[8px] font-normal">
        <MultiSelectDropdown
          label="Importance"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          options={impactOptions}
          selectedValues={selectedImpacts}
          onChange={setSelectedImpacts}
          placeholder="All"
        />

        <MultiSelectDropdown
          label="Currency"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          options={currencyOptions}
          selectedValues={selectedCurrencies}
          onChange={setSelectedCurrencies}
          placeholder="All"
          searchable
        />

        <MultiSelectDropdown
          label="Event Type"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          options={eventTypeOptions}
          selectedValues={selectedEventTypes}
          onChange={setSelectedEventTypes}
          placeholder="All"
          searchable
        />
      </div>

      {/* Mobile Filter Button */}
      <div className="sm:hidden mb-3 text-[8px] font-normal">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="w-full px-4 py-2.5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 text-xs text-cyan-100 shadow-lg shadow-cyan-500/20 flex items-center justify-between active:scale-95 transition-transform"
        >
          <span className="font-medium">
            {(() => {
              const totalFilters = selectedImpacts.length + selectedCurrencies.length + selectedEventTypes.length;
              if (totalFilters === 0) return 'All Filters';
              return `Filters (${totalFilters})`;
            })()}
          </span>
          <span className="text-cyan-400">Edit</span>
        </button>
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

      {/* Mobile Card View (visible on mobile) */}
      <div className="md:hidden flex-1 overflow-auto space-y-2 pb-4">
        {Object.entries(eventsByDate)
          .flatMap(([date, events]) =>
            events.map((event, idx) => ({ date, event, idx }))
          )
          .sort(sortEvents)
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
                className="glass-soft rounded-2xl p-4 shadow-xl shadow-black/35 hover:border-slate-500/50 transition-all"
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

      {/* Desktop AG Grid View (hidden on mobile) */}
      <div
        className="hidden md:flex-1 md:block min-h-0 ag-theme-alpine-dark overflow-hidden"
        style={{ height: '100%' }}
      >
        <AgGridReact
          rowData={gridRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme="legacy"
          domLayout="normal"
          headerHeight={40}
          animateRows={false}
          suppressCellFocus={true}
          suppressAnimationFrame={true}
      rowStyle={defaultRowStyle}
      getRowStyle={getRowStyle}
      getRowHeight={getRowHeight}
      onRowClicked={handleGridRowClick}
      multiSortKey="ctrl"
      onGridReady={(params) => {
        setGridApi(params.api);
      }}
      isFullWidthRow={(params) => !!params?.rowNode?.data?.isDetailRow}
      fullWidthCellRenderer={(params) => renderDetailRow(params.data)}
      getRowId={getRowId}
    />
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
                isSelected={selectedImpacts.includes('high')}
                onClick={() => toggleImpact('high')}
                variant="impact"
                size="md"
                count={impactCounts.high}
              />
              <FilterChip
                label="Medium"
                value="medium"
                isSelected={selectedImpacts.includes('medium')}
                onClick={() => toggleImpact('medium')}
                variant="impact"
                size="md"
                count={impactCounts.medium}
              />
              <FilterChip
                label="Low"
                value="low"
                isSelected={selectedImpacts.includes('low')}
                onClick={() => toggleImpact('low')}
                variant="impact"
                size="md"
                count={impactCounts.low}
              />
            </FilterChipGroup>
          </div>

          {/* Event Type Filter */}
          <div>
            <div className="text-xs uppercase text-slate-400 tracking-wide font-semibold mb-2">Event Type (Multi-Select)</div>
            <FilterChipGroup columns={2} gap={2}>
              {eventTypes.map(type => (
                <FilterChip
                  key={type}
                  label={type}
                  value={type}
                  isSelected={selectedEventTypes.includes(type)}
                  onClick={() => toggleEventType(type)}
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
