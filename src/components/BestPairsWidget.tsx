import React, { useState, useEffect, useMemo } from 'react';
import { FXBestPair } from '../types';
import { useFXCorrelationMatrix } from '../hooks/useFXCorrelationMatrix';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function BestPairsWidget() {
  const [bestPairs, setBestPairs] = useState<FXBestPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('hedging');
  const { matrix, loading: matrixLoading, error: matrixError } = useFXCorrelationMatrix();

  const topMatrixPairs = useMemo(() => {
    if (!matrix) return [];
    return [...matrix]
      .sort((a, b) =>
        Math.abs(parseFloat(b.correlation)) - Math.abs(parseFloat(a.correlation))
      )
      .slice(0, 4);
  }, [matrix]);

  useEffect(() => {
    let isMounted = true;

    const fetchBestPairs = async () => {
      try {
        setError(null);
        setLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/fx/best-pairs?category=${category}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          if (result.success && result.data) {
            setBestPairs(result.data);
          } else {
            throw new Error('Invalid response format');
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch best pairs');
          setLoading(false);
        }
      }
    };

    fetchBestPairs();

    return () => {
      isMounted = false;
    };
  }, [category]);

  return (
    <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">Best Pairs for Trading</h2>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-2 py-0.5 bg-gray-800 text-white border border-gray-600 rounded-md text-[10px] focus:ring-2 focus:ring-blue-500"
        >
          <option value="hedging">Hedging</option>
          <option value="trending">Trending</option>
          <option value="reversal">Reversal</option>
        </select>
      </div>

      {matrixLoading ? (
        <div className="text-[11px] text-slate-400 mb-3">Loading correlation matrix...</div>
      ) : matrixError ? (
        <div className="text-[11px] text-red-400 mb-3">Error loading correlation matrix: {matrixError}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 tablet:grid-cols-2 desktop:grid-cols-4 gap-2 mb-3">
          {topMatrixPairs.map((pair) => {
            const correlation = parseFloat(pair.correlation);
            const absCorr = Math.abs(correlation);
            const corrColor =
              absCorr > 0.7
                ? 'text-emerald-300'
                : absCorr > 0.4
                  ? 'text-amber-300'
                  : 'text-slate-300';
            return (
              <div
                key={`${pair.pair1}_${pair.pair2}_${pair.time}`}
                className="glass-soft rounded-xl p-2 border border-slate-700/40 bg-slate-900/40"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {pair.pair1.replace('_', '/')} vs {pair.pair2.replace('_', '/')}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {pair.window_size || '1h'}
                  </span>
                </div>
                <div className="text-sm font-bold">
                  <span className={corrColor}>{correlation.toFixed(3)}</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {correlation > 0 ? 'moving together' : 'moving opposite'}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {pair.time ? new Date(pair.time).toLocaleString() : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-700 rounded"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-red-400">Error: {error}</div>
      ) : bestPairs.length === 0 && topMatrixPairs.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No pair data available yet</div>
          <div className="text-sm text-gray-500">
            Check back later for pair recommendations.
          </div>
        </div>
      ) : bestPairs.length === 0 ? (
        <div className="text-center py-4 text-xs text-gray-500 border-t border-gray-700 mt-2">
          Additional pair recommendations loading...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Pair 1</th>
                <th className="text-left py-3 px-4 text-gray-300 font-semibold">Pair 2</th>
                <th className="text-right py-3 px-4 text-gray-300 font-semibold">Correlation</th>
                <th className="text-right py-3 px-4 text-gray-300 font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {bestPairs.slice(0, 10).map((pair, index) => {
                const correlation = parseFloat(pair.correlation);
                const score = parseFloat(pair.score);

                const correlationColor =
                  Math.abs(correlation) > 0.7
                    ? 'text-red-400'
                    : Math.abs(correlation) > 0.3
                    ? 'text-yellow-400'
                    : 'text-green-400';

                return (
                  <tr
                    key={`${pair.instrument_1}_${pair.instrument_2}_${index}`}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      {pair.instrument_1.replace('_', '/')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {pair.instrument_2.replace('_', '/')}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono ${correlationColor}`}>
                      {correlation.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-400">
                      {score.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        <p>
          <strong>Correlation:</strong> Measures how similarly two pairs move together.
        </p>
        <p className="mt-1">
          High correlation (&gt; 0.7): Pairs move together | Low correlation (&lt; 0.3): Good for
          hedging
        </p>
      </div>
    </div>
  );
}
