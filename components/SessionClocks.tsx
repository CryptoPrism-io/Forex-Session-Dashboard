import React, { useEffect, useState } from 'react';

interface ClockConfig {
  label: string;
  timezone: string;
  accent: string;
}

const CLOCKS: ClockConfig[] = [
  { label: 'Sydney', timezone: 'Australia/Sydney', accent: '#38bdf8' },
  { label: 'Tokyo', timezone: 'Asia/Tokyo', accent: '#f472b6' },
  { label: 'London', timezone: 'Europe/London', accent: '#facc15' },
  { label: 'New York', timezone: 'America/New_York', accent: '#34d399' },
];

const TICK_MARKS = Array.from({ length: 12 });

const getTimeForTimezone = (timezone: string) => {
  const now = new Date();
  const localeString = now.toLocaleString('en-US', { timeZone: timezone });
  return new Date(localeString);
};

interface ClockCardProps extends ClockConfig {
  compact?: boolean;
}

const ClockCard: React.FC<ClockCardProps> = ({ label, timezone, accent, compact }) => {
  const [time, setTime] = useState<Date>(() => getTimeForTimezone(timezone));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTime(getTimeForTimezone(timezone));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timezone]);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  const timeString = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const clockSize = compact ? 64 : 92;
  const tickLength = compact ? 24 : 34;
  const hourHandLength = compact ? 18 : 30;
  const minuteHandLength = compact ? 24 : 40;
  const secondHandLength = compact ? 26 : 44;

  return (
    <div className={`flex items-center gap-3 p-3 sm:gap-4 sm:p-4 rounded-2xl bg-slate-900/40 border border-slate-800/40 backdrop-blur-xl shadow-lg shadow-black/10 ${compact ? '' : 'md:flex-col md:items-start md:gap-3'}`}>
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
        <span className="text-sm font-semibold text-slate-100">{label}</span>
        <span className="text-[11px] text-slate-500">{dateString}</span>
        <span className="text-sm font-mono text-slate-200">{timeString}</span>
      </div>
    </div>
  );
};

const SessionClocks: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {CLOCKS.map((config) => (
        <ClockCard key={config.label} {...config} compact={compact} />
      ))}
    </div>
  );
};

export default SessionClocks;
