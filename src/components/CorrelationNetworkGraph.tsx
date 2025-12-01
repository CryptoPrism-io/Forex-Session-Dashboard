import React, { useMemo, useState } from 'react';
import { ResponsiveNetwork } from '@nivo/network';
import { useFXCorrelationMatrix } from '../hooks/useFXCorrelationMatrix';

interface NetworkNode {
  id: string;
  height: number;
  size: number;
  color: string;
}

interface NetworkLink {
  source: string;
  target: string;
  distance: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

interface CustomNodeTooltipProps {
  node: NetworkNode;
}

interface CustomLinkTooltipProps {
  link: {
    source: NetworkNode;
    target: NetworkNode;
    data: {
      correlation: number;
    };
  };
}

const CustomNodeTooltip: React.FC<CustomNodeTooltipProps> = ({ node }) => {
  return (
    <div
      className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-xs shadow-xl"
      style={{ pointerEvents: 'none' }}
    >
      <div className="font-semibold text-white mb-1">{node.id}</div>
      <div className="text-gray-300 text-xs">Click to highlight connections</div>
    </div>
  );
};

const CustomLinkTooltip: React.FC<CustomLinkTooltipProps> = ({ link }) => {
  const correlation = link.data.correlation;
  const getCorrelationLabel = (value: number): { label: string; emoji: string; color: string } => {
    if (value > 0.7) return { label: 'Strong Positive', emoji: '🔵', color: 'text-blue-400' };
    if (value > 0.3) return { label: 'Moderate Positive', emoji: '🟢', color: 'text-green-400' };
    if (value > -0.3) return { label: 'Weak', emoji: '⚪', color: 'text-gray-400' };
    if (value > -0.7) return { label: 'Moderate Negative', emoji: '🟠', color: 'text-orange-400' };
    return { label: 'Strong Negative', emoji: '🔴', color: 'text-red-400' };
  };

  const corrLabel = getCorrelationLabel(correlation);

  return (
    <div
      className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-xs shadow-xl"
      style={{ pointerEvents: 'none' }}
    >
      <div className="font-semibold text-white mb-1">
        {link.source.id} ↔ {link.target.id}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-mono font-bold ${corrLabel.color}`}>
          {correlation.toFixed(2)}
        </span>
      </div>
      <div className="text-gray-300">
        {corrLabel.emoji} {corrLabel.label}
      </div>
    </div>
  );
};

export function CorrelationNetworkGraph() {
  const { matrix, loading, error } = useFXCorrelationMatrix();
  const [correlationThreshold, setCorrelationThreshold] = useState(0.5);

  // Transform matrix data to network format
  const networkData: NetworkData = useMemo(() => {
    if (!matrix || matrix.length === 0) {
      return { nodes: [], links: [] };
    }

    // Collect unique instruments
    const instrumentsSet = new Set<string>();
    matrix.forEach(pair => {
      const inst1 = (pair as any).pair1 || (pair as any).instrument_1 || (pair as any).instrument1;
      const inst2 = (pair as any).pair2 || (pair as any).instrument_2 || (pair as any).instrument2;
      instrumentsSet.add(inst1);
      instrumentsSet.add(inst2);
    });

    // Create nodes
    const nodes: NetworkNode[] = Array.from(instrumentsSet).map(instrument => ({
      id: instrument,
      height: 1,
      size: 12,
      color: '#22d3ee' // cyan color
    }));

    // Create links (filter by threshold)
    const links: NetworkLink[] = matrix
      .filter(pair => {
        const corr = typeof pair.correlation === 'string'
          ? parseFloat(pair.correlation)
          : pair.correlation;
        return Math.abs(corr) >= correlationThreshold;
      })
      .map(pair => {
        const inst1 = (pair as any).pair1 || (pair as any).instrument_1 || (pair as any).instrument1;
        const inst2 = (pair as any).pair2 || (pair as any).instrument_2 || (pair as any).instrument2;
        const corr = typeof pair.correlation === 'string'
          ? parseFloat(pair.correlation)
          : pair.correlation;

        return {
          source: inst1,
          target: inst2,
          distance: Math.abs(1 - Math.abs(corr)) * 100, // Stronger correlations = shorter distance
          correlation: corr
        };
      });

    return { nodes, links };
  }, [matrix, correlationThreshold]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading correlation network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <h3 className="text-red-400 font-semibold mb-2">Failed to Load Network</h3>
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

  if (!networkData.nodes.length || !networkData.links.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 max-w-md">
          <div className="text-yellow-500 text-4xl mb-2">📊</div>
          <h3 className="text-yellow-400 font-semibold mb-2">No Correlation Data</h3>
          <p className="text-gray-400 text-sm">
            No correlations found above threshold {correlationThreshold.toFixed(1)}.
            Try lowering the threshold.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-sm text-gray-300 mb-2 block">
              Correlation Threshold: <span className="font-bold text-cyan-400">{correlationThreshold.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={correlationThreshold}
              onChange={(e) => setCorrelationThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.0 (Show All)</span>
              <span>1.0 (Perfect Only)</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Connections</div>
            <div className="text-2xl font-bold text-white">{networkData.links.length}</div>
          </div>
        </div>
      </div>

      {/* Network Graph */}
      <div
        className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden"
        style={{ height: 'calc(100vh - 400px)' }}
      >
        <ResponsiveNetwork
          data={networkData}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          linkDistance={(link) => link.distance}
          centeringStrength={0.3}
          repulsivity={10}
          nodeSize={(node) => node.size}
          activeNodeSize={(node) => node.size * 2}
          nodeColor={(node) => node.color}
          nodeBorderWidth={1}
          nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
          linkThickness={(link) => {
            const corr = (link as any).correlation || 0;
            return 1 + Math.abs(corr) * 4; // 1-5px based on correlation strength
          }}
          linkColor={(link) => {
            const corr = (link as any).correlation || 0;
            if (corr > 0.7) return '#3b82f6'; // blue - strong positive
            if (corr > 0) return '#10b981'; // green - positive
            if (corr > -0.7) return '#f97316'; // orange - negative
            return '#ef4444'; // red - strong negative
          }}
          isInteractive={true}
          nodeTooltip={CustomNodeTooltip}
          linkTooltip={CustomLinkTooltip as any}
          animate={true}
          motionConfig="gentle"
          theme={{
            background: 'transparent',
            text: {
              fontSize: 11,
              fill: '#e5e7eb',
              outlineWidth: 2,
              outlineColor: '#1f2937'
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

      {/* Info Panel */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-2xl">ℹ️</div>
          <div className="flex-1">
            <h4 className="text-blue-400 font-semibold mb-1">How to Read This Network</h4>
            <p className="text-gray-300 text-sm mb-2">
              Each node represents a currency pair. Lines show correlations above the threshold.
              Hover over lines for correlation values. Adjust threshold to filter weak correlations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-gray-300">Strong +ve (&gt;0.7)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-300">Positive</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-gray-300">Negative</span>
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
          <div className="text-gray-400 text-sm mb-1">Currency Pairs</div>
          <div className="text-2xl font-bold text-white">{networkData.nodes.length}</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Connections (Threshold: {correlationThreshold.toFixed(1)})</div>
          <div className="text-2xl font-bold text-white">{networkData.links.length}</div>
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
