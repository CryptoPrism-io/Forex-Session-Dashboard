import React, { useEffect, useState } from 'react';
import SessionClocks from './SessionClocks';
import { Timezone } from '../types';

interface ActiveSession {
  name: string;
  color: string;
  type: 'main' | 'overlap' | 'killzone';
  state: 'OPEN' | 'CLOSED' | 'WARNING';
  elapsedSeconds: number;
  remainingSeconds: number;
  startUTC: number;
  endUTC: number;
}

interface CalendarEvent {
  time: string;
  currency: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  previous?: string;
  forecast?: string;
}

interface WorldClockPanelProps {
  compact?: boolean;
  sessionStatus?: Record<string, 'OPEN' | 'CLOSED' | 'WARNING' | undefined>;
  activeSessions: ActiveSession[];
  selectedTimezone: Timezone;
}

const formatSessionTime = (seconds: number): string => {
  if (seconds < 0) return '--:--:--';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const formatTimeInTimezone = (utcHour: number, timezoneOffset: number): string => {
  const localHour = utcHour + timezoneOffset;
  const finalHour = (Math.floor(localHour) % 24 + 24) % 24;
  const minutes = Math.round((localHour - Math.floor(localHour)) * 60);
  return `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const getImpactColor = (impact: string): string => {
  switch (impact?.toLowerCase()) {
    case 'high':
      return '#ef4444'; // red-500
    case 'medium':
      return '#f59e0b'; // amber-500
    case 'low':
      return '#10b981'; // green-500
    default:
      return '#64748b'; // slate-500
  }
};

const getCurrencyFlag = (currency: string): string => {
  const flagMap: Record<string, string> = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    JPY: '🇯🇵',
    AUD: '🇦🇺',
    NZD: '🇳🇿',
    CAD: '🇨🇦',
    CHF: '🇨🇭',
    CNY: '🇨🇳',
    INR: '🇮🇳',
    SGD: '🇸🇬',
    HKD: '🇭🇰',
  };
  return flagMap[currency] || '🌐';
};

const convertUTCToTimezone = (utcTimeString: string | undefined, offsetHours: number): string => {
  if (!utcTimeString) return '';

  const [hStr = '0', mStr = '0'] = utcTimeString.split(':');
  const baseMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
  const offsetMinutes = Math.round(offsetHours * 60);
  let localMinutes = (baseMinutes + offsetMinutes) % (24 * 60);
  if (localMinutes < 0) localMinutes += 24 * 60;

  const hh = String(Math.floor(localMinutes / 60)).padStart(2, '0');
  const mm = String(localMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

const WorldClockPanel: React.FC<WorldClockPanelProps> = ({
  compact = false,
  sessionStatus,
  activeSessions,
  selectedTimezone,
}) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the currently OPEN session (or WARNING if no OPEN session)
  const openSession = activeSessions.find(
    (s) => s.type === 'main' && (s.state === 'OPEN' || s.state === 'WARNING')
  ) || null;

  // Fetch today's calendar events
  useEffect(() => {
    const fetchTodaysEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/calendar/today');
        if (!response.ok) throw new Error('Failed to fetch today\'s events');

        const json = await response.json();
        const data = json.data || [];

        setCalendarEvents(data);
      } catch (error) {
        console.error('Error fetching today\'s events:', error);
        setCalendarEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysEvents();
    const interval = setInterval(fetchTodaysEvents, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* TOP 1/3: Clocks */}
      <div className="flex-shrink-0">
        <SessionClocks compact={true} sessionStatus={sessionStatus} />
      </div>

      {/* BOTTOM 2/3: Split into Left (60%) and Right (40%) */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* LEFT SIDE (60%): Currently OPEN Session */}
        <div className="w-3/5 flex flex-col rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Current Session</h3>

          {openSession ? (
            <div className="space-y-3">
              {/* Session Name */}
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: openSession.color }}
                />
                <span className="text-base font-semibold text-slate-100">
                  {openSession.name}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  openSession.state === 'OPEN'
                    ? 'bg-green-500/30 text-green-300'
                    : 'bg-yellow-500/30 text-yellow-300'
                }`}>
                  {openSession.state}
                </span>
              </div>

              {/* Session Timing */}
              <div className="bg-slate-800/40 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Start (Local)</span>
                  <span className="text-slate-200 font-mono">
                    {formatTimeInTimezone(openSession.startUTC, selectedTimezone.offset)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">End (Local)</span>
                  <span className="text-slate-200 font-mono">
                    {formatTimeInTimezone(openSession.endUTC, selectedTimezone.offset)}
                  </span>
                </div>
              </div>

              {/* Elapsed & Remaining Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Elapsed</div>
                  <div className="text-sm font-mono text-emerald-300">
                    {formatSessionTime(openSession.elapsedSeconds)}
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-slate-400 mb-1">Remaining</div>
                  <div className="text-sm font-mono text-cyan-300">
                    {formatSessionTime(openSession.remainingSeconds)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-sm text-slate-400">No active session</span>
            </div>
          )}
        </div>

        {/* RIGHT SIDE (40%): Today's Economic Calendar Events */}
        <div className="w-2/5 flex flex-col rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 p-3 overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Today's Events</h3>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-slate-400">Loading...</span>
              </div>
            ) : calendarEvents.length > 0 ? (
              calendarEvents.map((event: any) => {
                const impactColor = getImpactColor(event.impact || 'low');
                const rawTime = event.time || event.time_utc || '';
                const isTentative = rawTime.toLowerCase() === 'tentative';
                const convertedTime = isTentative ? '' : convertUTCToTimezone(event.time_utc, selectedTimezone.offset);
                const displayTime = convertedTime || rawTime;

                return (
                  <div
                    key={event.id}
                    className="rounded-lg p-2 transition-colors border border-slate-800/40 bg-slate-800/30 hover:bg-slate-800/50"
                  >
                    <div className="flex items-start gap-2">
                      {/* Time */}
                      <div className="min-w-12 text-xs font-mono text-slate-400 flex flex-col gap-0.5">
                        <span>{displayTime}</span>
                        {isTentative && (
                          <span className="text-[9px] font-mono text-amber-300">
                            Tentative
                          </span>
                        )}
                      </div>

                      {/* Currency Flag */}
                      <div className="text-sm flex-shrink-0">
                        {getCurrencyFlag(event.currency)}
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Impact Indicator */}
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: impactColor,
                              boxShadow: `0 0 4px ${impactColor}`,
                            }}
                          />
                          <div className="text-xs font-medium text-slate-200 truncate">
                            {event.event}
                          </div>
                        </div>
                      </div>

                      {/* Currency Badge */}
                      <div className="text-xs font-semibold text-slate-400">
                        {event.currency}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-slate-400">No events today</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldClockPanel;
