import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Customized,
} from 'recharts';
import { IconCalendarTab } from './icons';
import { AccessibleTooltip } from './Tooltip';
import { useInstrumentedMemo } from '../utils/performance';

interface VolumeChartProps {
  nowLine: number;
  timezoneOffset: number;
  currentTimezoneLabel: string;
  currentTime?: Date;
  calendarEvents?: any[];
  stackedEvents?: { [key: string]: any[] };
  visibleLayers?: { news?: boolean };
  chartContainerRef?: React.RefObject<HTMLDivElement>;
}

// Global Forex Trading Volume Model (UTC)
// Normalized 0–100 volumes with institutional microstructure
// 30-min intervals (48 points = 24 hours)
// Features: Sydney baseline → Asia ramp → London spike → London-NY overlap peak (100 at 13:30) → NY fade → Rollover lull
const VOLUME_DATA = [
  18, 17, 17, 18, 19, 21,        // 00:00–02:30 — Sydney-only quiet; slow Asian liquidity build
  23, 26, 30, 35, 39, 42,        // 03:00–05:30 — Asia begins, Tokyo desks warming up
  46, 50, 55, 60, 65, 70,        // 06:00–08:30 — Tokyo peak, early Europe pre-open buildup
  75, 82, 88, 92, 89, 84,        // 09:00–11:30 — Europe volatility, London open burst then lunch dip
  90, 95, 98, 100, 99, 96,       // 12:00–14:30 — NY AM KZ (11:00–14:00); data spikes & trend runs
  94, 90, 86, 80, 75, 70,        // 15:00–17:30 — overlap winds down, London exits, NY active
  68, 63, 58, 52, 48, 44,        // 18:00–20:30 — NY-only, declining flow, US close nearing
  40, 36, 32, 30, 28, 26         // 21:00–23:30 — rollover lull, swap-settlement hour, Sydney pre-open
];

const SESSION_NOTES = [
  { hour: 0, label: '00:00–02:30', desc: 'Sydney-only quiet; slow Asian liquidity build', utcRange: [0, 2.5] },
  { hour: 3, label: '03:00–05:30', desc: 'Asia begins, Tokyo desks warming up', utcRange: [3, 5.5] },
  { hour: 6, label: '06:00–08:30', desc: 'Tokyo peak, early Europe pre-open buildup', utcRange: [6, 8.5] },
  { hour: 9, label: '09:00–11:30', desc: 'Europe volatility, London open burst then lunch dip at 11:00 UTC', utcRange: [9, 11.5], lunchDip: 11 },
  { hour: 12, label: '12:00–14:30', desc: 'NY AM Killzone (11:00–14:00 UTC); peak overlap (100 at 13:30 UTC), data spikes & trend runs', utcRange: [12, 14.5], peak: 13.5 },
  { hour: 15, label: '15:00–17:30', desc: 'Overlap winds down, London exits, NY active', utcRange: [15, 17.5] },
  { hour: 18, label: '18:00–20:30', desc: 'NY-only, declining flow, US close nearing', utcRange: [18, 20.5] },
  { hour: 21, label: '21:00–23:30', desc: 'Rollover lull (21:00–22:00 UTC), swap-settlement hour, Sydney pre-open', utcRange: [21, 23.5], rolloverLull: [21, 22] }
] as const;

type SessionLayerType = 'main' | 'overlap' | 'killzone';

const SESSION_LAYER_DEFS: Array<{
  name: string;
  type: SessionLayerType;
  color: string;
  range: [number, number];
}> = [
  { name: 'Sydney Session', type: 'main', color: 'hsl(195, 74%, 62%)', range: [21, 30] },
  { name: 'Asian Session (Tokyo)', type: 'main', color: 'hsl(320, 82%, 60%)', range: [23, 32] },
  { name: 'London Session', type: 'main', color: 'hsl(45, 100%, 50%)', range: [8, 17] },
  { name: 'New York Session', type: 'main', color: 'hsl(120, 60%, 50%)', range: [13, 22] },
  { name: 'Asia-London Overlap', type: 'overlap', color: 'hsl(255, 80%, 70%)', range: [8, 9] },
  { name: 'London-NY Overlap', type: 'overlap', color: 'hsl(20, 100%, 60%)', range: [13, 17] },
  { name: 'London Killzone', type: 'killzone', color: 'hsl(0, 80%, 60%)', range: [7, 10] },
  { name: 'NY AM Killzone', type: 'killzone', color: 'hsl(0, 80%, 60%)', range: [12, 15] },
  { name: 'NY PM Killzone', type: 'killzone', color: 'hsl(0, 60%, 55%)', range: [18, 20] },
];

const SESSION_LANE_STYLES: Record<SessionLayerType, { y1: number; y2: number; opacity: number }> = {
  main: { y1: 60, y2: 100, opacity: 0.08 },
  overlap: { y1: 35, y2: 60, opacity: 0.12 },
  killzone: { y1: 12, y2: 35, opacity: 0.18 },
};

// Format elapsed/remaining time in HH MM SS format
const formatSessionDuration = (seconds: number): string => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);

  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = Math.floor(absSeconds % 60);

  const sign = isNegative ? '-' : '';
  return `${sign}${hours}h ${minutes}m ${secs}s`;
};

const formatHourLabel = (hourValue: number): string => {
  const hours = Math.floor(hourValue) % 24;
  const minutes = Math.round((hourValue - Math.floor(hourValue)) * 60);
  return `${String((hours + 24) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const normalizeHour = (value: number): number => ((value % 24) + 24) % 24;

const buildLocalSegments = (
  startUTC: number,
  endUTC: number,
  timezoneOffset: number,
  color: string,
  type: SessionLayerType,
  name: string
) => {
  const segments: { start: number; end: number; color: string; type: SessionLayerType; name: string }[] = [];
  const localStartAbs = startUTC + timezoneOffset;
  const localEndAbs = endUTC + timezoneOffset;

  let cursor = localStartAbs;
  while (cursor < localEndAbs) {
    const startNormalized = normalizeHour(cursor);
    const nextBoundary = Math.floor(cursor / 24 + 1e-9) * 24 + 24;
    const segmentLength = Math.min(localEndAbs - cursor, nextBoundary - cursor);
    const endNormalized = startNormalized + segmentLength;
    segments.push({
      start: startNormalized,
      end: Math.min(endNormalized, 24),
      color,
      type,
      name,
    });
    cursor += segmentLength;
  }

  return segments;
};

// Custom Tooltip Component
const CustomVolumeTooltip: React.FC<any> = ({ active, payload, label, getSessionAtTime, getSessionEventsAtTime }) => {
  if (active && payload && payload[0]) {
    // Extract the time string from the chart (e.g., "18:00")
    const timeStr = payload[0].payload.time;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const hoveredLocalTime = hours + minutes / 60;

    // Get session data for the hovered time
    const sessionData = getSessionAtTime?.(hoveredLocalTime);
    const sessionEvents = getSessionEventsAtTime?.(hoveredLocalTime);

    return (
      <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl max-w-sm">
        <p className="text-xs text-slate-400 mb-2">Time: <span className="text-cyan-400 font-medium">{timeStr}</span></p>
        <p className="text-xs text-slate-300 mb-2">Volume: <span className="text-slate-100 font-medium">{payload[0].value}</span></p>

        {/* Events at this time */}
        {sessionEvents && sessionEvents.length > 0 && (
          <div className="border-t border-slate-700 pt-2 mt-2">
            <p className="text-xs text-slate-300 font-semibold mb-2">At This Time:</p>
            <div className="space-y-1">
              {sessionEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: event.color }}
                  ></div>
                  <span className="text-xs text-slate-300">{event.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const VolumeChart: React.FC<VolumeChartProps> = ({
  nowLine,
  timezoneOffset,
  currentTimezoneLabel,
  currentTime = new Date(),
  calendarEvents = [],
  stackedEvents = {},
  visibleLayers = {},
  chartContainerRef
}) => {
  // Convert local time (nowLine) back to UTC for accurate session detection
  const getUTCHour = (localHour: number, offset: number): number => {
    let utcHour = localHour - offset;
    utcHour = (utcHour % 24 + 24) % 24; // Normalize to 0-24
    return utcHour;
  };

  // Format time with timezone conversion
  const formatTimeInTimezone = (utcHour: number, offset: number): string => {
    let localHour = (utcHour + offset) % 24;
    localHour = localHour < 0 ? localHour + 24 : localHour;

    const hours = Math.floor(localHour);
    const minutes = Math.round((localHour - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Prepare chart data with timezone-adjusted times
  const chartData = useInstrumentedMemo('VolumeChart-chartData', () => {
    // Calculate rotation amount based on timezone offset
    // Each 0.5-hour step = 1 data point, so multiply offset by 2
    // Normalize to 0-47 range (48 data points for 24 hours)
    let rotationSteps = Math.round((timezoneOffset % 24) * 2);
    rotationSteps = ((rotationSteps % 48) + 48) % 48;

    // Rotate BACKWARDS: move data from end to beginning
    // This aligns UTC times to local timezone perspective
    // At 00:00 local = (00:00 - offset) UTC = (24 - offset) UTC from previous day
    const rotatedVolumeData = [
      ...VOLUME_DATA.slice(48 - rotationSteps),
      ...VOLUME_DATA.slice(0, 48 - rotationSteps)
    ];

    return rotatedVolumeData.map((volume, index) => {
      // index 0-47 represents 0:00-23:30 in user's LOCAL timezone (after rotation)
      const localHours = index * 0.5;

      const hours = Math.floor(localHours);
      const minutes = Math.round((localHours - hours) * 60);

      return {
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        hour: localHours,  // ✅ continuous numeric x-axis value
        volume,
      };
    });
  }, [timezoneOffset]);

  // Determine current session based on UTC hours (converted from local nowLine)
  const getCurrentSession = () => {
    const utcHour = getUTCHour(nowLine, timezoneOffset);
    const hour = Math.floor(utcHour);

    if (hour >= 0 && hour < 3) return SESSION_NOTES[0];      // 0:00–2:30 UTC
    if (hour >= 3 && hour < 6) return SESSION_NOTES[1];      // 3:00–5:30 UTC
    if (hour >= 6 && hour < 9) return SESSION_NOTES[2];      // 6:00–8:30 UTC
    if (hour >= 9 && hour < 12) return SESSION_NOTES[3];     // 9:00–11:30 UTC
    if (hour >= 12 && hour < 15) return SESSION_NOTES[4];    // 12:00–14:30 UTC
    if (hour >= 15 && hour < 18) return SESSION_NOTES[5];    // 15:00–17:30 UTC
    if (hour >= 18 && hour < 21) return SESSION_NOTES[6];    // 18:00–20:30 UTC
    return SESSION_NOTES[7];                                   // 21:00–23:30 UTC
  };

  const currentSession = useMemo(() => {
    const baseSession = getCurrentSession();
    const utcHour = getUTCHour(nowLine, timezoneOffset);

    // Calculate start and end times in UTC for the current session
    const sessionStartUTC = Math.floor(utcHour / 3) * 3; // Round down to nearest 3-hour block
    const sessionEndUTC = (sessionStartUTC + 3) % 24;

    // Format times in user's timezone
    const startTimeLocal = formatTimeInTimezone(sessionStartUTC, timezoneOffset);
    const endTimeLocal = formatTimeInTimezone(sessionEndUTC, timezoneOffset);

    return {
      ...baseSession,
      label: `${startTimeLocal}–${endTimeLocal}`,
      desc: baseSession.desc,
    };
  }, [nowLine, timezoneOffset]);

  // Function to detect what events are at a given local time
  const getSessionEventsAtTime = useInstrumentedMemo('VolumeChart-sessionEvents', () => {
    return (localHour: number) => {
      const utcHour = getUTCHour(localHour, timezoneOffset);
      const events: { name: string; color: string }[] = [];

      SESSION_LAYER_DEFS.forEach(({ name, range, color }) => {
        const [start, end] = range;
        let isActive = false;

        // Handle overnight sessions (e.g., Sydney 21-30, Asia 23-32)
        if (end > 24) {
          // Session crosses midnight
          isActive = utcHour >= start || utcHour < (end - 24);
        } else {
          // Regular session within same day
          isActive = utcHour >= start && utcHour < end;
        }

        if (isActive) {
          events.push({ name, color });
        }
      });

      return events;
    };
  }, [timezoneOffset]);

  // Function to get session data for any given local time (used by tooltip)
  const getSessionAtTime = useInstrumentedMemo('VolumeChart-sessionAtTime', () => {
    return (localHour: number) => {
      const utcHour = getUTCHour(localHour, timezoneOffset);
      const hour = Math.floor(utcHour);

      // Get the session start/end times from SESSION_NOTES
      let baseSession;
      if (hour >= 0 && hour < 3) baseSession = SESSION_NOTES[0];
      else if (hour >= 3 && hour < 6) baseSession = SESSION_NOTES[1];
      else if (hour >= 6 && hour < 9) baseSession = SESSION_NOTES[2];
      else if (hour >= 9 && hour < 12) baseSession = SESSION_NOTES[3];
      else if (hour >= 12 && hour < 15) baseSession = SESSION_NOTES[4];
      else if (hour >= 15 && hour < 18) baseSession = SESSION_NOTES[5];
      else if (hour >= 18 && hour < 21) baseSession = SESSION_NOTES[6];
      else baseSession = SESSION_NOTES[7];

      const sessionStartUTC = baseSession.utcRange[0];
      const sessionEndUTC = baseSession.utcRange[1];

      // Calculate elapsed and remaining based on the hovered time
      const hoveredUTCSeconds = utcHour * 3600;
      const sessionStartSeconds = sessionStartUTC * 3600;
      const sessionEndSeconds = sessionEndUTC * 3600;

      const elapsedSeconds = hoveredUTCSeconds - sessionStartSeconds;
      const remainingSeconds = sessionEndSeconds - hoveredUTCSeconds;

      // Format times in user's timezone
      const startTimeLocal = formatTimeInTimezone(sessionStartUTC, timezoneOffset);
      const endTimeLocal = formatTimeInTimezone(sessionEndUTC, timezoneOffset);

      // Determine session name
      let sessionName = 'Trading Session';
      if (hour >= 0 && hour < 9) sessionName = 'Asia Session';
      else if (hour >= 9 && hour < 17) sessionName = 'Europe Session';
      else if (hour >= 17 && hour < 24) sessionName = 'New York Session';

      return {
        sessionRange: `${startTimeLocal}–${endTimeLocal}`,
        sessionName: sessionName,
        elapsed: formatSessionDuration(elapsedSeconds),
        remaining: formatSessionDuration(remainingSeconds),
      };
    };
  }, [timezoneOffset]);

  // Current session data (for header display)
  const normalizedNowLine = useMemo(() => normalizeHour(nowLine), [nowLine]);

  const sessionLayerSegments = useInstrumentedMemo('VolumeChart-sessionLayerSegments', () => {
    const segmentsByType: Record<SessionLayerType, Array<{ start: number; end: number; color: string; name: string }>> = {
      main: [],
      overlap: [],
      killzone: [],
    };

    SESSION_LAYER_DEFS.forEach((layer) => {
      const segments = buildLocalSegments(layer.range[0], layer.range[1], timezoneOffset, layer.color, layer.type, layer.name);
      segmentsByType[layer.type].push(...segments);
    });

    // Sort segments by start for consistent rendering
    (Object.keys(segmentsByType) as SessionLayerType[]).forEach((type) => {
      segmentsByType[type].sort((a, b) => a.start - b.start);
    });

    return segmentsByType;
  }, [timezoneOffset]);

  return (
    <div className="w-full mt-4 sm:mt-6 bg-slate-900/40 border border-slate-800/50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-md shadow-black/10 sm:shadow-lg backdrop-blur-none sm:backdrop-blur-xl">
      {/* Header with Title and Session Info */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-100 mb-1">Trading Volume</h2>
        </div>

        {/* Session Info - Mobile: below title, Desktop: top right */}
        <div className="text-xs text-slate-300 space-y-1 max-w-xs sm:max-w-sm bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 sm:p-3">
          <div className="font-semibold text-slate-200 mb-1 text-[10px] sm:text-xs">Current Session</div>
          <div className="text-slate-300 text-[10px] sm:text-xs">
            <span className="font-medium text-cyan-400">{currentSession.label}</span>
            <span className="text-slate-400 hidden sm:inline"> — {currentSession.desc}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 320 : window.innerWidth < 768 ? 280 : 250}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(34, 211, 238, 0.8)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="rgba(34, 211, 238, 0.1)" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />

            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, 24]}
              ticks={window.innerWidth < 640
                ? Array.from({ length: 7 }, (_, idx) => idx * 4)  // Mobile: every 4 hours
                : Array.from({ length: 13 }, (_, idx) => idx * 2)  // Desktop: every 2 hours
              }
              tickFormatter={(h) => formatHourLabel(h)}
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{
                fill: 'rgba(148, 163, 184, 0.7)',
                fontSize: window.innerWidth < 640 ? 10 : 12
              }}
              interval={0}
              height={window.innerWidth < 640 ? 35 : 40}
            />

            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{
                fill: 'rgba(148, 163, 184, 0.7)',
                fontSize: window.innerWidth < 640 ? 10 : 12
              }}
              domain={[0, 100]}
              width={window.innerWidth < 640 ? 35 : 45}
            />

            <Tooltip
              content={
                <CustomVolumeTooltip getSessionAtTime={getSessionAtTime} getSessionEventsAtTime={getSessionEventsAtTime} />
              }
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(148, 163, 184, 0.5)' }}
            />

            {/* Session bands stacked inside the chart */}
            {(['main', 'overlap', 'killzone'] as SessionLayerType[]).map((type) =>
              sessionLayerSegments[type].map((segment, idx) => {
                const lane = SESSION_LANE_STYLES[type];
                return (
                  <ReferenceArea
                    key={`${type}-area-${idx}-${segment.start}`}
                    x1={segment.start}
                    x2={segment.end}
                    y1={lane.y1}
                    y2={lane.y2}
                    fill={segment.color}
                    fillOpacity={lane.opacity}
                    ifOverflow="visible"
                    stroke="none"
                  />
                );
              })
            )}

            <Area
              type="monotone"
              dataKey="volume"
              stroke="rgba(34, 211, 238, 1)"
              strokeWidth={2}
              fill="url(#volumeGradient)"
              dot={false}
              isAnimationActive={false}
            />

            {/* "Now" Reference Line */}
            <ReferenceLine
              x={normalizedNowLine}
              stroke="rgba(251, 191, 36, 0.9)"
              strokeWidth={1.2}
              ifOverflow="visible"
              strokeDasharray="0"
              strokeOpacity={1}
              strokeLinecap="round"
            />
            <Customized
              component={({ xAxisMap, offset }) => {
                if (!xAxisMap || !offset) return null;
                const axisKey = Object.keys(xAxisMap)[0];
                const xAxis = xAxisMap[axisKey];
                if (!xAxis || typeof xAxis.scale !== 'function') return null;

                const cx = xAxis.scale(normalizedNowLine);
                const cy = offset.top + offset.height / 2;
                const capsuleWidth = 48;
                const capsuleHeight = 18;
                const labelText = formatHourLabel(normalizedNowLine);
                const rotation = `rotate(270 ${cx} ${cy})`;

                return (
                  <g transform={rotation} style={{ pointerEvents: 'none' }}>
                    <rect
                      x={cx - capsuleWidth / 2}
                      y={cy - capsuleHeight / 2}
                      width={capsuleWidth}
                      height={capsuleHeight}
                      rx={capsuleHeight / 2}
                      ry={capsuleHeight / 2}
                      fill="rgba(15, 23, 42, 0.98)"
                      stroke="rgba(251, 191, 36, 0.95)"
                      strokeWidth={0.9}
                    />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(251, 191, 36, 0.98)"
                      fontSize={11}
                      fontWeight={600}
                    >
                      {labelText}
                    </text>
                  </g>
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Economic Event Indicators */}
        {visibleLayers.news && calendarEvents.map((event: any, idx: number) => {
          // Calculate vertical stack position for overlapping events
          const posKey = Math.floor(event.position * 10).toString();
          const stackGroup = stackedEvents[posKey] || [];
          const stackIndex = stackGroup.findIndex((e: any) => e.id === event.id);
          const stackOffset = stackIndex * 18; // 18px vertical spacing

          return (
            <AccessibleTooltip
              key={`event-volume-${event.id || idx}`}
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
              <div
                className="absolute cursor-pointer transition-all duration-200 hover:scale-110 hover:opacity-100"
                style={{
                  left: `${event.position}%`,
                  bottom: `${8 + stackOffset}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 10 + stackIndex,
                  opacity: 0.67,
                }}
              >
                <div
                  className="w-4.5 h-4.5 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: event.color,
                    border: `1.5px solid ${event.borderColor}`,
                    boxShadow: `
                      0 0 10px ${event.color}80,
                      0 2px 4px rgba(0, 0, 0, 0.4),
                      inset 0 1px 2px rgba(255, 255, 255, 0.3),
                      inset 0 -1px 2px rgba(0, 0, 0, 0.3)
                    `,
                  }}
                >
                  <IconCalendarTab
                    className="w-2.5 h-2.5"
                    style={{
                      color: 'white',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))'
                    }}
                  />
                </div>
              </div>
            </AccessibleTooltip>
          );
        })}
      </div>

      <div className="mt-3 sm:mt-4 flex flex-wrap gap-3 sm:gap-4 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.35em] text-slate-400">
        {(['main', 'overlap', 'killzone'] as SessionLayerType[]).map((type) => (
          <span key={`${type}-legend`} className="flex items-center gap-1.5 sm:gap-2">
            <span
              className="h-2 w-5 sm:w-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: sessionLayerSegments[type][0]?.color ?? '#94a3b8' }}
            />
            <span className="whitespace-nowrap">
              {type === 'main' ? 'Main Sessions' : type === 'overlap' ? 'Session Overlaps' : 'Killzones'}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default VolumeChart;
