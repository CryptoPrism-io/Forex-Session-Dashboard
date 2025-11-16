import React, { useEffect, useMemo, useState } from 'react';
import { SESSIONS } from '../constants';
import { ChartBarDetails, TooltipInfo } from '../types';
import { SessionStatus } from '../App';
import { IconChevronDown, IconCalendarTab } from './icons';
import VolumeChart from './VolumeChart';

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
}

interface TimeBlock {
  key: string;
  sessionName: string;
  details: ChartBarDetails;
  left: number; // percentage
  width: number; // percentage
  yLevel: number; // 0 for session, 1 for overlap, 2 for killzone
  tooltip: TooltipInfo;
  range: [number, number];
}

const formatTime = (hour: number, offset: number): string => {
  const localHour = hour + offset;
  const finalHour = (Math.floor(localHour) % 24 + 24) % 24;
  const minutes = Math.round((localHour - Math.floor(localHour)) * 60);
  return `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

interface TooltipState {
  block: TimeBlock | null;
  position: { x: number; y: number };
}

const UnifiedTooltip: React.FC<{
  tooltip: TooltipState | null;
  timezoneOffset: number;
  timezoneLabel: string;
  isVisible?: boolean;
}> = ({ tooltip, timezoneOffset, timezoneLabel, isVisible = true }) => {
  if (!isVisible || !tooltip || !tooltip.block) return null;

  const { block, position } = tooltip;
  const { details, range } = block;
  const [startUTC, endUTC] = range;
  const startTimeLocal = formatTime(startUTC, timezoneOffset);
  const endTimeLocal = formatTime(endUTC, timezoneOffset);

  const tooltipWidth = 300;
  const tooltipHeight = 160;
  const padding = 10;

  let left = position.x;
  let top = position.y;

  // Clamp within container bounds
  const maxLeft = window.innerWidth - tooltipWidth - padding;
  if (left + tooltipWidth > window.innerWidth - padding) {
    left = maxLeft > 0 ? maxLeft : padding;
  }
  if (left < padding) {
    left = padding;
  }

  const maxTop = window.innerHeight - tooltipHeight - padding;
  if (top + tooltipHeight > window.innerHeight - padding) {
    top = maxTop > 0 ? maxTop : padding;
  }
  if (top < padding) {
    top = padding;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        zIndex: 50,
        pointerEvents: 'none',
      }}
      className="bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl p-3 text-sm text-slate-200 w-80"
    >
      <h3 className="font-bold text-base text-white mb-2">{details.name}</h3>
      <p className="text-xs text-cyan-300 mb-2">
        <span className="font-semibold">{startTimeLocal}</span> - <span className="font-semibold">{endTimeLocal}</span> {timezoneLabel}
      </p>
      <p className="text-xs text-slate-400">
        <strong>Volatility:</strong> {block.tooltip.volatility}
      </p>
      <p className="text-xs text-slate-400">
        <strong>Best Pairs:</strong> {block.tooltip.bestPairs}
      </p>
      <p className="text-xs text-slate-400 pt-2 border-t border-slate-700 mt-2">
        <strong>Strategy:</strong> {block.tooltip.strategy}
      </p>
    </div>
  );
};

const ForexChart: React.FC<ForexChartProps> = ({
  nowLine, currentTimezoneLabel, timezoneOffset, sessionStatus, currentTime = new Date(),
  isDSTActive = false, activeSessions, isAutoDetectDST = true, manualDSTOverride,
  onToggleDSTOverride, onAutoDetectToggle
}) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'separate' | 'volume'>('unified');
  const [chartsVisible, setChartsVisible] = useState(true);
  const [showDSTMenu, setShowDSTMenu] = useState(false);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [nowBlinkVisible, setNowBlinkVisible] = useState(true);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showEventFilterMenu, setShowEventFilterMenu] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    sessions: true,
    zones: true,
    overlaps: true,
    killzones: true,
    volume: true,
    news: true // Default visible
  });

  // Economic event indicators state
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventTooltip, setEventTooltip] = useState<{ event: any; position: { x: number; y: number } } | null>(null);

  // Use activeSessions from props if provided, otherwise fall back to SESSIONS constant
  const sessions = activeSessions || SESSIONS;

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
        const response = await fetch('http://localhost:5000/api/calendar/today');
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
  }, []);

  const nowLineStyle = useMemo(() => ({
    left: `${(nowLine / 24) * 100}%`,
    opacity: nowBlinkVisible ? 1 : 0.15,
    boxShadow: nowBlinkVisible ? '0 0 14px rgba(250, 204, 21, 0.8)' : 'none',
    transition: 'opacity 0.2s ease'
  }), [nowLine, nowBlinkVisible]);


  const timeBlocks = useMemo(() => {
    const blocks: TimeBlock[] = [];

    const processBar = (session: typeof SESSIONS[0], bar: (ChartBarDetails & { range: [number, number] }) | undefined, yLevel: number) => {
      if (!bar || !bar.key) return;

      const duration = bar.range[1] - bar.range[0];
      const adjustedStart = bar.range[0] + timezoneOffset;
      const startPos = (adjustedStart % 24 + 24) % 24;
      const endPos = startPos + duration;

      if (endPos <= 24) {
        blocks.push({
          key: `${bar.key}_1`,
          sessionName: session.name,
          details: bar,
          left: (startPos / 24) * 100,
          width: (duration / 24) * 100,
          yLevel,
          tooltip: bar.tooltip,
          range: bar.range,
        });
      } else {
        const width1 = 24 - startPos;
        blocks.push({
          key: `${bar.key}_1`,
          sessionName: session.name,
          details: bar,
          left: (startPos / 24) * 100,
          width: (width1 / 24) * 100,
          yLevel,
          tooltip: bar.tooltip,
          range: bar.range,
        });

        const width2 = endPos - 24;
        if (width2 > 0.001) {
          blocks.push({
            key: `${bar.key}_2`,
            sessionName: session.name,
            details: bar,
            left: 0,
            width: (width2 / 24) * 100,
            yLevel,
            tooltip: bar.tooltip,
            range: bar.range,
          });
        }
      }
    };

    SESSIONS.forEach(session => {
      processBar(session, session.main, 0); // Main session
      processBar(session, session.overlapAsia, 1); // Overlap
      processBar(session, session.overlapLondon, 1); // Overlap
      processBar(session, session.killzone, 2); // Killzone
      processBar(session, session.killzoneAM, 2); // Killzone
      processBar(session, session.killzonePM, 2); // Killzone
    });

    return blocks;
  }, [timezoneOffset]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, block: TimeBlock) => {
    // Only show tooltip for highest priority block (highest yLevel)
    if (tooltip?.block && tooltip.block.yLevel > block.yLevel) {
      return;
    }

    // Clear previous timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Show tooltip after 1 second delay
    tooltipTimeoutRef.current = setTimeout(() => {
      // Calculate container-relative coordinates
      const rect = chartContainerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      setTooltip({
        block,
        position: { x: relativeX, y: relativeY },
      });
    }, 300);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setTooltip(null);
  };

  const getStatusColor = (status: SessionStatus) => {
    const statusConfig = {
      OPEN: { color: 'hsl(120, 70%, 55%)', glow: 'hsl(120, 70%, 55%)' },
      CLOSED: { color: 'hsl(0, 60%, 45%)', glow: 'transparent' },
      WARNING: { color: 'hsl(35, 100%, 60%)', glow: 'hsl(35, 100%, 60%)' },
    };
    return statusConfig[status];
  };

  const ticks = Array.from({ length: 24 }, (_, i) => i); // Every hour
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

  // Pre-calculate volume histogram data (hooks must be called at top level)
  const volumeHistogramSVG = useMemo(() => {
    if (!visibleLayers.volume) return null;

    let rotationSteps = Math.round((timezoneOffset % 24) * 2);
    rotationSteps = ((rotationSteps % 48) + 48) % 48;

    const rotatedVolume = [
      ...VOLUME_DATA.slice(48 - rotationSteps),
      ...VOLUME_DATA.slice(0, 48 - rotationSteps)
    ];

    const interpolatedVolume: number[] = [];
    for (let i = 0; i < rotatedVolume.length - 1; i++) {
      interpolatedVolume.push(rotatedVolume[i]);
      const v1 = rotatedVolume[i];
      const v2 = rotatedVolume[i + 1];
      interpolatedVolume.push(v1 + (v2 - v1) * 0.333);
      interpolatedVolume.push(v1 + (v2 - v1) * 0.667);
    }
    interpolatedVolume.push(rotatedVolume[rotatedVolume.length - 1]);

    const chartWidth = 1000;
    const chartHeight = 100;
    const barWidth = chartWidth / interpolatedVolume.length;
    const volumeScale = chartHeight * 0.85;
    const baselineY = chartHeight - 5;

    return { interpolatedVolume, chartWidth, chartHeight, barWidth, volumeScale, baselineY };
  }, [timezoneOffset, visibleLayers.volume]);

  // Process economic events for display
  const processedEvents = useMemo(() => {
    if (!calendarEvents.length || !visibleLayers.news) return [];

    // Helper: Convert UTC time string to hours (0-24)
    const convertUTCTimeToHours = (utcTimeString: string | undefined): number => {
      if (!utcTimeString) return -1;
      const [hStr = '0', mStr = '0'] = utcTimeString.split(':');
      const hours = parseInt(hStr, 10) || 0;
      const minutes = parseInt(mStr, 10) || 0;
      return hours + minutes / 60;
    };

    // Helper: Get impact color
    const getImpactColor = (impact: string): string => {
      switch (impact?.toLowerCase()) {
        case 'high': return '#ef4444'; // red-500
        case 'medium': return '#f59e0b'; // amber-500
        case 'low': return '#10b981'; // green-500
        default: return '#64748b'; // slate-500
      }
    };

    // Filter by impact level
    const filtered = calendarEvents.filter((event) => {
      if (eventFilter === 'all') return true;
      return event.impact?.toLowerCase() === eventFilter;
    });

    // Transform events with position calculation
    return filtered.map((event) => {
      const utcHours = convertUTCTimeToHours(event.time_utc);
      if (utcHours < 0) return null; // Skip events without valid time

      // Convert to local timezone
      const localHours = (utcHours + timezoneOffset + 24) % 24;
      const position = (localHours / 24) * 100; // percentage

      return {
        ...event,
        utcHours,
        localHours,
        position,
        color: getImpactColor(event.impact),
      };
    }).filter(Boolean); // Remove null entries
  }, [calendarEvents, eventFilter, timezoneOffset, visibleLayers.news]);

  // Group events by position for stacking
  const stackedEvents = useMemo(() => {
    const groups: { [key: string]: any[] } = {};

    processedEvents.forEach((event: any) => {
      const posKey = Math.floor(event.position * 10).toString(); // Group by ~2.4hr intervals
      if (!groups[posKey]) groups[posKey] = [];
      groups[posKey].push(event);
    });

    return groups;
  }, [processedEvents]);

  return (
    <div ref={chartContainerRef} className="relative w-full bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-2xl border border-slate-700/30 p-6 rounded-2xl shadow-2xl shadow-black/30 hover:border-slate-600/50 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-100">Session Timeline</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('separate')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md transition-all duration-300 border ${
                viewMode === 'separate'
                  ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-100 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md transition-all duration-300 border ${
                viewMode === 'unified'
                  ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-100 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300'
              }`}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode('volume')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md transition-all duration-300 border ${
                viewMode === 'volume'
                  ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-100 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300'
              }`}
            >
              Volume
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Show/Hide Button */}
          {(viewMode === 'separate' || viewMode === 'unified') && (
            <div className="relative">
              <button
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                className="px-2 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 opacity-50 hover:opacity-70 transition-all duration-300"
                title={visibleLayers.sessions ? "Hide layers" : "Show layers"}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>

              {/* Layers Menu */}
              {showLayersMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl p-3 z-50 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleLayers.sessions}
                      onChange={(e) => setVisibleLayers({ ...visibleLayers, sessions: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">Sessions</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleLayers.overlaps}
                      onChange={(e) => setVisibleLayers({ ...visibleLayers, overlaps: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">Overlaps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleLayers.killzones}
                      onChange={(e) => setVisibleLayers({ ...visibleLayers, killzones: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">Killzones</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={visibleLayers.volume}
                      onChange={(e) => setVisibleLayers({ ...visibleLayers, volume: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">Volume</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors border-t border-slate-700 pt-2 mt-2">
                    <input
                      type="checkbox"
                      checked={visibleLayers.news}
                      onChange={(e) => setVisibleLayers({ ...visibleLayers, news: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">📰 News</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Event Filter Dropdown */}
          {(viewMode === 'separate' || viewMode === 'unified') && visibleLayers.news && (
            <div className="relative">
              <button
                onClick={() => setShowEventFilterMenu(!showEventFilterMenu)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 transition-all duration-300 flex items-center gap-1"
                title="Filter economic events"
              >
                <IconCalendarTab className="w-3.5 h-3.5" />
                <span className="capitalize">{eventFilter}</span>
              </button>

              {/* Event Filter Menu */}
              {showEventFilterMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl p-2 z-50 space-y-1">
                  {['all', 'high', 'medium', 'low'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setEventFilter(filter as typeof eventFilter);
                        setShowEventFilterMenu(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all text-left capitalize ${
                        eventFilter === filter
                          ? filter === 'high'
                            ? 'bg-red-500/30 border-red-400/50 text-red-100'
                            : filter === 'medium'
                            ? 'bg-amber-500/30 border-amber-400/50 text-amber-100'
                            : filter === 'low'
                            ? 'bg-green-500/30 border-green-400/50 text-green-100'
                            : 'bg-cyan-500/30 border-cyan-400/50 text-cyan-100'
                          : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 text-slate-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DST Toggle Button */}
          <div className="relative">
            <button
              onClick={() => setShowDSTMenu(!showDSTMenu)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg backdrop-blur-md bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 transition-all duration-300"
              title={isDSTActive ? "Summer Time (DST Active)" : "Standard Time"}
            >
              {isDSTActive ? '🌞 DST' : '❄️ ST'}
            </button>

            {/* DST Menu */}
            {showDSTMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl p-3 z-50 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 p-2 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={isAutoDetectDST}
                    onChange={(e) => onAutoDetectToggle?.(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <span className="text-xs text-slate-300">Auto-detect DST</span>
                </label>
                <div className="border-t border-slate-700 pt-2 mt-2">
                  <p className="text-xs text-slate-400 px-2 pb-2">Manual Override:</p>
                  <button
                    onClick={() => {
                      onToggleDSTOverride?.(true);
                      setShowDSTMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all ${ manualDSTOverride === true
                      ? 'bg-amber-500/30 border-amber-400/50 text-amber-100'
                      : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 text-slate-300'
                    }`}
                  >
                    🌞 Summer (DST)
                  </button>
                  <button
                    onClick={() => {
                      onToggleDSTOverride?.(false);
                      setShowDSTMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-xs rounded-lg border transition-all mt-1 ${
                      manualDSTOverride === false
                        ? 'bg-blue-500/30 border-blue-400/50 text-blue-100'
                        : 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/40 text-slate-300'
                    }`}
                  >
                    ❄️ Winter (Standard)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-slate-300">
        {cityBadges.map((city) => (
          <div
            key={city.label}
            className="flex items-center gap-2 px-2.5 py-1 rounded-2xl border border-slate-700/60 bg-slate-800/30 backdrop-blur"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shadow"
              style={{ backgroundColor: city.accent, boxShadow: `0 0 10px ${city.accent}60` }}
            />
            <span className="font-semibold text-slate-100">{city.label}</span>
            <span className="text-[10px] text-slate-400">{city.offsetLabel}</span>
          </div>
        ))}
      </div>

      {viewMode === 'separate' ? (
        // Separate view - individual rows per session
        <div>
        {[sessions[3], sessions[2], sessions[0], sessions[1]].map(session => {
          const status = sessionStatus[session.name];
          const statusColors = getStatusColor(status);

          return (
            <div key={session.name} className="mb-5 last:mb-0">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-24 flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: statusColors.color,
                      boxShadow: `0 0 6px ${statusColors.glow}`,
                      animation: status === 'WARNING' ? 'pulse-glow 1.5s infinite' : 'none',
                    }}
                  />
                  <span className="text-sm font-semibold text-slate-300">{session.name}</span>
                </div>
              </div>

              <div className="relative w-full h-16 bg-gradient-to-br from-slate-700/30 to-slate-800/40 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden shadow-lg shadow-black/20">
                {/* Vertical hour grid lines */}
                {ticks.map(hour => (
                  <div
                    key={`grid-${hour}`}
                    className="absolute top-0 bottom-0 border-l border-slate-700/30"
                    style={{ left: `${(hour / 24) * 100}%` }}
                  />
                ))}

                {timeBlocks
                  .filter(block => block.sessionName === session.name)
                  .map(block => {
                    const yPositions = ['60%', '40%', '10%'];
                    const heights = ['35%', '25%', '20%'];

                    const style: React.CSSProperties = {
                      left: `${block.left}%`,
                      width: `${block.width}%`,
                      top: yPositions[block.yLevel],
                      height: heights[block.yLevel],
                      backgroundColor: block.details.color,
                      opacity: block.details.opacity,
                    };

                    return (
                      <div
                        key={block.key}
                        className="absolute rounded transition-all duration-200 ease-in-out hover:scale-y-125 cursor-pointer"
                        style={style}
                        onMouseMove={(e) => handleMouseMove(e, block)}
                        onMouseLeave={handleMouseLeave}
                        aria-label={block.details.name}
                      />
                    );
                  })}

                {/* Economic Event Indicators for this session */}
                {visibleLayers.news && processedEvents.map((event: any, idx: number) => {
                  // Calculate vertical stack position for overlapping events
                  const posKey = Math.floor(event.position * 10).toString();
                  const stackGroup = stackedEvents[posKey] || [];
                  const stackIndex = stackGroup.findIndex((e: any) => e.id === event.id);
                  const stackOffset = stackIndex * 14; // 14px vertical spacing for separate view

                  return (
                    <div
                      key={`event-${session.name}-${event.id || idx}`}
                      className="absolute cursor-pointer transition-all duration-200 hover:scale-110"
                      style={{
                        left: `${event.position}%`,
                        bottom: `${6 + stackOffset}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 10 + stackIndex,
                      }}
                      onMouseEnter={(e) => {
                        const rect = chartContainerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        setEventTooltip({
                          event,
                          position: { x: e.clientX - rect.left, y: e.clientY - rect.top },
                        });
                      }}
                      onMouseLeave={() => setEventTooltip(null)}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          backgroundColor: event.color,
                          boxShadow: `0 0 6px ${event.color}80`,
                        }}
                      >
                        <IconCalendarTab
                          className="w-2 h-2"
                          style={{ color: 'white' }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                  style={nowLineStyle}
                >
                  <div className="absolute -top-5 -translate-x-1/2 text-xs text-yellow-300 font-bold whitespace-nowrap">
                    Now
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <p className="mt-3 text-[11px] text-slate-500 text-right italic">{timezoneAxisNote}</p>
        </div>
      ) : viewMode === 'unified' ? (
        // Unified view - all sessions on one timeline
        <div className="mb-5">
          <div className="relative w-full h-32 bg-gradient-to-br from-slate-700/30 to-slate-800/40 backdrop-blur-xl border border-slate-700/30 rounded-xl overflow-hidden shadow-lg shadow-black/20">
            {/* Volume Histogram Background */}
            {volumeHistogramSVG && (
              <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
                viewBox={`0 0 ${volumeHistogramSVG.chartWidth} ${volumeHistogramSVG.chartHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Gradient from red (bottom) to orange to green (top), bottom-to-top direction */}
                  <linearGradient id="volumeHistogramGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="rgb(220, 38, 38)" stopOpacity="0.10" />
                    <stop offset="50%" stopColor="rgb(234, 88, 12)" stopOpacity="0.10" />
                    <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.10" />
                  </linearGradient>
                </defs>
                {/* Draw histogram bars */}
                {volumeHistogramSVG.interpolatedVolume.map((volume, i) => {
                  const x = i * volumeHistogramSVG.barWidth;
                  const barHeight = (volume / 100) * volumeHistogramSVG.volumeScale;
                  const y = volumeHistogramSVG.baselineY - barHeight;

                  return (
                    <rect
                      key={`bar-${i}`}
                      x={x}
                      y={y}
                      width={volumeHistogramSVG.barWidth}
                      height={barHeight}
                      fill="url(#volumeHistogramGradient)"
                    />
                  );
                })}
              </svg>
            )}

            {/* Vertical hour grid lines */}
            {ticks.map(hour => (
              <div
                key={`grid-${hour}`}
                className="absolute top-0 bottom-0 border-l border-slate-700/30"
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}

            {/* All session blocks - Filtered by visibility */}
            {timeBlocks
              .filter(block => {
                // Filter based on visibility settings
                if (block.yLevel === 0 && !visibleLayers.sessions) return false; // Main sessions
                if (block.yLevel === 1 && !visibleLayers.overlaps) return false; // Overlaps
                if (block.yLevel === 2 && !visibleLayers.killzones) return false; // Killzones
                return true;
              })
              .map(block => {
                const yPositions = ['75%', '50%', '25%'];
                const heights = ['35%', '25%', '20%'];
                const style: React.CSSProperties = {
                  left: `${block.left}%`,
                  width: `${block.width}%`,
                  top: yPositions[block.yLevel],
                  height: heights[block.yLevel],
                  backgroundColor: block.details.color,
                  opacity: block.details.opacity,
                  mixBlendMode: 'normal',
                };

                return (
                  <div
                    key={block.key}
                    className="absolute rounded transition-all duration-200 ease-in-out hover:scale-y-110 cursor-pointer"
                    style={style}
                    onMouseMove={(e) => handleMouseMove(e, block)}
                    onMouseLeave={handleMouseLeave}
                    aria-label={block.details.name}
                  />
                );
              })}

            {/* Economic Event Indicators */}
            {visibleLayers.news && processedEvents.map((event: any, idx: number) => {
              // Calculate vertical stack position for overlapping events
              const posKey = Math.floor(event.position * 10).toString();
              const stackGroup = stackedEvents[posKey] || [];
              const stackIndex = stackGroup.findIndex((e: any) => e.id === event.id);
              const stackOffset = stackIndex * 18; // 18px vertical spacing between stacked icons

              return (
                <div
                  key={`event-${event.id || idx}`}
                  className="absolute cursor-pointer transition-all duration-200 hover:scale-110"
                  style={{
                    left: `${event.position}%`,
                    bottom: `${8 + stackOffset}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 10 + stackIndex,
                  }}
                  onMouseEnter={(e) => {
                    const rect = chartContainerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    setEventTooltip({
                      event,
                      position: { x: e.clientX - rect.left, y: e.clientY - rect.top },
                    });
                  }}
                  onMouseLeave={() => setEventTooltip(null)}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      backgroundColor: event.color,
                      boxShadow: `0 0 8px ${event.color}80`,
                    }}
                  >
                    <IconCalendarTab
                      className="w-2.5 h-2.5"
                      style={{ color: 'white' }}
                    />
                  </div>
                </div>
              );
            })}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
              style={nowLineStyle}
            >
              <div className="absolute -top-5 -translate-x-1/2 text-xs text-yellow-300 font-bold whitespace-nowrap">
                Now
              </div>
            </div>
          </div>

          {/* Legend for unified view */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {[sessions[3], sessions[2], sessions[0], sessions[1]].map(session => {
              const status = sessionStatus[session.name];
              const statusColors = getStatusColor(status);
              return (
                <div key={session.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: statusColors.color,
                      boxShadow: `0 0 4px ${statusColors.glow}`,
                    }}
                  />
                  <span className="text-slate-300">{session.name}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-500 text-right italic">{timezoneAxisNote}</p>
        </div>
      ) : (
        // Volume view - Trading Volume Chart
        <div>
          <VolumeChart
            nowLine={nowLine}
            currentTimezoneLabel={currentTimezoneLabel}
            timezoneOffset={timezoneOffset}
            currentTime={currentTime}
          />
          <p className="mt-3 text-[11px] text-slate-500 text-right italic">{timezoneAxisNote}</p>
        </div>
      )}

      {viewMode === 'unified' && (
        <UnifiedTooltip
          tooltip={tooltip}
          timezoneOffset={timezoneOffset}
          timezoneLabel={currentTimezoneLabel}
          isVisible={true}
        />
      )}

      {/* Economic Event Tooltip */}
      {eventTooltip && eventTooltip.event && (
        <div
          style={{
            position: 'absolute',
            left: eventTooltip.position.x,
            top: eventTooltip.position.y - 120,
            zIndex: 100,
            pointerEvents: 'none',
          }}
          className="bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl p-3 text-xs text-slate-200 w-64"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: eventTooltip.event.color,
                boxShadow: `0 0 6px ${eventTooltip.event.color}80`,
              }}
            />
            <span className="font-bold text-sm text-white capitalize">
              {eventTooltip.event.impact || 'Medium'} Impact
            </span>
          </div>

          <p className="font-semibold text-slate-100 mb-2">{eventTooltip.event.event}</p>

          <div className="space-y-1 text-[11px]">
            <p className="text-slate-400">
              <span className="font-semibold">Time:</span>{' '}
              {eventTooltip.event.time || eventTooltip.event.time_utc || 'TBD'}
            </p>
            <p className="text-slate-400">
              <span className="font-semibold">Currency:</span>{' '}
              {eventTooltip.event.currency || 'N/A'}
            </p>
            {eventTooltip.event.forecast && (
              <p className="text-slate-400">
                <span className="font-semibold">Forecast:</span>{' '}
                {eventTooltip.event.forecast}
              </p>
            )}
            {eventTooltip.event.previous && (
              <p className="text-slate-400">
                <span className="font-semibold">Previous:</span>{' '}
                {eventTooltip.event.previous}
              </p>
            )}
            {eventTooltip.event.actual && (
              <p className="text-slate-400">
                <span className="font-semibold">Actual:</span>{' '}
                {eventTooltip.event.actual}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForexChart;
