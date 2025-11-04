
export interface Timezone {
  label: string;
  offset: number;
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
