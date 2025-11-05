import React, { useState, useEffect, useMemo } from 'react';
import ForexChart from './components/ForexChart';
import PWAInstall from './components/PWAInstall';
import SocialLinks from './components/SocialLinks';
import SessionClocks from './components/SessionClocks';
import { TIMEZONES, SESSIONS } from './constants';
import { Timezone, SessionData, ChartBarDetails } from './types';
import { IconClock, IconGlobe, IconTarget, IconBarChartBig, IconTradingFlow } from './components/icons';

export type SessionStatus = 'OPEN' | 'CLOSED' | 'WARNING';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const App: React.FC = () => {
  const getInitialTimezone = (): Timezone => {
    const userOffset = -new Date().getTimezoneOffset() / 60;
    const matchedTimezone = TIMEZONES.find(tz => tz.offset === userOffset);
    return matchedTimezone || TIMEZONES[0];
  };

  const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getInitialTimezone());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMoreTimezonesOpen, setIsMoreTimezonesOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPWAButton, setShowPWAButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every 1 second for real-time countdown
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPWAButton(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowPWAButton(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || (window.navigator as any)?.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      setShowPWAButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const { nowLine, activeSessions, sessionStatus } = useMemo(() => {
    const now = currentTime;
    const utcHours =
      now.getUTCHours() +
      now.getUTCMinutes() / 60 +
      now.getUTCSeconds() / 3600;

    let localTime = (utcHours + selectedTimezone.offset) % 24;
    localTime = localTime < 0 ? localTime + 24 : localTime;

    const currentlyActive: ({ name: string; color: string; type: 'main' | 'overlap' | 'killzone'; state: SessionStatus; elapsedSeconds: number; remainingSeconds: number })[] = [];
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
        return { isActive, status, elapsedSeconds, remainingSeconds };
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
        const { status, elapsedSeconds, remainingSeconds } = checkSession(bar.range[0], bar.range[1]);

        if (status) { // Only add if status is OPEN or WARNING
          let type: 'main' | 'overlap' | 'killzone' = 'main';
          if (key.startsWith('killzone')) type = 'killzone';
          else if (key.startsWith('overlap')) type = 'overlap';

          currentlyActive.push({ name: bar.name, color: bar.color, type, state: status, elapsedSeconds, remainingSeconds });
        }
      });
    });
    
    return { nowLine: localTime, activeSessions: currentlyActive, sessionStatus: statusMap };
  }, [currentTime, selectedTimezone]);
  
  const handleTimezoneChange = (tz: Timezone) => {
    setSelectedTimezone(tz);
    setIsMoreTimezonesOpen(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
          setIsInstalled(true);
        }

        setDeferredPrompt(null);
        setShowPWAButton(false);
      } catch (error) {
        console.error('Failed to install app:', error);
      }
    } else {
      alert('Install is handled by your browser menu. In Chrome: ⋮ > Install app.');
    }
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

  const displayedTimezones = TIMEZONES.slice(0, 3);
  const moreTimezones = TIMEZONES.slice(3);
  const timeFormatted = currentTime.toLocaleTimeString([], {
    timeZone: selectedTimezone.label,
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
        {/* CONTROL CARD: Title, Timezone Selector, Time Display + Live Sessions */}
        <div className="w-full mb-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-4 sm:p-5 shadow-lg shadow-black/20">
            {/* TOP ROW: Title (Left) + Timezone Selector (Right) */}
            <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-700/50">
              <div className="flex-1">
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
                <p className="text-xs sm:text-sm text-slate-300 font-light tracking-wide max-w-sm">
                  Real-time session tracking with killzones and overlaps
                </p>
              </div>

              {/* TOP RIGHT: Timezone Selector */}
              <div className="flex flex-wrap gap-1.5 justify-end">
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
                    ⋯
                  </button>
                  {isMoreTimezonesOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 p-2 z-50 w-40">
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

            {/* Big Time Display */}
            <div className="mb-3">
              <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 bg-clip-text text-transparent tracking-wider font-mono">
                {timeFormatted}
              </div>
              <div className="text-xs text-slate-400 font-light mt-1">{selectedTimezone.label}</div>
            </div>

            {/* Live Sessions List */}
            {activeSessions.length > 0 && (
              <div className="space-y-1.5">
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
                      <div key={session.name} className="flex items-center justify-between gap-2 px-2 py-1 bg-slate-800/20 rounded-lg">
                          <span className="text-xs font-mono text-slate-500 min-w-12">
                              {formatSessionTime(session.elapsedSeconds)}
                          </span>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={indicatorStyle}></span>
                          <span className="text-xs font-medium flex-1 text-center" style={textStyle}>{session.name}</span>
                          <span className="text-xs font-mono text-slate-500 min-w-12 text-right">
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

        {/* SESSION CLOCKS */}
        <section className="w-full mt-6 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl shadow-lg shadow-black/20 p-4 sm:p-5">
          <h2 className="text-xs font-semibold text-slate-300 mb-4 tracking-widest uppercase">Session Clocks</h2>
          <SessionClocks compact sessionStatus={sessionStatus} />
        </section>

        {/* FOOTER: Action Row with PWA + Social */}
        <footer className="w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-slate-500 text-xs font-light">
          <p>Data is illustrative. Always verify times with your broker. Not financial advice.</p>
          <div className="flex items-center gap-3">
            {/* PWA Install Button - Always Visible */}
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 hover:border-cyan-300/60 text-cyan-300 transition-all duration-300 backdrop-blur-md shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30"
              title={showPWAButton ? "Click to install the app" : "Install app via browser menu: ⋮ > Install app"}
              aria-label="Download and install app"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="hidden sm:inline">Install</span>
            </button>
            <PWAInstall />
            <SocialLinks />
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
