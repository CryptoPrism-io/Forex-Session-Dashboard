import React from 'react';
import { IconHelpCircle, IconUser } from './icons';
import AlertsToggleHeader from './AlertsToggleHeader';
import InstallButton from './InstallButton';

export interface DesktopNavbarProps {
  onHelpClick: () => void;
  onProfileClick?: () => void;
  alertConfig: {
    enabled: boolean;
    soundEnabled: boolean;
  };
  onToggleAlerts: () => void;
  onToggleSound: () => void;
  installState: 'available' | 'dismissed' | 'installed' | 'unsupported';
  onInstallClick: () => void;
}

const DesktopNavbar: React.FC<DesktopNavbarProps> = ({
  onHelpClick,
  onProfileClick,
  alertConfig,
  onToggleAlerts,
  onToggleSound,
  installState,
  onInstallClick,
}) => {
  return (
    <nav className="flex-shrink-0 h-[52px] px-4 py-3 border-b border-slate-700/30 backdrop-blur-xl glass-soft flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <h1
          className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap"
          style={{
            textShadow: '0 0 10px rgba(34, 211, 238, 0.25), 0 0 16px rgba(59, 130, 246, 0.15)',
            filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.2))'
          }}
        >
          FX_Saarthi
        </h1>
      </div>

      {/* Right: Alert Toggle, Install Button, Help Icon, and Profile Icon */}
      <div className="flex items-center gap-3">
        {/* Alert Toggle */}
        <AlertsToggleHeader
          alertConfig={alertConfig}
          onToggle={onToggleAlerts}
          onToggleSound={onToggleSound}
        />

        {/* Install Button */}
        <InstallButton
          onClick={onInstallClick}
          show={installState === 'available' || installState === 'dismissed'}
          hasNativePrompt={installState === 'available'}
        />

        {/* Help Icon */}
        <button
          onClick={onHelpClick}
          className="p-2 rounded-lg bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600/60 hover:text-cyan-300 transition-all duration-200"
          title="Help & Documentation"
          aria-label="Help & Documentation"
        >
          <IconHelpCircle className="w-5 h-5" />
        </button>

        {/* Profile Icon */}
        {onProfileClick && (
          <button
            onClick={onProfileClick}
            className="p-2 rounded-lg bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600/60 hover:text-cyan-300 transition-all duration-200"
            title="User Profile"
            aria-label="User Profile"
          >
            <IconUser className="w-5 h-5" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default DesktopNavbar;
