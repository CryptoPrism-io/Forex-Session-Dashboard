import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { SESSIONS } from '../constants';
import { ChartBarDetails } from '../types';
import { SessionStatus } from '../App';
import ChartTooltip from './ChartTooltip';

interface ForexChartProps {
  nowLine: number;
  currentTimezoneLabel: string;
  timezoneOffset: number;
  sessionStatus: { [key: string]: SessionStatus };
}

const CustomYAxisTick: React.FC<any> = ({ x, y, payload, sessionStatus }) => {
  const sessionName = payload.value;
  const status: SessionStatus = sessionStatus[sessionName];

  const statusConfig = {
    OPEN: { color: 'hsl(120, 70%, 55%)', glow: 'hsl(120, 70%, 55%)', animation: 'none' },
    CLOSED: { color: 'hsl(0, 60%, 45%)', glow: 'transparent', animation: 'none' },
    WARNING: { color: 'hsl(35, 100%, 60%)', glow: 'hsl(35, 100%, 60%)', animation: 'pulse 1.5s infinite' },
  };

  const { color, glow, animation } = statusConfig[status] || { color: '#64748b', glow: 'transparent', animation: 'none' };
  
  return (
    <g transform={`translate(${x},${y})`}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              filter: drop-shadow(0 0 3px ${glow});
            }
            50% {
              filter: drop-shadow(0 0 8px ${glow});
            }
          }
        `}
      </style>
      <circle
        cx={-75}
        cy={4}
        r={5}
        fill={color}
        style={{
          animation,
          filter: status === 'OPEN' ? `drop-shadow(0 0 5px ${glow})` : 'none',
        }}
      />
      <text
        x={-10}
        y={0}
        dy={4}
        textAnchor="end"
        fill="#cbd5e1"
        fontSize="10.5px"
        fontWeight="600"
        letterSpacing="0.75px"
      >
        {payload.value}
      </text>
    </g>
  );
};


// This component creates a layered effect by deriving the full row height from the props Recharts provides.
const CustomBarShape = (props: any) => {
    const { 
      x, 
      y,
      width, 
      height,
      fill, 
      isHovered, 
      baseOpacity, 
      dataKey, 
      payload
    } = props;
  
    // If the bar has no width or height, don't render it.
    if (width <= 0 || !payload || height <= 0) return null;
  
    const isMainSession = dataKey.includes('_session');
    const isKillzone = dataKey.includes('killzone');
    
    // Infer the full height of the category row based on the bar's height and the chart's gap setting.
    const gapPercentage = 0.05; // This must match `barCategoryGap` on the BarChart component.
    const fullCategoryHeight = height / (1 - gapPercentage);
    const categoryY = y - (fullCategoryHeight - height) / 2;
  
    let finalY;
    let finalHeight;

    // New logic for much thicker bars.
    const mainSessionHeight = fullCategoryHeight * 0.9; // Set main session height to 90% of the row.
  
    if (isMainSession) {
      // Main session is thick and centered in its row.
      finalHeight = mainSessionHeight;
      finalY = categoryY + (fullCategoryHeight - finalHeight) / 2;
    } else {
      // Overlaps and killzones are smaller and centered for a layered effect.
      const newHeight = mainSessionHeight * 0.4; // 40% of the main session bar height.
      finalHeight = newHeight;
      finalY = categoryY + (fullCategoryHeight - newHeight) / 2;
    }
  
    // Hover effect logic
    let finalOpacity = isHovered ? Math.min(1, baseOpacity + 0.3) : baseOpacity;
    
    // Apply special visual treatment for Killzones
    if (isKillzone) {
      // Reduce opacity slightly to differentiate from solid overlaps, but make it pop on hover
      finalOpacity = isHovered ? 0.95 : baseOpacity - 0.1;
    }
  
    return (
      <rect
        x={x}
        y={finalY}
        width={width}
        height={finalHeight}
        fill={fill}
        fillOpacity={finalOpacity}
        rx={6} // Increased radius for thicker bars
        // Add a subtle glowing stroke to killzones to make them stand out
        stroke={isKillzone ? 'hsl(0, 100%, 80%)' : 'none'}
        strokeWidth={isKillzone ? 1 : 0}
        strokeOpacity={isHovered ? 0.7 : 0.3}
        style={{ 
          transition: 'fill-opacity 0.2s ease-in-out, stroke-opacity 0.2s ease-in-out' 
        }}
      />
    );
  };


const ForexChart: React.FC<ForexChartProps> = ({ nowLine, currentTimezoneLabel, timezoneOffset, sessionStatus }) => {
  const [hoveredBarKey, setHoveredBarKey] = useState<string | null>(null);

  const { chartData, allBars } = useMemo(() => {
    const processedBars: (ChartBarDetails & { dataKey: string })[] = [];
    const data = SESSIONS.map(s => ({ name: s.name })).reverse();
    const dataMap = new Map<string, any>(data.map(d => [d.name, d]));

    SESSIONS.forEach(session => {
      const sessionRow = dataMap.get(session.name);
      if (!sessionRow) return;

      Object.values(session).forEach(prop => {
        if (typeof prop === 'object' && prop !== null && 'key' in prop) {
          const bar = prop as ChartBarDetails & { range: [number, number] };
          
          const duration = bar.range[1] - bar.range[0];
          const adjustedStart = bar.range[0] + timezoneOffset;
          const adjustedEnd = adjustedStart + duration;

          const startDayBoundary = Math.floor(adjustedStart / 24);
          const endDayBoundary = Math.floor((adjustedEnd - 0.00001) / 24);

          if (startDayBoundary === endDayBoundary) {
            const displayStart = (adjustedStart % 24 + 24) % 24;
            let displayEnd = (adjustedEnd % 24 + 24) % 24;
            if (displayEnd === 0 && duration > 0) displayEnd = 24;

            const dataKey = `${bar.key}_p1`;
            sessionRow[dataKey] = [displayStart, displayEnd];
            processedBars.push({ ...bar, dataKey });
          } else {
            const part1End = (startDayBoundary + 1) * 24;
            const displayStart1 = (adjustedStart % 24 + 24) % 24;
            const dataKey1 = `${bar.key}_p1`;
            sessionRow[dataKey1] = [displayStart1, 24];
            processedBars.push({ ...bar, dataKey: dataKey1 });
            
            const displayEnd2 = (adjustedEnd % 24 + 24) % 24;
            if (displayEnd2 > 0) {
              const dataKey2 = `${bar.key}_p2`;
              sessionRow[dataKey2] = [0, displayEnd2];
              processedBars.push({ ...bar, dataKey: dataKey2 });
            }
          }
        }
      });
    });
    
    // Sort bars to ensure correct render layering: sessions -> overlaps -> killzones
    processedBars.sort((a, b) => {
        const order = { session: 1, overlap: 2, killzone: 3 };
        const aType = a.key.includes('session') ? order.session : a.key.includes('overlap') ? order.overlap : order.killzone;
        const bType = b.key.includes('session') ? order.session : b.key.includes('overlap') ? order.overlap : order.killzone;
        return aType - bType;
    });

    return { chartData: Array.from(dataMap.values()), allBars: processedBars };
  }, [timezoneOffset]);

  const ticks = useMemo(() => Array.from({ length: 25 }, (_, i) => i), []);

  return (
    <div className="w-full h-[400px] bg-slate-900/40 backdrop-blur-lg border border-slate-700/50 p-4 rounded-lg shadow-2xl">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 30, bottom: 20 }}
          barCategoryGap="5%"
          onMouseLeave={() => setHoveredBarKey(null)}
        >
          <XAxis
            type="number"
            domain={[0, 24]}
            ticks={ticks}
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            axisLine={{ stroke: '#475569' }}
            tickLine={{ stroke: '#475569' }}
            label={{ value: `Time (${currentTimezoneLabel})`, position: 'insideBottom', offset: -5, fill: '#cbd5e1' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={<CustomYAxisTick sessionStatus={sessionStatus} />}
            width={90}
          />
          <Tooltip 
            content={<ChartTooltip timezoneOffset={timezoneOffset} timezoneLabel={currentTimezoneLabel} />} 
            cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }} 
           />
          
          <ReferenceLine
            x={nowLine}
            stroke="hsl(53, 98%, 52%)"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{ value: 'Now', position: 'top', fill: 'hsl(53, 98%, 52%)', fontSize: 12, fontWeight: 'bold' }}
          />
          
          {allBars.map(bar => {
            const isHovered = hoveredBarKey === bar.dataKey;

            return (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                fill={bar.color}
                shape={(props) => (
                  <CustomBarShape
                    {...props}
                    baseOpacity={bar.opacity}
                    isHovered={isHovered}
                  />
                )}
                isAnimationActive={false}
                onMouseEnter={() => setHoveredBarKey(bar.dataKey)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ForexChart;