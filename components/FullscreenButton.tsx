import React from 'react';
import { IconMaximize, IconMinimize } from './icons';

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
  sectionName: string;
}

const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  isFullscreen,
  onToggle,
  sectionName,
}) => {
  return (
    <button
      onClick={onToggle}
      className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/60 hover:border-slate-600/60 text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 group"
      title={isFullscreen ? `Exit fullscreen (${sectionName})` : `Fullscreen (${sectionName})`}
      aria-label={isFullscreen ? `Exit fullscreen ${sectionName}` : `Fullscreen ${sectionName}`}
    >
      {isFullscreen ? (
        <IconMinimize className="w-3.5 h-3.5" />
      ) : (
        <IconMaximize className="w-3.5 h-3.5" />
      )}
      <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        {isFullscreen ? 'Exit' : 'Full'}
      </span>
    </button>
  );
};

export default FullscreenButton;
