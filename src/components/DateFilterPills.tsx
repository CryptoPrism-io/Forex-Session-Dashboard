import React from 'react';

export type DateRangeFilter = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek';

interface DateFilterPillsProps {
  /** Currently selected range */
  selected: DateRangeFilter;
  /** Change handler */
  onChange: (range: DateRangeFilter) => void;
  /** Show date picker button */
  showDatePicker?: boolean;
}

const DATE_LABELS: Record<DateRangeFilter, string> = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  nextWeek: 'Next Week',
};

/**
 * Date Filter Pills Component
 *
 * Simple pill-style buttons for quick date range selection.
 * Displays: Today | Tomorrow | This Week | Next Week
 *
 * Features:
 * - Clean pill button design
 * - Active state highlighting (emerald green)
 * - Optional date picker button
 * - Responsive: wraps on small screens
 */
export function DateFilterPills({
  selected,
  onChange,
  showDatePicker = false,
}: DateFilterPillsProps) {
  const ranges: DateRangeFilter[] = ['today', 'tomorrow', 'thisWeek', 'nextWeek'];

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {ranges.map(range => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all shadow-inner shadow-black/20 border ${
            selected === range
              ? 'bg-emerald-500/80 text-emerald-50 border-emerald-300/70'
              : 'bg-slate-900/60 text-slate-100 border-slate-700/60 hover:border-emerald-400/50 hover:text-emerald-100'
          }`}
        >
          {DATE_LABELS[range]}
        </button>
      ))}

      {showDatePicker && (
        <button
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-slate-700/60 bg-slate-900/60 text-slate-100 hover:border-cyan-400/50 hover:text-cyan-100 transition-all shadow-inner shadow-black/20"
          title="Select custom date range (coming soon)"
        >
          <span className="mr-1">📅</span>
          Select Date
        </button>
      )}
    </div>
  );
}
