import React, { useState, useMemo } from 'react';
import { useFXVolatility } from '../hooks/useFXVolatility';
import { FXVolatility } from '../types';

type SortField = 'instrument' | 'hv20' | 'atr' | 'sma30' | 'bbWidth';
type SortDirection = 'asc' | 'desc';

function getVolatilityColor(value: number): string {
  if (value < 0.005) return 'text-green-400';
  if (value < 0.015) return 'text-yellow-400';
  return 'text-red-400';
}

function getVolatilityBg(value: number): string {
  if (value < 0.005) return 'bg-green-900/30';
  if (value < 0.015) return 'bg-yellow-900/30';
  return 'bg-red-900/30';
}

export function VolatilityPanel() {
  const { volatility, loading, error } = useFXVolatility(null);
  const [sortField, setSortField] = useState<SortField>('instrument');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<('high' | 'medium' | 'low')[]>(['high', 'medium', 'low']);

  // Extract unique currencies from all instruments
  const availableCurrencies = useMemo(() => {
    if (!volatility || !Array.isArray(volatility)) return [];
    const currencySet = new Set<string>();
    volatility.forEach((item) => {
      const [base, quote] = item.instrument.split('_');
      currencySet.add(base);
      currencySet.add(quote);
    });
    return Array.from(currencySet).sort();
  }, [volatility]);

  const sortedData = useMemo(() => {
    if (!volatility || !Array.isArray(volatility)) return [];

    let data = [...volatility];

    // Apply currency filter
    if (selectedCurrencies.length > 0) {
      data = data.filter((item) => {
        const [base, quote] = item.instrument.split('_');
        return selectedCurrencies.includes(base) || selectedCurrencies.includes(quote);
      });
    }

    // Apply volatility level filter
    if (selectedLevels.length > 0 && selectedLevels.length < 3) {
      data = data.filter((item) => {
        const hv20 = parseFloat(item.volatility_20);
        if (selectedLevels.includes('low') && hv20 < 0.005) return true;
        if (selectedLevels.includes('medium') && hv20 >= 0.005 && hv20 < 0.015) return true;
        if (selectedLevels.includes('high') && hv20 >= 0.015) return true;
        return false;
      });
    }

    data.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'instrument':
          aValue = a.instrument;
          bValue = b.instrument;
          break;
        case 'hv20':
          aValue = parseFloat(a.volatility_20);
          bValue = parseFloat(b.volatility_20);
          break;
        case 'atr':
          aValue = parseFloat(a.atr);
          bValue = parseFloat(b.atr);
          break;
        case 'sma30':
          aValue = parseFloat(a.sma_30);
          bValue = parseFloat(b.sma_30);
          break;
        case 'bbWidth':
          aValue = parseFloat(a.bb_upper) - parseFloat(a.bb_lower);
          bValue = parseFloat(b.bb_upper) - parseFloat(b.bb_lower);
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return data;
  }, [volatility, sortField, sortDirection, selectedCurrencies, selectedLevels]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleCurrency = (currency: string) => {
    setSelectedCurrencies((prev) =>
      prev.includes(currency) ? prev.filter((c) => c !== currency) : [...prev, currency]
    );
  };

  const toggleLevel = (level: 'high' | 'medium' | 'low') => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-slate-600">⇅</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  if (loading) {
    return (
      <div className="glass-soft rounded-xl p-4 shadow-xl shadow-black/30 border border-slate-700/30">
        <div className="animate-pulse space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-700/30 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-soft rounded-xl p-4 shadow-xl shadow-black/30 border border-slate-700/30">
        <div className="text-red-400 text-sm">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="glass-soft rounded-xl p-4 shadow-xl shadow-black/30 border border-slate-700/30 space-y-3">
      {/* Filters */}
      <div className="space-y-2">
        {/* Currency Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Currency:</span>
          {availableCurrencies.map((currency) => (
            <button
              key={currency}
              onClick={() => toggleCurrency(currency)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                selectedCurrencies.includes(currency)
                  ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-100'
                  : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40 hover:border-slate-500/60'
              }`}
            >
              {currency}
            </button>
          ))}
          {selectedCurrencies.length > 0 && (
            <button
              onClick={() => setSelectedCurrencies([])}
              className="px-2 py-1 text-[10px] font-medium rounded bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30"
            >
              Clear
            </button>
          )}
        </div>

        {/* Volatility Level Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Level:</span>
          <button
            onClick={() => toggleLevel('low')}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${
              selectedLevels.includes('low')
                ? 'bg-green-500/30 border border-green-400/50 text-green-100'
                : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            Low
          </button>
          <button
            onClick={() => toggleLevel('medium')}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${
              selectedLevels.includes('medium')
                ? 'bg-yellow-500/30 border border-yellow-400/50 text-yellow-100'
                : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            Medium
          </button>
          <button
            onClick={() => toggleLevel('high')}
            className={`px-2 py-1 text-[10px] font-medium rounded transition-all flex items-center gap-1 ${
              selectedLevels.includes('high')
                ? 'bg-red-500/30 border border-red-400/50 text-red-100'
                : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            High
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/30">
              <th
                className="text-left py-2 px-3 text-slate-400 font-medium text-[10px] uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('instrument')}
              >
                <span className="flex items-center gap-2">
                  Instrument <SortIcon field="instrument" />
                </span>
              </th>
              <th
                className="text-right py-2 px-3 text-slate-400 font-medium text-[10px] uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('hv20')}
              >
                <span className="flex items-center justify-end gap-1">
                  HV-20 <SortIcon field="hv20" />
                </span>
              </th>
              <th
                className="text-right py-2 px-3 text-slate-400 font-medium text-[10px] uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('atr')}
              >
                <span className="flex items-center justify-end gap-1">
                  ATR <SortIcon field="atr" />
                </span>
              </th>
              <th
                className="text-right py-2 px-3 text-slate-400 font-medium text-[10px] uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('sma30')}
              >
                <span className="flex items-center justify-end gap-1">
                  SMA-30 <SortIcon field="sma30" />
                </span>
              </th>
              <th
                className="text-right py-2 px-3 text-slate-400 font-medium text-[10px] uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort('bbWidth')}
              >
                <span className="flex items-center justify-end gap-1">
                  BB Width <SortIcon field="bbWidth" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item: FXVolatility) => {
              const hv20 = parseFloat(item.volatility_20);
              const atr = parseFloat(item.atr);
              const bbWidth = parseFloat(item.bb_upper) - parseFloat(item.bb_lower);

              return (
                <tr
                  key={item.instrument}
                  className={`border-b border-slate-800/30 hover:bg-slate-700/20 transition-colors ${getVolatilityBg(
                    hv20
                  )}`}
                >
                  <td className="py-2 px-3 font-medium text-slate-200 text-xs">
                    {item.instrument.replace('_', '/')}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono text-xs ${getVolatilityColor(hv20)}`}>
                    {hv20.toFixed(5)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono text-xs ${getVolatilityColor(atr)}`}>
                    {atr.toFixed(5)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xs text-slate-400">
                    {parseFloat(item.sma_30).toFixed(5)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xs text-slate-400">
                    {bbWidth.toFixed(5)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
