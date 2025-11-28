import React from 'react';
import { Timezone } from '../types';
import { IconSettings } from './icons';
import SocialLinks from './SocialLinks';

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
    <div className="h-full overflow-y-auto">
      <div className="min-h-full grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left rail: time + sessions */}
        <div className="col-span-12 md:col-span-8 space-y-4">
          {/* Current Time Display */}
          <div className="glass-soft rounded-3xl p-4 md:p-5 shadow-2xl shadow-black/35 h-full">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg" style={{ filter: `drop-shadow(0 0 4px ${timeGlow})` }}>
                {timeIcon}
              </span>
              <div className="text-[9px] uppercase tracking-[0.4em] text-slate-500">
                Current Time
              </div>
            </div>

            <div className={`text-4xl font-bold bg-gradient-to-r ${timeGradient} bg-clip-text text-transparent tracking-wider font-mono mb-2`}>
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
            <div className="glass-soft rounded-3xl p-4 shadow-2xl shadow-black/35 space-y-3">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
                Active Sessions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSessions.map((session) => {
                  const totalSeconds = session.elapsedSeconds + session.remainingSeconds;
                  const progressPercent = (session.elapsedSeconds / totalSeconds) * 100;

                  return (
                    <div
                      key={session.name}
                      className="glass-soft rounded-2xl p-3 shadow-xl shadow-black/30 flex flex-col gap-2"
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
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
                      <div>
                        <div className="h-1.5 bg-slate-900/60 rounded-full overflow-hidden">
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
                        <div className="glass-soft rounded-xl p-2.5 text-center shadow-inner shadow-black/10">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500 mb-0.5">
                            Elapsed
                          </div>
                          <div className="text-sm font-bold text-emerald-400 font-mono">
                            {formatSessionTime(session.elapsedSeconds)}
                          </div>
                        </div>
                        <div className="glass-soft rounded-xl p-2.5 text-center shadow-inner shadow-black/10">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500 mb-0.5">
                            Remaining
                          </div>
                          <div className="text-sm font-bold text-amber-400 font-mono">
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
            <div className="glass-soft rounded-3xl p-4 shadow-2xl shadow-black/35 text-center">
              <p className="text-xs text-slate-400">No active trading sessions</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Check back during market hours</p>
            </div>
          )}
        </div>

        {/* Right rail: compact info controls */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
          <div className="glass-soft rounded-2xl p-3 shadow-xl shadow-black/30 h-full">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xl">📊</div>
              <div className="text-[10px] uppercase tracking-wide font-semibold text-cyan-300/60">
                Status
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mb-1">Active Sessions</div>
            <div className="text-xl font-bold text-cyan-300">
              {activeSessions.length}
              <span className="text-xs font-normal text-slate-400 ml-1">/ 4</span>
            </div>
          </div>
          <button
            onClick={onTimezoneSettingsClick}
            className="glass-soft rounded-2xl p-3 shadow-xl shadow-black/30 hover:border-emerald-400/40 transition-all text-left w-full h-full"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xl">🛰️</div>
              <div className="flex items-center gap-1">
                <div className="text-[10px] uppercase tracking-wide font-semibold text-emerald-300/60">
                  Zone
                </div>
                <IconSettings className="w-3 h-3 text-emerald-400/60" />
              </div>
            </div>
            <div className="text-[10px] text-slate-400 mb-1">Current Timezone</div>
            <div className="text-sm font-bold text-emerald-300 truncate">
              {selectedTimezone.label}
            </div>
          </button>
        </div>

        {/* Social Links - Mobile Only */}
        <div className="md:hidden col-span-12 mt-2 pt-4 border-t border-slate-700/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Connect
            </div>
          </div>
          <div className="flex items-center justify-center">
            <SocialLinks />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
