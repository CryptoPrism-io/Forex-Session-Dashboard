import React, { useState, useMemo, useEffect } from 'react';
import { useTickerData, CategoryFilter } from '../hooks/useTickerData';
import { IconFilter, IconChevronDown } from './icons';
import { Timezone } from '../types';

interface TickerTapeProps {
  selectedTimezone: Timezone;
}

const CRYPTO_FETCH_INTERVAL = 10; // seconds (CoinGecko)
const FOREX_COMMODITIES_FETCH_INTERVAL = 6 * 60 * 60; // 6 hours (Alpha Vantage)

const TickerTape: React.FC<TickerTapeProps> = ({ selectedTimezone }) => {
  const { tickers, loading, error, lastFetched } = useTickerData();
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [countdown, setCountdown] = useState(CRYPTO_FETCH_INTERVAL);

  const filteredTickers = useMemo(() => {
    if (selectedFilter === 'All') {
      return tickers;
    }
    return tickers.filter((t) => t.category === selectedFilter);
  }, [tickers, selectedFilter]);

  const filterOptions: CategoryFilter[] = ['All', 'Crypto', 'Indices', 'Forex', 'Commodities'];

  // Determine the fetch interval based on selected filter
  const getFetchInterval = (filter: CategoryFilter): number => {
    if (filter === 'Crypto') return CRYPTO_FETCH_INTERVAL;
    if (filter === 'Forex' || filter === 'Commodities') return FOREX_COMMODITIES_FETCH_INTERVAL;
    return CRYPTO_FETCH_INTERVAL; // Default to crypto for 'All' and 'Indices'
  };

  const fetchInterval = getFetchInterval(selectedFilter);

  // Format countdown for display
  const formatCountdown = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  };

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return fetchInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchInterval]);

  // Reset countdown when data is fetched or filter changes
  useEffect(() => {
    if (lastFetched) {
      setCountdown(fetchInterval);
    }
  }, [lastFetched, fetchInterval]);

  if (error) {
    return (
      <div className="text-center py-2 text-xs text-red-400">
        Failed to load ticker data
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-slate-900/40 via-slate-800/30 to-slate-900/40 backdrop-blur-md border-b border-slate-700/30 shadow-lg shadow-black/10">
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .ticker-scroll {
          animation: scroll-left 240s linear infinite;
          display: flex;
          gap: 2rem;
          min-width: 200%;
          padding: 0.75rem 0;
        }

        .ticker-tape:hover .ticker-scroll {
          animation-play-state: paused;
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          white-space: nowrap;
          border-right: 1px solid rgba(148, 163, 184, 0.1);
          flex-shrink: 0;
        }

        .ticker-item:last-child {
          border-right: none;
        }

        .ticker-symbol {
          font-weight: 600;
          font-size: 0.875rem;
          color: rgb(226, 232, 240);
        }

        .ticker-price {
          font-weight: 500;
          font-size: 0.875rem;
          color: rgb(148, 163, 184);
        }

        .ticker-change {
          font-weight: 600;
          font-size: 0.75rem;
          min-width: 3.5rem;
          text-align: right;
        }

        .ticker-change.positive {
          color: rgb(34, 197, 94);
        }

        .ticker-change.negative {
          color: rgb(239, 68, 68);
        }
      `}</style>

      <div className="flex items-center justify-between px-4 relative">
        {/* Left: Countdown timer for next fetch */}
        <div className="flex-shrink-0 pr-4 border-r border-slate-700/30">
          <div className="text-xs font-light text-slate-400">
            <span className="inline-block min-w-[130px]">
              Next fetch in: <span className="font-semibold text-cyan-400">{formatCountdown(countdown)}</span>
            </span>
          </div>
        </div>

        {/* Center: Ticker tape */}
        <div className="ticker-tape flex-1 overflow-hidden mx-4">
          <div className="ticker-scroll">
            {/* First pass */}
            {filteredTickers.length > 0 && filteredTickers.map((ticker) => (
              <div key={`${ticker.symbol}-1`} className="ticker-item">
                <span className="ticker-symbol">{ticker.symbol}</span>
                <span className="ticker-price">${ticker.price.toFixed(2)}</span>
                <span
                  className={`ticker-change ${
                    ticker.changePercent >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {ticker.changePercent >= 0 ? '+' : ''}
                  {ticker.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}

            {/* Second pass for seamless loop */}
            {filteredTickers.length > 0 && filteredTickers.map((ticker) => (
              <div key={`${ticker.symbol}-2`} className="ticker-item">
                <span className="ticker-symbol">{ticker.symbol}</span>
                <span className="ticker-price">${ticker.price.toFixed(2)}</span>
                <span
                  className={`ticker-change ${
                    ticker.changePercent >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {ticker.changePercent >= 0 ? '+' : ''}
                  {ticker.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Filter dropdown */}
        <div className="flex-shrink-0 pl-4 border-l border-slate-700/30 relative">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 transition-all duration-300 backdrop-blur-md"
            title="Filter assets by category"
          >
            <IconFilter className="w-4 h-4" />
            <span className="hidden sm:inline">{selectedFilter}</span>
            <IconChevronDown className={`w-3 h-3 transition-transform duration-300 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 p-1 z-50 w-40">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setSelectedFilter(filter);
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-150 ${
                    selectedFilter === filter
                      ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/50'
                      : 'hover:bg-slate-700/40 text-slate-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TickerTape;
