// PWA Installation Types
export interface BrowserInfo {
  name: string;
  isIOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isSamsung: boolean;
  isOpera: boolean;
  isStandalone: boolean;
}

export type InstallState = 'available' | 'installed' | 'dismissed' | 'unavailable';

export interface Timezone {
  label: string;
  offset: number;
  ianaTimezone?: string; // IANA timezone identifier for toLocaleTimeString
}

export interface TooltipInfo {
  title: string;
  volatility: string;
  bestPairs: string;
  strategy: string;
}

export interface ChartBarDetails {
  key: string;
  name: string;
  color: string;
  opacity: number;
  tooltip: TooltipInfo;
}

export interface SessionData {
  name: string;
  main: ChartBarDetails & { range: [number, number] };
  overlapAsia?: ChartBarDetails & { range: [number, number] };
  overlapLondon?: ChartBarDetails & { range: [number, number] };
  killzone?: ChartBarDetails & { range: [number, number] };
  killzoneAM?: ChartBarDetails & { range: [number, number] };
  killzonePM?: ChartBarDetails & { range: [number, number] };
}

export interface TimeBlock {
  key: string;
  sessionName: string;
  details: ChartBarDetails;
  left: number;
  width: number;
  yLevel: number;
  tooltip: TooltipInfo;
  range: [number, number];
}

export interface VisibleLayers {
  sessions: boolean;
  zones: boolean;
  overlaps: boolean;
  killzones: boolean;
  volume: boolean;
  news: boolean;
}

export interface ProcessedEvent {
  id?: number | string;
  impact?: string;
  color: string;
  borderColor: string;
  event?: string;
  time_utc?: string;
  currency?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  position: number;
}

export interface VolumeHistogram {
  interpolatedVolume: number[];
  chartWidth: number;
  chartHeight: number;
  barWidth: number;
  volumeScale: number;
  baselineY: number;
}

export interface SessionWorkerRequest {
  type: 'compute';
  id: number;
  cacheKey: string;
  timezoneOffset: number;
  visibleLayers: VisibleLayers;
  calendarEvents: any[];
  selectedImpactLevels: string[];
}

export interface SessionWorkerResponse {
  type: 'result';
  id: number;
  cacheKey: string;
  timezoneOffset: number;
  timeBlocks: TimeBlock[];
  processedEvents: ProcessedEvent[];
  stackedEvents: Record<string, ProcessedEvent[]>;
  volumeHistogram: VolumeHistogram | null;
}

// Alert Types
export type AlertEventType = 'open-before' | 'open' | 'close-before' | 'close';

export interface AlertEvent {
  id: string;
  sessionName: string;
  barName: string;
  eventType: AlertEventType;
  triggerTime: number; // UTC hours when alert should fire
  message: string;
  color: string;
}

export interface AlertConfig {
  enabled: boolean;
  soundEnabled: boolean;
  autoDismissSeconds: number;
}
