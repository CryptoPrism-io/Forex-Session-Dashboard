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
}> = ({ block, position, timezoneOffset, timezoneLabel }) => {
  if (!block) return null;

  const tooltipData = block.tooltip;
  const range = block.range;

  const [startUTC, endUTC] = range;
  const startTimeLocal = formatTime(startUTC, timezoneOffset);
  const endTimeLocal = formatTime(endUTC, timezoneOffset);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    transform: 'translate(15px, 15px)', // Position away from cursor
    pointerEvents: 'none',
    zIndex: 50,
  };

  return (
    <div style={style} className="p-4 bg-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl text-sm text-slate-200 max-w-xs transition-all duration-200">
      <h3 className="font-bold text-base mb-2 text-white">{tooltipData.title}</h3>
      <div className="text-xs text-cyan-300 mb-3 font-semibold">
        {`Hours (${timezoneLabel}): ${startTimeLocal} - ${endTimeLocal}`}
      </div>
      <p><strong className="font-semibold text-slate-400">Volatility:</strong> {tooltipData.volatility}</p>
      <p><strong className="font-semibold text-slate-400">Best Pairs:</strong> {tooltipData.bestPairs}</p>
      <p className="mt-2 pt-2 border-t border-slate-700"><strong className="font-semibold text-slate-400">Strategy:</strong> {tooltipData.strategy}</p>
    </div>
  );
};

const DayChart: React.FC<DayChartProps> = ({ nowLine, timezoneOffset, currentTimezoneLabel }) => {
  const [hoveredBlock, setHoveredBlock] = useState<TimeBlock | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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
  
  const ticks = Array.from({ length: 8 }, (_, i) => i * 3); // Every 3 hours from 00 to 21

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-lg border border-slate-700/50 p-6 rounded-lg shadow-2xl mt-8">
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
      
      <div className="relative w-full flex text-xs text-slate-400 mt-2">
        {ticks.map((tick) => (
          <div key={tick} style={{ width: `${(3 / 24) * 100}%` }}>
            {String(tick).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <DayChartTooltip
        block={hoveredBlock}
        position={tooltipPosition}
        timezoneOffset={timezoneOffset}
        timezoneLabel={currentTimezoneLabel}
      />
    </div>
  );
};

export default DayChart;
