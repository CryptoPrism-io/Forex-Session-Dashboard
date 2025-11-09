import React, { useState, useEffect, useMemo } from 'react';
import ForexChart from './components/ForexChart';
import SocialLinks from './components/SocialLinks';
import SessionClocks from './components/SessionClocks';
import EconomicCalendar from './components/EconomicCalendar';
import InstallButton from './components/InstallButton';
import InstallModal from './components/InstallModal';
import AlertsToggleHeader from './components/AlertsToggleHeader';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useSessionAlerts } from './hooks/useSessionAlerts';
import { TIMEZONES, SESSIONS_STANDARD, SESSIONS_DAYLIGHT } from './constants';
import { Timezone, SessionData, ChartBarDetails } from './types';
import { IconClock, IconGlobe, IconTarget, IconBarChartBig, IconTradingFlow } from './components/icons';
import { isDSTActive } from './utils/dstUtils';

export type SessionStatus = 'OPEN' | 'CLOSED' | 'WARNING';

const App: React.FC = () => {
  const getInitialTimezone = (): Timezone => {
    const userOffset = -new Date().getTimezoneOffset() / 60;
    const matchedTimezone = TIMEZONES.find(tz => tz.offset === userOffset);
    return matchedTimezone || TIMEZONES[0];
  };

  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getInitialTimezone());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAutoDetectDST, setIsAutoDetectDST] = useState(true);
  const [manualDSTOverride, setManualDSTOverride] = useState<boolean | null>(null);
  const [activeView, setActiveView] = useState<'clocks' | 'calendar'>('clocks');
  const [isMoreTimezonesOpen, setIsMoreTimezonesOpen] = useState(false);

  // PWA Installation management
  const {
    installState,
    browserInfo,
    showInstallModal,
    setShowInstallModal,
    handleInstallClick,
    handleDismissModal,
  } = usePWAInstall();

  // Session Alerts management
  const {
    alertConfig,
    toggleAlerts,
    toggleSound,
  } = useSessionAlerts();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every 1 second for real-time countdown
    return () => clearInterval(timer);
  }, []);

  // Auto-detect timezone based on browser's native timezone
  useEffect(() => {
    const detectTimezoneFromBrowser = () => {
      try {
        // Use native JavaScript Intl API to get browser's timezone
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Find matching timezone by IANA name
        const detectedTz = TIMEZONES.find(tz => tz.ianaTimezone === browserTimezone);
        if (detectedTz) {
          setSelectedTimezone(detectedTz);
          return;
        }

        // Fallback: try matching by UTC offset if IANA match fails
        const now = new Date();
        const userOffset = -now.getTimezoneOffset() / 60;
        const matchedTz = TIMEZONES.find(tz => Math.abs(tz.offset - userOffset) < 0.1);
        if (matchedTz) {
          setSelectedTimezone(matchedTz);
        }
      } catch (error) {
        console.log('Timezone detection failed, using default:', error);
        // Silently fall back to default (UTC) timezone
      }
    };

    detectTimezoneFromBrowser();
  }, []);

  // Determine DST status: use manual override if set, otherwise auto-detect
  const currentDSTStatus = useMemo(() => {
    if (manualDSTOverride !== null) {
      return manualDSTOverride;
    }
    return isDSTActive(currentTime);
  }, [currentTime, manualDSTOverride]);

  // Select session data based on DST status
  const activeSessions_config = currentDSTStatus ? SESSIONS_DAYLIGHT : SESSIONS_STANDARD;

  const { nowLine, activeSessions, sessionStatus } = useMemo(() => {
    const now = currentTime;
    const utcHours =
      now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      now.getUTCSeconds() / 3600;

    let localTime = (utcHours + selectedTimezone.offset) % 24;
    localTime = localTime < 0 ? localTime + 24 : localTime;

    const currentlyActive: ({ name: string; color: string; type: 'main' | 'overlap' | 'killzone'; state: SessionStatus; elapsedSeconds: number; remainingSeconds: number; startUTC: number; endUTC: number })[] = [];
    const statusMap: { [key: string]: SessionStatus } = {};
    const fifteenMinutesInHours = 15 / 60;

    const checkSession = (s: number, e: number) => {
        // A session is active if the current time falls within its range, checking both "today" and "yesterday"
        // to correctly handle overnight sessions that cross the 00:00 UTC mark.
        const isActive = (utcHours >= s && utcHours < e) || (utcHours >= s - 24 && utcHours < e - 24);

        let status: SessionStatus | null = null;
        let elapsedSeconds = 0;
        let remainingSeconds = 0;

        // Determine adjusted start/end times for overnight sessions
        let adjustedStart = s;
        let adjustedEnd = e;

        // For overnight sessions, adjust if we're in the "next day" portion
        if (e > 24 && utcHours < s) {
          adjustedStart = s - 24;
          adjustedEnd = e - 24;
        }

        if (isActive) {
            status = 'OPEN';
            // Calculate elapsed and remaining time in seconds
            elapsedSeconds = (utcHours - adjustedStart) * 3600;
            remainingSeconds = (adjustedEnd - utcHours) * 3600;

            // Check if closing soon by calculating time to end for both possible session occurrences
            const timeToEnd = e - utcHours;
            const timeToEndYesterday = (e - 24) - utcHours;
            if ((timeToEnd > 0 && timeToEnd <= fifteenMinutesInHours) || (timeToEndYesterday > 0 && timeToEndYesterday <= fifteenMinutesInHours)) {
                status = 'WARNING';
            }
        } else {
            // Check if opening soon by calculating time to start
            const timeToStart = s - utcHours;
            const timeToStartYesterday = (s - 24) - utcHours;
            if ((timeToStart > 0 && timeToStart <= fifteenMinutesInHours) || (timeToStartYesterday > 0 && timeToStartYesterday <= fifteenMinutesInHours)) {
                status = 'WARNING';
                // For pre-start countdown, show negative countdown on both sides
                const timeUntilStart = timeToStart > 0 ? timeToStart : timeToStartYesterday;
                elapsedSeconds = -(timeUntilStart * 3600);
                remainingSeconds = -(timeUntilStart * 3600);
            }
        }
        return { isActive, status, elapsedSeconds, remainingSeconds, startUTC: s, endUTC: e };
    };

    activeSessions_config.forEach(session => {
      // Calculate status for main sessions (for the chart's Y-axis indicators)
      const { main, name } = session;
      if (main) {
        const { isActive, status } = checkSession(main.range[0], main.range[1]);
        statusMap[name] = status || (isActive ? 'OPEN' : 'CLOSED');
      }

      // Calculate currently active/warning sessions for the header card
      Object.entries(session).forEach(([key, prop]) => {
        if (key === 'name' || typeof prop !== 'object' || prop === null || !('key' in prop)) return;

        const bar = prop as ChartBarDetails & { range: [number, number] };
        const { status, elapsedSeconds, remainingSeconds, startUTC, endUTC } = checkSession(bar.range[0], bar.range[1]);

        if (status) { // Only add if status is OPEN or WARNING
          let type: 'main' | 'overlap' | 'killzone' = 'main';
          if (key.startsWith('killzone')) type = 'killzone';
          else if (key.startsWith('overlap')) type = 'overlap';

          currentlyActive.push({ name: bar.name, color: bar.color, type, state: status, elapsedSeconds, remainingSeconds, startUTC, endUTC });
        }
      });
    });

    return { nowLine: localTime, activeSessions: currentlyActive, sessionStatus: statusMap };
  }, [currentTime, selectedTimezone, activeSessions_config]);
  
  const handleTimezoneChange = (tz: Timezone) => {
    setSelectedTimezone(tz);
    setIsMoreTimezonesOpen(false);
  };


  // Format session elapsed/remaining time in HH MM SS format
  const formatSessionTime = (seconds: number): string => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);

    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = Math.floor(absSeconds % 60);

    const sign = isNegative ? '-' : '';
    return `${sign}${hours}h ${minutes}m ${secs}s`;
  };

  // Format UTC hours to HH:MM in user's timezone
  const formatTimeInTimezone = (utcHours: number): string => {
    let localHours = (utcHours + selectedTimezone.offset) % 24;
    localHours = localHours < 0 ? localHours + 24 : localHours;

    const hours = Math.floor(localHours);
    const minutes = Math.floor((localHours - hours) * 60);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const timeFormatted = currentTime.toLocaleTimeString([], {
    timeZone: selectedTimezone.ianaTimezone || selectedTimezone.label,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="min-h-screen font-sans text-slate-200" style={{
      background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Portrait Mode Blocker for Mobile */}
      <div className="portrait-blocker bg-gradient-to-br from-slate-950 to-slate-900" style={{
        position: 'fixed',
        inset: 0,
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}>
        <div className="text-center space-y-6 px-6">
          <div className="text-6xl">📱</div>
          <h1 className="text-3xl font-bold text-cyan-400">Rotate Your Device</h1>
          <p className="text-lg text-slate-300 max-w-sm">
            This application is optimized for <span className="font-semibold text-cyan-300">landscape mode</span> on mobile devices for the best trading experience.
          </p>
          <p className="text-sm text-slate-400">
            Please rotate your device to landscape orientation to continue.
          </p>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center">
        {/* HEADER ROW: Left Section (Title/Time/Timezone) + Right Section (Clocks) */}
        <div className="w-full mb-6 flex gap-6">
          {/* LEFT SECTION: Title, Subtitle, Time, and Timezone Selector */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/20">
            {/* TOP ROW: Title and Timezone Selector */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Left: Icon and Title */}
              <div className="flex items-center gap-3">
                {(installState === 'available' || installState === 'dismissed') ? (
                  <button
                    onClick={handleInstallClick}
                    className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 cursor-pointer transition-all duration-300 hover:scale-110 hover:drop-shadow-lg active:scale-95"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'drop-shadow(0 0 16px rgba(34, 211, 238, 0.8))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))';
                    }}
                    title="Click to install the app"
                    aria-label="Download and install app"
                  >
                    <IconTradingFlow className="w-full h-full text-cyan-400" />
                  </button>
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0" style={{
                    filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))'
                  }}>
                    <IconTradingFlow className="w-full h-full text-cyan-400" />
                  </div>
                )}

                <h1
                  className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
                  style={{
                    textShadow: '0 0 30px rgba(34, 211, 238, 0.3), 0 0 60px rgba(59, 130, 246, 0.2)',
                    filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.25))'
                  }}
                >
                  Global FX Trading Sessions
                </h1>
              </div>

              {/* Right: Timezone Selector */}
              <div className="relative flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  {/* Current Selected Timezone */}
                  <button
                    className="px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-300 backdrop-blur-md whitespace-nowrap bg-cyan-500/30 border border-cyan-400/60 text-cyan-100 shadow-md shadow-cyan-500/20"
                  >
                    {selectedTimezone.label.includes('UTC+5:30') ? 'IST' : selectedTimezone.label}
                  </button>

                  {/* UTC Button (if not already selected) */}
                  {selectedTimezone.label !== 'UTC' && (
                    <button
                      onClick={() => handleTimezoneChange(TIMEZONES.find(tz => tz.label === 'UTC')!)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-300 backdrop-blur-md whitespace-nowrap bg-slate-700/20 border border-slate-700/40 hover:bg-slate-700/40 hover:border-slate-600/60 text-slate-300"
                    >
                      UTC
                    </button>
                  )}

                  {/* More Button */}
                  <button
                    onClick={() => setIsMoreTimezonesOpen(!isMoreTimezonesOpen)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-300 backdrop-blur-md whitespace-nowrap bg-slate-700/20 border border-slate-700/40 hover:bg-slate-700/40 hover:border-slate-600/60 text-slate-300"
                  >
                    More {isMoreTimezonesOpen ? '▲' : '▼'}
                  </button>
                </div>

                {/* Timezone Dropdown */}
                {isMoreTimezonesOpen && (
                  <div className="absolute top-full mt-2 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl p-2 shadow-lg shadow-black/30">
                    <div className="flex gap-1.5">
                      {TIMEZONES.filter(tz => ['GMT', 'EST', 'PST', 'BST'].includes(tz.label)).map(tz => {
                        return (
                          <button
                            key={tz.label}
                            onClick={() => handleTimezoneChange(tz)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                              selectedTimezone.label === tz.label
                                ? 'bg-cyan-500/30 border border-cyan-400/60 text-cyan-100'
                                : 'bg-slate-800/40 hover:bg-slate-700/60 text-slate-300'
                            }`}
                          >
                            {tz.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-light tracking-wide mb-4">
              Real-time session tracking with killzones and overlaps
            </p>

            {/* Big Time Display */}
            <div className="mb-6">
              <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 bg-clip-text text-transparent tracking-wider font-mono">
                {timeFormatted}
              </div>
              <div className="text-xs text-slate-400 font-light mt-1">{selectedTimezone.label}</div>
            </div>

            {/* Live Sessions List */}
            {activeSessions.length > 0 && (
              <div className="space-y-1.5 border-t border-slate-700/30 pt-4">
                {/* Column Headers */}
                <div className="flex items-center justify-between gap-3 px-2 py-1 mb-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-20">Time</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex-1">Session</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-16 text-right">Elapsed</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-16 text-right">Remaining</span>
                </div>

                {activeSessions.map(session => {
                  let textStyle: React.CSSProperties = {};
                  let indicatorStyle: React.CSSProperties = {};

                  if (session.type === 'killzone') {
                    const color = 'hsl(0, 100%, 65%)';
                    textStyle = { color: 'hsl(0, 100%, 80%)', textShadow: `0 0 8px ${color}` };
                    indicatorStyle = { backgroundColor: color, boxShadow: `0 0 8px ${color}`};
                  } else if (session.type === 'overlap') {
                    const color = 'hsl(30, 100%, 65%)';
                    textStyle = { color: 'hsl(30, 100%, 80%)', textShadow: `0 0 8px ${color}` };
                    indicatorStyle = { backgroundColor: color, boxShadow: `0 0 8px ${color}`};
                  } else { // main session
                    textStyle = { color: session.color };
                    indicatorStyle = { backgroundColor: session.color, boxShadow: `0 0 6px ${session.color}`};
                  }

                  if (session.state === 'WARNING') {
                    indicatorStyle.animation = 'pulse-glow 1.5s infinite';
                  }

                  return (
                      <div key={session.name} className="flex items-center justify-between gap-3 px-2 py-1.5 bg-slate-800/20 rounded-lg">
                          {/* Start - End Time (Left) */}
                          <span className="text-xs font-light text-slate-400 min-w-20">
                              {formatTimeInTimezone(session.startUTC)} – {formatTimeInTimezone(session.endUTC)}
                          </span>

                          {/* Session Name with Indicator (Center) */}
                          <div className="flex items-center gap-1.5 flex-1">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={indicatorStyle}></span>
                              <span className="text-xs font-medium" style={textStyle}>{session.name}</span>
                          </div>

                          {/* Elapsed Time (Right) */}
                          <span className="text-xs font-light text-slate-400 min-w-16 text-right">
                              {formatSessionTime(session.elapsedSeconds)}
                          </span>

                          {/* Remaining Time (Far Right) */}
                          <span className="text-xs font-light text-slate-400 min-w-16 text-right">
                              {formatSessionTime(session.remainingSeconds)}
                          </span>
                      </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SECTION: Clocks/Calendar Container with Buttons */}
          <div className="min-w-[50%] max-h-[75vh] bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-4 shadow-lg shadow-black/20 flex flex-col">
            {/* Buttons Row */}
            <div className="flex gap-2 mb-4 flex-shrink-0">
              <button
                onClick={() => setActiveView('clocks')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeView === 'clocks'
                    ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600/60'
                }`}
              >
                World Clock
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeView === 'calendar'
                    ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                    : 'bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600/60'
                }`}
              >
                Economic Calendar
              </button>
            </div>
            {/* Conditional Render: Clocks or Calendar */}
            <div className="flex-1 overflow-y-auto">
              {activeView === 'clocks' ? (
                <SessionClocks compact sessionStatus={sessionStatus} />
              ) : (
                <EconomicCalendar selectedTimezone={selectedTimezone} />
              )}
            </div>
          </div>
        </div>

        {/* SESSION TIMELINE */}
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
          onToggleDSTOverride={(override) => setManualDSTOverride(override)}
          onAutoDetectToggle={(enabled) => {
            setIsAutoDetectDST(enabled);
            if (enabled) setManualDSTOverride(null);
          }}
        />

        {/* FOOTER: Action Row with PWA + Social */}
        <footer className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-slate-500 text-xs font-light">
          <p>Data is illustrative. Always verify times with your broker. Not financial advice.</p>
          <div className="flex items-center gap-3">
            <AlertsToggleHeader
              alertConfig={alertConfig}
              onToggle={toggleAlerts}
              onToggleSound={toggleSound}
            />
            <InstallButton
              onClick={handleInstallClick}
              show={installState === 'available' || installState === 'dismissed'}
              hasNativePrompt={installState === 'available'}
            />
            <SocialLinks />
          </div>
        </footer>
      </main>

      {/* PWA Installation Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={handleDismissModal}
        browserInfo={browserInfo}
      />
    </div>
  );
};

export default App;
