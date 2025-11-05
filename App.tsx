import React, { useState, useEffect, useMemo } from 'react';
import ForexChart from './components/ForexChart';
import SocialLinks from './components/SocialLinks';
import SessionClocks from './components/SessionClocks';
import InstallButton from './components/InstallButton';
import InstallModal from './components/InstallModal';
import AlertsToggle from './components/AlertsToggle';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useSessionAlerts } from './hooks/useSessionAlerts';
import { TIMEZONES, MAJOR_TIMEZONES, SESSIONS } from './constants';
import { Timezone, SessionData, ChartBarDetails } from './types';
import { IconClock, IconGlobe, IconTarget, IconBarChartBig, IconTradingFlow } from './components/icons';

export type SessionStatus = 'OPEN' | 'CLOSED' | 'WARNING';

const App: React.FC = () => {
  const getInitialTimezone = (): Timezone => {
    const userOffset = -new Date().getTimezoneOffset() / 60;
    const matchedTimezone = TIMEZONES.find(tz => tz.offset === userOffset);
    return matchedTimezone || TIMEZONES[0];
  };

  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getInitialTimezone());
  const [currentTime, setCurrentTime] = useState(new Date());
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

  // Auto-detect timezone based on IP geolocation
  useEffect(() => {
    const detectTimezoneFromIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.timezone) {
          // Find timezone by IANA timezone name
          const detectedTz = TIMEZONES.find(tz => tz.ianaTimezone === data.timezone);
          if (detectedTz) {
            setSelectedTimezone(detectedTz);
            return;
          }
        }

        // Fallback: try matching by offset if IANA match fails
        if (data.utc_offset) {
          const offsetHours = parseInt(data.utc_offset.split(':')[0]);
          const offsetMinutes = parseInt(data.utc_offset.split(':')[1]) / 60 || 0;
          const totalOffset = offsetHours + offsetMinutes;

          const matchedTz = TIMEZONES.find(tz => Math.abs(tz.offset - totalOffset) < 0.1);
          if (matchedTz) {
            setSelectedTimezone(matchedTz);
          }
        }
      } catch (error) {
        console.log('IP geolocation failed, using device timezone:', error);
        // Silently fall back to device timezone
      }
    };

    detectTimezoneFromIP();
  }, []);

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

    SESSIONS.forEach(session => {
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
  }, [currentTime, selectedTimezone]);
  
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

  // Display only UTC, GMT, and the user's selected timezone
  const utcTz = TIMEZONES.find(tz => tz.label === 'UTC');
  const gmtTz = TIMEZONES.find(tz => tz.label === 'GMT');

  const displayedTimezones: Timezone[] = [];
  if (utcTz) displayedTimezones.push(utcTz);
  if (gmtTz) displayedTimezones.push(gmtTz);

  // Add user's selected timezone if it's not already in the list
  if (selectedTimezone.label !== 'UTC' && selectedTimezone.label !== 'GMT') {
    displayedTimezones.push(selectedTimezone);
  }

  // Major trading timezones for the dropdown (8-10 important ones)
  const moreTimezones = MAJOR_TIMEZONES.filter(tz =>
    tz.label !== selectedTimezone.label
  );
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
      <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col items-center">
        {/* HEADER ROW: Left Section (Title/Time/Timezone) + Right Section (Clocks) */}
        <div className="w-full mb-6 flex gap-6">
          {/* LEFT SECTION: Title, Subtitle, Time, and Timezone Selector */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/20">
            {/* Title and Subtitle */}
            <div className="flex items-center gap-3 mb-2">
              {showPWAButton && !isInstalled ? (
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

            {/* Timezone Selector */}
            <div className="flex flex-wrap gap-1.5">
                {displayedTimezones.map(tz => (
                  <button
                    key={tz.label}
                    onClick={() => handleTimezoneChange(tz)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-300 backdrop-blur-md ${
                      selectedTimezone.label === tz.label
                        ? 'bg-cyan-500/30 border border-cyan-400/60 text-cyan-100 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-700/20 border border-slate-700/40 hover:bg-slate-700/40 hover:border-slate-600/60 text-slate-300'
                    }`}
                  >
                    {tz.label}
                  </button>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setIsMoreTimezonesOpen(!isMoreTimezonesOpen)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-700/20 border border-slate-700/40 hover:bg-slate-700/40 hover:border-slate-600/60 text-slate-300 transition-all duration-300 backdrop-blur-md"
                    aria-label="More timezones"
                  >
                    ...
                  </button>
                  {isMoreTimezonesOpen && (
                    <div className="absolute top-full mt-2 left-0 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 p-2 z-[9999] w-40">
                      {moreTimezones.map(tz => (
                         <button
                            key={tz.label}
                            onClick={() => handleTimezoneChange(tz)}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-all duration-150 ${
                                selectedTimezone.label === tz.label
                                  ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-400/50'
                                  : 'hover:bg-slate-700/40 text-slate-300'
                            }`}
                          >
                           {tz.label}
                         </button>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          </div>

          {/* RIGHT SECTION: Session Clocks */}
          <div className="flex justify-end">
            <SessionClocks compact sessionStatus={sessionStatus} />
          </div>
        </div>

        {/* SESSIONS LIST CARD */}
        <div className="w-full mb-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/20">

            {/* Live Sessions List */}
            {activeSessions.length > 0 && (
              <div className="space-y-1.5">
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
        </div>

        {/* SESSION TIMELINE */}
        <ForexChart
          nowLine={nowLine}
          currentTimezoneLabel={selectedTimezone.label}
          timezoneOffset={selectedTimezone.offset}
          sessionStatus={sessionStatus}
        />

        {/* FOOTER: Action Row with PWA + Social */}
        <footer className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-slate-500 text-xs font-light">
          <p>Data is illustrative. Always verify times with your broker. Not financial advice.</p>
          <div className="flex items-center gap-3">
            <AlertsToggle
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
