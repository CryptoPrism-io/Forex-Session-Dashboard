import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';

interface VolumeChartProps {
  nowLine: number;
  timezoneOffset: number;
  currentTimezoneLabel: string;
  currentTime?: Date;
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

const VolumeChart: React.FC<VolumeChartProps> = ({ nowLine, timezoneOffset, currentTimezoneLabel, currentTime = new Date() }) => {
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
  const chartData = useMemo(() => {
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

    // Add timezone-aware details to description
    let descWithTimezone = baseSession.desc;

    // Add lunch dip timezone conversion if present
    if ('lunchDip' in baseSession) {
      const lunchDipLocal = formatTimeInTimezone(baseSession.lunchDip, timezoneOffset);
      descWithTimezone = descWithTimezone.replace('11:00 UTC', `11:00 UTC (${lunchDipLocal} ${currentTimezoneLabel})`);
    }

    // Add peak timezone conversion if present
    if ('peak' in baseSession) {
      const peakLocal = formatTimeInTimezone(baseSession.peak, timezoneOffset);
      descWithTimezone = descWithTimezone.replace('13:30 UTC', `13:30 UTC (${peakLocal} ${currentTimezoneLabel})`);
    }

    // Add rollover lull timezone conversion if present
    if ('rolloverLull' in baseSession) {
      const rolloverStart = formatTimeInTimezone(baseSession.rolloverLull[0], timezoneOffset);
      const rolloverEnd = formatTimeInTimezone(baseSession.rolloverLull[1], timezoneOffset);
      descWithTimezone = descWithTimezone.replace('21:00–22:00 UTC', `21:00–22:00 UTC (${rolloverStart}–${rolloverEnd} ${currentTimezoneLabel})`);
    }

    return {
      ...baseSession,
      label: `${startTimeLocal}–${endTimeLocal}`,
      desc: descWithTimezone,
    };
  }, [nowLine, timezoneOffset, currentTimezoneLabel]);

  // Function to detect what events are at a given local time
  const getSessionEventsAtTime = useMemo(() => {
    return (localHour: number) => {
      const utcHour = getUTCHour(localHour, timezoneOffset);
      const events: { name: string; color: string }[] = [];

      // Define all session events with their UTC ranges and colors
      const sessionRanges = [
        { name: 'Main Session (Sydney)', range: [21, 30], color: 'hsl(195, 74%, 62%)' },
        { name: 'Main Session (Asia)', range: [23, 32], color: 'hsl(320, 82%, 60%)' },
        { name: 'Main Session (London)', range: [8, 17], color: 'hsl(45, 100%, 50%)' },
        { name: 'Main Session (NY)', range: [13, 22], color: 'hsl(120, 60%, 50%)' },
        { name: 'Asia-London Overlap', range: [8, 9], color: 'hsl(255, 80%, 70%)' },
        { name: 'London-NY Overlap', range: [13, 17], color: 'hsl(20, 100%, 60%)' },
        { name: 'London Killzone', range: [7, 10], color: 'hsl(0, 80%, 60%)' },
        { name: 'NY AM Killzone', range: [12, 15], color: 'hsl(0, 80%, 60%)' },
        { name: 'NY PM Killzone', range: [18, 20], color: 'hsl(0, 60%, 55%)' },
      ];

      // Check which events are active at this UTC hour
      sessionRanges.forEach(({ name, range, color }) => {
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
  const getSessionAtTime = useMemo(() => {
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
  const sessionTimingData = useMemo(() => {
    return getSessionAtTime(nowLine);
  }, [nowLine, getSessionAtTime]);

  return (
    <div className="w-full mt-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 shadow-lg shadow-black/20">
      {/* Header with Title and Session Info */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-1">Trading Volume</h2>
          <p className="text-xs text-slate-400">{currentTimezoneLabel} Timezone</p>
        </div>

        {/* Session Info - Top Right (Current Session Only) */}
        <div className="hidden sm:block text-xs text-slate-300 space-y-1 max-w-xs bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
          <div className="font-semibold text-slate-200 mb-1">Current Session</div>
          <div className="text-slate-300">
            <span className="font-medium text-cyan-400">{currentSession.label}</span>
            <span className="text-slate-400"> — {currentSession.desc}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(34, 211, 238, 0.8)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="rgba(34, 211, 238, 0.1)" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" vertical={true} />

            <XAxis
              dataKey="hour"
              type="number"
              domain={[0, 24]}
              tickFormatter={(h) =>
                `${String(Math.floor(h)).padStart(2, '0')}:${(h % 1 ? '30' : '00')}`
              }
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: 'rgba(148, 163, 184, 0.7)', fontSize: 12 }}
              interval={3} // Show every 2 hours
              angle={-45}
              textAnchor="end"
              height={60}
            />

            <YAxis
              stroke="rgba(148, 163, 184, 0.5)"
              tick={{ fill: 'rgba(148, 163, 184, 0.7)', fontSize: 12 }}
              domain={[0, 100]}
            />

            <Tooltip
              content={
                <CustomVolumeTooltip getSessionAtTime={getSessionAtTime} getSessionEventsAtTime={getSessionEventsAtTime} />
              }
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(148, 163, 184, 0.5)' }}
            />

            <Area
              type="monotone"
              dataKey="volume"
              stroke="rgba(34, 211, 238, 1)"
              strokeWidth={2}
              fill="url(#volumeGradient)"
              dot={false}
              isAnimationActive={false}
            />

            {/* "Now" Reference Line with centered time label */}
            <ReferenceLine
              x={nowLine}
              stroke="rgba(250, 204, 21, 0.85)"
              strokeWidth={0.75}
              ifOverflow="visible"
              label={{
                content: ({ viewBox }: any) => {
                  // Get local time
                  const utcHours = currentTime.getUTCHours();
                  const utcMinutes = currentTime.getUTCMinutes();
                  const totalUTCMinutes = utcHours * 60 + utcMinutes;
                  const totalLocalMinutes = totalUTCMinutes + timezoneOffset * 60;
                  const localHours = Math.floor((totalLocalMinutes / 60) % 24);
                  const localMinutes = Math.round(totalLocalMinutes % 60);
                  const timeStr = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;

                  // Center the label vertically on the chart
                  const centerY = viewBox.height / 2;

                  return (
                    <text
                      x={viewBox.x}
                      y={centerY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fde047"
                      fontSize={10}
                      fontWeight={500}
                      transform={`rotate(270 ${viewBox.x} ${centerY})`}
                      style={{ pointerEvents: 'none' }}
                    >
                      {timeStr}
                    </text>
                  );
                },
              }}
              style={{
                filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.4))',
                transition: 'transform 1s ease-in-out',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VolumeChart;
