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

const ClockCard: React.FC<ClockConfig> = ({ label, timezone, accent }) => {
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

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-700/40 backdrop-blur-xl shadow-lg shadow-black/20">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <div className="absolute inset-0 rounded-full border border-slate-700/50 bg-slate-950/90 shadow-inner">
          {TICK_MARKS.map((_, index) => (
            <span
              key={index}
              className="absolute top-1/2 left-1/2 w-[2px] h-3 bg-slate-600/60 origin-center"
              style={{
                transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-34px)`,
              }}
            />
          ))}

          <span
            className="absolute top-1/2 left-1/2 w-1 h-6 bg-slate-200 origin-bottom rounded"
            style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-[3px] h-8 bg-slate-300 origin-bottom rounded"
            style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }}
          />
          <span
            className="absolute top-1/2 left-1/2 w-[1px] h-9 origin-bottom rounded"
            style={{
              transform: `translate(-50%, -100%) rotate(${secondAngle}deg)`,
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
        <span className="text-xs text-slate-500">{dateString}</span>
        <span className="text-sm font-mono text-slate-200">{timeString}</span>
      </div>
    </div>
  );
};

const SessionClocks: React.FC = () => {
  return (
    <section className="w-full mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CLOCKS.map((config) => (
          <ClockCard key={config.label} {...config} />
        ))}
      </div>
    </section>
  );
};

export default SessionClocks;
