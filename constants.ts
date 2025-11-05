import { Timezone, SessionData } from './types';

export const TIMEZONES: Timezone[] = [
  // === MAJOR FOREX TIMEZONES (Quick Select) ===
  { label: "UTC", offset: 0 },
  { label: "GMT", offset: 0 },
  { label: "EST", offset: -5 },

  // === EUROPE ===
  { label: "WET", offset: 0 },      // Western European Time
  { label: "WEST", offset: 1 },     // Western European Summer Time
  { label: "CET", offset: 1 },      // Central European Time
  { label: "CEST", offset: 2 },     // Central European Summer Time
  { label: "EET", offset: 2 },      // Eastern European Time
  { label: "EEST", offset: 3 },     // Eastern European Summer Time
  { label: "BST", offset: 1 },      // British Summer Time
  { label: "IST", offset: 5.5 },    // Irish Standard Time
  { label: "MSK", offset: 3 },      // Moscow Standard Time

  // === ASIA - EAST ===
  { label: "JST", offset: 9 },      // Japan Standard Time
  { label: "KST", offset: 9 },      // Korea Standard Time
  { label: "CST", offset: 8 },      // China Standard Time
  { label: "HKT", offset: 8 },      // Hong Kong Time
  { label: "SGT", offset: 8 },      // Singapore Standard Time
  { label: "MYT", offset: 8 },      // Malaysia Time
  { label: "PHT", offset: 8 },      // Philippine Time
  { label: "WIB", offset: 7 },      // Western Indonesia Time
  { label: "ICT", offset: 7 },      // Indochina Time (Thailand, Cambodia, Laos)
  { label: "WITA", offset: 8 },     // Central Indonesia Time
  { label: "WIT", offset: 9 },      // Eastern Indonesia Time

  // === ASIA - SOUTH & CENTRAL ===
  { label: "IST", offset: 5.5 },    // Indian Standard Time
  { label: "PKT", offset: 5 },      // Pakistan Standard Time
  { label: "BDT", offset: 6 },      // Bangladesh Standard Time
  { label: "THA", offset: 7 },      // Thailand Time
  { label: "AEST", offset: 10 },    // Australian Eastern Standard Time

  // === AMERICAS - NORTH ===
  { label: "PST", offset: -8 },     // Pacific Standard Time
  { label: "PDT", offset: -7 },     // Pacific Daylight Time
  { label: "MST", offset: -7 },     // Mountain Standard Time
  { label: "MDT", offset: -6 },     // Mountain Daylight Time
  { label: "CST", offset: -6 },     // Central Standard Time (US)
  { label: "CDT", offset: -5 },     // Central Daylight Time
  { label: "EST", offset: -5 },     // Eastern Standard Time
  { label: "EDT", offset: -4 },     // Eastern Daylight Time

  // === AMERICAS - CENTRAL ===
  { label: "CST(MX)", offset: -6 }, // Central Standard Time (Mexico)
  { label: "CDMX", offset: -6 },    // Mexico City Time

  // === AMERICAS - SOUTH ===
  { label: "VET", offset: -4 },     // Venezuela Time
  { label: "ART", offset: -3 },     // Argentina Time
  { label: "BRT", offset: -3 },     // Brasília Time
  { label: "BRST", offset: -2 },    // Brasília Summer Time
  { label: "PET", offset: -5 },     // Peru Time
  { label: "CLT", offset: -3 },     // Chile Standard Time
  { label: "CLST", offset: -2 },    // Chile Summer Time

  // === AFRICA ===
  { label: "WET", offset: 0 },      // West Africa Time
  { label: "WAT", offset: 1 },      // West Africa Time
  { label: "CAT", offset: 2 },      // Central Africa Time
  { label: "EAT", offset: 3 },      // East Africa Time
  { label: "SAST", offset: 2 },     // South Africa Standard Time

  // === MIDDLE EAST ===
  { label: "AST", offset: 3 },      // Arabia Standard Time
  { label: "GST", offset: 4 },      // Gulf Standard Time
  { label: "IRST", offset: 3.5 },   // Iran Standard Time
  { label: "IST(IL)", offset: 2 },  // Israel Standard Time
  { label: "EEST(EG)", offset: 3 }, // Egypt Time

  // === OCEANIA ===
  { label: "AWST", offset: 8 },     // Australian Western Standard Time
  { label: "ACST", offset: 9.5 },   // Australian Central Standard Time
  { label: "ACSST", offset: 10.5 }, // Australian Central Summer Time
  { label: "AEST", offset: 10 },    // Australian Eastern Standard Time
  { label: "AEDT", offset: 11 },    // Australian Eastern Daylight Time
  { label: "NZST", offset: 12 },    // New Zealand Standard Time
  { label: "NZDT", offset: 13 },    // New Zealand Daylight Time
  { label: "FJST", offset: 13 },    // Fiji Time
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