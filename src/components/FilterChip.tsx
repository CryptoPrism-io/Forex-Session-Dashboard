import React, { ReactNode } from 'react';

export type FilterChipVariant = 'currency' | 'impact' | 'range';
export type FilterChipSize = 'xs' | 'sm' | 'md' | 'lg';

interface FilterChipProps {
  label: string;
  value: string;
  isSelected: boolean;
  onClick: () => void;
  variant?: FilterChipVariant;
  count?: number;
  icon?: ReactNode;
  size?: FilterChipSize;
  disabled?: boolean;
  className?: string;
}

/**
 * Unified Filter Chip Component
 *
 * A modern, accessible chip component for filter selections.
 * Replaces traditional checkbox-based filters with a more intuitive
 * tap-to-toggle interaction pattern.
 *
 * Features:
 * - Single tap to toggle selection
 * - Visual feedback with scale animations
 * - Checkmark indicator when selected
 * - Support for counts (e.g., "High (11)")
 * - Optional icon/flag support
 * - Fully keyboard accessible
 *
 * @example
 * ```tsx
 * <FilterChip
 *   label="USD"
 *   value="usd"
 *   isSelected={true}
 *   onClick={() => toggleCurrency('usd')}
 *   variant="currency"
 * />
 * ```
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  isSelected,
  onClick,
  variant = 'currency',
  count,
  icon,
  size = 'md',
  disabled = false,
  className = '',
}) => {
  // Size-specific classes
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px]',
    sm: 'px-2 py-1 text-[10px]',
    md: 'px-2.5 py-1.5 text-[10px]',
    lg: 'px-3 py-2 text-xs',
  };

  // Variant-specific colors
  const variantColors = {
    currency: {
      selected: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-100 shadow-lg shadow-cyan-500/30',
      unselected: 'bg-slate-800/20 border-slate-600/40 text-slate-300 hover:border-slate-500',
    },
    impact: {
      selected: 'bg-amber-500/20 border-amber-400/60 text-amber-100 shadow-lg shadow-amber-500/30',
      unselected: 'bg-slate-800/20 border-slate-600/40 text-slate-300 hover:border-slate-500',
    },
    range: {
      selected: 'bg-blue-500/20 border-blue-400/60 text-blue-100 shadow-lg shadow-blue-500/30',
      unselected: 'bg-slate-800/20 border-slate-600/40 text-slate-300 hover:border-slate-500',
    },
  };

  const colorClass = isSelected
    ? variantColors[variant].selected
    : variantColors[variant].unselected;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative rounded-lg border font-semibold
        transition-all duration-200 ease-out
        active:scale-95 hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
        ${sizeClasses[size]}
        ${colorClass}
        ${className}
      `}
      aria-label={`${label} filter chip, ${isSelected ? 'selected' : 'not selected'}`}
      aria-pressed={isSelected}
      role="button"
      type="button"
    >
      {/* Icon (optional, e.g., currency flag) */}
      {icon && (
        <span className="inline-flex items-center mr-1.5">
          {icon}
        </span>
      )}

      {/* Label */}
      <span className="inline-flex items-center gap-1">
        {label}

        {/* Count badge (for impact chips) */}
        {count !== undefined && (
          <span className="opacity-70 font-normal">({count})</span>
        )}
      </span>

      {/* Checkmark indicator when selected */}
      {isSelected && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full flex items-center justify-center shadow-sm">
          <svg
            className="w-2 h-2 text-slate-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      )}
    </button>
  );
};

/**
 * Chip Group Container
 *
 * Wrapper for organizing multiple chips in a grid layout
 */
interface FilterChipGroupProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  gap?: 1 | 2 | 3;
  className?: string;
}

export const FilterChipGroup: React.FC<FilterChipGroupProps> = ({
  children,
  columns = 3,
  gap = 2,
  className = '',
}) => {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  const gapClasses = {
    1: 'gap-1',
    2: 'gap-1.5',
    3: 'gap-2',
  };

  return (
    <div className={`grid ${colClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};
