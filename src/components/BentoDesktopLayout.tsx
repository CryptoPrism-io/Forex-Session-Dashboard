import React, { Suspense } from 'react';
import { Timezone } from '../types';
import { SessionStatus } from '../App';
import SessionClocks from './SessionClocks';
import DesktopNavbar from './DesktopNavbar';
import PairsToTrade from './PairsToTrade';
import { IconSettings } from './icons';

// Lazy load heavy components
const ForexChart = React.lazy(() => import('./ForexChart'));
const EconomicCalendar = React.lazy(() => import('./EconomicCalendar'));

interface BentoDesktopLayoutProps {
  selectedTimezone: Timezone;
  currentTime: Date;
  nowLine: number;
  sessionStatus: { [key: string]: SessionStatus };
  activeSessions: Array<{
    name: string;
    color: string;
    type: 'main' | 'overlap' | 'killzone';
    state: SessionStatus;
    elapsedSeconds: number;
    remainingSeconds: number;
    startUTC: number;
    endUTC: number;
  }>;
  currentDSTStatus: boolean;
  activeSessions_config: any[];
  isAutoDetectDST: boolean;
  manualDSTOverride: boolean | null;
  onToggleDSTOverride: (override: boolean | null) => void;
  onAutoDetectToggle: (enabled: boolean) => void;
  onTimezoneSettingsClick: () => void;
  onHelpClick: () => void;
  alertConfig: {
    enabled: boolean;
    soundEnabled: boolean;
  };
  onToggleAlerts: () => void;
  onToggleSound: () => void;
  installState: 'available' | 'dismissed' | 'installed' | 'unsupported';
  onInstallClick: () => void;
  onNavigatePage?: (pageNum: number) => void;
  pageViewContent?: React.ReactNode;
}

const formatSessionTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

const BentoDesktopLayout: React.FC<BentoDesktopLayoutProps> = ({
  selectedTimezone,
  currentTime,
  nowLine,
  sessionStatus,
  activeSessions,
  currentDSTStatus,
  activeSessions_config,
  isAutoDetectDST,
  manualDSTOverride,
  onToggleDSTOverride,
  onAutoDetectToggle,
  onTimezoneSettingsClick,
  onHelpClick,
  alertConfig,
  onToggleAlerts,
  onToggleSound,
  installState,
  onInstallClick,
  onNavigatePage,
  pageViewContent,
}) => {
  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    timeZone: selectedTimezone.timezone || selectedTimezone.ianaTimezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    timeZone: selectedTimezone.timezone || selectedTimezone.ianaTimezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Determine day/night
  const localHour = parseInt(timeFormatted.split(':')[0]);
  const isDaytime = localHour >= 6 && localHour < 18;
  const timeIcon = isDaytime ? '☀️' : '🌙';
  const timeGradient = isDaytime
    ? 'from-amber-400 via-orange-400 to-amber-400'
    : 'from-blue-400 via-indigo-400 to-purple-400';

  const desktopNavbar = (
    <DesktopNavbar
      onHelpClick={onHelpClick}
      alertConfig={alertConfig}
      onToggleAlerts={onToggleAlerts}
      onToggleSound={onToggleSound}
      installState={installState}
      onInstallClick={onInstallClick}
      onNavigatePage={onNavigatePage}
    />
  );

  if (pageViewContent) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {desktopNavbar}
        <div
          className="flex-1 p-2.5 overflow-auto min-h-0"
          style={{ height: 'calc(100% - 44px)' }}
        >
          <div className="h-full min-h-0 w-full">
            {pageViewContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Desktop Navbar */}
      {desktopNavbar}

      {/* 2-Column Grid Layout: Left (20%) full height | Right nested grid */}
      <div
        className="flex-1 grid gap-2.5 p-2.5 overflow-auto"
        style={{
          gridTemplateColumns: '20% 80%',
          gridTemplateRows: '1fr',
          height: 'calc(100% - 44px)', // Subtract navbar height
        }}
      >
        {/* LEFT SIDEBAR - 20% width, full height */}
        <div className="flex flex-col gap-3 h-full min-h-0 overflow-auto">
          {/* Current Time Card */}
          <div className="glass-soft rounded-2xl p-3 shadow-xl shadow-black/30 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{timeIcon}</span>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 flex-1">Time</div>
            </div>
            <div className={`text-lg font-bold bg-gradient-to-r ${timeGradient} bg-clip-text text-transparent font-mono mb-0.5`}>
              {timeFormatted}
            </div>
            <div className="text-[10px] text-slate-400 mb-1.5">{dateFormatted}</div>
            <button
              onClick={onTimezoneSettingsClick}
              className="w-full px-2 py-1.5 text-[10px] font-medium rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 transition-all flex items-center justify-between gap-1"
            >
              <span className="truncate">{selectedTimezone.label}</span>
              <IconSettings className="w-3 h-3 flex-shrink-0" />
            </button>
          </div>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div className="glass-soft rounded-2xl p-3 shadow-xl shadow-black/30 flex-shrink-0">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Active Now</h3>
              <div className="space-y-2">
                {activeSessions.map((session) => {
                  const totalSeconds = session.elapsedSeconds + session.remainingSeconds;
                  const progressPercent = totalSeconds > 0 ? (session.elapsedSeconds / totalSeconds) * 100 : 0;

                  return (
                    <div
                      key={session.name}
                      className="glass-soft rounded-xl p-2 shadow-lg shadow-black/20"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${session.state === 'WARNING' ? 'animate-pulse' : ''}`}
                            style={{
                              backgroundColor: session.color,
                              boxShadow: `0 0 4px ${session.color}`,
                            }}
                          />
                          <span className="text-[10px] font-semibold text-slate-100 truncate">
                            {session.name}
                          </span>
                        </div>
                        <span
                          className="px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full"
                          style={{
                            backgroundColor: `${session.color}20`,
                            color: session.color,
                            border: `1px solid ${session.color}40`,
                          }}
                        >
                          {session.state}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1 bg-slate-900/60 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${progressPercent}%`,
                            backgroundColor: session.color,
                            boxShadow: `0 0 4px ${session.color}`,
                          }}
                        />
                      </div>

                      {/* Time Info */}
                      <div className="grid grid-cols-2 gap-1">
                        <div className="bg-slate-900/40 rounded-lg p-1 text-center">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500">Elapsed</div>
                          <div className="text-[10px] font-bold text-emerald-400 font-mono">
                            {formatSessionTime(session.elapsedSeconds)}
                          </div>
                        </div>
                        <div className="bg-slate-900/40 rounded-lg p-1 text-center">
                          <div className="text-[9px] uppercase tracking-wide text-slate-500">Left</div>
                          <div className="text-[10px] font-bold text-amber-400 font-mono">
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
            <div className="glass-soft rounded-2xl p-2 shadow-xl shadow-black/30 text-center flex-shrink-0">
              <p className="text-[10px] text-slate-400">No active sessions</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Check market hours</p>
            </div>
          )}

          {/* Pairs to Trade */}
          <div className="glass-soft rounded-2xl p-3 shadow-xl shadow-black/30 flex-1 min-h-0 overflow-y-auto">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Pairs to Trade</h3>
            <PairsToTrade
              activeSessions={activeSessions}
              sessionStatus={sessionStatus}
              currentTime={currentTime}
            />
          </div>
        </div>

        {/* RIGHT SIDE nested grid */}
        <div className="grid gap-3 overflow-hidden" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr auto' }}>
          <div className="overflow-hidden">
            <Suspense fallback={
              <div className="h-full glass-soft rounded-2xl flex items-center justify-center">
                <div className="text-xs text-slate-400">Loading chart...</div>
              </div>
            }>
              <ForexChart
                nowLine={nowLine}
                currentTimezoneLabel={selectedTimezone.label}
                timezoneOffset={selectedTimezone.offset}
                sessionStatus={sessionStatus}
                currentTime={currentTime}
                isDSTActive={currentDSTStatus}
                activeSessions={activeSessions_config}
                isAutoDetectDST={isAutoDetectDST}
                manualDSTOverride={manualDSTOverride}
                onToggleDSTOverride={onToggleDSTOverride}
                onAutoDetectToggle={onAutoDetectToggle}
              />
            </Suspense>
          </div>

          <div className="row-span-2 overflow-hidden">
            <Suspense fallback={
              <div className="h-full glass-soft rounded-2xl flex items-center justify-center">
                <div className="text-xs text-slate-400">Loading calendar...</div>
              </div>
            }>
              <EconomicCalendar selectedTimezone={selectedTimezone} />
            </Suspense>
          </div>

          <div className="col-span-2 overflow-hidden">
            <div className="h-full glass-soft rounded-2xl p-3 shadow-xl shadow-black/30">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">World Clocks</h3>
              <SessionClocks compact sessionStatus={sessionStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoDesktopLayout;
