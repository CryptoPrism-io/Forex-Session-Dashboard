import React from 'react';

interface InstallButtonProps {
  onClick: () => void;
  show: boolean;
  hasNativePrompt: boolean;
}

const InstallButton: React.FC<InstallButtonProps> = ({ onClick, show, hasNativePrompt }) => {
  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 hover:border-cyan-300/60 text-cyan-300 transition-all duration-300 backdrop-blur-md shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30"
      title={hasNativePrompt ? "Click to install the app" : "Click for installation instructions"}
      aria-label="Download and install app"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="hidden sm:inline">Install</span>
    </button>
  );
};

export default InstallButton;
