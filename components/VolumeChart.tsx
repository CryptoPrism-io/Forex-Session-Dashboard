import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface VolumeChartProps {
  nowLine: number;
  timezoneOffset: number;
  currentTimezoneLabel: string;
}

// Volume data for 24 hours (48 values = 2 per hour)
// Based on realistic forex trading session patterns
const VOLUME_DATA = [
  22, 21, 19, 18, 17, 18,   // 0:00–2:30, Sydney only, quiet
  20, 25, 30, 38, 42, 45,   // 3:00–5:30, Tokyo ramps up
  48, 52, 60, 65, 70, 62,   // 6:00–8:30, Tokyo peak, London opens
  68, 75, 85, 90, 98, 100,  // 9:00–11:30, London–Tokyo/Europe overlap starts
  93, 95, 100, 98, 95, 90,  // 12:00–14:30, London–NY peak overlap, max volume
  90, 92, 87, 82, 75, 68,   // 15:00–17:30, London–NY overlap ending, US active
  60, 52, 45, 40, 38, 35,   // 18:00–20:30, NY-only, volume declining
  32, 26, 22, 20, 19, 18    // 21:00–23:30, Sydney-only quiet, pre-open
];

const SESSION_NOTES = [
  { hour: 0, label: '0:00–2:30', desc: 'Sydney only, quiet' },
  { hour: 3, label: '3:00–5:30', desc: 'Tokyo ramps up' },
  { hour: 6, label: '6:00–8:30', desc: 'Tokyo peak, London opens' },
  { hour: 9, label: '9:00–11:30', desc: 'London–Tokyo overlap' },
  { hour: 12, label: '12:00–14:30', desc: 'London–NY peak, max volume' },
  { hour: 15, label: '15:00–17:30', desc: 'London–NY overlap ending' },
  { hour: 18, label: '18:00–20:30', desc: 'NY-only, declining' },
  { hour: 21, label: '21:00–23:30', desc: 'Sydney-only, pre-open' }
];

const VolumeChart: React.FC<VolumeChartProps> = ({ nowLine, timezoneOffset, currentTimezoneLabel }) => {
  // Prepare chart data with timezone-adjusted times
  const chartData = useMemo(() => {
    return VOLUME_DATA.map((volume, index) => {
      // index 0-47 represents 0:00-23:30 UTC in 30-minute intervals
      const utcHours = index * 0.5; // Each index is 30 minutes (0.5 hours)

      // Adjust for timezone
      let localHours = (utcHours + timezoneOffset) % 24;
      localHours = localHours < 0 ? localHours + 24 : localHours;

      const hours = Math.floor(localHours);
      const minutes = Math.round((localHours - hours) * 60);

      return {
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        volume,
        utcTime: `${String(Math.floor(utcHours)).padStart(2, '0')}:${String(Math.round((utcHours % 1) * 60)).padStart(2, '0')}`,
      };
    });
  }, [timezoneOffset]);

  // Calculate "now" line position as percentage (0-100%)
  const nowLinePercent = (nowLine / 24) * 100;

  return (
    <div className="w-full mt-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 shadow-lg shadow-black/20">
      {/* Header with Title and Session Info */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-1">Trading Volume</h2>
          <p className="text-xs text-slate-400">{currentTimezoneLabel} Timezone</p>
        </div>

        {/* Session Info - Top Right */}
        <div className="hidden sm:block text-xs text-slate-300 space-y-1 max-w-xs">
          <div className="font-semibold text-slate-200 mb-2">Session Activity</div>
          {SESSION_NOTES.map((note, idx) => (
            <div key={idx} className="text-slate-400">
              <span className="font-medium text-slate-300">{note.label}</span>
              <span className="text-slate-500"> — {note.desc}</span>
            </div>
          ))}
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
              x={Math.floor(nowLine * 2)} // nowLine is 0-24, convert to data index (0-48)
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
