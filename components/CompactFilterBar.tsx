import React from 'react';

type DateRangeFilter = 'yesterday' | 'today' | 'tomorrow' | 'lastWeek' | 'thisWeek' | 'nextWeek' | 'lastMonth' | 'thisMonth' | 'nextMonth';
type FilterCategory = 'daily' | 'weekly' | 'monthly';
type ImpactLevel = 'high' | 'medium' | 'low';

interface CompactFilterBarProps {
  // Date navigation
  currentRange: DateRangeFilter;
  currentCategory: FilterCategory;
  onPrevious: () => void;
  onNext: () => void;
  rangeLabel: string;

  // Impact multi-select
  selectedImpacts: Set<ImpactLevel>;
  onToggleImpact: (impact: ImpactLevel) => void;
  impactCounts?: {
    high: number;
    medium: number;
    low: number;
  };

  // Expand/collapse currency filters
  isExpanded: boolean;
  onToggleExpand: () => void;
}

/**
 * Compact Filter Bar Component
 *
 * A streamlined filter control bar with:
 * - Date navigation arrows (left/right based on view type)
 * - Impact level multi-select buttons (keyboard-style pressed/unpressed states)
 * - Collapsible currency filter section
 *
 * @example
 * ```tsx
 * <CompactFilterBar
 *   currentRange="today"
 *   currentCategory="daily"
 *   onPrevious={() => setDateRange('yesterday')}
 *   onNext={() => setDateRange('tomorrow')}
 *   rangeLabel="Today"
 *   selectedImpacts={new Set(['high'])}
 *   onToggleImpact={(impact) => toggleImpact(impact)}
 *   isExpanded={false}
 *   onToggleExpand={() => setExpanded(!expanded)}
 * />
 * ```
 */
export const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  currentRange,
  currentCategory,
  onPrevious,
  onNext,
  rangeLabel,
  selectedImpacts,
  onToggleImpact,
  impactCounts,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className="mb-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 backdrop-blur-2xl p-3 shadow-lg">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Date Navigation (Left) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600 active:scale-95 transition-all"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="px-4 py-2 min-w-[140px] text-center rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-100 font-semibold text-sm">
            {rangeLabel}
          </div>

          <button
            onClick={onNext}
            className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600 active:scale-95 transition-all"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Impact Multi-Select Buttons (Right) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Impact:</span>

          {/* High Impact Button */}
          <ImpactButton
            impact="high"
            label="High"
            isSelected={selectedImpacts.has('high')}
            onClick={() => onToggleImpact('high')}
            count={impactCounts?.high}
            color={{
              selected: 'bg-red-600 border-red-700 text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(239,68,68,0.5)]',
              unselected: 'bg-gradient-to-b from-red-500/30 to-red-600/20 border-red-600/50 text-red-200 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:from-red-500/40 hover:to-red-600/30'
            }}
          />

          {/* Medium Impact Button */}
          <ImpactButton
            impact="medium"
            label="Med"
            isSelected={selectedImpacts.has('medium')}
            onClick={() => onToggleImpact('medium')}
            count={impactCounts?.medium}
            color={{
              selected: 'bg-amber-600 border-amber-700 text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(245,158,11,0.5)]',
              unselected: 'bg-gradient-to-b from-amber-500/30 to-amber-600/20 border-amber-600/50 text-amber-200 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:from-amber-500/40 hover:to-amber-600/30'
            }}
          />

          {/* Low Impact Button */}
          <ImpactButton
            impact="low"
            label="Low"
            isSelected={selectedImpacts.has('low')}
            onClick={() => onToggleImpact('low')}
            count={impactCounts?.low}
            color={{
              selected: 'bg-emerald-600 border-emerald-700 text-white shadow-[inset_0_2px_8px_rgba(0,0,0,0.4),0_1px_2px_rgba(16,185,129,0.5)]',
              unselected: 'bg-gradient-to-b from-emerald-500/30 to-emerald-600/20 border-emerald-600/50 text-emerald-200 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:from-emerald-500/40 hover:to-emerald-600/30'
            }}
          />

          {/* Collapse/Expand Currency Filters */}
          <button
            onClick={onToggleExpand}
            className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600 active:scale-95 transition-all ml-2"
            aria-label={isExpanded ? 'Hide currency filters' : 'Show currency filters'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Impact Button Component
 *
 * Keyboard-style button with pressed/unpressed states
 */
interface ImpactButtonProps {
  impact: ImpactLevel;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  count?: number;
  color: {
    selected: string;
    unselected: string;
  };
}

const ImpactButton: React.FC<ImpactButtonProps> = ({
  impact,
  label,
  isSelected,
  onClick,
  count,
  color,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3 py-2 rounded-lg border font-semibold text-xs
        transition-all duration-150
        ${isSelected ? color.selected : color.unselected}
        ${isSelected ? 'translate-y-[2px]' : 'hover:-translate-y-[1px]'}
      `}
      aria-label={`${label} impact filter, ${isSelected ? 'selected' : 'not selected'}`}
      aria-pressed={isSelected}
      role="button"
      type="button"
    >
      <span className="flex items-center gap-1.5">
        {label}
        {count !== undefined && (
          <span className={`
            px-1.5 py-0.5 rounded-full text-[10px] font-bold
            ${isSelected
              ? 'bg-white/20 text-white'
              : 'bg-black/20 text-current'
            }
          `}>
            {count}
          </span>
        )}
      </span>
    </button>
  );
};
