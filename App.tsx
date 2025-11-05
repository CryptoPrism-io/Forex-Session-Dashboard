import React, { useState, useEffect, useMemo } from 'react';
import ForexChart from './components/ForexChart';
import PWAInstall from './components/PWAInstall';
import SocialLinks from './components/SocialLinks';
import SessionClocks from './components/SessionClocks';
import { TIMEZONES, SESSIONS } from './constants';
import { Timezone, SessionData, ChartBarDetails } from './types';
import { IconClock, IconGlobe, IconTarget, IconBarChartBig } from './components/icons';

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every 1 second for real-time countdown
    return () => clearInterval(timer);
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
      <main className="w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col items-center">
        <header className="w-full text-left mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight" style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Forex Session Map
          </h1>
          <p className="text-xs text-slate-400 font-light">
            Global market session timings and liquidity windows
          </p>
        </header>

        <div className="mb-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
          {/* LEFT: Timezone Selector */}
          <div className="flex items-center gap-2 relative flex-wrap justify-center">
            <IconGlobe className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-300 hidden sm:inline">Timezone:</span>
            {displayedTimezones.map(tz => (
              <button
                key={tz.label}
                onClick={() => handleTimezoneChange(tz)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 backdrop-blur-md ${
                  selectedTimezone.label === tz.label
                    ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-100 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300'
                }`}
              >
                {tz.label}
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setIsMoreTimezonesOpen(!isMoreTimezonesOpen)}
                className="w-8 h-8 flex items-center justify-center bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 rounded-lg transition-all duration-300 backdrop-blur-md"
                aria-label="More timezones"
              >
                <span className="text-slate-300 font-light">⋯</span>
              </button>
              {isMoreTimezonesOpen && (
                <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 p-2 z-10 w-32">
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

          {/* CENTER: Time Display Card */}
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-2xl border border-slate-700/30 rounded-2xl p-4 flex items-center gap-6 shadow-2xl shadow-black/30 hover:border-slate-600/50 transition-all duration-300">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent tracking-wider">{timeFormatted}</div>
              <div className="text-xs text-slate-400 font-light mt-1">{selectedTimezone.label}</div>
            </div>
            {activeSessions.length > 0 && <div className="w-px h-12 bg-gradient-to-b from-slate-700/50 to-transparent"></div>}
            <div className="flex flex-col gap-2.5">
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
                    <div key={session.name} className="flex items-center gap-2 min-w-fit">
                        {/* Elapsed Time - LEFT */}
                        <span className="text-xs font-mono text-slate-400">
                            {formatSessionTime(session.elapsedSeconds)}
                        </span>

                        {/* Colored Indicator Dot */}
                        <span className="w-2.5 h-2.5 rounded-full" style={indicatorStyle}></span>

                        {/* Session Name - CENTER */}
                        <span className="text-xs font-medium" style={textStyle}>{session.name}</span>

                        {/* Remaining Time - RIGHT */}
                        <span className="text-xs font-mono text-slate-400">
                            {formatSessionTime(session.remainingSeconds)}
                        </span>
                    </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: PWA Install + Social Links */}
          <div className="flex items-center gap-3">
            <PWAInstall />
            <SocialLinks />
          </div>
        </div>

        <ForexChart
          nowLine={nowLine}
          currentTimezoneLabel={selectedTimezone.label}
          timezoneOffset={selectedTimezone.offset}
          sessionStatus={sessionStatus}
        />

        <section className="w-full mt-8 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-2xl shadow-2xl shadow-black/30 p-5 sm:p-7">
          <h2 className="text-sm font-semibold text-slate-100 mb-4 tracking-wide uppercase">Session Clocks</h2>
          <SessionClocks compact />
        </section>

        <footer className="text-center mt-12 text-slate-500 text-xs font-light">
          <p>Data is illustrative. Always verify times with your broker. Not financial advice.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
