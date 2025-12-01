import React, { useState } from 'react';
import { RiskCalculator } from './RiskCalculator';
import { VolatilityPanel } from './VolatilityPanel';
import { BestPairsWidget } from './BestPairsWidget';
import { CorrelationHeatMap } from './CorrelationHeatMap';
import { CorrelationNetworkGraph } from './CorrelationNetworkGraph';
import ForexChart from './ForexChart';
import VolumeChart from './VolumeChart';
import { Timezone } from '../types';
import { SessionStatus } from '../App';

interface FXToolsPanelProps {
  selectedTimezone?: Timezone;
  currentTime?: Date;
  nowLine?: number;
  sessionStatus?: { [key: string]: SessionStatus };
  currentDSTStatus?: boolean;
}

type ToolTab =
  | 'timeline'
  | 'volume'
  | 'volatility'
  | 'position'
  | 'correlation'
  | 'network'
  | 'screener'
  | 'aiChat';

export function FXToolsPanel({
  selectedTimezone,
  currentTime,
  nowLine,
  sessionStatus,
  currentDSTStatus
}: FXToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<ToolTab>('network');

  const tabs: Array<{ id: ToolTab; label: string }> = [
    { id: 'timeline', label: 'Session Timeline' },
    { id: 'volume', label: 'Session Volume' },
    { id: 'volatility', label: 'Volatility' },
    { id: 'position', label: 'Position Size' },
    { id: 'correlation', label: 'Correlation HeatMap' },
    { id: 'network', label: 'Network Corr Map' },
    { id: 'screener', label: 'Screener' },
    { id: 'aiChat', label: 'AI Chat' }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Tools Header */}
      <div className="px-6 py-3 border-b border-gray-700">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          TOOLS
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-700/50 hover:text-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'timeline' && selectedTimezone && currentTime && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
              <h2 className="text-xl font-semibold text-white mb-4">24-Hour Session Timeline</h2>
              <ForexChart
                selectedTimezone={selectedTimezone}
                currentTime={currentTime}
                nowLine={nowLine || 0}
                sessionStatus={sessionStatus || {}}
                currentDSTStatus={currentDSTStatus || false}
              />
            </div>
          </div>
        )}

        {activeTab === 'volume' && selectedTimezone && currentTime && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Trading Volume Profile</h2>
              <VolumeChart
                selectedTimezone={selectedTimezone}
                currentTime={currentTime}
                nowLine={nowLine || 0}
                sessionStatus={sessionStatus || {}}
              />
            </div>
          </div>
        )}

        {activeTab === 'volatility' && (
          <div className="space-y-6">
            <VolatilityPanel />
          </div>
        )}

        {activeTab === 'position' && (
          <div className="space-y-6">
            <RiskCalculator />
          </div>
        )}

        {activeTab === 'correlation' && (
          <CorrelationHeatMap />
        )}

        {activeTab === 'network' && (
          <CorrelationNetworkGraph />
        )}

        {activeTab === 'screener' && (
          <div className="space-y-6">
            <BestPairsWidget />
          </div>
        )}

        {activeTab === 'aiChat' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg border border-purple-500/30 p-8 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Chat</h2>
              <p className="text-gray-400 mb-6">
                Coming soon: AI-powered trading recommendations based on market conditions,
                volatility, and correlation analysis.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-purple-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                Feature in development
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
