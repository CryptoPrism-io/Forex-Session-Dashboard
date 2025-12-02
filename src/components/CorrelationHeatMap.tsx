import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ResponsiveHeatMapCanvas } from '@nivo/heatmap';
import { useFXCorrelationMatrix } from '../hooks/useFXCorrelationMatrix';
import { TooltipPortal } from './TooltipPortal';

interface HeatMapDataPoint {
  x: string;
  y: number;
}

interface HeatMapSeries {
  id: string;
  data: HeatMapDataPoint[];
}

interface CustomTooltipProps {
  cell: {
    serieId: string;
    data: {
      x: string;
      y: number;
    };
    value: number;
    formattedValue: string;
    color: string;
  };
  x?: number;
  y?: number;
}

/**
 * Calculate tooltip position with boundary detection
 * Automatically flips position if tooltip would go off-screen
 */
const calculateTooltipPosition = (
  x: number,
  y: number,
  tooltipWidth: number = 200,
  tooltipHeight: number = 120
): { top: number; left: number; position: 'top' | 'bottom' } => {
  const OFFSET = 12;
  const MARGIN = 20;

  // Check space above and below
  const spaceAbove = y;
  const spaceBelow = window.innerHeight - y;

  // Determine if tooltip should appear above or below
  const position = spaceAbove > tooltipHeight + MARGIN ? 'top' : 'bottom';

  // Calculate vertical position
  const top = position === 'top' ? y - tooltipHeight - OFFSET : y + OFFSET;

  // Calculate horizontal position (centered on cursor)
  let left = x - tooltipWidth / 2;

  // Constrain to viewport
  if (left < MARGIN) left = MARGIN;
  if (left + tooltipWidth > window.innerWidth - MARGIN) {
    left = window.innerWidth - tooltipWidth - MARGIN;
  }

  return { top: Math.max(MARGIN, top), left, position };
};

const CustomCorrelationTooltip: React.FC<CustomTooltipProps> = ({ cell, x = 0, y = 0 }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; position: 'top' | 'bottom' }>({
    top: y,
    left: x,
    position: 'bottom'
  });

  const getCorrelationLabel = (value: number): { label: string; emoji: string; color: string } => {
    if (value > 0.7) return { label: 'Strong Positive', emoji: '🔵', color: 'text-blue-400' };
    if (value > 0.3) return { label: 'Moderate Positive', emoji: '🟢', color: 'text-green-400' };
    if (value > -0.3) return { label: 'Weak', emoji: '⚪', color: 'text-gray-400' };
    if (value > -0.7) return { label: 'Moderate Negative', emoji: '🟠', color: 'text-orange-400' };
    return { label: 'Strong Negative', emoji: '🔴', color: 'text-red-400' };
  };

  // Update position when tooltip is rendered
  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const newPosition = calculateTooltipPosition(x, y, rect.width, rect.height);
      setPosition(newPosition);
    }
  }, [x, y]);

  const correlation = getCorrelationLabel(cell.value);

  const tooltipElement = (
    <div
      ref={tooltipRef}
      className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-xs shadow-xl"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: 'none',
        zIndex: 9999,
        minWidth: '200px'
      }}
    >
      <div className="font-semibold text-white mb-1">
        {cell.serieId} ↔ {cell.data.x}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-4 h-4 rounded"
          style={{ backgroundColor: cell.color }}
        />
        <span className={`font-mono font-bold ${correlation.color}`}>
          {cell.formattedValue}
        </span>
      </div>
      <div className="text-gray-300">
        {correlation.emoji} {correlation.label}
      </div>
    </div>
  );

  return (
    <TooltipPortal isVisible={true}>
      {tooltipElement}
    </TooltipPortal>
  );
};

export function CorrelationHeatMap() {
  const { matrix, loading, error } = useFXCorrelationMatrix();

  // Transform matrix data to Nivo format
  const data: HeatMapSeries[] = useMemo(() => {
    if (!matrix || matrix.length === 0) return [];

    // Group by instrument_1 (API uses this field name)
    const grouped = matrix.reduce((acc, pair) => {
      const inst1 = (pair as any).pair1 || (pair as any).instrument_1 || (pair as any).instrument1;
      const inst2 = (pair as any).pair2 || (pair as any).instrument_2 || (pair as any).instrument2;
      const corr = typeof pair.correlation === 'string' ? parseFloat(pair.correlation) : pair.correlation;

      if (!acc[inst1]) {
        acc[inst1] = [];
      }
      acc[inst1].push({
        x: inst2,
        y: corr
      });
      return acc;
    }, {} as Record<string, HeatMapDataPoint[]>);

    // Convert to Nivo format and sort
    return Object.entries(grouped)
      .map(([instrument, dataPoints]) => ({
        id: instrument,
        data: dataPoints.sort((a, b) => a.x.localeCompare(b.x))
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [matrix]);

  // Get unique instruments for proper ordering
  const instruments = useMemo(() => {
    if (!matrix || matrix.length === 0) return [];
    const uniqueInstruments = new Set<string>();
    matrix.forEach(pair => {
      const inst1 = (pair as any).pair1 || (pair as any).instrument_1 || (pair as any).instrument1;
      const inst2 = (pair as any).pair2 || (pair as any).instrument_2 || (pair as any).instrument2;
      uniqueInstruments.add(inst1);
      uniqueInstruments.add(inst2);
    });
    return Array.from(uniqueInstruments).sort();
  }, [matrix]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading correlation matrix...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <h3 className="text-red-400 font-semibold mb-2">Failed to Load Correlation Matrix</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 max-w-md">
          <div className="text-yellow-500 text-4xl mb-2">📊</div>
          <h3 className="text-yellow-400 font-semibold mb-2">No Correlation Data</h3>
          <p className="text-gray-400 text-sm">
            Correlation matrix is being calculated. Please check back in a few minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* HeatMap */}
      <div
        className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-y-auto"
        style={{ height: '600px', maxHeight: 'calc(100vh - 250px)' }}
      >
        <ResponsiveHeatMapCanvas
          data={data}
          margin={{ top: 90, right: 105, bottom: 22, left: 105 }}

          // Color scale for correlations (-1 to +1)
          colors={{
            type: 'diverging',
            scheme: 'red_yellow_blue',
            divergeAt: 0.5,
            minValue: -1,
            maxValue: 1
          }}

          // Value formatting (1 decimal place)
          valueFormat=">-.1f"

          // Axis configuration (vertical labels - 90 degrees)
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -90,
            legend: '',
            legendOffset: 46,
            ticksPosition: 'after'
          }}
          axisRight={null}
          axisBottom={null}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendPosition: 'middle',
            legendOffset: -72
          }}

          // Cell configuration
          cellOpacity={1}
          cellBorderWidth={1}
          cellBorderColor="rgba(255, 255, 255, 0.15)"

          // Interactions
          isInteractive={true}
          tooltip={(props: any) => (
            <CustomCorrelationTooltip
              {...props}
              x={props.x}
              y={props.y}
            />
          )}

          // Labels (disabled to save space - values visible in tooltips)
          enableLabels={false}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 1.8]]
          }}

          // Legend - Disabled (moved to info panel at bottom)
          legends={[]}

          // Animations
          animate={true}
          motionConfig="gentle"

          // Theme
          theme={{
            background: 'transparent',
            text: {
              fontSize: 9,
              fill: '#e5e7eb',
              outlineWidth: 0,
              outlineColor: 'transparent'
            },
            axis: {
              domain: {
                line: {
                  stroke: '#374151',
                  strokeWidth: 1
                }
              },
              legend: {
                text: {
                  fontSize: 10,
                  fill: '#9ca3af'
                }
              },
              ticks: {
                line: {
                  stroke: '#374151',
                  strokeWidth: 1
                },
                text: {
                  fontSize: 9,
                  fill: '#e5e7eb'
                }
              }
            },
            legends: {
              title: {
                text: {
                  fontSize: 11,
                  fill: '#9ca3af'
                }
              },
              text: {
                fontSize: 11,
                fill: '#e5e7eb'
              },
              ticks: {
                line: {},
                text: {
                  fontSize: 10,
                  fill: '#e5e7eb'
                }
              }
            },
            tooltip: {
              container: {
                background: 'transparent',
                color: 'inherit',
                fontSize: 'inherit'
              }
            }
          }}
        />
      </div>

      {/* Info Panel - Moved to Bottom */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-2xl">ℹ️</div>
          <div className="flex-1">
            <h4 className="text-blue-400 font-semibold mb-1">How to Read This HeatMap</h4>
            <p className="text-gray-300 text-sm mb-2">
              Each cell shows the correlation between two currency pairs. Hover over cells for details.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-gray-300">Strong +ve (&gt;0.7)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-300">Moderate +ve</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-300">Neutral (0)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-gray-300">Moderate -ve</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span className="text-gray-300">Strong -ve (&lt;-0.7)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total Pairs</div>
          <div className="text-2xl font-bold text-white">{matrix?.length || 0}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Instruments</div>
          <div className="text-2xl font-bold text-white">{instruments.length}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Last Updated</div>
          <div className="text-sm font-mono text-white">
            {matrix && matrix[0]
              ? new Date((matrix[0] as any).time || (matrix[0] as any).updated_at || (matrix[0] as any).date).toLocaleString()
              : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
}
