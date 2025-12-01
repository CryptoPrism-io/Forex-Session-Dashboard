import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarErrorBoundary from './components/CalendarErrorBoundary';
import SocialLinks from './components/SocialLinks';
import SessionClocks from './components/SessionClocks';
import InstallButton from './components/InstallButton';
import InstallModal from './components/InstallModal';
import AlertsToggleHeader from './components/AlertsToggleHeader';
import BottomNavBar from './components/BottomNavBar';
import SwipeableFooter from './components/SwipeableFooter';
import OverviewPanel from './components/OverviewPanel';
import BentoDesktopLayout from './components/BentoDesktopLayout';
import TimezoneModal from './components/TimezoneModal';
import HelpGuideModal from './components/HelpGuideModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useSessionAlerts } from './hooks/useSessionAlerts';
import { useReducedMotion } from './hooks/useReducedMotion';
import { TIMEZONES, SESSIONS_STANDARD, SESSIONS_DAYLIGHT } from './constants';
import { Timezone, SessionData, ChartBarDetails } from './types';
import { IconClock, IconGlobe, IconTarget, IconBarChartBig, IconCalendarTab, IconChartsTab, IconGuideTab, IconWorldClockTab } from './components/icons';
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
  const [activeView, setActiveView] = useState<'overview' | 'clocks' | 'calendar' | 'charts' | 'guide'>('overview');
  const [isMoreTimezonesOpen, setIsMoreTimezonesOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  // Detect desktop/mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    <div className="h-screen font-sans text-slate-200 overflow-x-hidden overflow-y-auto" style={{
      background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #0f1419 100%)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Desktop Bento Grid Layout (>= 1024px) */}
      {isDesktop ? (
        <div className="w-full h-screen">
          {/* Bento Grid Content */}
          <div className="h-full overflow-hidden">
            <BentoDesktopLayout
              selectedTimezone={selectedTimezone}
              currentTime={currentTime}
              nowLine={nowLine}
              sessionStatus={sessionStatus}
              activeSessions={activeSessions}
              currentDSTStatus={currentDSTStatus}
              activeSessions_config={activeSessions_config}
              isAutoDetectDST={isAutoDetectDST}
              manualDSTOverride={manualDSTOverride}
              onToggleDSTOverride={(override) => setManualDSTOverride(override)}
              onAutoDetectToggle={(enabled) => {
                setIsAutoDetectDST(enabled);
                if (enabled) setManualDSTOverride(null);
              }}
              onTimezoneSettingsClick={() => setIsTimezoneMenuOpen(true)}
              onHelpClick={() => setShowHelpModal(true)}
              alertConfig={alertConfig}
              onToggleAlerts={toggleAlerts}
              onToggleSound={toggleSound}
              installState={installState}
              onInstallClick={handleInstallClick}
            />
          </div>
        </div>
      ) : (
        /* Mobile Layout (< 1024px) - Existing tab-based layout */
        <main className="w-full h-full flex flex-col items-stretch p-0">
        {/* LAYOUT: Single column - Full width content area */}
        <div className="w-full flex-1 h-full overflow-hidden">
          {/* Main Content Area */}
          <div className="glass-shell backdrop-blur-xl rounded-3xl p-3 sm:p-4 shadow-lg shadow-black/20 flex flex-col overflow-hidden h-full gap-3 sm:gap-4">
            {/* Desktop Header: Title + Icons (Left) | Navigation Tabs (Right) */}
            <div className="hidden md:flex items-center justify-between gap-4 mb-2.5 flex-shrink-0 border-b border-slate-700/30 pb-3">
              {/* Left: Title + Essential Action Icons */}
              <div className="flex items-center gap-3">
                {/* Title */}
                <h1
                  className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap"
                  style={{
                    textShadow: '0 0 10px rgba(34, 211, 238, 0.25), 0 0 16px rgba(59, 130, 246, 0.15)',
                    filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.2))'
                  }}
                >
                  FX_Saarthi
                </h1>

                {/* Essential Action Icons (no social links - they're in footer) */}
                <div className="flex items-center gap-2">
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
                </div>
              </div>

              {/* Right: 5-Tab Navigation */}
              <div className="flex gap-2">
                {/* Overview Tab - Blue */}
                <button
                  onClick={() => setActiveView('overview')}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                    activeView === 'overview'
                      ? 'bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold'
                      : 'bg-slate-700/20 border border-slate-700/40 text-blue-300 font-light hover:bg-slate-700/40 hover:border-slate-600/60'
                  }`}
                  title="Overview"
                >
                  <IconTarget className="w-5 h-5" />
                  <span className="hidden lg:inline">Overview</span>
                </button>

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
                  <span className="hidden lg:inline">Calendar</span>
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
                  <span className="hidden lg:inline">Charts</span>
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
                  <span className="hidden lg:inline">Guide</span>
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
                  <span className="hidden lg:inline">World Clock</span>
                </button>
              </div>
            </div>

            {/* Mobile Header - Only for Overview page */}
            {activeView === 'overview' && (
              <div className="md:hidden border-b border-slate-700/30 flex-shrink-0 px-3 py-2.5">
                {/* Mobile: Compact Single Row Layout */}
                <div className="flex items-center justify-between gap-2">
                  {/* Title Pill - Floating Card Style */}
                  <div
                    className="flex-1 flex items-center justify-center px-4 py-2 rounded-full backdrop-blur-xl border border-cyan-400/30 shadow-lg shadow-cyan-500/20"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    }}
                  >
                    <h1
                      className="text-base font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
                      style={{
                        textShadow: '0 0 10px rgba(34, 211, 238, 0.3)',
                        filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.25))'
                      }}
                    >
                      FX_Saarthi
                    </h1>
                  </div>

                  {/* Essential Action Pills */}
                  <div className="flex items-center gap-1.5">
                    <div className="scale-90">
                      <AlertsToggleHeader
                        alertConfig={alertConfig}
                        onToggle={toggleAlerts}
                        onToggleSound={toggleSound}
                      />
                    </div>
                    <div className="scale-90">
                      <InstallButton
                        onClick={handleInstallClick}
                        show={installState === 'available' || installState === 'dismissed'}
                        hasNativePrompt={installState === 'available'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Render: Overview, Calendar, Clocks, Charts, or Guide */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-2 sm:py-3"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              {activeView === 'overview' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading overview...</div>}>
                  <OverviewPanel
                    selectedTimezone={selectedTimezone}
                    currentTime={currentTime}
                    activeSessions={activeSessions}
                    onTimezoneSettingsClick={() => setIsTimezoneMenuOpen(true)}
                    installState={installState}
                    onInstallClick={handleInstallClick}
                    alertConfig={alertConfig}
                    onToggleAlerts={toggleAlerts}
                    onToggleSound={toggleSound}
                  />
                </Suspense>
              )}
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

        {/* Footer only shown on desktop (mobile has it in Overview) */}
        {activeView !== 'overview' && (
          <div className="hidden md:block">
            <SwipeableFooter
              installState={installState}
              onInstallClick={handleInstallClick}
              alertConfig={alertConfig}
              onToggleAlerts={toggleAlerts}
              onToggleSound={toggleSound}
            />
          </div>
        )}

        {/* Bottom Navigation Bar for Mobile */}
        <BottomNavBar activeView={activeView} onViewChange={setActiveView} />
      </main>
      )}

      {/* PWA Installation Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={handleDismissModal}
        browserInfo={browserInfo}
      />

      {/* Timezone Selection Modal */}
      <TimezoneModal
        isOpen={isTimezoneMenuOpen}
        onClose={() => setIsTimezoneMenuOpen(false)}
        selectedTimezone={selectedTimezone}
        onTimezoneChange={handleTimezoneChange}
      />

      {/* Help Guide Modal */}
      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        currentTimezoneLabel={selectedTimezone.label}
        timezoneOffset={selectedTimezone.offset}
      />
    </div>
  );
};

export default App;

