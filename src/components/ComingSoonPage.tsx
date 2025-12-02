import React from 'react';

interface ComingSoonPageProps {
  pageNumber: number;
}

const pageContent = {
  1: {
    icon: '🚀',
    title: 'Trading Desk',
    description: 'Your comprehensive trading dashboard with real-time market data and session tracking'
  },
  2: {
    icon: '🔍',
    title: 'Screener',
    description: 'Advanced FX pair screener with multi-criteria filtering based on volatility, correlation, momentum, and technical indicators. Filter and rank pairs to find the best trading opportunities.'
  },
  3: {
    icon: '🤖',
    title: 'AI Assistant',
    description: 'Intelligent trading assistant powered by AI. Ask questions about market conditions, get strategy recommendations, and visualize data insights through interactive charts and analysis.'
  },
  4: {
    icon: '📈',
    title: 'Backtesting',
    description: 'Comprehensive strategy backtesting engine. Test your trading strategies against historical data and receive detailed performance tearsheets with metrics like Sharpe ratio, max drawdown, win rate, and profit factor.'
  }
};

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ pageNumber }) => {
  const content = pageContent[pageNumber as keyof typeof pageContent];

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-3xl p-8 shadow-2xl shadow-black/50 text-center">
        {/* Icon */}
        <div className="text-6xl mb-6 filter drop-shadow-lg">{content.icon}</div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-3">{content.title}</h2>

        {/* Description */}
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{content.description}</p>

        {/* Coming Soon Badge */}
        <div className="inline-block px-4 py-2 bg-cyan-500/20 border border-cyan-500/40 rounded-full">
          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">
            Coming Soon
          </span>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500/60 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-cyan-500/40 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          <div className="w-2 h-2 rounded-full bg-cyan-500/20 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
        </div>
      </div>
    </div>
  );
};
