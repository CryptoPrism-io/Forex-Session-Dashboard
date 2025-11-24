import React from 'react';
import { Timezone } from '../types';
import { IconSettings } from './icons';
import SwipeableFooter from './SwipeableFooter';

interface ActiveSessionData {
  name: string;
  color: string;
  status: 'OPEN' | 'WARNING';
  elapsedSeconds: number;
  remainingSeconds: number;
}

interface OverviewPanelProps {
  selectedTimezone: Timezone;
  currentTime: Date;
  activeSessions: ActiveSessionData[];
  onTimezoneSettingsClick: () => void;
  installState: 'available' | 'installed' | 'unsupported' | 'dismissed';
  onInstallClick: () => void;
  alertConfig: { enabled: boolean; soundEnabled: boolean };
  onToggleAlerts: () => void;
  onToggleSound: () => void;
}

const formatSessionTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

const OverviewPanel: React.FC<OverviewPanelProps> = ({
  selectedTimezone,
  currentTime,
  activeSessions,
  onTimezoneSettingsClick,
  installState,
  onInstallClick,
  alertConfig,
  onToggleAlerts,
  onToggleSound,
}) => {
  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    timeZone: selectedTimezone.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    timeZone: selectedTimezone.timezone,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Determine day/night based on local hour
  const localHour = parseInt(timeFormatted.split(':')[0]);
  const isDaytime = localHour >= 6 && localHour < 18;
  const timeOfDay = isDaytime ? 'day' : 'night';
  const timeIcon = isDaytime ? '☀️' : '🌙';
  const timeGradient = isDaytime
    ? 'from-amber-400 via-orange-400 to-amber-400'
    : 'from-blue-400 via-indigo-400 to-purple-400';
  const timeGlow = isDaytime
    ? 'rgba(251, 146, 60, 0.3)'
    : 'rgba(99, 102, 241, 0.3)';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-6">
        {/* Title Section */}
        <div className="text-center">
          <h1
            className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2"
            style={{
              textShadow: '0 0 15px rgba(34, 211, 238, 0.3), 0 0 30px rgba(59, 130, 246, 0.2)',
              filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.25))'
            }}
          >
            FX_Saarthi
          </h1>
          <p className="text-xs text-slate-400 font-light">
            Real-time session tracking with killzones and overlaps
          </p>
        </div>

        {/* Current Time Display */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${timeGlow})` }}>
              {timeIcon}
            </span>
            <div className="text-[10px] uppercase tracking-[0.45em] text-slate-500">
              Current Time
            </div>
          </div>

          <div className={`text-5xl font-bold bg-gradient-to-r ${timeGradient} bg-clip-text text-transparent tracking-wider font-mono mb-3`}>
            {timeFormatted}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{dateFormatted}</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-slate-700/40 border border-slate-600/40 text-slate-400">
                {timeOfDay}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200">
                {selectedTimezone.label}
              </span>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-lg">
            <h3 className="text-xs uppercase tracking-[0.35em] text-slate-500 mb-4">
              Active Sessions
            </h3>
            <div className="space-y-4">
              {activeSessions.map((session) => {
                const totalSeconds = session.elapsedSeconds + session.remainingSeconds;
                const progressPercent = (session.elapsedSeconds / totalSeconds) * 100;

                return (
                  <div
                    key={session.name}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/40"
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-4 h-4 rounded-full ${
                            session.status === 'WARNING' ? 'animate-pulse' : ''
                          }`}
                          style={{
                            backgroundColor: session.color,
                            boxShadow: `0 0 10px ${session.color}`,
                          }}
                        />
                        <span className="text-base font-semibold text-slate-100">
                          {session.name}
                        </span>
                      </div>
                      <span
                        className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full"
                        style={{
                          backgroundColor: `${session.color}20`,
                          color: session.color,
                          border: `1px solid ${session.color}40`
                        }}
                      >
                        {session.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: session.color,
                            boxShadow: `0 0 8px ${session.color}`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Elapsed
                        </div>
                        <div className="text-base font-bold text-emerald-400 font-mono">
                          {formatSessionTime(session.elapsedSeconds)}
                        </div>
                      </div>
                      <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Remaining
                        </div>
                        <div className="text-base font-bold text-amber-400 font-mono">
                          {formatSessionTime(session.remainingSeconds)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSessions.length === 0 && (
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg text-center">
            <p className="text-sm text-slate-400">No active trading sessions</p>
            <p className="text-xs text-slate-500 mt-1">Check back during market hours</p>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">📊</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-cyan-300/60">
                Status
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-1.5">Active Sessions</div>
            <div className="text-2xl font-bold text-cyan-300">
              {activeSessions.length}
              <span className="text-sm font-normal text-slate-400 ml-1">/ 4</span>
            </div>
          </div>
          <button
            onClick={onTimezoneSettingsClick}
            className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-400/30 rounded-xl p-4 hover:from-emerald-500/15 hover:to-green-500/15 hover:border-emerald-400/50 transition-all text-left w-full"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">🌍</div>
              <div className="flex items-center gap-1.5">
                <div className="text-xs uppercase tracking-wider font-semibold text-emerald-300/60">
                  Zone
                </div>
                <IconSettings className="w-3.5 h-3.5 text-emerald-400/60" />
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-1.5">Current Timezone</div>
            <div className="text-base font-bold text-emerald-300 truncate">
              {selectedTimezone.label}
            </div>
          </button>
        </div>

      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-slate-700/50 bg-slate-900/95">
        <SwipeableFooter
          installState={installState}
          onInstallClick={onInstallClick}
          alertConfig={alertConfig}
          onToggleAlerts={onToggleAlerts}
          onToggleSound={onToggleSound}
        />
      </div>
    </div>
  );
};

export default OverviewPanel;
