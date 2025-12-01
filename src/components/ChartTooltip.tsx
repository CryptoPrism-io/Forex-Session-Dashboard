import React, { ReactElement, useRef } from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { SESSIONS } from '../constants';
import { TooltipInfo } from '../types';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  timezoneOffset: number;
  timezoneLabel: string;
}

type SessionTooltipEntry = {
  tooltip: TooltipInfo;
  range: [number, number];
};

const SESSION_TOOLTIP_LOOKUP: Map<string, SessionTooltipEntry> = (() => {
  const map = new Map<string, SessionTooltipEntry>();
  SESSIONS.forEach((session) => {
    Object.keys(session).forEach((key) => {
      const prop = (session as any)[key];
      if (prop && typeof prop === 'object' && 'key' in prop && prop.key) {
        map.set(prop.key, { tooltip: prop.tooltip, range: prop.range });
      }
    });
  });
  return map;
})();

const formatTime = (hour: number, offset: number): string => {
  const localHour = hour + offset;
  const finalHour = (Math.floor(localHour) % 24 + 24) % 24;
  const minutes = Math.round((localHour - Math.floor(localHour)) * 60);
  return `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const ChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  timezoneOffset,
  timezoneLabel,
}) => {
  const cacheRef = useRef<{
    key: string;
    element: ReactElement | null;
    time: number;
  } | null>(null);

  if (!active || !payload || !payload.length) {
    cacheRef.current = null;
    return null;
  }

  const dataKey = payload[0].dataKey as string;
  const originalKey = dataKey.replace(/_p\d+$/, '');
  const entry = SESSION_TOOLTIP_LOOKUP.get(originalKey);
  if (!entry) return null;

  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const cacheKey = `${originalKey}-${timezoneOffset}-${timezoneLabel}`;
  if (cacheRef.current && cacheRef.current.key === cacheKey && now - cacheRef.current.time < 16) {
    return cacheRef.current.element;
  }

  const { tooltip: tooltipData, range } = entry;
  if (!range) return null;

  const [startUTC, endUTC] = range;
  const startTimeLocal = formatTime(startUTC, timezoneOffset);
  const endTimeLocal = formatTime(endUTC, timezoneOffset);
  const duration = endUTC - startUTC;

  const element = (
    <div className="p-4 bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl text-sm text-slate-200 max-w-xs transition-all duration-200">
      <h3 className="font-bold text-base mb-2 text-white">{tooltipData.title}</h3>
      <div className="text-xs text-cyan-300 mb-3 font-semibold">
        {`Hours (${timezoneLabel}): ${startTimeLocal} - ${endTimeLocal}`}
      </div>
      <div className="text-xs text-slate-400 mb-3">
        Duration: {duration} {duration === 1 ? 'hour' : 'hours'}
      </div>
      <p>
        <strong className="font-semibold text-slate-400">Volatility:</strong>{' '}
        {tooltipData.volatility}
      </p>
      <p>
        <strong className="font-semibold text-slate-400">Best Pairs:</strong>{' '}
        {tooltipData.bestPairs}
      </p>
      <p className="mt-2 pt-2 border-t border-slate-700">
        <strong className="font-semibold text-slate-400">Strategy:</strong>{' '}
        {tooltipData.strategy}
      </p>
    </div>
  );

  cacheRef.current = {
    key: cacheKey,
    element,
    time: now,
  };

  return element;
};

export default ChartTooltip;
