import React from 'react';

interface ComingSoonPageProps {
  pageNumber: number;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ pageNumber }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-slate-700/30">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-300 mb-3">Coming Soon</h1>
        <p className="text-lg text-slate-400">Page {pageNumber}</p>
      </div>
    </div>
  );
};
