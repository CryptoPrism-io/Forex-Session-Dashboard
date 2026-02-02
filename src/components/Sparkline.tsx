import React, { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  strokeColor,
  fillColor,
  strokeWidth = 1.5,
  className = '',
}: SparklineProps) {
  const { path, fillPath, isPositive } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', fillPath: '', isPositive: true };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Calculate points
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2; // 2px padding top/bottom
      return { x, y };
    });

    // Create SVG path
    const linePath = points
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        return `L ${point.x} ${point.y}`;
      })
      .join(' ');

    // Create fill path (close the area under the line)
    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

    // Determine if trend is positive (last > first)
    const positive = data[data.length - 1] >= data[0];

    return { path: linePath, fillPath: areaPath, isPositive: positive };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-[8px] text-slate-600">No data</span>
      </div>
    );
  }

  const defaultStrokeColor = isPositive ? '#34d399' : '#f87171';
  const defaultFillColor = isPositive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)';

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Fill area under the line */}
      <path
        d={fillPath}
        fill={fillColor || defaultFillColor}
      />
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={strokeColor || defaultStrokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Sparkline;
