import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarErrorBoundary from './components/CalendarErrorBoundary';
import SocialLinks from './components/SocialLinks';
import SessionClocks from './components/SessionClocks';
import InstallButton from './components/InstallButton';
import InstallModal from './components/InstallModal';
import AlertsToggleHeader from './components/AlertsToggleHeader';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useSessionAlerts } from './hooks/useSessionAlerts';
import { useReducedMotion } from './hooks/useReducedMotion';
import { TIMEZONES, SESSIONS_STANDARD, SESSIONS_DAYLIGHT } from './constants';
import { Timezone, SessionData, ChartBarDetails } from './types';
import { IconClock, IconGlobe, IconTarget, IconBarChartBig, IconTradingFlow, IconMenu, IconX, IconCalendarTab, IconChartsTab, IconGuideTab, IconWorldClockTab, IconSettings } from './components/icons';
import { PopoverMenu, MenuButton } from './components/Menu';
import { isDSTActive } from './utils/dstUtils';

const ForexChart = lazy(() => import('./components/ForexChart'));
const EconomicCalendar = lazy(() => import('./components/EconomicCalendar'));
const SessionGuide = lazy(() => import('./components/SessionGuide'));
const WorldClockPanel = lazy(() => import('./components/WorldClockPanel'));

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
  const [timezoneSearchQuery, setTimezoneSearchQuery] = useState('');
  const [isTimezoneMenuOpen, setIsTimezoneMenuOpen] = useState(false);
  const [manualDSTOverride, setManualDSTOverride] = useState<boolean | null>(null);
  const [activeView, setActiveView] = useState<'clocks' | 'calendar' | 'charts' | 'guide'>('calendar');
  const [isMoreTimezonesOpen, setIsMoreTimezonesOpen] = useState(false);

  // Initialize left pane state from localStorage, default to closed on mobile
  const [leftPaneOpen, setLeftPaneOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('leftPaneOpen');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read localStorage:', e);
      // Clear corrupted data
      localStorage.removeItem('leftPaneOpen');
    }
    // Default: closed on mobile, open on desktop
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  });

  // Persist left pane state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('leftPaneOpen', JSON.stringify(leftPaneOpen));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [leftPaneOpen]);

  // PWA Installation management
  const {
    installState,
    browserInfo,
    showInstallModal,
    setShowInstallModal,
    handleInstallClick,
    handleDismissModal,
  } = usePWAInstall();

  // Reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Animation variants for left pane - memoized to handle reduced motion dependency
  const leftPaneVariants = useMemo(() => ({
    // Mobile: Slide in from left
    openMobile: {
      x: 0,
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring', stiffness: 300, damping: 30 }
    },
    closedMobile: {
      x: '-100%',
      opacity: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring', stiffness: 300, damping: 30 }
    },
    // Desktop: Always visible (no x translation)
    desktop: {
      x: 0,
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring', stiffness: 300, damping: 30 }
    }
  }), [prefersReducedMotion]);

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

  // Session Alerts management (share the same session definition used for rendering)
  const {
    alertConfig,
    toggleAlerts,
    toggleSound,
  } = useSessionAlerts(activeSessions_config);

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
      <main className="w-full max-w-7xl mx-auto p-3 sm:p-4 flex flex-col items-center">
        {/* LAYOUT: Bento Grid - Vertical on Mobile, Horizontal on Desktop */}
        <div className="w-full mb-3 grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-3 h-auto md:h-[85vh]">
          {/* LEFT PANE: Title, Subtitle, Time, and Timezone Selector - Bento Grid Item */}
          <motion.div
            className={`bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-3 sm:p-4 shadow-lg shadow-black/20 flex flex-col ${leftPaneOpen ? 'block' : 'hidden md:block'} md:overflow-y-auto overflow-visible h-auto md:h-full`}
            variants={leftPaneVariants}
            initial={false}
            animate={
              typeof window !== 'undefined' && window.innerWidth < 768
                ? leftPaneOpen
                  ? 'openMobile'
                  : 'closedMobile'
                : 'desktop'
            }
            drag={typeof window !== 'undefined' && window.innerWidth < 768 && leftPaneOpen ? 'x' : false}
            dragConstraints={{ left: -300, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              // Close if dragged left more than 100px or velocity is high
              if (offset.x < -100 || velocity.x < -500) {
                setLeftPaneOpen(false);
              }
            }}
          >
            {/* TOP ROW: Title Only */}
            <div className="mb-2">
              <h1
                className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap"
                style={{
                  textShadow: '0 0 15px rgba(34, 211, 238, 0.3), 0 0 30px rgba(59, 130, 246, 0.2)',
                  filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.25))'
                }}
              >
                FX_Saarthi
              </h1>
              <p className="text-xs text-slate-300 font-light tracking-wide mt-1">
                Real-time session tracking with killzones and overlaps
              </p>
            </div>

            {/* Big Time Display */}
            <div className="mb-4 space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="text-[10px] uppercase tracking-[0.45em] text-slate-500">
                  Current Time
                </div>
                {/* Settings Menu for Timezone */}
                <PopoverMenu
                  trigger={
                    <div className="relative">
                      <IconSettings
                        className={`
                          w-4 h-4 transition-all duration-300
                          ${isTimezoneMenuOpen
                            ? 'text-cyan-400 rotate-90 scale-110'
                            : 'text-blue-400/70 hover:text-cyan-400 hover:scale-105'
                          }
                        `}
                        style={{
                          filter: isTimezoneMenuOpen
                            ? 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.6))'
                            : 'none'
                        }}
                      />
                    </div>
                  }
                  triggerClassName={`
                    p-1.5 rounded-lg transition-all duration-300
                    ${isTimezoneMenuOpen
                      ? 'bg-cyan-500/20 ring-2 ring-cyan-400/40'
                      : 'hover:bg-blue-500/10 focus:ring-2 focus:ring-blue-400/30'
                    }
                  `}
                  menuClassName="w-64"
                  isOpen={isTimezoneMenuOpen}
                  onOpenChange={setIsTimezoneMenuOpen}
                >
                  <div className="p-3 space-y-2">
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-semibold">
                      Select Timezone
                    </div>

                    {/* Quick Select: UTC and IST */}
                    <div className="space-y-1.5 mb-3">
                      <MenuButton
                        label="UTC (GMT)"
                        onClick={() => setSelectedTimezone(TIMEZONES.find(tz => tz.label === 'UTC') || TIMEZONES[0])}
                        isActive={selectedTimezone.label === 'UTC'}
                      />
                      <MenuButton
                        label="IST (UTC+5:30)"
                        onClick={() => setSelectedTimezone(TIMEZONES.find(tz => tz.label === 'IST (UTC+5:30)') || TIMEZONES[0])}
                        isActive={selectedTimezone.label === 'IST (UTC+5:30)'}
                      />
                    </div>

                    {/* All Timezones Dropdown */}
                    <details className="group border-t border-slate-700/50 pt-3">
                      <summary className="cursor-pointer text-xs text-slate-300 hover:text-cyan-400 transition-colors list-none flex items-center justify-between">
                        <span>More Timezones</span>
                        <span className="group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-2 space-y-2">
                        {/* Search Box */}
                        <input
                          type="text"
                          placeholder="Search timezone..."
                          value={timezoneSearchQuery}
                          onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-slate-800/50 border border-slate-600/50 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                        />
                        {/* Filtered Timezone List */}
                        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                          {TIMEZONES.filter(tz =>
                            tz.label.toLowerCase().includes(timezoneSearchQuery.toLowerCase())
                          ).map((tz) => (
                            <MenuButton
                              key={tz.label}
                              label={tz.label}
                              onClick={() => {
                                setSelectedTimezone(tz);
                                setTimezoneSearchQuery(''); // Clear search after selection
                              }}
                              isActive={selectedTimezone.label === tz.label}
                            />
                          ))}
                          {/* No results message */}
                          {TIMEZONES.filter(tz =>
                            tz.label.toLowerCase().includes(timezoneSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <p className="text-xs text-slate-500 text-center py-4">
                              No timezones found
                            </p>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                </PopoverMenu>
              </div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-green-400 bg-clip-text text-transparent tracking-wider font-mono">
                {timeFormatted}
              </div>
              <div className="text-[11px] text-slate-400 font-light mt-0.5">{selectedTimezone.label}</div>
            </div>

            {/* Live Sessions List */}
            {activeSessions.length > 0 && (
              <div className="space-y-1 border-t border-slate-700/30 pt-2.5 flex-1 overflow-y-auto">
                {/* Active Sessions */}
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
                      <div key={session.name} className="bg-slate-800/20 rounded-lg overflow-hidden">
                          {/* Row 1: Session Name + Start/End Time */}
                          <div className="flex items-center justify-between gap-2 px-1.5 py-1">
                              {/* Session Name with Indicator */}
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={indicatorStyle}></span>
                                  <span className="text-xs font-medium truncate" style={textStyle}>{session.name}</span>
                              </div>

                              {/* Start - End Time */}
                              <span className="text-xs font-light text-slate-400 flex-shrink-0">
                                  {formatTimeInTimezone(session.startUTC)} – {formatTimeInTimezone(session.endUTC)}
                              </span>
                          </div>

                          {/* Row 2: Elapsed & Remaining Time */}
                          <div className="flex items-center justify-between gap-2 px-1.5 py-0.5 bg-slate-800/40 border-t border-slate-700/20">
                              <span className="text-[10px] font-light text-slate-500">
                                  ⏱ {formatSessionTime(session.elapsedSeconds)}
                              </span>
                              <span className="text-[10px] font-light text-slate-500">
                                  ⏱ {formatSessionTime(session.remainingSeconds)}
                              </span>
                          </div>
                      </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* RIGHT PANE: Main Content Area with 4 Tabs - Bento Grid Item */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-3 shadow-lg shadow-black/20 flex flex-col overflow-hidden h-[60vh] md:h-full">
            {/* Header with Toggle Button and Tab Buttons */}
            <div className="flex items-center gap-2 mb-2.5 flex-shrink-0">
              {/* Collapse/Expand Toggle Button */}
              <button
                onClick={() => setLeftPaneOpen(!leftPaneOpen)}
                className="p-2.5 rounded-lg transition-all duration-200 bg-slate-700/20 border border-slate-700/40 hover:bg-slate-700/40 hover:border-slate-600/60 text-slate-300 md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={leftPaneOpen ? "Close info panel" : "Open info panel"}
              >
                {leftPaneOpen ? <IconX className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
              </button>

              {/* 4-Tab Navigation with Individual Colors & SVG Icons */}
              <div className="flex gap-2 flex-1 overflow-x-auto">
                {/* Calendar Tab - Green */}
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                    activeView === 'calendar'
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold'
                      : 'bg-slate-700/20 border border-slate-700/40 text-emerald-300 font-light hover:bg-slate-700/40 hover:border-slate-600/60'
                  }`}
                  title="Economic Calendar"
                >
                  <IconCalendarTab className="w-5 h-5" />
                  <span className="hidden sm:inline">Calendar</span>
                </button>

                {/* Charts Tab - Cyan */}
                <button
                  onClick={() => setActiveView('charts')}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                    activeView === 'charts'
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-bold'
                      : 'bg-slate-700/20 border border-slate-700/40 text-cyan-300 font-light hover:bg-slate-700/40 hover:border-slate-600/60'
                  }`}
                  title="Trading Charts"
                >
                  <IconChartsTab className="w-5 h-5" />
                  <span className="hidden sm:inline">Charts</span>
                </button>

                {/* Guide Tab - Amber/Yellow */}
                <button
                  onClick={() => setActiveView('guide')}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                    activeView === 'guide'
                      ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold'
                      : 'bg-slate-700/20 border border-slate-700/40 text-amber-300 font-light hover:bg-slate-700/40 hover:border-slate-600/60'
                  }`}
                  title="Trading Guide"
                >
                  <IconGuideTab className="w-5 h-5" />
                  <span className="hidden sm:inline">Guide</span>
                </button>

                {/* World Clock Tab - Violet */}
                <button
                  onClick={() => setActiveView('clocks')}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                    activeView === 'clocks'
                      ? 'bg-violet-500/20 border border-violet-400/40 text-violet-300 font-bold'
                      : 'bg-slate-700/20 border border-slate-700/40 text-violet-300 font-light hover:bg-slate-700/40 hover:border-slate-600/60'
                  }`}
                  title="World Clock"
                >
                  <IconWorldClockTab className="w-5 h-5" />
                  <span className="hidden sm:inline">World Clock</span>
                </button>
              </div>
            </div>

            {/* Conditional Render: Calendar, Clocks, Charts, or Guide */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {activeView === 'calendar' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading calendar...</div>}>
                  <CalendarErrorBoundary>
                    <EconomicCalendar selectedTimezone={selectedTimezone} />
                  </CalendarErrorBoundary>
                </Suspense>
              )}
              {activeView === 'clocks' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading clocks...</div>}>
                  <WorldClockPanel
                    compact
                    sessionStatus={sessionStatus}
                    activeSessions={activeSessions}
                    selectedTimezone={selectedTimezone}
                  />
                </Suspense>
              )}
              {activeView === 'charts' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading charts...</div>}>
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
                </Suspense>
              )}
              {activeView === 'guide' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading guide...</div>}>
                  <SessionGuide
                    currentTimezoneLabel={selectedTimezone.label}
                    timezoneOffset={selectedTimezone.offset}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER: Action Row with PWA + Social */}
        <footer className="w-full mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 text-slate-500 text-[10px] sm:text-xs font-light">
          <p className="text-center sm:text-left">Data is illustrative. Always verify times with your broker. Not financial advice.</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 shadow-inner shadow-cyan-500/20">
              <IconTradingFlow className="w-5 h-5 text-cyan-300" />
            </div>
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
