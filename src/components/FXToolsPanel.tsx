import React, { useState } from 'react';
import { RiskCalculator } from './RiskCalculator';
import { VolatilityPanel } from './VolatilityPanel';
import { BestPairsWidget } from './BestPairsWidget';
import { CorrelationHeatMap } from './CorrelationHeatMap';
import { CorrelationNetworkGraph } from './CorrelationNetworkGraph';
import { CorrelationInsights } from './CorrelationInsights';
import { PriceTicker } from './PriceTicker';
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
  | 'prices'
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
  const [activeTab, setActiveTab] = useState<ToolTab>('prices');

  const tabs: Array<{ id: ToolTab; label: string }> = [
    { id: 'prices', label: 'Live Prices' },
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
    <div className="w-full h-full flex flex-col bg-black">
      {/* Tools Header */}
      <div className="px-6 py-3 border-b border-gray-800/50">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          TOOLS
        </div>

        {/* Tab Navigation - Mobile: dropdown, Desktop: buttons */}
        {/* Mobile dropdown */}
        <div className="md:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as ToolTab)}
            className="w-full px-4 py-3 text-sm font-semibold rounded-lg bg-slate-950/90 border border-cyan-400/40 text-cyan-100 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25rem',
              paddingRight: '2.5rem',
            }}
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        {/* Desktop/Tablet buttons */}
        <div className="hidden md:flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-gray-950/70 text-gray-400 border border-gray-800/50 hover:bg-gray-900/70 hover:text-gray-300'
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
        {activeTab === 'prices' && (
          <div className="space-y-6">
            <PriceTicker />
          </div>
        )}

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
          <div className="space-y-6">
            <CorrelationInsights />
            <div className="border-t border-slate-700/50 pt-6">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Correlation Matrix</h3>
              <CorrelationHeatMap />
            </div>
          </div>
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
