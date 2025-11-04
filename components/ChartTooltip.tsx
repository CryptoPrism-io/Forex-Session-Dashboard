import React from 'react';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { SESSIONS } from '../constants';
import { TooltipInfo } from '../types';

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  timezoneOffset: number;
  timezoneLabel: string;
}

const formatTime = (hour: number, offset: number): string => {
    const localHour = (hour + offset);
    const finalHour = (Math.floor(localHour) % 24 + 24) % 24;
    const minutes = Math.round((localHour - Math.floor(localHour)) * 60);
    return `${String(finalHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, timezoneOffset, timezoneLabel }) => {
  if (active && payload && payload.length) {
    const dataKey = payload[0].dataKey as string;
    const originalKey = dataKey.replace(/_p\d+$/, '');
    
    let tooltipData: TooltipInfo | null = null;
    let range: [number, number] | null = null;
    
    for (const session of SESSIONS) {
      for (const key in session) {
        const prop = (session as any)[key];
        if (typeof prop === 'object' && prop.key === originalKey) {
          tooltipData = prop.tooltip;
          range = prop.range;
          break;
        }
      }
      if (tooltipData) break;
    }
    
    if (!tooltipData || !range) return null;

    const [startUTC, endUTC] = range;
    const startTimeLocal = formatTime(startUTC, timezoneOffset);
    const endTimeLocal = formatTime(endUTC, timezoneOffset);
    const duration = endUTC - startUTC;


    return (
      <div className="p-4 bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-lg shadow-xl text-sm text-slate-200 max-w-xs transition-all duration-200">
        <h3 className="font-bold text-base mb-2 text-white">{tooltipData.title}</h3>
        <div className="text-xs text-cyan-300 mb-3 font-semibold">
          {`Hours (${timezoneLabel}): ${startTimeLocal} - ${endTimeLocal}`}
        </div>
        <div className="text-xs text-slate-400 mb-3">
          Duration: {duration} {duration === 1 ? 'hour' : 'hours'}
        </div>
        <p><strong className="font-semibold text-slate-400">Volatility:</strong> {tooltipData.volatility}</p>
        <p><strong className="font-semibold text-slate-400">Best Pairs:</strong> {tooltipData.bestPairs}</p>
        <p className="mt-2 pt-2 border-t border-slate-700"><strong className="font-semibold text-slate-400">Strategy:</strong> {tooltipData.strategy}</p>
      </div>
    );
  }

  return null;
};

export default ChartTooltip;