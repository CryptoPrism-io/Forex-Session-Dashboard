import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface VolumeChartProps {
  nowLine: number;
  timezoneOffset: number;
  currentTimezoneLabel: string;
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

const VolumeChart: React.FC<VolumeChartProps> = ({ nowLine, timezoneOffset, currentTimezoneLabel }) => {
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
    const rotationSteps = Math.round((timezoneOffset % 24) * 2);

    // Rotate the volume data array to align peaks with user's timezone
    const rotatedVolumeData = [
      ...VOLUME_DATA.slice(rotationSteps),
      ...VOLUME_DATA.slice(0, rotationSteps)
    ];

    return rotatedVolumeData.map((volume, index) => {
      // index 0-47 represents 0:00-23:30 in user's LOCAL timezone (after rotation)
      const localHours = index * 0.5;

      const hours = Math.floor(localHours);
      const minutes = Math.round((localHours - hours) * 60);

      return {
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
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
              dataKey="time"
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
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                color: 'rgba(203, 213, 225, 1)',
              }}
              labelStyle={{ color: 'rgba(34, 211, 238, 1)' }}
              formatter={(value) => [`Volume: ${value}`, 'Trading Volume']}
            />

            {/* "Now" Reference Line */}
            <ReferenceLine
              x={Math.floor(nowLine * 2)} // Chart data is now rotated to local timezone, so use local time directly
              stroke="rgba(34, 211, 238, 0.8)"
              strokeWidth={2}
              strokeDasharray="0"
              label={{
                value: 'NOW',
                position: 'top',
                fill: 'rgba(34, 211, 238, 1)',
                fontSize: 12,
                fontWeight: 'bold',
              }}
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VolumeChart;
