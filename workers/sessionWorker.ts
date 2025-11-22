/// <reference lib="webworker" />

import { SESSIONS } from '../constants';
import {
  ChartBarDetails,
  ProcessedEvent,
  SessionWorkerRequest,
  SessionWorkerResponse,
  TimeBlock,
  VolumeHistogram,
  VisibleLayers,
} from '../types';

const VOLUME_DATA = [
  18, 17, 17, 18, 19, 21,
  23, 26, 30, 35, 39, 42,
  46, 50, 55, 60, 65, 70,
  75, 82, 88, 92, 89, 84,
  90, 95, 98, 100, 99, 96,
  94, 90, 86, 80, 75, 70,
  68, 63, 58, 52, 48, 44,
  40, 36, 32, 30, 28, 26,
];

const normalizeHour = (value: number) => ((value % 24) + 24) % 24;

const convertUTCTimeToHours = (utcTimeString: string | undefined): number => {
  if (!utcTimeString) return -1;
  const [hStr = '0', mStr = '0'] = utcTimeString.split(':');
  const hours = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;
  return hours + minutes / 60;
};

const getImpactColor = (impact: string | undefined): string => {
  switch (impact?.toLowerCase()) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#64748b';
  }
};

const getDarkerBorderColor = (impact: string | undefined): string => {
  switch (impact?.toLowerCase()) {
    case 'high':
      return '#991b1b';
    case 'medium':
      return '#78350f';
    case 'low':
      return '#064e3b';
    default:
      return '#1e293b';
  }
};

const buildTimeBlocks = (timezoneOffset: number): TimeBlock[] => {
  const blocks: TimeBlock[] = [];

  const processBar = (
    session: typeof SESSIONS[0],
    bar: (ChartBarDetails & { range: [number, number] }) | undefined,
    yLevel: number
  ) => {
    if (!bar || !bar.key) return;

    const duration = bar.range[1] - bar.range[0];
    const adjustedStart = bar.range[0] + timezoneOffset;
    const startPos = normalizeHour(adjustedStart);
    const endPos = startPos + duration;

    if (endPos <= 24) {
      blocks.push({
        key: `${bar.key}_1`,
        sessionName: session.name,
        details: bar,
        left: (startPos / 24) * 100,
        width: (duration / 24) * 100,
        yLevel,
        tooltip: bar.tooltip,
        range: bar.range,
      });
    } else {
      const width1 = 24 - startPos;
      blocks.push({
        key: `${bar.key}_1`,
        sessionName: session.name,
        details: bar,
        left: (startPos / 24) * 100,
        width: (width1 / 24) * 100,
        yLevel,
        tooltip: bar.tooltip,
        range: bar.range,
      });

      const width2 = endPos - 24;
      if (width2 > 0.001) {
        blocks.push({
          key: `${bar.key}_2`,
          sessionName: session.name,
          details: bar,
          left: 0,
          width: (width2 / 24) * 100,
          yLevel,
          tooltip: bar.tooltip,
          range: bar.range,
        });
      }
    }
  };

  SESSIONS.forEach((session) => {
    processBar(session, session.main, 0);
    processBar(session, session.overlapAsia, 1);
    processBar(session, session.overlapLondon, 1);
    processBar(session, session.killzone, 2);
    processBar(session, session.killzoneAM, 2);
    processBar(session, session.killzonePM, 2);
  });

  return blocks;
};

const processCalendarEvents = (
  calendarEvents: any[],
  selectedImpactLevels: string[],
  timezoneOffset: number
): ProcessedEvent[] => {
  if (!calendarEvents.length) return [];
  const impactFilter = new Set(selectedImpactLevels.map((level) => level.toLowerCase()));

  return calendarEvents
    .filter((event) => {
      const impact = (event.impact ?? '').toLowerCase();
      return impactFilter.size === 0 || impactFilter.has(impact);
    })
    .map((event) => {
      const utcHours = convertUTCTimeToHours(event.time_utc);
      if (utcHours < 0) return null;
      const localHours = normalizeHour(utcHours + timezoneOffset);
      const position = (localHours / 24) * 100;

      return {
        ...event,
        id: event.id,
        impact: event.impact,
        event: event.event,
        time_utc: event.time_utc,
        currency: event.currency,
        forecast: event.forecast,
        previous: event.previous,
        actual: event.actual,
        color: getImpactColor(event.impact),
        borderColor: getDarkerBorderColor(event.impact),
        position,
      } as ProcessedEvent;
    })
    .filter(Boolean) as ProcessedEvent[];
};

const stackEvents = (events: ProcessedEvent[]): Record<string, ProcessedEvent[]> => {
  const groups: Record<string, ProcessedEvent[]> = {};
  events.forEach((event) => {
    const posKey = Math.floor(event.position * 10).toString();
    if (!groups[posKey]) groups[posKey] = [];
    groups[posKey].push(event);
  });
  return groups;
};

const buildVolumeHistogram = (timezoneOffset: number): VolumeHistogram => {
  let rotationSteps = Math.round((timezoneOffset % 24) * 2);
  rotationSteps = ((rotationSteps % 48) + 48) % 48;

  const rotatedVolume = [
    ...VOLUME_DATA.slice(48 - rotationSteps),
    ...VOLUME_DATA.slice(0, 48 - rotationSteps),
  ];

  const interpolatedVolume: number[] = [];
  for (let i = 0; i < rotatedVolume.length - 1; i++) {
    interpolatedVolume.push(rotatedVolume[i]);
    const v1 = rotatedVolume[i];
    const v2 = rotatedVolume[i + 1];
    interpolatedVolume.push(v1 + (v2 - v1) * 0.333);
    interpolatedVolume.push(v1 + (v2 - v1) * 0.667);
  }
  interpolatedVolume.push(rotatedVolume[rotatedVolume.length - 1]);

  const chartWidth = 1000;
  const chartHeight = 100;
  const barWidth = chartWidth / interpolatedVolume.length;
  const volumeScale = chartHeight * 0.85;
  const baselineY = chartHeight - 5;

  return {
    interpolatedVolume,
    chartWidth,
    chartHeight,
    barWidth,
    volumeScale,
    baselineY,
  };
};

self.addEventListener('message', (event) => {
  const payload = event.data as SessionWorkerRequest;
  if (payload?.type !== 'compute') return;

  const timeBlocks = buildTimeBlocks(payload.timezoneOffset);
  const processedEvents =
    payload.visibleLayers.news && payload.calendarEvents.length
      ? processCalendarEvents(payload.calendarEvents, payload.selectedImpactLevels, payload.timezoneOffset)
      : [];

  const groupedEvents = processedEvents.length ? stackEvents(processedEvents) : {};
  const volumeHistogram = payload.visibleLayers.volume
    ? buildVolumeHistogram(payload.timezoneOffset)
    : null;

  const response: SessionWorkerResponse = {
    type: 'result',
    id: payload.id,
    cacheKey: payload.cacheKey,
    timezoneOffset: payload.timezoneOffset,
    timeBlocks,
    processedEvents,
    stackedEvents: groupedEvents,
    volumeHistogram,
  };

  self.postMessage(response);
});
