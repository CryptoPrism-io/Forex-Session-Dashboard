import React, { useState } from 'react';
import { AlertConfig } from '../types';
import { usePopoverPosition } from '../hooks/usePopoverPosition';
import './AlertsToggleHeader.css';

interface AlertsToggleHeaderProps {
  alertConfig: AlertConfig;
  onToggle: () => void;
  onToggleSound: () => void;
}

const AlertsToggleHeader: React.FC<AlertsToggleHeaderProps> = ({
  alertConfig,
  onToggle,
  onToggleSound,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { triggerRef, position } = usePopoverPosition();

  const handleToggleClick = () => {
    onToggle();
  };

  const handleToggleSoundClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSound();
  };

  return (
    <div className="relative" ref={triggerRef}>
      {/* Alert Button */}
      <button
        onClick={handleToggleClick}
        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 border-2 ${
          alertConfig.enabled
            ? 'bg-slate-800/40 hover:bg-slate-800/60 text-green-400 border-green-500'
            : 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-slate-300 border-red-500/60'
        }`}
        style={{
          boxShadow: alertConfig.enabled
            ? '0 0 12px rgba(34, 197, 94, 0.5), inset 0 0 8px rgba(34, 197, 94, 0.1)'
            : '0 0 8px rgba(239, 68, 68, 0.3), inset 0 0 4px rgba(239, 68, 68, 0.05)',
        }}
        title={alertConfig.enabled ? 'Alerts enabled' : 'Alerts disabled'}
        aria-label={alertConfig.enabled ? 'Disable alerts' : 'Enable alerts'}
      >
        {/* Bell Icon */}
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

        {/* Notification Badge - only when enabled */}
        {alertConfig.enabled && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu - Fixed positioning with smart collision detection */}
          <div
            className="fixed w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-lg shadow-lg shadow-black/40 z-40 overflow-hidden"
            style={{
              top: `${position.top}px`,
              right: `${position.right}px`,
            }}
          >
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

      {/* Toggle menu button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="absolute inset-0 w-full h-full rounded-lg"
        style={{ pointerEvents: showMenu ? 'none' : 'auto' }}
        aria-label="Toggle alerts menu"
      />
    </div>
  );
};

export default AlertsToggleHeader;
