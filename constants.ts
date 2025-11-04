import { Timezone, SessionData } from './types';

export const TIMEZONES: Timezone[] = [
  // Primary display
  { label: "UTC", offset: 0 },
  { label: "BST", offset: 1 },
  { label: "EST", offset: -5 },
  { label: "JST", offset: 9 },
  // In dropdown
  { label: "GMT", offset: 0 },
  { label: "IST", offset: 5.5 },
  { label: "PST", offset: -8 },
  { label: "CET", offset: 1 },
  { label: "SGT", offset: 8 },
  { label: "AEDT", offset: 11 },
];

export const SESSIONS: SessionData[] = [
  {
    name: "Sydney",
    main: {
      key: 'sydney_session',
      name: "Sydney Session",
      range: [21, 30], // 9pm to 6am UTC
      color: "hsl(195, 74%, 62%)",
      opacity: 0.7,
      tooltip: {
        title: "Sydney Session",
        volatility: "Low",
        bestPairs: "AUD/USD, AUD/JPY",
        strategy: "Range trading, breakouts during session open."
      }
    }
  },
  {
    name: "Asia",
    main: {
      key: 'tokyo_session',
      name: "Asian Session (Tokyo)",
      range: [23, 32], // 11pm to 8am UTC
      color: "hsl(320, 82%, 60%)",
      opacity: 0.7,
      tooltip: {
        title: "Asian Session (Tokyo)",
        volatility: "Low-Medium",
        bestPairs: "USD/JPY, GBP/JPY",
        strategy: "Follow JPY pairs, watch for Bank of Japan announcements."
      }
    },
  },
  {
    name: "London",
    main: {
      key: 'london_session',
      name: "London Session",
      range: [7, 16], // 7am to 4pm UTC
      color: "hsl(45, 100%, 50%)",
      opacity: 0.7,
      tooltip: {
        title: "London Session",
        volatility: "High",
        bestPairs: "EUR/USD, GBP/USD",
        strategy: "High volume, focus on breakouts and trend-following."
      }
    },
    overlapAsia: {
      key: 'asia_london_overlap',
      name: "Asia-London Overlap",
      range: [7, 8],
      color: "hsl(255, 80%, 70%)",
      opacity: 0.9,
      tooltip: {
        title: "Asia-London Overlap",
        volatility: "High",
        bestPairs: "GBP/JPY, EUR/JPY",
        strategy: "Look for trend continuation from the Asian session or reversals as London volume enters."
      }
    },
    killzone: {
      key: 'london_killzone',
      name: "London Killzone",
      range: [6, 9],
      color: "hsl(0, 80%, 60%)",
      opacity: 0.8,
      tooltip: {
        title: "London Killzone (LKZ)",
        volatility: "Very High",
        bestPairs: "EUR/USD, GBP/USD",
        strategy: "Classic 'stop hunt' and 'seek and destroy' patterns. Look for liquidity grabs above/below Asia's range, then a reversal."
      }
    }
  },
  {
    name: "New York",
    main: {
      key: 'ny_session',
      name: "New York Session",
      range: [12, 21], // 12pm to 9pm UTC
      color: "hsl(120, 60%, 50%)",
      opacity: 0.7,
      tooltip: {
        title: "New York Session",
        volatility: "High",
        bestPairs: "USD Majors",
        strategy: "Key economic data releases. Trade the news or wait for post-news trends to establish."
      }
    },
    overlapLondon: {
      key: 'london_ny_overlap',
      name: "London-NY Overlap",
      range: [12, 16],
      color: "hsl(20, 100%, 60%)",
      opacity: 0.9,
      tooltip: {
        title: "London-NY Overlap",
        volatility: "Very High",
        bestPairs: "EUR/USD, USD/JPY, GBP/USD",
        strategy: "Highest liquidity period. Ideal for breakout strategies and short-term trend following."
      }
    },
    killzoneAM: {
      key: 'ny_am_killzone',
      name: "NY AM Killzone",
      range: [11, 14],
      color: "hsl(0, 80%, 60%)",
      opacity: 0.8,
      tooltip: {
        title: "NY AM Killzone",
        volatility: "Very High",
        bestPairs: "USD Majors, Indices (US30, NAS100)",
        strategy: "Similar to London Killzone. Look for manipulation moves around the NY open to engineer liquidity before the true move."
      }
    },
    killzonePM: {
      key: 'ny_pm_killzone',
      name: "NY PM Killzone",
      range: [17, 19],
      color: "hsl(0, 60%, 55%)",
      opacity: 0.6,
      tooltip: {
        title: "NY PM Killzone",
        volatility: "Medium",
        bestPairs: "USD Majors",
        strategy: "Often a period of reversal or retracement as the London session closes and profit-taking occurs."
      }
    },
  },
];