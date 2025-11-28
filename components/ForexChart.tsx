import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { SESSIONS } from '../constants';
import {
  ChartBarDetails,
  SessionData,
  TimeBlock,
  VolumeHistogram,
  VisibleLayers,
  SessionWorkerRequest,
  SessionWorkerResponse,
} from '../types';
import { SessionStatus } from '../App';
import { IconChevronDown, IconCalendarTab } from './icons';
import VolumeChart from './VolumeChart';
import { AccessibleTooltip } from './Tooltip';
import { PopoverMenu, CheckboxMenuItem, MenuSection, MenuButton } from './Menu';
import { useReducedMotion } from '../hooks/useReducedMotion';

// Global Forex Trading Volume Profile (UTC, 30-min intervals, 48 points = 24 hours)
const VOLUME_DATA = [
  18, 17, 17, 18, 19, 21,        // 00:00–02:30 – Sydney-only quiet; slow Asian liquidity build
  23, 26, 30, 35, 39, 42,        // 03:00–05:30 – Asia begins, Tokyo desks warming up
  46, 50, 55, 60, 65, 70,        // 06:00–08:30 – Tokyo peak, early Europe pre-open buildup
  75, 82, 88, 92, 89, 84,        // 09:00–11:30 — Europe volatility, London open burst then lunch dip
  90, 95, 98, 100, 99, 96,       // 12:00–14:30 — NY AM KZ (11:00–14:00); data spikes & trend runs
  94, 90, 86, 80, 75, 70,        // 15:00–17:30 — overlap winds down, London exits, NY active
  68, 63, 58, 52, 48, 44,        // 18:00–20:30 — NY-only, declining flow, US close nearing
  40, 36, 32, 30, 28, 26         // 21:00–23:30 – rollover lull, swap-settlement hour, Sydney pre-open
];

const SESSION_CITY_REFERENCES = [
  { label: 'Sydney', timezone: 'Australia/Sydney', accent: '#38bdf8' },
  { label: 'Tokyo', timezone: 'Asia/Tokyo', accent: '#f472b6' },
  { label: 'London', timezone: 'Europe/London', accent: '#facc15' },
  { label: 'New York', timezone: 'America/New_York', accent: '#34d399' },
];

const formatOffsetFromMinutes = (minutes: number): string => {
  const sign = minutes >= 0 ? '+' : '-';
  const absMin = Math.abs(minutes);
  const hours = Math.floor(absMin / 60);
  const mins = absMin % 60;
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const formatOffsetFromHours = (hoursValue: number): string => {
  const minutes = Math.round(hoursValue * 60);
  return formatOffsetFromMinutes(minutes);
};

const getTimezoneOffsetLabel = (timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(new Date());
    const offsetPart = parts.find((part) => part.type === 'timeZoneName')?.value?.replace('GMT', 'UTC');
    if (offsetPart) return offsetPart;
  } catch (error) {
    // Fallback below
  }

  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const zoned = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMinutes = (zoned.getTime() - utc.getTime()) / 60000;
    return formatOffsetFromMinutes(offsetMinutes);
  } catch {
    return 'UTC';
  }
};

interface ForexChartProps {
  nowLine: number;
  currentTimezoneLabel: string;
  timezoneOffset: number;
  sessionStatus: { [key: string]: SessionStatus };
  currentTime?: Date;
  isDSTActive?: boolean;
  activeSessions?: SessionData[];
  isAutoDetectDST?: boolean;
  manualDSTOverride?: boolean | null;
  onToggleDSTOverride?: (override: boolean | null) => void;
  onAutoDetectToggle?: (enabled: boolean) => void;
  fullscreenButton?: React.ReactNode;
}

const formatTime = (hour: number, offset: number): string => {
  const localHour = hour + offset;
  const finalHour = (Math.floor(localHour) % 24 + 24) % 24;
  const minutes = Math.round((localHour - Math.floor(localHour)) * 60);
  return `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const ForexChart: React.FC<ForexChartProps> = ({
  nowLine, currentTimezoneLabel, timezoneOffset, sessionStatus, currentTime = new Date(),
  isDSTActive = false, activeSessions, isAutoDetectDST = true, manualDSTOverride,
  onToggleDSTOverride, onAutoDetectToggle, fullscreenButton
}) => {
  const [viewMode, setViewMode] = useState<
    'timeline' | 'volume' | 'volatility' | 'position' | 'correlation' | 'ai'
  >('timeline');
  const [chartsVisible, setChartsVisible] = useState(true);
  const [showDSTMenu, setShowDSTMenu] = useState(false);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [nowBlinkVisible, setNowBlinkVisible] = useState(true);
  const [showEventFilterMenu, setShowEventFilterMenu] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>({
    sessions: true,
    zones: true,
    overlaps: true,
    killzones: true,
    volume: true,
    news: true, // Default visible
  });

  const workerRef = useRef<Worker | null>(null);
  const workerCacheRef = useRef<Map<string, SessionWorkerResponse>>(new Map());
  const cacheKeyRef = useRef('');
  const requestIdRef = useRef(0);
  const [workerResponse, setWorkerResponse] = useState<SessionWorkerResponse | null>(null);

  // Economic event indicators state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [selectedImpactLevels, setSelectedImpactLevels] = useState<string[]>(['high', 'medium']);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Use activeSessions from props if provided, otherwise fall back to SESSIONS constant
  const sessions = activeSessions || SESSIONS;

  // API base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Reduced motion preference for animations
  const prefersReducedMotion = useReducedMotion();

  // Session bar animation variants
  const sessionBarVariants = useMemo(
    () => ({
      hidden: {
        scaleY: 0.8,
        opacity: 0,
      },
      visible: (i: number) => ({
        scaleY: 1,
        opacity: 1,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: 0.3,
              delay: i * 0.05, // Stagger: 50ms between each bar
              ease: 'easeOut',
              type: 'tween', // Use tween for predictable GPU-accelerated animation
            },
      }),
      hover: {
        scaleY: prefersReducedMotion ? 1 : 1.25,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: 0.2,
              ease: 'easeOut',
              type: 'tween',
            },
      },
    }),
    [prefersReducedMotion]
  );

  // Economic event indicator animation variants
  const eventIndicatorVariants = useMemo(
    () => ({
      hidden: {
        scale: 0,
        opacity: 0,
      },
      visible: (i: number) => ({
        scale: 1,
        opacity: 0.67,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: 0.4,
              delay: i * 0.03, // Stagger: 30ms between each event
              ease: [0.34, 1.56, 0.64, 1], // Spring-like ease
              type: 'tween',
            },
      }),
      hover: {
        scale: prefersReducedMotion ? 1 : 1.1,
        opacity: 1,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: 0.2,
              ease: 'easeOut',
              type: 'tween',
            },
      },
    }),
    [prefersReducedMotion]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowBlinkVisible((prev) => !prev);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Fetch economic calendar events for today
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);

        // Get user's local date in YYYY-MM-DD format
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Pass local date to backend so it returns events for user's "today"
        const response = await fetch(`${API_BASE_URL}/api/calendar/today?date=${localDate}`);
        if (!response.ok) throw new Error('Failed to fetch events');

        const json = await response.json();
        setCalendarEvents(json.data || []);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        setCalendarEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/sessionWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    const handleMessage = (event: MessageEvent<SessionWorkerResponse>) => {
      const data = event.data;
      workerCacheRef.current.set(data.cacheKey, data);
      if (data.cacheKey === cacheKeyRef.current && data.id === requestIdRef.current) {
        setWorkerResponse(data);
      }
    };
    worker.addEventListener('message', handleMessage);
    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const impactKey = useMemo(() => selectedImpactLevels.join(','), [selectedImpactLevels]);
  const visibleLayerKey = useMemo(
    () =>
      `${visibleLayers.sessions}-${visibleLayers.overlaps}-${visibleLayers.killzones}-${visibleLayers.volume}-${visibleLayers.news}-${visibleLayers.zones}`,
    [visibleLayers]
  );

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const cacheKey = `${timezoneOffset}-${visibleLayerKey}-${impactKey}`;
    cacheKeyRef.current = cacheKey;
    const cached = workerCacheRef.current.get(cacheKey);
    if (cached) {
      setWorkerResponse(cached);
      return;
    }

    requestIdRef.current += 1;
    const payload: SessionWorkerRequest = {
      type: 'compute',
      id: requestIdRef.current,
      cacheKey,
      timezoneOffset,
      visibleLayers,
      calendarEvents,
      selectedImpactLevels,
    };
    worker.postMessage(payload);
    setWorkerResponse(null);
  }, [timezoneOffset, visibleLayerKey, impactKey, calendarEvents, visibleLayers]);

  const workerData =
    workerResponse && workerResponse.cacheKey === cacheKeyRef.current ? workerResponse : null;
  const timeBlocks = workerData?.timeBlocks ?? [];
  const processedEvents = workerData?.processedEvents ?? [];
  const stackedEvents = workerData?.stackedEvents ?? {};
  const volumeHistogram = workerData?.volumeHistogram ?? null;

  // Debug logging
  React.useEffect(() => {
    console.log('ForexChart Debug:', {
      viewMode,
      timeBlocksCount: timeBlocks.length,
      visibleLayers,
      workerDataExists: !!workerData,
      sessionsCount: sessions.length
    });
  }, [viewMode, timeBlocks.length, visibleLayers, workerData, sessions.length]);

  const virtualizedEvents = useMemo(() => {
    const MAX_EVENTS = 160;
    if (processedEvents.length <= MAX_EVENTS) return processedEvents;
    const step = Math.ceil(processedEvents.length / MAX_EVENTS);
    return processedEvents.filter((_, index) => index % step === 0);
  }, [processedEvents]);

  const virtualizedStackedEvents = useMemo(() => {
    const groups: { [key: string]: typeof virtualizedEvents } = {};
    virtualizedEvents.forEach((event) => {
      const key = Math.floor(event.position * 10).toString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [virtualizedEvents]);

  // Now line position - optimized with useMemo to prevent unnecessary recalculations
  // No transition needed: position changes are incremental (0.00116% per second)
  // Smooth transitions would make it appear choppy. Direct updates are optimal.
  const nowLinePosition = useMemo(() => ({
    left: `${(nowLine / 24) * 100}%`,
  }), [nowLine]);


const getStatusColor = (status: SessionStatus) => {
  const statusConfig = {
    OPEN: { color: 'hsl(120, 70%, 55%)', glow: 'hsl(120, 70%, 55%)' },
      CLOSED: { color: 'hsl(0, 60%, 45%)', glow: 'transparent' },
      WARNING: { color: 'hsl(35, 100%, 60%)', glow: 'hsl(35, 100%, 60%)' },
  };
  return statusConfig[status];
};

// Convert base HSL colors to HSLA with the provided opacity (fallback to raw color)
const withOpacity = (color: string, alpha: number) => {
  if (!color) return color;
  if (color.startsWith('hsl(')) {
    return color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
  }
  return color;
};

const cityBadges = useMemo(
  () =>
      SESSION_CITY_REFERENCES.map((city) => ({
        ...city,
        offsetLabel: getTimezoneOffsetLabel(city.timezone),
      })),
    [currentTime]
  );
  const timezoneAxisNote = useMemo(
    () => `All times in ${currentTimezoneLabel} (${formatOffsetFromHours(timezoneOffset)})`,
    [currentTimezoneLabel, timezoneOffset]
  );

  const ticks = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const blocksBySession = useMemo(() => {
    const map = new Map<string, TimeBlock[]>();
    timeBlocks.forEach((block) => {
      const arr = map.get(block.sessionName);
      if (arr) {
        arr.push(block);
      } else {
        map.set(block.sessionName, [block]);
      }
    });
    return map;
  }, [timeBlocks]);

  // Pre-calculate volume histogram data (hooks must be called at top level)
  // Process economic events for display
  // Group events by position for stacking
  return (
    <div
      ref={chartContainerRef}
      className="relative w-full h-full glass-soft rounded-2xl p-3 shadow-2xl shadow-black/35 hover:border-slate-500/50 transition-all duration-300 sm:backdrop-blur-2xl backdrop-blur-none overflow-hidden flex flex-col"
    >
      {/* Tools header row 1 */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500">TOOLS</h3>
        {fullscreenButton}
      </div>

      {/* Tools row 2: modes + filters (timeline/volume only) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'timeline', label: 'Session Timeline' },
            { key: 'volume', label: 'Session Volume' },
            { key: 'volatility', label: 'Volatility' },
            { key: 'position', label: 'Position Size' },
            { key: 'correlation', label: 'Correlation Matrix' },
            { key: 'ai', label: 'AI Suggestions' },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key as any)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg backdrop-blur-md transition-all duration-300 border ${
                viewMode === mode.key
                  ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-100 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {(viewMode === 'timeline' || viewMode === 'volume') && (
          <div className="flex items-center gap-2">
            <PopoverMenu
              trigger={
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>Filters</span>
                </>
              }
              triggerClassName={`px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md border flex items-center gap-1 transition-all duration-200 ${
                showEventFilterMenu
                  ? 'bg-cyan-500/30 border-cyan-400/60 text-cyan-100 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-700/20 border-slate-600/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-500/60 hover:text-slate-200 hover:shadow-md active:bg-slate-700/60'
              }`}
              menuClassName="w-48"
              isOpen={showEventFilterMenu}
              onOpenChange={setShowEventFilterMenu}
            >
              <div className="p-3">
                <MenuSection title="Layers">
                  <CheckboxMenuItem
                    label="Sessions"
                    checked={visibleLayers.sessions}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, sessions: checked })}
                  />
                  <CheckboxMenuItem
                    label="Overlaps"
                    checked={visibleLayers.overlaps}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, overlaps: checked })}
                  />
                  <CheckboxMenuItem
                    label="Killzones"
                    checked={visibleLayers.killzones}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, killzones: checked })}
                  />
                  <CheckboxMenuItem
                    label="Volume"
                    checked={visibleLayers.volume}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, volume: checked })}
                  />
                  <CheckboxMenuItem
                    label="News"
                    checked={visibleLayers.news}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, news: checked })}
                  />
                </MenuSection>

                {visibleLayers.news && (
                  <MenuSection title="Impact Levels" showDivider>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedImpactLevels.includes('high')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImpactLevels([...selectedImpactLevels, 'high']);
                          } else {
                            setSelectedImpactLevels(selectedImpactLevels.filter(l => l !== 'high'));
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-red-300 font-medium">High</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedImpactLevels.includes('medium')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImpactLevels([...selectedImpactLevels, 'medium']);
                          } else {
                            setSelectedImpactLevels(selectedImpactLevels.filter(l => l !== 'medium'));
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-amber-300 font-medium">Medium</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedImpactLevels.includes('low')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImpactLevels([...selectedImpactLevels, 'low']);
                          } else {
                            setSelectedImpactLevels(selectedImpactLevels.filter(l => l !== 'low'));
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-emerald-300 font-medium">Low</span>
                    </label>
                  </MenuSection>
                )}
              </div>
            </PopoverMenu>

            <PopoverMenu
              trigger={isDSTActive ? '☀ DST' : '🌙 ST'}
              triggerClassName="px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 transition-all duration-300"
              menuClassName="w-56"
              isOpen={showDSTMenu}
              onOpenChange={setShowDSTMenu}
            >
              <div className="p-3 space-y-2">
                <CheckboxMenuItem
                  label="Auto-detect DST"
                  checked={isAutoDetectDST ?? false}
                  onChange={(checked) => onAutoDetectToggle?.(checked)}
                />

                <MenuSection title="Manual Override" showDivider>
                  <div className="space-y-1">
                    <MenuButton
                      label="☀ Summer (DST)"
                      onClick={() => {
                        onToggleDSTOverride?.(true);
                        setShowDSTMenu(false);
                      }}
                      isActive={manualDSTOverride === true}
                      className={manualDSTOverride === true ? 'bg-amber-500/30 border-amber-400/50 text-amber-100' : ''}
                    />
                    <MenuButton
                      label="🌙 Winter (Standard)"
                      onClick={() => {
                        onToggleDSTOverride?.(false);
                        setShowDSTMenu(false);
                      }}
                      isActive={manualDSTOverride === false}
                      className={manualDSTOverride === false ? 'bg-blue-500/30 border-blue-400/50 text-blue-100' : ''}
                    />
                  </div>
                </MenuSection>
              </div>
            </PopoverMenu>
          </div>
        )}
      </div>
      <div className="hidden">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500">Tools</h3>
          {fullscreenButton}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'timeline', label: 'Session Timeline' },
              { key: 'volume', label: 'Session Volume' },
              { key: 'volatility', label: 'Volatility' },
              { key: 'position', label: 'Position Size' },
              { key: 'correlation', label: 'Correlation Matrix' },
              { key: 'ai', label: 'AI Suggestions' },
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key as any)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg backdrop-blur-md transition-all duration-300 border ${
                  viewMode === mode.key
                    ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-100 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeline Filter Menu */}
          {viewMode === 'timeline' && (
            <PopoverMenu
              trigger={
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span>Filters</span>
                </>
              }
              triggerClassName={`px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md border flex items-center gap-1 transition-all duration-200 ${
                showEventFilterMenu
                  ? 'bg-cyan-500/30 border-cyan-400/60 text-cyan-100 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-700/20 border-slate-600/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-500/60 hover:text-slate-200 hover:shadow-md active:bg-slate-700/60'
              }`}
              menuClassName="w-48"
              isOpen={showEventFilterMenu}
              onOpenChange={setShowEventFilterMenu}
            >
              <div className="p-3">
                <MenuSection title="Layers">
                  <CheckboxMenuItem
                    label="Sessions"
                    checked={visibleLayers.sessions}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, sessions: checked })}
                  />
                  <CheckboxMenuItem
                    label="Overlaps"
                    checked={visibleLayers.overlaps}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, overlaps: checked })}
                  />
                  <CheckboxMenuItem
                    label="Killzones"
                    checked={visibleLayers.killzones}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, killzones: checked })}
                  />
                  <CheckboxMenuItem
                    label="Volume"
                    checked={visibleLayers.volume}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, volume: checked })}
                  />
                  <CheckboxMenuItem
                    label="📰 News"
                    checked={visibleLayers.news}
                    onChange={(checked) => setVisibleLayers({ ...visibleLayers, news: checked })}
                  />
                </MenuSection>

                {visibleLayers.news && (
                  <MenuSection title="Impact Levels" showDivider>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedImpactLevels.includes('high')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImpactLevels([...selectedImpactLevels, 'high']);
                          } else {
                            setSelectedImpactLevels(selectedImpactLevels.filter(l => l !== 'high'));
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-red-300 font-medium">High</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedImpactLevels.includes('medium')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImpactLevels([...selectedImpactLevels, 'medium']);
                          } else {
                            setSelectedImpactLevels(selectedImpactLevels.filter(l => l !== 'medium'));
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-amber-300 font-medium">Medium</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedImpactLevels.includes('low')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedImpactLevels([...selectedImpactLevels, 'low']);
                          } else {
                            setSelectedImpactLevels(selectedImpactLevels.filter(l => l !== 'low'));
                          }
                        }}
                        className="cursor-pointer"
                      />
                      <span className="text-xs text-green-300 font-medium">Low</span>
                    </label>
                  </MenuSection>
                )}
              </div>
            </PopoverMenu>
          )}

          {/* DST Toggle Menu */}
          <PopoverMenu
            trigger={isDSTActive ? '🌞 DST' : '❄️ ST'}
            triggerClassName="px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 transition-all duration-300"
            menuClassName="w-56"
            isOpen={showDSTMenu}
            onOpenChange={setShowDSTMenu}
          >
            <div className="p-3 space-y-2">
              <CheckboxMenuItem
                label="Auto-detect DST"
                checked={isAutoDetectDST ?? false}
                onChange={(checked) => onAutoDetectToggle?.(checked)}
              />

              <MenuSection title="Manual Override" showDivider>
                <div className="space-y-1">
                  <MenuButton
                    label="🌞 Summer (DST)"
                    onClick={() => {
                      onToggleDSTOverride?.(true);
                      setShowDSTMenu(false);
                    }}
                    isActive={manualDSTOverride === true}
                    className={manualDSTOverride === true ? 'bg-amber-500/30 border-amber-400/50 text-amber-100' : ''}
                  />
                  <MenuButton
                    label="❄️ Winter (Standard)"
                    onClick={() => {
                      onToggleDSTOverride?.(false);
                      setShowDSTMenu(false);
                    }}
                    isActive={manualDSTOverride === false}
                    className={manualDSTOverride === false ? 'bg-blue-500/30 border-blue-400/50 text-blue-100' : ''}
                  />
                </div>
              </MenuSection>
            </div>
          </PopoverMenu>
        </div>
      </div>

      {/* City badges removed - session names now displayed in glass capsules on each row */}

      {viewMode === 'timeline' ? (
        // Separate view - individual rows per session
        <div className="flex-1 overflow-y-auto min-h-0">
        {[sessions[3], sessions[2], sessions[0], sessions[1]].map(session => {
          const status = sessionStatus[session.name];
          const statusColors = getStatusColor(status);

          return (
            <div key={session.name} className="mb-5 last:mb-0">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/40 backdrop-blur-xl border border-slate-600/40 shadow-inner shadow-black/10 glass-soft">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: statusColors.color,
                      boxShadow: `0 0 6px ${statusColors.glow}`,
                      animation: status === 'WARNING' ? 'pulse-glow 1.5s infinite' : 'none',
                    }}
                  />
                  <span className="text-xs font-normal text-slate-100 uppercase" style={{ letterSpacing: '0.15em' }}>{session.name}</span>
                  <span className="text-[10px] font-light text-slate-400 ml-1">
                    {getTimezoneOffsetLabel(SESSION_CITY_REFERENCES.find(c => c.label === session.name)?.timezone || 'UTC')}
                  </span>
                </div>
              </div>

              <div className="relative w-full h-12 bg-gradient-to-br from-slate-700/30 to-slate-800/40 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden shadow-lg shadow-black/20">
                {/* Vertical hour grid lines */}
                {ticks.map(hour => (
                  <div
                    key={`grid-${hour}`}
                    className="absolute top-0 bottom-0 border-l border-slate-700/30"
                    style={{ left: `${(hour / 24) * 100}%` }}
                  />
                ))}

                <SessionBlocks
                  sessionName={session.name}
                  blocks={blocksBySession.get(session.name) || []}
                  timezoneOffset={timezoneOffset}
                  currentTimezoneLabel={currentTimezoneLabel}
                  sessionBarVariants={sessionBarVariants}
                />

                <SessionEventIndicators
                  sessionName={session.name}
                  events={virtualizedEvents}
                  stackedEvents={virtualizedStackedEvents}
                  visible={visibleLayers.news}
                  eventIndicatorVariants={eventIndicatorVariants}
                />


                <motion.div
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                  style={nowLinePosition}
                  animate={{
                    opacity: nowBlinkVisible ? 1 : 0.15,
                    boxShadow: nowBlinkVisible
                      ? '0 0 14px rgba(250, 204, 21, 0.8)'
                      : '0 0 0px rgba(250, 204, 21, 0)',
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { opacity: { duration: 0.2 }, boxShadow: { duration: 0.2 } }
                  }
                >
                  <div className="absolute -top-5 -translate-x-1/2 text-xs text-yellow-300 font-bold whitespace-nowrap">
                    Now
                  </div>
                </motion.div>
              </div>
            </div>
          );
        })}
        <p className="mt-3 text-[11px] text-slate-500 text-right italic">{timezoneAxisNote}</p>
        </div>
      ) : viewMode === 'unified' ? (
        // Unified view - clean timeline with elegant overlaps
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {/* Time Ruler - Bold GMT markers */}
          <div className="relative h-8 mb-2 px-2">
            <div className="flex justify-between items-end border-b border-slate-700/40 pb-1">
              {[0, 4, 8, 12, 16, 20].map(hour => (
                <div key={hour} className="flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-300 tabular-nums">
                    {String(hour).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-600 font-medium">GMT</span>
                </div>
              ))}
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-slate-300 tabular-nums">00</span>
                <span className="text-[9px] text-slate-600 font-medium">GMT</span>
              </div>
            </div>
          </div>

          {/* Main Timeline Container */}
          <div className="relative w-full h-full min-h-[200px] bg-slate-900/40 backdrop-blur-sm border border-slate-700/20 rounded-lg overflow-hidden">
            {/* Subtle vertical grid lines at major hours */}
            {[0, 4, 8, 12, 16, 20].map(hour => (
              <div
                key={`grid-${hour}`}
                className="absolute top-0 bottom-0 w-px bg-slate-700/15"
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}

            {/* Session blocks with improved rendering */}
            {timeBlocks.length > 0 ? (
              timeBlocks
                .filter(block => {
                  if (block.yLevel === 0 && !visibleLayers.sessions) return false;
                  if (block.yLevel === 1 && !visibleLayers.overlaps) return false;
                  if (block.yLevel === 2 && !visibleLayers.killzones) return false;
                  return true;
                })
                .map(block => {
                // Improved vertical positioning - more space, clearer hierarchy
                const yPositions = ['70%', '45%', '20%'];
                const heights = ['28%', '28%', '28%'];

                // Determine if this is overlap or killzone
                const isOverlap = block.yLevel === 1;
                const isKillzone = block.yLevel === 2;
                const isMainSession = block.yLevel === 0;

                // Enhanced styling based on block type
                const baseColor = block.details.color;
                const style: React.CSSProperties = {
                  left: `${block.left}%`,
                  width: `${block.width}%`,
                  top: yPositions[block.yLevel],
                  height: heights[block.yLevel],
                  backgroundColor: isOverlap
                    ? withOpacity(baseColor, 0.35) // Overlap: lighter tint
                    : isKillzone
                    ? withOpacity(baseColor, 0.2) // Killzone: subtle background
                    : withOpacity(baseColor, 0.4), // Main session: medium opacity
                  border: isKillzone
                    ? `1.5px dashed ${withOpacity(baseColor, 0.9)}` // Killzone: dashed outline
                    : `1px solid ${withOpacity(baseColor, 0.6)}`,
                  opacity: isOverlap ? 0.85 : 1,
                  borderRadius: isKillzone ? '3px' : '4px',
                  mixBlendMode: 'normal',
                };

                const [startUTC, endUTC] = block.range;
                const startTimeLocal = formatTime(startUTC, timezoneOffset);
                const endTimeLocal = formatTime(endUTC, timezoneOffset);

                // Custom tooltip content based on block type
                const tooltipName = isOverlap
                  ? block.details.name.replace('-', ' × ') // "London-NY" → "London × NY"
                  : block.details.name;

                return (
                  <AccessibleTooltip
                    key={block.key}
                    content={{
                      type: 'session',
                      name: tooltipName,
                      timeRange: `${startTimeLocal} - ${endTimeLocal}`,
                      timezoneLabel: currentTimezoneLabel,
                      tooltipInfo: block.tooltip,
                    }}
                    delay={200}
                  >
                    <motion.div
                      className="absolute cursor-pointer"
                      style={style}
                      variants={sessionBarVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      custom={block.yLevel}
                    />
                  </AccessibleTooltip>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                Loading sessions...
              </div>
            )}

            {/* Economic Event Indicators - cleaner positioning */}
            <AnimatePresence>
              {visibleLayers.news && virtualizedEvents.map((event: any, idx: number) => {
                const posKey = Math.floor(event.position * 10).toString();
                const stackGroup = virtualizedStackedEvents[posKey] || [];
                const stackIndex = stackGroup.findIndex((e: any) => e.id === event.id);
                const stackOffset = stackIndex * 14;

                return (
                  <AccessibleTooltip
                    key={`event-${event.id || idx}`}
                    content={{
                      type: 'event',
                      impact: event.impact,
                      color: event.color,
                      event: event.event,
                      timeUtc: event.time_utc,
                      currency: event.currency,
                      forecast: event.forecast,
                      previous: event.previous,
                      actual: event.actual,
                    }}
                    delay={200}
                  >
                    <motion.div
                      className="absolute cursor-pointer"
                      style={{
                        left: `${event.position}%`,
                        bottom: `${6 + stackOffset}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 10 + stackIndex,
                      }}
                      variants={eventIndicatorVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      whileHover="hover"
                      custom={idx}
                    >
                      <div
                        className="w-3 h-3 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: event.color,
                          border: `1px solid ${event.borderColor}`,
                          boxShadow: `0 0 6px ${event.color}70, inset 0 1px 1px rgba(255,255,255,0.3)`,
                        }}
                      >
                        <IconCalendarTab
                          className="w-1.5 h-1.5"
                          style={{ color: 'white', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}
                        />
                      </div>
                    </motion.div>
                  </AccessibleTooltip>
                );
              })}
            </AnimatePresence>

            {/* Strong "NOW" vertical line - spans entire height */}
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 z-20 pointer-events-none"
              style={nowLinePosition}
              animate={{
                opacity: nowBlinkVisible ? 1 : 0.7,
                boxShadow: nowBlinkVisible
                  ? '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)'
                  : '0 0 10px rgba(251, 191, 36, 0.4)',
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.8, ease: 'easeInOut' }
              }
            >
              {/* NOW label at top */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-500/90 px-2 py-0.5 rounded text-[10px] font-bold text-slate-900 whitespace-nowrap shadow-lg">
                NOW
              </div>
              {/* Triangle pointer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-amber-500/90" />
            </motion.div>
          </div>

          {/* Compact legend - no status badges, just session identification */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs px-2">
            {[sessions[3], sessions[2], sessions[0], sessions[1]].map(session => {
              return (
                <div key={session.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: session.main.color,
                      opacity: 0.7,
                    }}
                  />
                  <span className="text-slate-400 font-medium">{session.name}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-slate-500 text-right italic px-2">{timezoneAxisNote}</p>
        </div>
      ) : (
        // Volume view - Trading Volume Chart
        <div className="flex-1 overflow-y-auto min-h-0">
          <VolumeChart
            nowLine={nowLine}
            currentTimezoneLabel={currentTimezoneLabel}
            timezoneOffset={timezoneOffset}
            currentTime={currentTime}
            calendarEvents={processedEvents}
            stackedEvents={stackedEvents}
            visibleLayers={visibleLayers}
            chartContainerRef={chartContainerRef}
          />
          <p className="mt-3 text-[11px] text-slate-500 text-right italic">{timezoneAxisNote}</p>
        </div>
      )}
    </div>
  );
};

export default ForexChart;

interface SessionBlocksProps {
  sessionName: string;
  blocks: TimeBlock[];
  timezoneOffset: number;
  currentTimezoneLabel: string;
  sessionBarVariants: Variants;
}

const SessionBlocks = React.memo(
  ({ blocks, timezoneOffset, currentTimezoneLabel, sessionBarVariants }: SessionBlocksProps) => {
    if (!blocks.length) return null;

    const yPositions = ['60%', '40%', '10%'];
    const heights = ['35%', '25%', '20%'];

    return (
      <>
        {blocks.map((block) => {
          const style: React.CSSProperties = {
            left: `${block.left}%`,
            width: `${block.width}%`,
            top: yPositions[block.yLevel],
            height: heights[block.yLevel],
            backgroundColor: block.details.color,
            opacity: block.details.opacity,
          };

          const [startUTC, endUTC] = block.range;
          const startTimeLocal = formatTime(startUTC, timezoneOffset);
          const endTimeLocal = formatTime(endUTC, timezoneOffset);

          return (
            <AccessibleTooltip
              key={block.key}
              content={{
                type: 'session',
                name: block.details.name,
                timeRange: `${startTimeLocal} - ${endTimeLocal}`,
                timezoneLabel: currentTimezoneLabel,
                tooltipInfo: block.tooltip,
              }}
              delay={300}
            >
              <motion.div
                className="absolute rounded cursor-pointer"
                style={style}
                variants={sessionBarVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                custom={block.yLevel}
              />
            </AccessibleTooltip>
          );
        })}
      </>
    );
  },
  (prev, next) =>
    prev.blocks === next.blocks &&
    prev.timezoneOffset === next.timezoneOffset &&
    prev.currentTimezoneLabel === next.currentTimezoneLabel &&
    prev.sessionBarVariants === next.sessionBarVariants
);

interface SessionEventIndicatorsProps {
  sessionName: string;
  events: any[];
  stackedEvents: { [key: string]: any[] };
  visible: boolean;
  eventIndicatorVariants: Variants;
}

const SessionEventIndicators = React.memo(
  ({ sessionName, events, stackedEvents, visible, eventIndicatorVariants }: SessionEventIndicatorsProps) => {
    if (!visible || !events.length) return null;

    return (
      <AnimatePresence>
        {events.map((event: any, idx: number) => {
          const posKey = Math.floor(event.position * 10).toString();
          const stackGroup = stackedEvents[posKey] || [];
          const stackIndex = stackGroup.findIndex((e: any) => e.id === event.id);
          const stackOffset = stackIndex * 14;

          return (
            <AccessibleTooltip
              key={`event-${sessionName}-${event.id || idx}`}
              content={{
                type: 'event',
                impact: event.impact,
                color: event.color,
                event: event.event,
                timeUtc: event.time_utc,
                currency: event.currency,
                forecast: event.forecast,
                previous: event.previous,
                actual: event.actual,
              }}
              delay={300}
            >
              <motion.div
                className="absolute cursor-pointer"
                style={{
                  left: `${event.position}%`,
                  bottom: `${6 + stackOffset}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 10 + stackIndex,
                }}
                variants={eventIndicatorVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                whileHover="hover"
                custom={idx}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: event.color,
                    border: `1.5px solid ${event.borderColor}`,
                    boxShadow: `
                      0 0 8px ${event.color}80,
                      0 2px 4px rgba(0, 0, 0, 0.4),
                      inset 0 1px 2px rgba(255, 255, 255, 0.3),
                      inset 0 -1px 2px rgba(0, 0, 0, 0.3)
                    `,
                  }}
                >
                  <IconCalendarTab
                    className="w-2 h-2"
                    style={{
                      color: 'white',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))'
                    }}
                  />
                </div>
              </motion.div>
            </AccessibleTooltip>
          );
        })}
      </AnimatePresence>
    );
  },
  (prev, next) =>
    prev.visible === next.visible &&
    prev.events === next.events &&
    prev.stackedEvents === next.stackedEvents &&
    prev.eventIndicatorVariants === next.eventIndicatorVariants &&
    prev.sessionName === next.sessionName
);

const VolumeHistogramCanvas = React.memo(
  ({ histogram }: { histogram: VolumeHistogram }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!histogram) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = histogram.chartWidth;
      canvas.height = histogram.chartHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, 0, histogram.chartHeight);
      // Slightly reduce opacity to 0.66 so background volume bars stay subtle
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.66)');
      gradient.addColorStop(0.5, 'rgba(234, 88, 12, 0.66)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.66)');
      ctx.fillStyle = gradient;

      histogram.interpolatedVolume.forEach((volume, idx) => {
        const barHeight = (volume / 100) * histogram.volumeScale;
        const x = idx * histogram.barWidth;
        const y = histogram.baselineY - barHeight;
        ctx.fillRect(x, y, histogram.barWidth, barHeight);
      });
    }, [histogram]);

    return (
      <canvas
        ref={canvasRef}
        width={histogram.chartWidth}
        height={histogram.chartHeight}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />
    );
  },
  (prev, next) => prev.histogram === next.histogram
);
