import React, { useMemo, useState } from 'react';
import { useFXPrices } from '../hooks/useFXPrices';
import { useFXSparklines } from '../hooks/useFXSparklines';
import { Sparkline } from './Sparkline';
import { FXPrice } from '../types';

// Major pairs to show by default
const MAJOR_PAIRS = [
  'EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF',
  'AUD_USD', 'USD_CAD', 'NZD_USD'
];

const CROSS_PAIRS = [
  'EUR_GBP', 'EUR_JPY', 'GBP_JPY', 'EUR_CHF',
  'AUD_JPY', 'CAD_JPY', 'CHF_JPY'
];

const METALS = ['XAU_USD', 'XAG_USD'];

type FilterType = 'all' | 'majors' | 'crosses' | 'metals';

interface PriceCardProps {
  price: FXPrice;
  sparklineData?: number[];
  compact?: boolean;
}

function formatInstrument(instrument: string): string {
  return instrument.replace('_', '/');
}

function formatPrice(price: string, instrument: string): string {
  const numPrice = parseFloat(price);
  // JPY pairs and metals need different decimal places
  if (instrument.includes('JPY')) {
    return numPrice.toFixed(3);
  }
  if (instrument.includes('XAU') || instrument.includes('XAG')) {
    return numPrice.toFixed(2);
  }
  return numPrice.toFixed(5);
}

function calculateChange(open: string, close: string): { value: number; percent: number } {
  const openNum = parseFloat(open);
  const closeNum = parseFloat(close);
  const value = closeNum - openNum;
  const percent = openNum !== 0 ? (value / openNum) * 100 : 0;
  return { value, percent };
}

function formatChange(value: number, instrument: string): string {
  if (instrument.includes('JPY')) {
    return value >= 0 ? `+${value.toFixed(3)}` : value.toFixed(3);
  }
  if (instrument.includes('XAU') || instrument.includes('XAG')) {
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  }
  return value >= 0 ? `+${value.toFixed(5)}` : value.toFixed(5);
}

function PriceCard({ price, sparklineData, compact = false }: PriceCardProps) {
  const change = useMemo(
    () => calculateChange(price.open_mid, price.mid),
    [price.open_mid, price.mid]
  );

  const isPositive = change.value >= 0;
  const changeColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const bgGlow = isPositive ? 'hover:shadow-emerald-500/20' : 'hover:shadow-rose-500/20';

  if (compact) {
    return (
      <div className={`glass-soft rounded-lg p-2 transition-all hover:scale-[1.02] ${bgGlow} hover:shadow-lg`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-semibold text-slate-300 tracking-wide">
              {formatInstrument(price.instrument)}
            </span>
            {sparklineData && sparklineData.length > 1 && (
              <Sparkline data={sparklineData} width={40} height={14} strokeWidth={1} />
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-bold text-white font-mono">
              {formatPrice(price.mid, price.instrument)}
            </span>
            <span className={`text-[9px] font-semibold ${changeColor}`}>
              {change.percent >= 0 ? '▲' : '▼'} {Math.abs(change.percent).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-soft rounded-xl p-3 transition-all hover:scale-[1.02] ${bgGlow} hover:shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white tracking-wide">
          {formatInstrument(price.instrument)}
        </span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
          isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {isPositive ? '▲' : '▼'} {Math.abs(change.percent).toFixed(2)}%
        </span>
      </div>

      {/* Price + Sparkline Row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-lg font-bold text-white font-mono">
          {formatPrice(price.mid, price.instrument)}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} width={60} height={24} strokeWidth={1.5} />
        )}
      </div>

      {/* Change */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500">Change</span>
        <span className={`font-mono font-semibold ${changeColor}`}>
          {formatChange(change.value, price.instrument)}
        </span>
      </div>

      {/* High/Low */}
      <div className="flex items-center justify-between text-[9px] mt-1 pt-1 border-t border-slate-700/50">
        <div>
          <span className="text-slate-500">H: </span>
          <span className="text-slate-400 font-mono">{formatPrice(price.high_mid, price.instrument)}</span>
        </div>
        <div>
          <span className="text-slate-500">L: </span>
          <span className="text-slate-400 font-mono">{formatPrice(price.low_mid, price.instrument)}</span>
        </div>
      </div>
    </div>
  );
}

interface PriceTickerProps {
  compact?: boolean;
  maxItems?: number;
  showFilters?: boolean;
  showSparklines?: boolean;
}

export function PriceTicker({
  compact = false,
  maxItems,
  showFilters = true,
  showSparklines = true
}: PriceTickerProps) {
  const { prices, loading, error, lastUpdated } = useFXPrices(30000); // Refresh every 30s
  const { sparklines } = useFXSparklines(24, 300000); // 24h data, refresh every 5min
  const [filter, setFilter] = useState<FilterType>('majors');

  const filteredPrices = useMemo(() => {
    let filtered: FXPrice[];

    switch (filter) {
      case 'majors':
        filtered = prices.filter(p => MAJOR_PAIRS.includes(p.instrument));
        break;
      case 'crosses':
        filtered = prices.filter(p => CROSS_PAIRS.includes(p.instrument));
        break;
      case 'metals':
        filtered = prices.filter(p => METALS.includes(p.instrument));
        break;
      default:
        filtered = prices;
    }

    // Sort by instrument name
    filtered.sort((a, b) => a.instrument.localeCompare(b.instrument));

    if (maxItems) {
      return filtered.slice(0, maxItems);
    }
    return filtered;
  }, [prices, filter, maxItems]);

  if (loading && prices.length === 0) {
    return (
      <div className="glass-soft rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-700/30 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-soft rounded-xl p-4 border border-rose-500/30">
        <div className="flex items-center gap-2 text-rose-400">
          <span>⚠️</span>
          <span className="text-sm">Failed to load prices: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">💱</span>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Live Prices
          </h3>
          {lastUpdated && (
            <span className="text-[9px] text-slate-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Filter buttons */}
        {showFilters && (
          <div className="flex gap-1">
            {(['majors', 'crosses', 'metals', 'all'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[9px] font-semibold uppercase tracking-wide rounded-md transition-all ${
                  filter === f
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-700/40 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Grid */}
      {filteredPrices.length > 0 ? (
        <div className={`grid gap-2 ${
          compact
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
        }`}>
          {filteredPrices.map((price) => (
            <PriceCard
              key={price.instrument}
              price={price}
              sparklineData={showSparklines ? sparklines[price.instrument] : undefined}
              compact={compact}
            />
          ))}
        </div>
      ) : (
        <div className="glass-soft rounded-xl p-4 text-center">
          <p className="text-sm text-slate-400">No prices available for selected filter</p>
        </div>
      )}

      {/* Data source note */}
      <div className="text-[9px] text-slate-600 text-center">
        Data from OANDA · Hourly candles · Auto-refreshes every 30s
      </div>
    </div>
  );
}

export default PriceTicker;
