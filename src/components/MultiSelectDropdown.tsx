import React, { ReactNode, useState, useMemo } from 'react';
import { PopoverMenu } from './Menu';

export interface DropdownOption {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface MultiSelectDropdownProps {
  /** Dropdown label */
  label: string;
  /** Optional icon before label */
  icon?: ReactNode;
  /** Available options */
  options: DropdownOption[];
  /** Currently selected values */
  selectedValues: string[];
  /** Change handler */
  onChange: (values: string[]) => void;
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Enable search input */
  searchable?: boolean;
  /** Max height of options list */
  maxHeight?: string;
}

/**
 * Multi-Select Dropdown Component
 *
 * Features:
 * - Checkbox-based multi-selection
 * - "Select All" / "Deselect All" buttons
 * - Optional search input
 * - Shows selected count in trigger
 * - Accessible keyboard navigation via React Aria
 * - Glass-morphism styling
 */
export function MultiSelectDropdown({
  label,
  icon,
  options,
  selectedValues,
  onChange,
  placeholder = 'All',
  searchable = false,
  maxHeight = '400px',
}: MultiSelectDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery, searchable]);

  // Toggle individual option
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  // Select all options
  const handleSelectAll = () => {
    onChange(options.map(o => o.value));
  };

  // Deselect all options
  const handleDeselectAll = () => {
    onChange([]);
  };

  // Display text in trigger button
  const displayText = selectedValues.length === 0
    ? placeholder
    : `${selectedValues.length} selected`;

  // Check if all options are selected
  const allSelected = selectedValues.length === options.length;
  const noneSelected = selectedValues.length === 0;

  return (
    <PopoverMenu
      trigger={
        <div className="flex items-center gap-1">
          {icon && <span className="w-3 h-3 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
          <span className="text-[10px] font-medium">{label}</span>
          {!noneSelected && (
            <span className="px-1 py-px text-[9px] font-semibold rounded-full bg-cyan-500/30 text-cyan-100 border border-cyan-400/40">
              {selectedValues.length}
            </span>
          )}
          {/* Chevron icon */}
          <svg
            className="w-2.5 h-2.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      }
      triggerClassName="px-2 py-1 rounded-full border border-slate-600/50 bg-slate-800/40 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-slate-100 transition-all duration-200 shadow-inner shadow-black/20"
      menuClassName="min-w-[10rem]"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <div className="p-1.5" style={{ maxHeight }}>
        {/* Header with Select All/None */}
        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-700/30">
          <span className="text-[9px] text-slate-400 font-medium">
            {selectedValues.length}/{options.length}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={handleSelectAll}
              disabled={allSelected}
              className="text-[9px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            >
              All
            </button>
            <span className="text-slate-600 text-[9px]">|</span>
            <button
              onClick={handleDeselectAll}
              disabled={noneSelected}
              className="text-[9px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
            >
              None
            </button>
          </div>
        </div>

        {/* Search Input */}
        {searchable && (
          <div className="mb-1.5">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-1.5 py-1 text-[10px] rounded bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* Options List */}
        <div
          className="space-y-px overflow-y-auto"
          style={{ maxHeight: searchable ? '160px' : '180px' }}
        >
          {filteredOptions.length === 0 ? (
            <div className="text-center py-3 text-[9px] text-slate-500">
              No options found
            </div>
          ) : (
            filteredOptions.map(option => (
              <label
                key={option.value}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-slate-800/50 cursor-pointer transition-colors group"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="w-3 h-3 rounded border-slate-600 text-cyan-500 focus:ring-cyan-500/30 focus:ring-offset-0 cursor-pointer"
                />

                {/* Icon */}
                {option.icon && (
                  <span className="flex-shrink-0 text-[10px]">{option.icon}</span>
                )}

                {/* Label */}
                <span className="flex-1 text-[10px] text-slate-200 group-hover:text-slate-100 transition-colors">
                  {option.label}
                </span>

                {/* Count Badge */}
                {option.count !== undefined && (
                  <span className="text-[9px] text-slate-500 font-mono">
                    ({option.count})
                  </span>
                )}
              </label>
            ))
          )}
        </div>

        {/* Footer message if search has no results */}
        {searchable && searchQuery && filteredOptions.length === 0 && (
          <div className="mt-1 text-[9px] text-slate-500 text-center">
            Try a different search term
          </div>
        )}
      </div>
    </PopoverMenu>
  );
}
