import React, { useState } from 'react';
import { SESSIONS_STANDARD, SESSIONS_DAYLIGHT } from '../constants';
import { IconChevronDown } from './icons';

interface SessionGuideProps {
  currentTimezoneLabel: string;
  timezoneOffset: number;
}

const formatTime = (hour: number, offset: number): string => {
  const localHour = hour + offset;
  const finalHour = (Math.floor(localHour) % 24 + 24) % 24;
  const minutes = Math.round((localHour - Math.floor(localHour)) * 60);
  return `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const SessionGuide: React.FC<SessionGuideProps> = ({ currentTimezoneLabel, timezoneOffset }) => {
  const [guideTab, setGuideTab] = useState<'standard' | 'daylight'>('standard');
  const [collapsedSections, setCollapsedSections] = useState({ mainSessions: false, overlaps: false, killzones: false });
  const [chartsVisible, setChartsVisible] = useState(true);

  const guideSessions = guideTab === 'standard' ? SESSIONS_STANDARD : SESSIONS_DAYLIGHT;

  const toggleSection = (section: 'mainSessions' | 'overlaps' | 'killzones') => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <section className="w-full bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-2xl border border-slate-700/30 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden transition-all duration-300 hover:border-slate-600/50">
      <div className="p-6 text-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-100">Trading Session Guide ({currentTimezoneLabel})</h3>
            {/* Tabs for Standard / Daylight Times */}
            <div className="flex items-center gap-1 bg-slate-800/40 backdrop-blur-md border border-slate-700/40 rounded-lg p-1">
              <button
                onClick={() => setGuideTab('standard')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                  guideTab === 'standard'
                    ? 'bg-blue-500/30 border border-blue-400/50 text-blue-100'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                ❄️ Winter
              </button>
              <button
                onClick={() => setGuideTab('daylight')}
                className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                  guideTab === 'daylight'
                    ? 'bg-amber-500/30 border border-amber-400/50 text-amber-100'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                🌞 Summer
              </button>
            </div>
          </div>
          <button
            onClick={() => setChartsVisible(!chartsVisible)}
            className="px-3 py-1 text-xs font-semibold rounded-lg backdrop-blur-md bg-slate-700/20 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-500/60 text-slate-300 transition-all duration-300"
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
            <div className="overflow-x-auto rounded-xl bg-slate-800/20 backdrop-blur-md border border-slate-700/20 p-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/40">
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
                  {[guideSessions[0], guideSessions[1], guideSessions[2], guideSessions[3]].map((session, idx) => {
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
            <div className="overflow-x-auto rounded-xl bg-slate-800/20 backdrop-blur-md border border-slate-700/20 p-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/40">
                    <th className="text-left p-2 text-slate-300 font-semibold">Overlap</th>
                    <th className="text-left p-2 text-slate-300 font-semibold">Start</th>
                    <th className="text-left p-2 text-slate-300 font-semibold">End</th>
                    <th className="text-left p-2 text-slate-300 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const overlaps = [];
                    if (guideSessions[2].overlapAsia) {
                      overlaps.push({ name: guideSessions[2].overlapAsia.name, range: guideSessions[2].overlapAsia.range });
                    }
                    if (guideSessions[3].overlapLondon) {
                      overlaps.push({ name: guideSessions[3].overlapLondon.name, range: guideSessions[3].overlapLondon.range });
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
            <div className="overflow-x-auto rounded-xl bg-slate-800/20 backdrop-blur-md border border-slate-700/20 p-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/40">
                    <th className="text-left p-2 text-slate-300 font-semibold">Killzone</th>
                    <th className="text-left p-2 text-slate-300 font-semibold">Start</th>
                    <th className="text-left p-2 text-slate-300 font-semibold">End</th>
                    <th className="text-left p-2 text-slate-300 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const killzones = [];
                    if (guideSessions[2].killzone) {
                      killzones.push({ name: guideSessions[2].killzone.name, range: guideSessions[2].killzone.range });
                    }
                    if (guideSessions[3].killzoneAM) {
                      killzones.push({ name: guideSessions[3].killzoneAM.name, range: guideSessions[3].killzoneAM.range });
                    }
                    if (guideSessions[3].killzonePM) {
                      killzones.push({ name: guideSessions[3].killzonePM.name, range: guideSessions[3].killzonePM.range });
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
  );
};

export default SessionGuide;
