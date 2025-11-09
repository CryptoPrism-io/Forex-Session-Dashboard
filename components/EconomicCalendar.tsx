import React, { useState, useMemo, useCallback } from 'react';
import { useEconomicCalendar } from '../hooks/useEconomicCalendar';
import { Timezone } from '../types';
import { IconEyeOff, IconEye, IconRefreshCcw } from './icons';

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

const convertUTCToTimezone = (utcTimeString: string | undefined, offsetHours: number): string => {
  if (!utcTimeString) return '';

  const [hStr = '0', mStr = '0'] = utcTimeString.split(':');
  const baseMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
  const offsetMinutes = Math.round(offsetHours * 60);
  let localMinutes = (baseMinutes + offsetMinutes) % (24 * 60);
  if (localMinutes < 0) localMinutes += 24 * 60;

  const hh = String(Math.floor(localMinutes / 60)).padStart(2, '0');
  const mm = String(localMinutes % 60).padStart(2, '0');
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
  const [selectedImpact, setSelectedImpact] = useState<string | undefined>(undefined);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('today');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('daily');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

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
    selectedImpact
  );

  // Client-side filtering to ensure UI filters even if API returns a superset
  const filteredData = useMemo(() => {
    return data.filter(ev => {
      const byCcy = selectedCurrencies.length === 0 || selectedCurrencies.includes(ev.currency);
      const byImpact = !selectedImpact || (ev.impact ?? '').toLowerCase() === selectedImpact.toLowerCase();
      return byCcy && byImpact;
    });
  }, [data, selectedCurrencies, selectedImpact]);

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
    const impactLabel = selectedImpact ? `${selectedImpact.charAt(0).toUpperCase()}${selectedImpact.slice(1)} Impact` : 'All Impact Levels';
    const currencyLabel = selectedCurrencies.length === 0 ? 'All Currencies' : selectedCurrencies.join(', ');
    const rangeLabel = DATE_RANGE_LABELS[dateRangeFilter];
    const categoryLabel = CATEGORY_LABELS[activeCategory];
    return `${categoryLabel} · ${rangeLabel} · ${currencyLabel} · ${impactLabel}`;
  }, [activeCategory, dateRangeFilter, selectedCurrencies, selectedImpact]);

  const handleResetFilters = useCallback(() => {
    setSelectedCurrencies([]);
    setSelectedImpact(undefined);
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
            onClick={() => setFiltersCollapsed(prev => !prev)}
            className={`w-8 h-8 flex items-center justify-center rounded-full border text-slate-200 transition-all ${
              filtersCollapsed
                ? 'border-cyan-400/40 bg-cyan-500/10'
                : 'border-slate-700/50 bg-slate-800/40 hover:border-cyan-400/40 hover:bg-cyan-500/10'
            }`}
            title={filtersCollapsed ? 'Show filters' : 'Hide filters'}
            aria-label={filtersCollapsed ? 'Show filters' : 'Hide filters'}
          >
            <IconEyeOff className="w-4 h-4" />
          </button>

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

      {/* Filter summary always visible */}
      <div className="mb-3 px-3 py-2 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 text-[11px] text-cyan-100 shadow-lg shadow-cyan-500/20 flex items-center justify-between">
        <span className="font-medium tracking-wide">{filterSummary}</span>
        <button
          onClick={() => setFiltersCollapsed(prev => !prev)}
          className={`ml-3 px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
            filtersCollapsed
              ? 'bg-cyan-500/20 border border-cyan-300/50 text-cyan-50 shadow-[0_5px_20px_rgba(14,165,233,0.35)] hover:bg-cyan-500/30 hover:border-cyan-200 hover:text-white'
              : 'bg-slate-800/30 border border-slate-700/50 text-slate-200 shadow-[0_5px_15px_rgba(15,23,42,0.8)] hover:bg-slate-900/60 hover:border-cyan-400/60 hover:text-cyan-100'
          }`}
          aria-label={filtersCollapsed ? 'Show filters' : 'Hide filters'}
        >
          {filtersCollapsed ? (
            <>
              <IconEye className="w-3.5 h-3.5" />
              Show Filters
            </>
          ) : (
            <>
              <IconEyeOff className="w-3.5 h-3.5" />
              Hide Filters
            </>
          )}
        </button>
      </div>

      {!filtersCollapsed && (
        <div className="mb-2 rounded-[28px] border border-slate-800/60 bg-slate-950/40 backdrop-blur-2xl p-3 shadow-inner shadow-black/30">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
          {/* Currency Filter (Left) */}
          <div className="lg:w-44 xl:w-56 rounded-2xl border border-slate-800/50 bg-slate-900/35 p-2 backdrop-blur-md shadow-inner shadow-black/20">
            <div className="text-[9px] uppercase text-slate-500 mb-1.5 tracking-wide">Currencies</div>
            <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-1">
              {currencyTiles.map((option) => {
                if (option === 'ALL') {
                  const isSelected = selectedCurrencies.length === 0;
                  return (
                    <label
                      key="all-option"
                      className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] cursor-pointer border ${
                        isSelected
                          ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200'
                          : 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="text-cyan-500 focus:ring-cyan-400 scale-90"
                        checked={isSelected}
                        onChange={() => setSelectedCurrencies([])}
                      />
                      <span className="flex items-center justify-center">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold tracking-wide bg-cyan-500/25 text-cyan-50 border border-cyan-400/50">
                          ALL
                        </span>
                      </span>
                    </label>
                  );
                }

                const isSelected = selectedCurrencies.includes(option);
                return (
                  <label
                    key={option}
                    className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] cursor-pointer border ${
                      isSelected
                        ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200'
                        : 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="text-cyan-500 focus:ring-cyan-400 scale-90"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedCurrencies(prev =>
                          prev.includes(option)
                            ? prev.filter(c => c !== option)
                            : [...prev, option]
                        )
                      }
                    />
                    <span className="flex items-center justify-center">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold tracking-wide ${getCurrencyTintClass(option)}`}
                        title={option}
                      >
                        {option.slice(0, 2)}
                      </span>
                    </span>
                  </label>
                );
              })}
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
                  <div className="grid grid-cols-3 gap-1">
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
            <div className="flex items-center justify-between">
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

            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-2 space-y-1.5">
              {impactOptions.map((option) => {
                const value = option === 'all' ? undefined : option;
                const isSelected = value ? selectedImpact?.toLowerCase() === value : !selectedImpact;
                const label =
                  option === 'all'
                    ? 'All'
                    : `${option.charAt(0).toUpperCase() + option.slice(1)}`;
                const style = impactVisualStyles[option as keyof typeof impactVisualStyles] || impactVisualStyles.low;
                return (
                  <label
                    key={option}
                    className={`flex items-center justify-between px-2 py-1 rounded-lg text-[10px] cursor-pointer border ${
                      isSelected ? style.selected : style.unselected
                    }`}
                  >
                    <span className="font-medium">{label}</span>
                    <input
                      type="radio"
                      name="impact-filter"
                      className="text-amber-400 focus:ring-amber-400 scale-90"
                      checked={isSelected}
                      onChange={() => setSelectedImpact(value)}
                    />
                  </label>
                );
              })}
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

      {/* Events Grouped by Date */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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

                const convertedTime = convertUTCToTimezone(event.time_utc, selectedTimezone.offset);
                const rawTime = event.time || event.time_utc || '';
                const isTentative = rawTime.toLowerCase() === 'tentative';
                const displayTime = convertedTime || rawTime;
                return (
                  <div
                    key={event.id}
                    className="rounded-lg p-2 transition-colors border border-slate-800/40 bg-slate-800/30 hover:bg-slate-800/50"
                  >
                    <div className="flex items-start gap-2">
                      {/* Time - Converted to User's Timezone */}
                        <div className="min-w-12 text-xs font-mono text-slate-400 flex flex-col gap-0.5">
                          <span>{displayTime}</span>
                          {isTentative && (
                            <span className="text-[9px] font-mono text-amber-300">
                              Tentative
                            </span>
                          )}
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
