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
    USD: '�YΧ�Y��',
    EUR: '�YΦ�YΧ',
    GBP: '�YΪ�Y��',
    JPY: '�Y���Y��',
    AUD: '�Y���YΧ',
    NZD: '�Y���YΨ',
    CAD: '�Y���Y��',
    CHF: '�Y���Y��',
    CNY: '�Y���Y��',
    INR: '�YΩ�Y��',
    SGD: '�Y���YΪ',
    HKD: '�Y���Y��',
  };
  return flagMap[currency] || '�YO?';
};

// Convert UTC time to selected timezone
// Database now stores time_utc (already in UTC)
const convertUTCToTimezone = (utcTimeString: string | undefined, targetOffsetHours: number): string => {
  if (!utcTimeString) return '';

  const [hStr = '0', mStr = '0'] = utcTimeString.split(':');
  const utcMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);

  // Apply target timezone offset
  const offsetMinutes = Math.round(targetOffsetHours * 60);
  let targetMinutes = (utcMinutes + offsetMinutes) % (24 * 60);
  if (targetMinutes < 0) targetMinutes += 24 * 60;

  const hh = String(Math.floor(targetMinutes / 60)).padStart(2, '0');
  const mm = String(targetMinutes % 60).padStart(2, '0');
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

  // API base URL from environment variable
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Get the currently OPEN session (or WARNING if no OPEN session)
  const openSession = activeSessions.find(
    (s) => s.type === 'main' && (s.state === 'OPEN' || s.state === 'WARNING')
  ) || null;

  // Fetch today's calendar events
  useEffect(() => {
    const fetchTodaysEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/calendar/today`);
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
  }, [API_BASE_URL]);

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* TOP 1/3: Clocks */}
      <div className="flex-shrink-0">
        <SessionClocks compact={true} sessionStatus={sessionStatus} />
      </div>

      {/* BOTTOM 2/3: Split into Left (60%) and Right (40%) */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* LEFT SIDE (60%): Currently OPEN Session */}
        <div className="w-3/5 flex flex-col rounded-3xl glass-soft p-4 shadow-2xl shadow-black/30 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-100 mb-3">Current Session</h3>

          {openSession ? (
            <div className="space-y-1.5">
              {/* Row 1: Session Name + Status + Start/End Times */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: openSession.color }}
                  />
                  <span className="text-sm font-semibold text-slate-100">
                    {openSession.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    openSession.state === 'OPEN'
                      ? 'bg-green-500/30 text-green-300'
                      : 'bg-yellow-500/30 text-yellow-300'
                  }`}>
                    {openSession.state}
                  </span>
                </div>

                <div className="text-xs text-slate-200 font-mono flex gap-2">
                  <span className="text-slate-300">{formatTimeInTimezone(openSession.startUTC, selectedTimezone.offset)}</span>
                  <span className="text-slate-500">�?"</span>
                  <span className="text-slate-300">{formatTimeInTimezone(openSession.endUTC, selectedTimezone.offset)}</span>
                </div>
              </div>

              {/* Row 2: Elapsed & Remaining Time (Secondary, Compact) */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">�?� Elapsed:</span>
                  <span className="text-emerald-300 font-mono">
                    {formatSessionTime(openSession.elapsedSeconds)}
                  </span>
                </div>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">�?� Remaining:</span>
                  <span className="text-cyan-300 font-mono">
                    {formatSessionTime(openSession.remainingSeconds)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-slate-400">No active session</span>
            </div>
          )}
        </div>

        {/* RIGHT SIDE (40%): Today's Economic Calendar Events */}
        <div className="w-2/5 flex flex-col rounded-3xl glass-soft p-3 shadow-2xl shadow-black/30 overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Today's Events</h3>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-xs text-slate-400">Loading...</span>
              </div>
            ) : calendarEvents.length > 0 ? (
              calendarEvents.map((event: any, idx: number) => {
                const impactColor = getImpactColor(event.impact || 'low');
                const rawTime = event.time_utc || '';
                const isTentative = rawTime.toLowerCase() === 'tentative';
                const convertedTime = isTentative ? '' : convertUTCToTimezone(event.time_utc, selectedTimezone.offset);
                const displayTime = convertedTime || rawTime;

                return (
                  <div
                    key={event.id || `event-${idx}-${event.time_utc}-${event.currency}`}
                    className="rounded-xl p-3 transition-colors border border-slate-700/40 bg-slate-900/40 hover:bg-slate-800/60 shadow-inner shadow-black/15 glass-soft"
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
