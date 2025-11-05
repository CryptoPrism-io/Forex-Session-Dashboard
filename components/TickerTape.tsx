import React from 'react';
import { useTickerData } from '../hooks/useTickerData';

const TickerTape: React.FC = () => {
  const { tickers, loading, error } = useTickerData();

  if (error) {
    return (
      <div className="text-center py-2 text-xs text-red-400">
        Failed to load ticker data
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-slate-900/40 via-slate-800/30 to-slate-900/40 backdrop-blur-md border-b border-slate-700/30 shadow-lg shadow-black/10">
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
          animation: scroll-left 120s linear infinite;
          display: flex;
          gap: 2rem;
          min-width: 200%;
          padding: 1rem 0;
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

      <div className="ticker-tape">
        <div className="ticker-scroll">
          {/* First pass */}
          {tickers.length > 0 && tickers.map((ticker) => (
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
          {tickers.length > 0 && tickers.map((ticker) => (
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
    </div>
  );
};

export default TickerTape;
