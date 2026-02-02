import React, { useMemo, useState } from 'react';
import { useFXCorrelationMatrix } from '../hooks/useFXCorrelationMatrix';

interface CorrelationPair {
  pair1: string;
  pair2: string;
  correlation: string | number;
  time?: string;
}

interface TopCorrelationRowProps {
  pair: CorrelationPair;
  rank: number;
  isPositive: boolean;
}

function TopCorrelationRow({ pair, rank, isPositive }: TopCorrelationRowProps) {
  const corr = typeof pair.correlation === 'string'
    ? parseFloat(pair.correlation)
    : pair.correlation;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 w-4">{rank}.</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-slate-200">{pair.pair1.replace('_', '/')}</span>
          <span className="text-slate-600">↔</span>
          <span className="text-xs font-medium text-slate-200">{pair.pair2.replace('_', '/')}</span>
        </div>
      </div>
      <span className={`font-mono text-sm font-bold ${
        isPositive ? 'text-blue-400' : 'text-red-400'
      }`}>
        {corr >= 0 ? '+' : ''}{corr.toFixed(2)}
      </span>
    </div>
  );
}

interface TopCorrelationsCardProps {
  title: string;
  pairs: CorrelationPair[];
  isPositive: boolean;
  icon: string;
}

function TopCorrelationsCard({ title, pairs, isPositive, icon }: TopCorrelationsCardProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="space-y-0">
        {pairs.map((pair, idx) => (
          <TopCorrelationRow
            key={`${pair.pair1}-${pair.pair2}`}
            pair={pair}
            rank={idx + 1}
            isPositive={isPositive}
          />
        ))}
      </div>
    </div>
  );
}

interface PairSearchProps {
  selectedPair: string;
  onSelectPair: (pair: string) => void;
  instruments: string[];
}

function PairSearch({ selectedPair, onSelectPair, instruments }: PairSearchProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🔍</span>
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Filter by Pair</h4>
      </div>
      <select
        value={selectedPair}
        onChange={(e) => onSelectPair(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.25rem',
          paddingRight: '2rem',
        }}
      >
        <option value="">All Pairs</option>
        {instruments.map(inst => (
          <option key={inst} value={inst}>{inst.replace('_', '/')}</option>
        ))}
      </select>
    </div>
  );
}

interface FilteredCorrelationsListProps {
  pairs: CorrelationPair[];
  selectedPair: string;
}

function FilteredCorrelationsList({ pairs, selectedPair }: FilteredCorrelationsListProps) {
  if (!selectedPair || pairs.length === 0) {
    return null;
  }

  // Sort by absolute correlation value
  const sortedPairs = [...pairs].sort((a, b) => {
    const corrA = Math.abs(typeof a.correlation === 'string' ? parseFloat(a.correlation) : a.correlation);
    const corrB = Math.abs(typeof b.correlation === 'string' ? parseFloat(b.correlation) : b.correlation);
    return corrB - corrA;
  });

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 mt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          {selectedPair.replace('_', '/')} Correlations
        </h4>
        <span className="text-[10px] text-slate-500">{pairs.length} pairs</span>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-0.5">
        {sortedPairs.map(pair => {
          const corr = typeof pair.correlation === 'string'
            ? parseFloat(pair.correlation)
            : pair.correlation;
          const isPositive = corr >= 0;
          const otherPair = pair.pair1 === selectedPair ? pair.pair2 : pair.pair1;

          // Color based on strength
          let textColor = 'text-slate-400';
          if (Math.abs(corr) > 0.7) {
            textColor = isPositive ? 'text-blue-400' : 'text-red-400';
          } else if (Math.abs(corr) > 0.4) {
            textColor = isPositive ? 'text-green-400' : 'text-orange-400';
          }

          return (
            <div
              key={`${pair.pair1}-${pair.pair2}`}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/50 transition-colors"
            >
              <span className="text-sm text-slate-200">{otherPair.replace('_', '/')}</span>
              <div className="flex items-center gap-2">
                {/* Visual bar */}
                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPositive ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(corr) * 100}%` }}
                  />
                </div>
                <span className={`font-mono text-xs font-semibold ${textColor} w-12 text-right`}>
                  {corr >= 0 ? '+' : ''}{corr.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CorrelationInsights() {
  const { matrix, loading, error } = useFXCorrelationMatrix();
  const [selectedPair, setSelectedPair] = useState('');

  // Process correlation data
  const { topPositive, topNegative, instruments, filteredPairs, stats } = useMemo(() => {
    if (!matrix || matrix.length === 0) {
      return {
        topPositive: [],
        topNegative: [],
        instruments: [],
        filteredPairs: [],
        stats: { avg: 0, strongPos: 0, strongNeg: 0 }
      };
    }

    // Parse all correlations
    const parsed = matrix.map(pair => ({
      ...pair,
      corrValue: typeof pair.correlation === 'string'
        ? parseFloat(pair.correlation)
        : pair.correlation
    }));

    // Get unique instruments
    const instrumentSet = new Set<string>();
    parsed.forEach(p => {
      const p1 = (p as any).pair1 || (p as any).instrument_1;
      const p2 = (p as any).pair2 || (p as any).instrument_2;
      instrumentSet.add(p1);
      instrumentSet.add(p2);
    });
    const instruments = Array.from(instrumentSet).sort();

    // Sort by correlation value (descending for positive, ascending for negative)
    const sortedByCorr = [...parsed].sort((a, b) => b.corrValue - a.corrValue);

    // Top 5 positive (highest values)
    const topPositive = sortedByCorr.slice(0, 5) as CorrelationPair[];

    // Top 5 negative (lowest values)
    const topNegative = sortedByCorr.slice(-5).reverse() as CorrelationPair[];

    // Filter by selected pair
    let filteredPairs: CorrelationPair[] = [];
    if (selectedPair) {
      filteredPairs = matrix.filter(p => {
        const p1 = (p as any).pair1 || (p as any).instrument_1;
        const p2 = (p as any).pair2 || (p as any).instrument_2;
        return p1 === selectedPair || p2 === selectedPair;
      }) as CorrelationPair[];
    }

    // Stats
    const avgCorr = parsed.reduce((sum, p) => sum + p.corrValue, 0) / parsed.length;
    const strongPos = parsed.filter(p => p.corrValue > 0.7).length;
    const strongNeg = parsed.filter(p => p.corrValue < -0.7).length;

    return {
      topPositive,
      topNegative,
      instruments,
      filteredPairs,
      stats: { avg: avgCorr, strongPos, strongNeg }
    };
  }, [matrix, selectedPair]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-slate-800/50 rounded-lg"></div>
          <div className="h-48 bg-slate-800/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
        <span className="text-red-400 text-sm">Failed to load correlation data: {error}</span>
      </div>
    );
  }

  if (!matrix || matrix.length === 0) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
        <span className="text-yellow-400 text-sm">No correlation data available</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">{matrix.length}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Pairs</div>
        </div>
        <div className="bg-slate-900/50 border border-blue-500/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{stats.strongPos}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Strong +ve</div>
        </div>
        <div className="bg-slate-900/50 border border-red-500/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-400">{stats.strongNeg}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Strong -ve</div>
        </div>
      </div>

      {/* Top Correlations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopCorrelationsCard
          title="Strongest Positive"
          pairs={topPositive}
          isPositive={true}
          icon="🔵"
        />
        <TopCorrelationsCard
          title="Strongest Negative"
          pairs={topNegative}
          isPositive={false}
          icon="🔴"
        />
      </div>

      {/* Pair Search */}
      <PairSearch
        selectedPair={selectedPair}
        onSelectPair={setSelectedPair}
        instruments={instruments}
      />

      {/* Filtered Results */}
      <FilteredCorrelationsList
        pairs={filteredPairs}
        selectedPair={selectedPair}
      />
    </div>
  );
}

export default CorrelationInsights;
