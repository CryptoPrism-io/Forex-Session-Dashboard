import React from 'react';
import { useFXVolatility } from '../hooks/useFXVolatility';
import { FXVolatility } from '../types';

interface VolatilityMeterProps {
  instrument: string;
}

function getVolatilityColor(value: number): { bg: string; text: string; label: string } {
  if (value < 0.005) {
    return { bg: 'bg-green-500', text: 'text-green-400', label: 'Low' };
  } else if (value < 0.015) {
    return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium' };
  } else {
    return { bg: 'bg-red-500', text: 'text-red-400', label: 'High' };
  }
}

export function VolatilityMeter({ instrument }: VolatilityMeterProps) {
  const { volatility, loading, error } = useFXVolatility(instrument);

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-red-400 text-sm">Error: {error}</div>
      </div>
    );
  }

  const data = volatility as FXVolatility;
  if (!data) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-gray-400 text-sm">No data available</div>
      </div>
    );
  }

  const hv20 = parseFloat(data.volatility_20);
  const hv50 = parseFloat(data.volatility_50);
  const atr = parseFloat(data.atr);

  const hv20Color = getVolatilityColor(hv20);
  const hv50Color = getVolatilityColor(hv50);
  const atrColor = getVolatilityColor(atr);

  return (
    <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">
        {instrument.replace('_', '/')} Volatility
      </h3>

      <div className="space-y-3">
        {/* HV-20 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">HV-20</span>
            <span className={`text-sm font-semibold ${hv20Color.text}`}>
              {hv20Color.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${hv20Color.bg} transition-all duration-300`}
                style={{ width: `${Math.min(hv20 * 5000, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-white font-mono w-16 text-right">
              {hv20.toFixed(5)}
            </span>
          </div>
        </div>

        {/* HV-50 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">HV-50</span>
            <span className={`text-sm font-semibold ${hv50Color.text}`}>
              {hv50Color.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${hv50Color.bg} transition-all duration-300`}
                style={{ width: `${Math.min(hv50 * 5000, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-white font-mono w-16 text-right">
              {hv50.toFixed(5)}
            </span>
          </div>
        </div>

        {/* ATR */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-400">ATR</span>
            <span className={`text-sm font-semibold ${atrColor.text}`}>
              {atrColor.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${atrColor.bg} transition-all duration-300`}
                style={{ width: `${Math.min(atr * 5000, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-white font-mono w-16 text-right">
              {atr.toFixed(5)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
