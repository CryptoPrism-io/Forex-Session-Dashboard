import React, { useMemo, useState } from 'react';
import { SESSIONS } from '../constants';
import { ChartBarDetails, TooltipInfo } from '../types';
import { SessionStatus } from '../App';
import { IconChevronDown } from './icons';

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
  // Note: The chart bars are already positioned in the selected timezone, so we don't add offset again
  let hoverTimeLocal = '';
  if (chartRef?.current) {
    const rect = chartRef.current.getBoundingClientRect();
    const relativeX = position.x - rect.left;
    const chartWidth = rect.width;
    const hoverHour = (relativeX / chartWidth) * 24;
    const finalHour = (Math.floor(hoverHour) % 24 + 24) % 24;
    const minutes = Math.round((hoverHour - Math.floor(hoverHour)) * 60);
    hoverTimeLocal = `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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
  const [viewMode, setViewMode] = useState<'unified' | 'separate' | 'guide'>('separate');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-slate-200">Session Timeline</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('separate')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all duration-200 ${
              viewMode === 'separate'
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700/50 hover:bg-slate-600/70 text-slate-300'
            }`}
          >
            Separate
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all duration-200 ${
              viewMode === 'unified'
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700/50 hover:bg-slate-600/70 text-slate-300'
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setViewMode('guide')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-all duration-200 ${
              viewMode === 'guide'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-700/50 hover:bg-slate-600/70 text-slate-300'
            }`}
          >
            Guide
          </button>
        </div>
      </div>

      {viewMode === 'separate' ? (
        // Separate view - individual rows per session
        <div>
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
        </div>
      ) : viewMode === 'unified' ? (
        // Unified view - all sessions on one timeline
        <div className="mb-6">
          <div className="relative w-full h-40 bg-slate-800/50 rounded-md overflow-hidden">
            {/* Vertical hour grid lines */}
            {ticks.map(hour => (
              <div
                key={`grid-${hour}`}
                className="absolute top-0 bottom-0 border-l border-slate-700/30"
                style={{ left: `${(hour / 24) * 100}%` }}
              />
            ))}

            {/* All session blocks */}
            {timeBlocks.map(block => {
              const yPositions = ['75%', '50%', '25%'];
              const heights = ['35%', '25%', '20%'];

              return (
                <div
                  key={block.key}
                  className="absolute rounded transition-all duration-200 ease-in-out hover:scale-y-125 cursor-pointer group"
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
                  title={block.sessionName}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-2 py-1 rounded whitespace-nowrap z-10">
                    {block.sessionName}
                  </div>
                </div>
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

          {/* Legend for unified view */}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            {[SESSIONS[3], SESSIONS[2], SESSIONS[0], SESSIONS[1]].map(session => {
              const status = sessionStatus[session.name];
              const statusColors = getStatusColor(status);
              return (
                <div key={session.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: statusColors.color,
                      boxShadow: `0 0 4px ${statusColors.glow}`,
                    }}
                  />
                  <span className="text-slate-300">{session.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Guide view - Trading Session Guide
        <section className="w-full bg-slate-900/40 border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden transition-all duration-300">
          <div className="p-6 text-sm">
            <h3 className="text-lg font-bold text-slate-200 mb-6">Trading Session Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="font-semibold text-base mb-2 flex items-center"><span className="w-3 h-3 rounded-full bg-cyan-400 mr-2.5"></span> Main Session</h4>
                <p className="text-slate-400 pl-5">The main trading blocks for Sydney, Tokyo, London, and New York.</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="font-semibold text-base mb-2 flex items-center"><span className="w-3 h-3 rounded-full bg-orange-400 mr-2.5"></span> Session Overlap</h4>
                <p className="text-slate-400 pl-5">Periods where two major sessions are open simultaneously, typically leading to higher liquidity and volatility.</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="font-semibold text-base mb-2 flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2.5"></span> Killzone</h4>
                <p className="text-slate-400 pl-5">Specific, volatile windows used by institutional traders to engineer liquidity. Prime time for ICT concepts.</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <h4 className="font-semibold text-base mb-2 flex items-center text-yellow-300">"Now" Line</h4>
                <p className="text-slate-400">The dashed yellow line indicates the current time in your selected timezone, helping you orient yourself in the market day.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {viewMode !== 'guide' && (
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
      )}

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