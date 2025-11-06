import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VolumeChartProps {
  nowLine: number;
  timezoneOffset: number;
  currentTimezoneLabel: string;
}

// Volume data for 24 hours (48 values = 2 per hour)
const VOLUME_DATA = [
  12, 10, 9, 8,
  11, 13, 18, 22,
  28, 35, 42, 50,
  58, 63, 70, 76,
  82, 90, 88, 80,
  72, 65, 58, 52,
  48, 44, 40, 37,
  34, 32, 30, 28,
  35, 42, 55, 68,
  82, 95, 100, 94,
  86, 72, 55, 40,
  30, 22, 16, 12
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

  return (
    <div className="w-full mt-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 mb-1">Trading Volume</h2>
        <p className="text-xs text-slate-400">{currentTimezoneLabel} Timezone</p>
      </div>

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
  );
};

export default VolumeChart;
