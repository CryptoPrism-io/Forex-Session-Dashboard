import React, { useEffect, useState } from 'react';

interface ClockConfig {
  label: string;
  timezone: string;
  accent: string;
  sessionKey: string;
}

type SessionStatusValue = 'OPEN' | 'CLOSED' | 'WARNING' | undefined;

const CLOCKS: ClockConfig[] = [
  { label: 'Sydney', timezone: 'Australia/Sydney', accent: '#38bdf8', sessionKey: 'Sydney' },
  { label: 'Tokyo', timezone: 'Asia/Tokyo', accent: '#f472b6', sessionKey: 'Asia' },
  { label: 'London', timezone: 'Europe/London', accent: '#facc15', sessionKey: 'London' },
  { label: 'New York', timezone: 'America/New_York', accent: '#34d399', sessionKey: 'New York' },
];

const TICK_MARKS = Array.from({ length: 12 });

interface ClockTimeParts {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  timeLabel: string;
  dateLabel: string;
}

const getTimePartsForTimezone = (timezone: string): ClockTimeParts => {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const timeParts = timeFormatter.formatToParts(now);
  const hour = Number(timeParts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(timeParts.find((part) => part.type === 'minute')?.value ?? '0');
  const second = Number(timeParts.find((part) => part.type === 'second')?.value ?? '0');

  const displayTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  const displayDate = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(now);

  return {
    hour,
    minute,
    second,
    millisecond: now.getMilliseconds(),
    timeLabel: displayTime,
    dateLabel: displayDate,
  };
};

interface ClockCardProps extends ClockConfig {
  compact?: boolean;
  sessionStatus?: Record<string, SessionStatusValue>;
}

const ClockCard: React.FC<ClockCardProps> = ({ label, timezone, accent, compact, sessionStatus, sessionKey }) => {
  const [timeParts, setTimeParts] = useState<ClockTimeParts>(() => getTimePartsForTimezone(timezone));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimeParts(getTimePartsForTimezone(timezone));
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [timezone]);

  const secondProgress = timeParts.second + timeParts.millisecond / 1000;
  const minuteProgress = timeParts.minute + secondProgress / 60;
  const hourProgress = (timeParts.hour % 12) + minuteProgress / 60;

  const hourAngle = hourProgress * 30;
  const minuteAngle = minuteProgress * 6;
  const secondAngle = secondProgress * 6;

  const clockSize = compact ? 128 : 184;
  const tickLength = compact ? 48 : 68;
  const hourHandLength = compact ? 40 : 60;
  const minuteHandLength = compact ? 50 : 76;
  const secondHandLength = compact ? 56 : 84;

  const status: SessionStatusValue = sessionStatus?.[sessionKey];
  const isActive = status === 'OPEN' || status === 'WARNING';
  const isWarning = status === 'WARNING';

  const cardStyle: React.CSSProperties = isActive
    ? {
        borderColor: accent,
        boxShadow: `0 0 22px ${accent}40, inset 0 0 18px ${accent}20`,
      }
    : {};

  const indicatorStyle: React.CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: '9999px',
    background: isActive ? accent : 'rgba(148, 163, 184, 0.4)',
    boxShadow: isActive ? `0 0 12px ${accent}` : undefined,
    animation: isWarning ? 'pulse-glow 1.5s infinite' : undefined,
  };

  const labelClass = `text-sm font-semibold ${isActive ? 'text-slate-100' : 'text-slate-400'}`;
  const timeClass = `text-sm font-mono ${isActive ? 'text-slate-100' : 'text-slate-300'}`;
  const dateClass = `text-[11px] ${isActive ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <div
      className={`flex items-center gap-3 p-3 sm:gap-4 sm:p-4 rounded-2xl bg-slate-900/40 border border-slate-800/40 backdrop-blur-xl shadow-lg shadow-black/10 ${compact ? '' : 'md:flex-col md:items-start md:gap-3'}`}
      style={cardStyle}
    >
      <div className="relative" style={{ width: clockSize, height: clockSize }}>
        <div className="absolute inset-0 rounded-full border border-slate-700/50 bg-slate-950/90 shadow-inner">
          {TICK_MARKS.map((_, index) => (
            <span
              key={index}
              className="absolute top-1/2 left-1/2 w-[2px] h-3 bg-slate-600/60 origin-center"
              style={{
                transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-${tickLength}px)`,
              }}
            />
          ))}

          <span
            className="absolute top-1/2 left-1/2 w-1 h-6 bg-slate-200 origin-bottom rounded"
            style={{
              transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
              height: hourHandLength,
            }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-[3px] h-8 bg-slate-300 origin-bottom rounded"
            style={{
              transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
              height: minuteHandLength,
            }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-[1px] h-9 origin-bottom rounded"
            style={{
              transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
              height: secondHandLength,
              background: accent,
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              width: '10px',
              height: '10px',
              background: accent,
              top: 'calc(50% - 5px)',
              left: 'calc(50% - 5px)',
            }}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0" style={indicatorStyle}></span>
          <span className={labelClass}>{label}</span>
        </div>
        <span className={dateClass}>{timeParts.dateLabel}</span>
        <span className={timeClass}>{timeParts.timeLabel}</span>
      </div>
    </div>
  );
};

const SessionClocks: React.FC<{
  compact?: boolean;
  sessionStatus?: Record<string, SessionStatusValue>;
}> = ({ compact = false, sessionStatus }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {CLOCKS.map((config) => (
        <ClockCard key={config.label} {...config} compact={compact} sessionStatus={sessionStatus} />
      ))}
    </div>
  );
};

export default SessionClocks;
