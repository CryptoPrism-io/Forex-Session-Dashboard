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
    <div className="h-full overflow-y-auto pb-2 sm:pb-4">
      <div className="grid grid-cols-1 tablet:grid-cols-12 gap-1.5 sm:gap-3 tablet:gap-4">
        {/* Left rail: time + sessions */}
        <div className="col-span-12 tablet:col-span-8 space-y-1.5 sm:space-y-3 tablet:space-y-4">
          {/* Current Time Display */}
          <div className="glass-soft rounded-xl sm:rounded-3xl p-2 sm:p-4 md:p-5 shadow-2xl shadow-black/35">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm" style={{ filter: `drop-shadow(0 0 3px ${timeGlow})` }}>
                {timeIcon}
              </span>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Current Time
              </div>
            </div>

            <div className={`text-xl font-bold bg-gradient-to-r ${timeGradient} bg-clip-text text-transparent tracking-wider font-mono mb-1.5`}>
              {timeFormatted}
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{dateFormatted}</span>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-slate-700/40 border border-slate-600/40 text-slate-400">
                  {timeOfDay}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-white/10 border border-white/30 text-white">
                  {selectedTimezone.label}
                </span>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div className="glass-soft rounded-xl sm:rounded-3xl p-1.5 sm:p-3 shadow-2xl shadow-black/35 space-y-1.5 sm:space-y-2 overflow-visible">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">📊</span>
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Active Sessions
                  </h3>
                </div>
                <span className="text-[9px] uppercase tracking-wide text-neutral-400 font-medium">
                  Status
                </span>
              </div>
              <div className="flex flex-col gap-1.5 sm:gap-3">
                {activeSessions.map((session) => {
                  const totalSeconds = Math.abs(session.elapsedSeconds) + Math.abs(session.remainingSeconds);
                  const progressPercent = totalSeconds > 0
                    ? Math.max(0, Math.min(100, (session.elapsedSeconds / totalSeconds) * 100))
                    : 0;

                  return (
                    <div
                      key={session.name}
                      className="glass-soft rounded-lg sm:rounded-xl p-1.5 sm:p-3 shadow-xl shadow-black/30 flex flex-col gap-1 sm:gap-2"
                    >
                      {/* Header Row - Session Name & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              session.status === 'WARNING' ? 'animate-pulse' : ''
                            }`}
                            style={{
                              backgroundColor: session.color,
                              boxShadow: `0 0 6px ${session.color}`,
                            }}
                          />
                          <span className="text-xs font-semibold text-slate-100 truncate">
                            {session.name}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full">
                        <div className="h-1.5 bg-slate-900/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${progressPercent}%`,
                              backgroundColor: session.color,
                              boxShadow: `0 0 6px ${session.color}`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Time Info - Horizontal Layout */}
                      <div className="flex items-center justify-between gap-3 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-wide text-slate-500">
                            Elapsed
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400 font-mono">
                            {formatSessionTime(session.elapsedSeconds)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-wide text-slate-500">
                            Remaining
                          </span>
                          <span className="text-[11px] font-bold text-amber-400 font-mono">
                            {formatSessionTime(session.remainingSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSessions.length === 0 && (
            <div className="glass-soft rounded-lg sm:rounded-2xl p-1.5 sm:p-3 shadow-2xl shadow-black/35 text-center">
              <p className="text-[11px] text-slate-400">No active trading sessions</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Check back during market hours</p>
            </div>
          )}
        </div>

        {/* Right rail: compact info controls - Horizontal on mobile, vertical on desktop */}
        <div className="col-span-12 md:col-span-4 flex flex-row md:flex-col gap-1 sm:gap-2">
          {/* Status Card - Hidden on mobile since header shows count */}
          <div className="hidden md:block glass-soft rounded-xl p-2.5 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm">📊</div>
              <div className="text-[9px] uppercase tracking-wide font-semibold text-neutral-400">
                Status
              </div>
            </div>
            <div className="text-[9px] text-slate-400 mb-0.5">Active Sessions</div>
            <div className="text-sm font-bold text-white">
              {activeSessions.length}
              <span className="text-[10px] font-normal text-slate-400 ml-1">/ 4</span>
            </div>
          </div>
          {/* Timezone Button - Full width on mobile */}
          <button
            onClick={onTimezoneSettingsClick}
            className="flex-1 glass-soft rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 shadow-xl shadow-black/30 hover:border-emerald-400/40 transition-all text-left w-full"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm">🛰️</div>
              <div className="flex items-center gap-1">
                <div className="text-[9px] uppercase tracking-wide font-semibold text-emerald-300/60">
                  Zone
                </div>
                <IconSettings className="w-2.5 h-2.5 text-emerald-400/60" />
              </div>
            </div>
            <div className="text-[9px] text-slate-400 mb-0.5">Current Timezone</div>
            <div className="text-xs font-bold text-emerald-300 truncate">
              {selectedTimezone.label}
            </div>
          </button>
        </div>

        {/* Social Links - Mobile Only */}
        <div className="md:hidden col-span-12 mt-1 pt-2 border-t border-slate-700/30">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
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
