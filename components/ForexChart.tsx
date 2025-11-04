import React, { useMemo, useState } from 'react';
import { SESSIONS } from '../constants';
import { ChartBarDetails, TooltipInfo } from '../types';
import { SessionStatus } from '../App';

interface ForexChartProps {
  nowLine: number;
  currentTimezoneLabel: string;
  timezoneOffset: number;
  sessionStatus: { [key: string]: SessionStatus };
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

const ChartTooltip: React.FC<{
  block: TimeBlock | null;
  position: { x: number; y: number };
  timezoneOffset: number;
  timezoneLabel: string;
  chartRef?: React.RefObject<HTMLDivElement>;
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

  // Position tooltip always on top of cursor
  const offsetX = 0;
  const offsetY = 10;
  const tooltipWidth = 300; // approximate width

  let left = position.x + offsetX;
  let top = position.y - offsetY; // Always position above

  // Keep within viewport bounds horizontally
  if (left + tooltipWidth > window.innerWidth) {
    left = position.x - tooltipWidth;
  }

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.max(10, top),
    left: Math.max(10, left),
    pointerEvents: 'none',
    zIndex: 50,
  };

  return (
    <div style={style} className="p-4 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl text-sm text-slate-200 w-72 transition-all duration-100">
      <h3 className="font-bold text-base mb-2 text-white">{tooltipData.title}</h3>
      {hoverTimeLocal && (
        <div className="text-xs text-yellow-300 mb-2 font-semibold">
          {`Hover Time (${timezoneLabel}): ${hoverTimeLocal}`}
        </div>
      )}
      <div className="text-xs text-cyan-300 mb-3 font-semibold">
        {`Hours (${timezoneLabel}): ${startTimeLocal} - ${endTimeLocal}`}
      </div>
      <p><strong className="font-semibold text-slate-400">Volatility:</strong> {tooltipData.volatility}</p>
      <p><strong className="font-semibold text-slate-400">Best Pairs:</strong> {tooltipData.bestPairs}</p>
      <p className="mt-2 pt-2 border-t border-slate-700"><strong className="font-semibold text-slate-400">Strategy:</strong> {tooltipData.strategy}</p>
    </div>
  );
};

const ForexChart: React.FC<ForexChartProps> = ({ nowLine, currentTimezoneLabel, timezoneOffset, sessionStatus }) => {
  const [hoveredBlock, setHoveredBlock] = useState<TimeBlock | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

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
    setHoveredBlock(block);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredBlock(null);
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
  const majorTicks = Array.from({ length: 24 }, (_, i) => i); // All 24 hours for labels

  return (
    <div ref={chartContainerRef} className="w-full bg-slate-900/40 backdrop-blur-lg border border-slate-700/50 p-6 rounded-lg shadow-2xl">
      <h3 className="text-lg font-bold text-slate-200 mb-4">Session Timeline</h3>

      {[SESSIONS[3], SESSIONS[2], SESSIONS[0], SESSIONS[1]].map(session => {
        const status = sessionStatus[session.name];
        const statusColors = getStatusColor(status);

        return (
          <div key={session.name} className="mb-6 last:mb-0">
            <div className="flex items-center gap-3 mb-2">
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

            <div className="relative w-full h-20 bg-slate-800/50 rounded-md overflow-hidden">
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

                  return (
                    <div
                      key={block.key}
                      className="absolute rounded transition-all duration-200 ease-in-out hover:scale-y-125 cursor-pointer"
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
                      title={block.details.name}
                    />
                  );
                })}

              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                style={{ left: `${(nowLine / 24) * 100}%` }}
              >
                <div className="absolute -top-5 -translate-x-1/2 text-xs text-yellow-300 font-bold whitespace-nowrap">
                  Now
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="relative w-full mt-6 px-2" style={{ height: '40px' }}>
        {majorTicks.map(tick => (
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

      <ChartTooltip
        block={hoveredBlock}
        position={tooltipPosition}
        timezoneOffset={timezoneOffset}
        timezoneLabel={currentTimezoneLabel}
        chartRef={chartContainerRef}
      />
    </div>
  );
};

export default ForexChart;