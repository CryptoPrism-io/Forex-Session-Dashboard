import React, { useMemo, useState } from 'react';
import { SESSIONS } from '../constants';
import { ChartBarDetails, TooltipInfo } from '../types';

interface DayChartProps {
  nowLine: number;
  timezoneOffset: number;
  currentTimezoneLabel: string;
}

interface TimeBlock {
  key: string;
  details: ChartBarDetails;
  left: number; // percentage
  width: number; // percentage
  yLevel: number; // 0 for session, 1 for overlap, 2 for killzone
  tooltip: TooltipInfo;
  range: [number, number];
}

const formatTime = (hour: number, offset: number): string => {
    const localHour = (hour + offset);
    const finalHour = (Math.floor(localHour) % 24 + 24) % 24;
    const minutes = Math.round((localHour - Math.floor(localHour)) * 60);
    return `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const DayChartTooltip: React.FC<{
  block: TimeBlock | null,
  position: { x: number, y: number },
  timezoneOffset: number,
  timezoneLabel: string,
  chartRef?: React.RefObject<HTMLDivElement>,
}> = ({ block, position, timezoneOffset, timezoneLabel, chartRef }) => {
  if (!block) return null;

  const tooltipData = block.tooltip;
  const range = block.range;

  const [startUTC, endUTC] = range;
  const startTimeLocal = formatTime(startUTC, timezoneOffset);
  const endTimeLocal = formatTime(endUTC, timezoneOffset);

  // Calculate current hover time based on cursor position
  let hoverTimeLocal = '';
  if (chartRef?.current) {
    const rect = chartRef.current.getBoundingClientRect();
    const relativeX = position.x - rect.left;
    const chartWidth = rect.width;
    const hoverHour = (relativeX / chartWidth) * 24;
    const displayHour = (hoverHour + timezoneOffset) % 24;
    const hours = Math.floor(displayHour);
    const minutes = Math.round((displayHour - hours) * 60);
    hoverTimeLocal = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    pointerEvents: 'none',
    zIndex: 50,
  };

  return (
    <div style={style} className="px-3 py-2 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded shadow-xl text-xs text-slate-200 transition-all duration-100">
      <h3 className="font-bold text-sm text-white mb-1">{tooltipData.title}</h3>
      {hoverTimeLocal && (
        <div className="text-yellow-300 font-semibold mb-0.5">
          {`${hoverTimeLocal}`}
        </div>
      )}
      <div className="text-cyan-300 font-semibold mb-1">
        {`${startTimeLocal} - ${endTimeLocal}`}
      </div>
      <p className="text-slate-400 leading-tight"><strong>Vol:</strong> {tooltipData.volatility}</p>
      <p className="text-slate-400 leading-tight"><strong>Pairs:</strong> {tooltipData.bestPairs}</p>
    </div>
  );
};

const DayChart: React.FC<DayChartProps> = ({ nowLine, timezoneOffset, currentTimezoneLabel }) => {
  const [hoveredBlock, setHoveredBlock] = useState<TimeBlock | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  const timeBlocks = useMemo(() => {
    const blocks: TimeBlock[] = [];
    
    const processBar = (bar: (ChartBarDetails & { range: [number, number] }) | undefined, yLevel: number) => {
        if (!bar || !bar.key) return;
        
        const duration = bar.range[1] - bar.range[0];
        const adjustedStart = bar.range[0] + timezoneOffset;

        const startPos = (adjustedStart % 24 + 24) % 24;
        const endPos = startPos + duration;

        if (endPos <= 24) {
            blocks.push({
                key: `${bar.key}_1`,
                details: bar,
                left: (startPos / 24) * 100,
                width: (duration / 24) * 100,
                yLevel,
                tooltip: bar.tooltip,
                range: bar.range
            });
        } else {
            const width1 = 24 - startPos;
            blocks.push({
                key: `${bar.key}_1`,
                details: bar,
                left: (startPos / 24) * 100,
                width: (width1 / 24) * 100,
                yLevel,
                tooltip: bar.tooltip,
                range: bar.range
            });

            const width2 = endPos - 24;
            if (width2 > 0.001) {
               blocks.push({
                    key: `${bar.key}_2`,
                    details: bar,
                    left: 0,
                    width: (width2 / 24) * 100,
                    yLevel,
                    tooltip: bar.tooltip,
                    range: bar.range
                });
            }
        }
    };

    SESSIONS.forEach(session => {
        processBar(session.main, 0); // Main session
        processBar(session.overlapAsia, 1); // Overlap
        processBar(session.overlapLondon, 1); // Overlap
        processBar(session.killzone, 2); // Killzone
        processBar(session.killzoneAM, 2); // Killzone
        processBar(session.killzonePM, 2); // Killzone
    });

    return blocks;
  }, [timezoneOffset]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, block: TimeBlock) => {
    setHoveredBlock(block);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseLeave = () => {
    setHoveredBlock(null);
  };
  
  const ticks = Array.from({ length: 24 }, (_, i) => i); // All 24 hours

  return (
    <div ref={chartContainerRef} className="w-full bg-slate-900/40 backdrop-blur-lg border border-slate-700/50 p-6 rounded-lg shadow-2xl mt-8">
      <h3 className="text-lg font-bold text-slate-200 mb-4">24-Hour Timeline</h3>
      <div className="relative w-full h-24 bg-slate-800/50 rounded-md overflow-hidden">
        {timeBlocks.map(block => {
          const yPositions = ['45%', '25%', '5%'];
          const heights = ['50%', '35%', '25%'];
          
          return (
            <div
              key={block.key}
              className="absolute rounded transition-transform duration-200 ease-in-out hover:scale-y-110 cursor-pointer"
              style={{
                left: `${block.left}%`,
                width: `${block.width}%`,
                top: yPositions[block.yLevel],
                height: heights[block.yLevel],
                backgroundColor: block.details.color,
                opacity: block.details.opacity,
              }}
              onMouseMove={(e) => handleMouseMove(e, block)}
              onMouseLeave={handleMouseLeave}
              aria-label={block.details.name}
            />
          );
        })}

        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
          style={{ left: `${(nowLine / 24) * 100}%` }}
        >
            <div className="absolute -top-5 -translate-x-1/2 text-xs text-yellow-300 font-bold whitespace-nowrap">Now</div>
        </div>
      </div>
      
      <div className="relative w-full mt-6 px-2" style={{ height: '40px' }}>
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute text-xs text-slate-400 font-medium"
            style={{
              left: `${(tick / 24) * 100}%`,
              transform: 'translateX(-50%) rotate(270deg)',
              whiteSpace: 'nowrap',
            }}
          >
            {String(tick).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <DayChartTooltip
        block={hoveredBlock}
        position={tooltipPosition}
        timezoneOffset={timezoneOffset}
        timezoneLabel={currentTimezoneLabel}
        chartRef={chartContainerRef}
      />
    </div>
  );
};

export default DayChart;
