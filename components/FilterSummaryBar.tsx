import React from 'react';
import { FilterChip } from './FilterChip';

interface FilterSummaryBarProps {
  /** Selected currency codes */
  selectedCurrencies: string[];
  /** Selected impact levels */
  selectedImpacts: string[];
  /** Current date range label (e.g., "Today", "This Week", "Custom") */
  dateRangeLabel: string;
  /** Total number of events matching current filters */
  eventCount?: number;
  /** Callback when a currency chip is clicked to deselect */
  onRemoveCurrency: (currency: string) => void;
  /** Callback when an impact chip is clicked to deselect */
  onRemoveImpact: (impact: string) => void;
  /** Callback when Clear All is clicked */
  onClearAll: () => void;
  /** Whether to show the summary bar (hide when no filters active) */
  show?: boolean;
}

/**
 * Filter Summary Bar Component
 *
 * A sticky header that displays active filters in a compact chip layout.
 * Provides quick visibility into what filters are applied and allows
 * one-tap removal of individual filters or clearing all at once.
 *
 * Features:
 * - Compact horizontal chip layout
 * - Shows currency, impact, and date range selections
 * - Tap chip to remove that filter
 * - "Clear All" button to reset all filters
 * - Auto-hides when no filters active
 * - Responsive: scrollable on mobile, full view on desktop
 * - Event count badge
 *
 * @example
 * ```tsx
 * <FilterSummaryBar
 *   selectedCurrencies={['USD', 'EUR']}
 *   selectedImpacts={['High']}
 *   dateRangeLabel="Today"
 *   eventCount={12}
 *   onRemoveCurrency={(curr) => toggleCurrency(curr)}
 *   onRemoveImpact={(imp) => toggleImpact(imp)}
 *   onClearAll={() => resetAllFilters()}
 * />
 * ```
 */
export const FilterSummaryBar: React.FC<FilterSummaryBarProps> = ({
  selectedCurrencies,
  selectedImpacts,
  dateRangeLabel,
  eventCount,
  onRemoveCurrency,
  onRemoveImpact,
  onClearAll,
  show = true,
}) => {
  const hasActiveFilters =
    selectedCurrencies.length > 0 ||
    selectedImpacts.length > 0 ||
    dateRangeLabel !== 'All Time';

  // Don't render if no filters active or explicitly hidden
  if (!show || !hasActiveFilters) {
    return null;
  }

  return (
    <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        {/* Header Row: Title + Event Count + Clear All */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-300">
              Active Filters
            </h3>
            {eventCount !== undefined && (
              <span className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                {eventCount} {eventCount === 1 ? 'event' : 'events'}
              </span>
            )}
          </div>

          <button
            onClick={onClearAll}
            className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-lg border border-slate-600/60 bg-slate-800/40 text-slate-300 hover:bg-slate-800/60 hover:border-slate-500 transition-all active:scale-95"
          >
            Clear All
          </button>
        </div>

        {/* Filter Chips Row (scrollable on mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {/* Date Range Label */}
          {dateRangeLabel !== 'All Time' && (
            <div className="shrink-0 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-200">
              📅 {dateRangeLabel}
            </div>
          )}

          {/* Currency Chips */}
          {selectedCurrencies.map((currency) => (
            <div key={currency} className="shrink-0">
              <FilterChip
                label={currency}
                value={currency}
                isSelected={true}
                onClick={() => onRemoveCurrency(currency)}
                variant="currency"
                size="sm"
              />
            </div>
          ))}

          {/* Impact Chips */}
          {selectedImpacts.map((impact) => (
            <div key={impact} className="shrink-0">
              <FilterChip
                label={impact}
                value={impact}
                isSelected={true}
                onClick={() => onRemoveImpact(impact)}
                variant="impact"
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Helper: Get filter counts for display
 *
 * @example
 * const counts = getFilterCounts(events, selectedCurrencies, selectedImpacts);
 * // { total: 42, byCurrency: { USD: 15, EUR: 12 }, byImpact: { High: 8 } }
 */
export const getFilterCounts = (
  events: any[],
  selectedCurrencies: string[],
  selectedImpacts: string[]
) => {
  const byCurrency: Record<string, number> = {};
  const byImpact: Record<string, number> = {};

  events.forEach((event) => {
    // Count by currency
    if (event.currency && selectedCurrencies.includes(event.currency)) {
      byCurrency[event.currency] = (byCurrency[event.currency] || 0) + 1;
    }

    // Count by impact
    if (event.impact && selectedImpacts.includes(event.impact)) {
      byImpact[event.impact] = (byImpact[event.impact] || 0) + 1;
    }
  });

  return {
    total: events.length,
    byCurrency,
    byImpact,
  };
};
