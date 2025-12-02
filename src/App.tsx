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
import { BestPairsWidget } from './components/BestPairsWidget';
import { isDSTActive } from './utils/dstUtils';

const ForexChart = lazy(() => import('./components/ForexChart'));
const VolumeChart = lazy(() => import('./components/VolumeChart'));
const EconomicCalendar = lazy(() => import('./components/EconomicCalendar'));
const SessionGuide = lazy(() => import('./components/SessionGuide'));
const WorldClockPanel = lazy(() => import('./components/WorldClockPanel'));
const RiskCalculator = lazy(() => import('./components/RiskCalculator').then(m => ({ default: m.RiskCalculator })));
const VolatilityPanel = lazy(() => import('./components/VolatilityPanel').then(m => ({ default: m.VolatilityPanel })));
const CorrelationHeatMap = lazy(() => import('./components/CorrelationHeatMap').then(m => ({ default: m.CorrelationHeatMap })));
const CorrelationNetworkGraph = lazy(() => import('./components/CorrelationNetworkGraph').then(m => ({ default: m.CorrelationNetworkGraph })));
const ComingSoonPage = lazy(() => import('./components/ComingSoonPage').then(m => ({ default: m.ComingSoonPage })));

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
  const [activeView, setActiveView] = useState<
    | 'overview' | 'clocks' | 'calendar' | 'charts' | 'guide'
    | 'timeline' | 'volume' | 'volatility' | 'position'
    | 'correlation' | 'network' | 'screener' | 'aiChat'
    | 'page1' | 'page2' | 'page3'
  >('network');
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
            {/* Desktop Header: 3-Column Layout - Left (Title + Icons) | Center (FX Tools Nav) | Right (Help) */}
            <div className="hidden md:flex items-center justify-between gap-4 mb-2.5 flex-shrink-0 border-b border-slate-700/30 pb-3">
              {/* Left: Title + essential icons */}
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

                {/* Essential Action Icons */}
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

              {/* Center: FX Tools Navigation */}
              <div className="flex gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => setActiveView('timeline')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'timeline'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveView('volume')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'volume'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  Volume
                </button>
                <button
                  onClick={() => setActiveView('volatility')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'volatility'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  Volatility
                </button>
                <button
                  onClick={() => setActiveView('position')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'position'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  Position
                </button>
                <button
                  onClick={() => setActiveView('correlation')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'correlation'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  HeatMap
                </button>
                <button
                  onClick={() => setActiveView('network')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'network'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  Network
                </button>
                <button
                  onClick={() => setActiveView('screener')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'screener'
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  Screener
                </button>
                <button
                  onClick={() => setActiveView('aiChat')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    activeView === 'aiChat'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50'
                  }`}
                >
                  AI Chat
                </button>
              </div>

              {/* Right: Help Icon */}
              <div className="flex items-center">
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
                  title="Help & Guide"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
              {activeView === 'screener' && (
                <div className="space-y-6">
                  <BestPairsWidget />
                </div>
              )}

              {activeView === 'aiChat' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-8 text-center">
                    <div className="text-6xl mb-4">🤖</div>
                    <h2 className="text-2xl font-bold text-white mb-2">AI Chat</h2>
                    <p className="text-gray-400 mb-6">
                      Coming soon: AI-powered conversational guidance for correlation insights,
                      hedging tactics, and trade ideas.
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm text-purple-400">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      Feature in development
                    </div>
                  </div>
                </div>
              )}

              {/* FX Tools Views */}
              {activeView === 'timeline' && selectedTimezone && currentTime && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <ForexChart
                    selectedTimezone={selectedTimezone}
                    currentTime={currentTime}
                    nowLine={nowLine || 0}
                    sessionStatus={sessionStatus || {}}
                    currentDSTStatus={currentDSTStatus || false}
                  />
                </Suspense>
              )}

              {activeView === 'volume' && selectedTimezone && currentTime && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <VolumeChart
                    selectedTimezone={selectedTimezone}
                    currentTime={currentTime}
                    nowLine={nowLine || 0}
                    sessionStatus={sessionStatus || {}}
                  />
                </Suspense>
              )}

              {activeView === 'volatility' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <VolatilityPanel />
                </Suspense>
              )}

              {activeView === 'position' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <RiskCalculator />
                </Suspense>
              )}

              {activeView === 'correlation' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <CorrelationHeatMap />
                </Suspense>
              )}

              {activeView === 'network' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <CorrelationNetworkGraph />
                </Suspense>
              )}

              {activeView === 'page1' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <ComingSoonPage pageNumber={1} />
                </Suspense>
              )}

              {activeView === 'page2' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <ComingSoonPage pageNumber={2} />
                </Suspense>
              )}

              {activeView === 'page3' && (
                <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading...</div>}>
                  <ComingSoonPage pageNumber={3} />
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
