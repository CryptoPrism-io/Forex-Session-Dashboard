import React, { useState } from 'react';
import { AlertConfig } from '../types';

interface AlertsToggleProps {
  alertConfig: AlertConfig;
  onToggle: () => void;
  onToggleSound: () => void;
}

const AlertsToggle: React.FC<AlertsToggleProps> = ({ alertConfig, onToggle, onToggleSound }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleToggleClick = () => {
    onToggle();
  };

  const handleToggleSoundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSound();
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleClick}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
          alertConfig.enabled
            ? 'bg-cyan-500/30 hover:bg-cyan-500/40 text-cyan-300'
            : 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300'
        }`}
        title={alertConfig.enabled ? 'Alerts enabled' : 'Alerts disabled'}
        aria-label={alertConfig.enabled ? 'Disable alerts' : 'Enable alerts'}
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={alertConfig.enabled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-lg shadow-lg shadow-black/40 z-40 overflow-hidden">
            <div className="p-3 space-y-2">
              <div
                onClick={handleToggleClick}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={alertConfig.enabled}
                  onChange={() => {}}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-slate-200">Enable Alerts</span>
              </div>

              {alertConfig.enabled && (
                <div
                  onClick={handleToggleSoundClick}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={alertConfig.soundEnabled}
                    onChange={() => {}}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm text-slate-200">Sound</span>
                </div>
              )}

              <div className="px-3 py-2 text-xs text-slate-400 border-t border-slate-700/30 pt-3 mt-2">
                <p className="mb-1 font-semibold text-slate-300">Alert times:</p>
                <ul className="space-y-1">
                  <li>• 15 min before open</li>
                  <li>• At open</li>
                  <li>• 15 min before close</li>
                  <li>• At close</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick toggle button in menu trigger */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="absolute inset-0 w-full h-full rounded-lg"
        style={{ pointerEvents: showMenu ? 'none' : 'auto' }}
      />
    </div>
  );
};

export default AlertsToggle;
