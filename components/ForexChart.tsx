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
  const [chartsVisible, setChartsVisible] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState({ mainSessions: false, overlaps: false, killzones: false });
  const chartContainerRef = React.useRef<HTMLDivElement>(null);

  const toggleSection = (section: 'mainSessions' | 'overlaps' | 'killzones') => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
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
              Individual
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
      </div>

      {viewMode === 'separate' ? (
        // Separate view - individual rows per session
        <div>
        {[SESSIONS[3], SESSIONS[2], SESSIONS[0], SESSIONS[1]].map(session => {
          const status = sessionStatus[session.name];
          const statusColors = getStatusColor(status);

          return (
            <div key={session.name} className="mb-5 last:mb-0">
              <div className="flex items-center gap-3 mb-1.5">
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

              <div className="relative w-full h-16 bg-slate-800/50 rounded-md overflow-hidden">
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
        <div className="mb-5">
          <div className="relative w-full h-32 bg-slate-800/50 rounded-md overflow-hidden">
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
        // Guide view - Trading Session Guide with Master Table and Collapsible Sections
        <section className="w-full bg-slate-900/40 border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden transition-all duration-300">
          <div className="p-6 text-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-200">Trading Session Guide ({currentTimezoneLabel})</h3>
              <button
                onClick={() => setChartsVisible(!chartsVisible)}
                className="px-3 py-1 text-xs font-semibold rounded bg-slate-700/50 hover:bg-slate-600/70 text-slate-300 transition-all"
                title={chartsVisible ? "Hide charts" : "Show charts"}
              >
                {chartsVisible ? '▼ Charts' : '▶ Charts'}
              </button>
            </div>

            {/* Main Sessions Master Table */}
            <div>
              <button
                onClick={() => toggleSection('mainSessions')}
                className="w-full flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
              >
                <IconChevronDown
                  className={`w-4 h-4 transition-transform ${collapsedSections.mainSessions ? '-rotate-90' : ''}`}
                  style={{ color: 'hsl(195, 74%, 62%)', textShadow: '0 0 8px hsl(195, 74%, 62%)' }}
                />
                <h4
                  className="font-semibold text-base flex items-center"
                  style={{ color: 'hsl(195, 74%, 72%)', textShadow: `0 0 10px hsl(195, 74%, 62%)` }}
                >
                  <span className="w-3 h-3 rounded-full mr-2.5" style={{ backgroundColor: 'hsl(195, 74%, 62%)', boxShadow: '0 0 8px hsl(195, 74%, 62%)' }}></span>
                  Main Sessions
                </h4>
              </button>
              <p className="text-xs text-slate-400 mb-3 ml-6">The primary trading blocks when each major market is actively trading. Each session has its own volatility profile and best trading pairs.</p>
              {!collapsedSections.mainSessions && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left p-2 text-slate-300 font-semibold">Session</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Start</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">End</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Dur.</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Has Overlap</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">OL Hours</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Has KZ</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">KZ Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[SESSIONS[0], SESSIONS[1], SESSIONS[2], SESSIONS[3]].map((session, idx) => {
                        const hasOverlap = (session.overlapAsia || session.overlapLondon) ? 'Yes' : 'No';
                        const overlapHours = (() => {
                          let hours = 0;
                          if (session.overlapAsia) hours += session.overlapAsia.range[1] - session.overlapAsia.range[0];
                          if (session.overlapLondon) hours += session.overlapLondon.range[1] - session.overlapLondon.range[0];
                          return hours > 0 ? hours : '-';
                        })();
                        const hasKillzone = (session.killzone || session.killzoneAM || session.killzonePM) ? 'Yes' : 'No';
                        const killzoneHours = (() => {
                          let hours = 0;
                          if (session.killzone) hours += session.killzone.range[1] - session.killzone.range[0];
                          if (session.killzoneAM) hours += session.killzoneAM.range[1] - session.killzoneAM.range[0];
                          if (session.killzonePM) hours += session.killzonePM.range[1] - session.killzonePM.range[0];
                          return hours > 0 ? hours : '-';
                        })();
                        return (
                          <tr key={session.name} className={idx % 2 === 0 ? 'bg-slate-800/30' : ''}>
                            <td className="p-2 text-slate-300 font-medium flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: session.main.color }}
                              />
                              {session.name}
                            </td>
                            <td className="p-2 text-slate-400">{formatTime(session.main.range[0], timezoneOffset)}</td>
                            <td className="p-2 text-slate-400">{formatTime(session.main.range[1], timezoneOffset)}</td>
                            <td className="p-2 text-slate-400">{session.main.range[1] - session.main.range[0]}h</td>
                            <td className="p-2 text-slate-400">{hasOverlap}</td>
                            <td className="p-2 text-slate-400">{overlapHours}</td>
                            <td className="p-2 text-slate-400">{hasKillzone}</td>
                            <td className="p-2 text-slate-400">{killzoneHours}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Session Overlaps Table */}
            <div>
              <button
                onClick={() => toggleSection('overlaps')}
                className="w-full flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
              >
                <IconChevronDown
                  className={`w-4 h-4 transition-transform`}
                  style={{ color: 'hsl(30, 100%, 60%)', textShadow: '0 0 8px hsl(30, 100%, 60%)' }}
                />
                <h4
                  className="font-semibold text-base flex items-center"
                  style={{ color: 'hsl(30, 100%, 70%)', textShadow: `0 0 10px hsl(30, 100%, 60%)` }}
                >
                  <span className="w-3 h-3 rounded-full mr-2.5" style={{ backgroundColor: 'hsl(30, 100%, 60%)', boxShadow: '0 0 8px hsl(30, 100%, 60%)' }}></span>
                  Session Overlaps
                </h4>
              </button>
              <p className="text-xs text-slate-400 mb-3 ml-6">Times when two major sessions overlap, offering increased liquidity and volatility. Ideal for breakout strategies and trend-following.</p>
              {!collapsedSections.overlaps && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left p-2 text-slate-300 font-semibold">Overlap</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Start</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">End</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const overlaps = [];
                        if (SESSIONS[2].overlapAsia) {
                          overlaps.push({ name: SESSIONS[2].overlapAsia.name, range: SESSIONS[2].overlapAsia.range });
                        }
                        if (SESSIONS[3].overlapLondon) {
                          overlaps.push({ name: SESSIONS[3].overlapLondon.name, range: SESSIONS[3].overlapLondon.range });
                        }
                        return overlaps.map((overlap, idx) => (
                          <tr key={overlap.name} className={idx % 2 === 0 ? 'bg-slate-800/30' : ''}>
                            <td className="p-2 text-slate-300 font-medium">{overlap.name}</td>
                            <td className="p-2 text-slate-400">{formatTime(overlap.range[0], timezoneOffset)}</td>
                            <td className="p-2 text-slate-400">{formatTime(overlap.range[1], timezoneOffset)}</td>
                            <td className="p-2 text-slate-400">{overlap.range[1] - overlap.range[0]}h</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Killzones Table */}
            <div>
              <button
                onClick={() => toggleSection('killzones')}
                className="w-full flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity"
              >
                <IconChevronDown
                  className={`w-4 h-4 transition-transform ${collapsedSections.killzones ? '-rotate-90' : ''}`}
                  style={{ color: 'hsl(0, 100%, 65%)', textShadow: '0 0 8px hsl(0, 100%, 65%)' }}
                />
                <h4
                  className="font-semibold text-base flex items-center"
                  style={{ color: 'hsl(0, 100%, 75%)', textShadow: `0 0 10px hsl(0, 100%, 65%)` }}
                >
                  <span className="w-3 h-3 rounded-full mr-2.5" style={{ backgroundColor: 'hsl(0, 100%, 65%)', boxShadow: '0 0 8px hsl(0, 100%, 65%)' }}></span>
                  Killzones
                </h4>
              </button>
              <p className="text-xs text-slate-400 mb-3 ml-6">High-volatility institutional trading windows designed for liquidity manipulation. Prime time for ICT-style stop hunts and seek & destroy patterns.</p>
              {!collapsedSections.killzones && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left p-2 text-slate-300 font-semibold">Killzone</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Start</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">End</th>
                        <th className="text-left p-2 text-slate-300 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const killzones = [];
                        if (SESSIONS[2].killzone) {
                          killzones.push({ name: SESSIONS[2].killzone.name, range: SESSIONS[2].killzone.range });
                        }
                        if (SESSIONS[3].killzoneAM) {
                          killzones.push({ name: SESSIONS[3].killzoneAM.name, range: SESSIONS[3].killzoneAM.range });
                        }
                        if (SESSIONS[3].killzonePM) {
                          killzones.push({ name: SESSIONS[3].killzonePM.name, range: SESSIONS[3].killzonePM.range });
                        }
                        return killzones.map((kz, idx) => (
                          <tr key={kz.name} className={idx % 2 === 0 ? 'bg-slate-800/30' : ''}>
                            <td className="p-2 text-slate-300 font-medium">{kz.name}</td>
                            <td className="p-2 text-slate-400">{formatTime(kz.range[0], timezoneOffset)}</td>
                            <td className="p-2 text-slate-400">{formatTime(kz.range[1], timezoneOffset)}</td>
                            <td className="p-2 text-slate-400">{kz.range[1] - kz.range[0]}h</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Legend Info */}
            <div className="pt-4 border-t border-slate-700/50 text-xs text-slate-400">
              <p><span className="text-yellow-300 font-semibold">"Now" Line:</span> The dashed yellow line in the charts indicates the current time in your selected timezone.</p>
            </div>
          </div>
        </section>
      )}

      {chartsVisible && viewMode !== 'guide' && (
        <>
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

          {/* Legend Footer */}
          <div className="w-full mt-4 pt-3 border-t border-slate-700/30 flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Main Session</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span>Session Overlap</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Killzone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></span>
              <span>"Now" Line</span>
            </div>
          </div>
        </>
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