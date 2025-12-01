import { useState } from 'react';

interface VersionInfo {
  version: string;
  commit: string;
  buildDate: string;
}

// These will be injected at build time via vite.config.ts
const versionInfo: VersionInfo = {
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  commit: import.meta.env.VITE_GIT_COMMIT_HASH || 'dev',
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
};

export default function VersionDisplay() {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="inline-block">
      <button
        onClick={() => setExpanded(!expanded)}
        className="group relative px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 hover:border-cyan-400/50 rounded-lg shadow-lg"
      >
        {expanded ? (
          <div className="text-left">
            <div className="font-semibold text-cyan-400 mb-1">
              Version {versionInfo.version}
            </div>
            <div className="text-[10px] space-y-0.5">
              <div>
                <span className="text-slate-500">Commit:</span>{' '}
                <span className="text-slate-300">{versionInfo.commit.substring(0, 7)}</span>
              </div>
              <div>
                <span className="text-slate-500">Built:</span>{' '}
                <span className="text-slate-300">{formatDate(versionInfo.buildDate)}</span>
              </div>
            </div>
          </div>
        ) : (
          <span>v{versionInfo.version}</span>
        )}
      </button>
    </div>
  );
}
