import React from 'react';

interface ComingSoonPageProps {
  pageNumber: number;
}

const pageContent = {
  1: {
    icon: '🚀',
    title: 'Advanced Analytics',
    description: 'Deep insights and advanced market analysis tools'
  },
  2: {
    icon: '📊',
    title: 'Market Intelligence',
    description: 'Real-time market data and predictive analytics'
  },
  3: {
    icon: '🤖',
    title: 'AI Insights',
    description: 'Machine learning powered trading recommendations'
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
