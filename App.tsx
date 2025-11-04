import React, { useState, useEffect, useMemo } from 'react';
import ForexChart from './components/ForexChart';
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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 30); // Update every 30 seconds for responsiveness
    return () => clearInterval(timer);
  }, []);

  const { nowLine, activeSessions, sessionStatus } = useMemo(() => {
    const now = currentTime;
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;

    let localTime = (utcHours + selectedTimezone.offset) % 24;
    localTime = localTime < 0 ? localTime + 24 : localTime;

    const currentlyActive: ({ name: string; color: string; type: 'main' | 'overlap' | 'killzone'; state: SessionStatus })[] = [];
    const statusMap: { [key: string]: SessionStatus } = {};
    const fifteenMinutesInHours = 15 / 60;

    const checkSession = (s: number, e: number) => {
        // A session is active if the current time falls within its range, checking both "today" and "yesterday"
        // to correctly handle overnight sessions that cross the 00:00 UTC mark.
        const isActive = (utcHours >= s && utcHours < e) || (utcHours >= s - 24 && utcHours < e - 24);
        
        let status: SessionStatus | null = null;
        if (isActive) {
            status = 'OPEN';
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
            }
        }
        return { isActive, status };
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
        const { status } = checkSession(bar.range[0], bar.range[1]);

        if (status) { // Only add if status is OPEN or WARNING
          let type: 'main' | 'overlap' | 'killzone' = 'main';
          if (key.startsWith('killzone')) type = 'killzone';
          else if (key.startsWith('overlap')) type = 'overlap';
          
          currentlyActive.push({ name: bar.name, color: bar.color, type, state: status });
        }
      });
    });
    
    return { nowLine: localTime, activeSessions: currentlyActive, sessionStatus: statusMap };
  }, [currentTime, selectedTimezone]);
  
  const handleTimezoneChange = (tz: Timezone) => {
    setSelectedTimezone(tz);
    setIsMoreTimezonesOpen(false);
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
    <div className="bg-slate-950 text-slate-200 min-h-screen font-sans p-4 sm:p-8 flex flex-col items-center">
      <main className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-cyan-400 mb-1 tracking-wide">
            Forex Session Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Global market session timings and liquidity windows
          </p>
        </header>

        <div className="mb-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
          <div className="flex items-center gap-2 relative flex-wrap justify-center">
            <IconGlobe className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-300 hidden sm:inline">Timezone:</span>
            {displayedTimezones.map(tz => (
              <button
                key={tz.label}
                onClick={() => handleTimezoneChange(tz)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                  selectedTimezone.label === tz.label
                    ? 'bg-cyan-500 text-white shadow-lg'
                    : 'bg-slate-700/50 hover:bg-slate-600/70 text-slate-300'
                }`}
              >
                {tz.label}
              </button>
            ))}
            <div className="relative">
              <button 
                onClick={() => setIsMoreTimezonesOpen(!isMoreTimezonesOpen)}
                className="w-8 h-8 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/70 rounded-full transition-all duration-200"
                aria-label="More timezones"
              >
                ...
              </button>
              {isMoreTimezonesOpen && (
                <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-10 w-28">
                  {moreTimezones.map(tz => (
                     <button
                        key={tz.label}
                        onClick={() => handleTimezoneChange(tz)}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors duration-150 ${
                            selectedTimezone.label === tz.label ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700'
                        }`}
                      >
                       {tz.label}
                     </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-lg border border-slate-700/50 rounded-lg p-3 flex items-center gap-4 shadow-xl">
             <div className="text-center">
                <div className="text-3xl font-bold text-green-400 tracking-wider">{timeFormatted}</div>
                <div className="text-xs text-slate-400">{selectedTimezone.label}</div>
            </div>
            {activeSessions.length > 0 && <div className="w-px h-10 bg-slate-700"></div>}
            <div className="flex flex-col gap-1.5 pr-2">
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
                      <div key={session.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={indicatorStyle}></span>
                          <span className="text-xs font-medium" style={textStyle}>{session.name}</span>
                      </div>
                  );
                })}
            </div>
          </div>
        </div>

        <ForexChart
          nowLine={nowLine}
          currentTimezoneLabel={selectedTimezone.label}
          timezoneOffset={selectedTimezone.offset}
          sessionStatus={sessionStatus}
        />

        <footer className="text-center mt-12 text-slate-500 text-xs">
          <p>Data is illustrative. Always verify times with your broker. Not financial advice.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;