import { Timezone, SessionData } from './types';

export const TIMEZONES: Timezone[] = [
  // === MAJOR FOREX TIMEZONES (Quick Select) ===
  { label: "UTC", offset: 0, ianaTimezone: "UTC" },
  { label: "GMT", offset: 0, ianaTimezone: "UTC" },
  { label: "EST", offset: -5, ianaTimezone: "America/New_York" },

  // === EUROPE ===
  { label: "WET", offset: 0, ianaTimezone: "Europe/London" },      // Western European Time
  { label: "WEST", offset: 1, ianaTimezone: "Europe/London" },     // Western European Summer Time
  { label: "CET", offset: 1, ianaTimezone: "Europe/Paris" },      // Central European Time
  { label: "CEST", offset: 2, ianaTimezone: "Europe/Paris" },     // Central European Summer Time
  { label: "EET", offset: 2, ianaTimezone: "Europe/Athens" },      // Eastern European Time
  { label: "EEST", offset: 3, ianaTimezone: "Europe/Athens" },     // Eastern European Summer Time
  { label: "BST", offset: 1, ianaTimezone: "Europe/London" },      // British Summer Time
  { label: "IST (UTC+0)", offset: 0, ianaTimezone: "Europe/Dublin" },    // Irish Standard Time
  { label: "MSK", offset: 3, ianaTimezone: "Europe/Moscow" },      // Moscow Standard Time

  // === ASIA - EAST ===
  { label: "JST", offset: 9, ianaTimezone: "Asia/Tokyo" },      // Japan Standard Time
  { label: "KST", offset: 9, ianaTimezone: "Asia/Seoul" },      // Korea Standard Time
  { label: "CST (UTC+8)", offset: 8, ianaTimezone: "Asia/Shanghai" },      // China Standard Time
  { label: "HKT", offset: 8, ianaTimezone: "Asia/Hong_Kong" },      // Hong Kong Time
  { label: "SGT", offset: 8, ianaTimezone: "Asia/Singapore" },      // Singapore Standard Time
  { label: "MYT", offset: 8, ianaTimezone: "Asia/Kuala_Lumpur" },      // Malaysia Time
  { label: "PHT", offset: 8, ianaTimezone: "Asia/Manila" },      // Philippine Time
  { label: "WIB", offset: 7, ianaTimezone: "Asia/Jakarta" },      // Western Indonesia Time
  { label: "ICT", offset: 7, ianaTimezone: "Asia/Bangkok" },      // Indochina Time (Thailand, Cambodia, Laos)
  { label: "WITA", offset: 8, ianaTimezone: "Asia/Makassar" },     // Central Indonesia Time
  { label: "WIT", offset: 9, ianaTimezone: "Asia/Jayapura" },      // Eastern Indonesia Time

  // === ASIA - SOUTH & CENTRAL ===
  { label: "IST (UTC+5:30)", offset: 5.5, ianaTimezone: "Asia/Kolkata" },    // Indian Standard Time
  { label: "PKT", offset: 5, ianaTimezone: "Asia/Karachi" },      // Pakistan Standard Time
  { label: "BDT", offset: 6, ianaTimezone: "Asia/Dhaka" },      // Bangladesh Standard Time
  { label: "THA", offset: 7, ianaTimezone: "Asia/Bangkok" },      // Thailand Time

  // === AMERICAS - NORTH ===
  { label: "PST", offset: -8, ianaTimezone: "America/Los_Angeles" },     // Pacific Standard Time
  { label: "PDT", offset: -7, ianaTimezone: "America/Los_Angeles" },     // Pacific Daylight Time
  { label: "MST", offset: -7, ianaTimezone: "America/Denver" },     // Mountain Standard Time
  { label: "MDT", offset: -6, ianaTimezone: "America/Denver" },     // Mountain Daylight Time
  { label: "CST (UTC-6)", offset: -6, ianaTimezone: "America/Chicago" },     // Central Standard Time (US)
  { label: "CDT", offset: -5, ianaTimezone: "America/Chicago" },     // Central Daylight Time
  { label: "EST", offset: -5, ianaTimezone: "America/New_York" },     // Eastern Standard Time
  { label: "EDT", offset: -4, ianaTimezone: "America/New_York" },     // Eastern Daylight Time

  // === AMERICAS - CENTRAL ===
  { label: "CST(MX)", offset: -6, ianaTimezone: "America/Mexico_City" }, // Central Standard Time (Mexico)
  { label: "CDMX", offset: -6, ianaTimezone: "America/Mexico_City" },    // Mexico City Time

  // === AMERICAS - SOUTH ===
  { label: "VET", offset: -4, ianaTimezone: "America/Caracas" },     // Venezuela Time
  { label: "ART", offset: -3, ianaTimezone: "America/Argentina/Buenos_Aires" },     // Argentina Time
  { label: "BRT", offset: -3, ianaTimezone: "America/Sao_Paulo" },     // Brasília Time
  { label: "BRST", offset: -2, ianaTimezone: "America/Sao_Paulo" },    // Brasília Summer Time
  { label: "PET", offset: -5, ianaTimezone: "America/Lima" },     // Peru Time
  { label: "CLT", offset: -3, ianaTimezone: "America/Santiago" },     // Chile Standard Time
  { label: "CLST", offset: -2, ianaTimezone: "America/Santiago" },    // Chile Summer Time

  // === AFRICA ===
  { label: "WAT", offset: 1, ianaTimezone: "Africa/Lagos" },      // West Africa Time
  { label: "CAT", offset: 2, ianaTimezone: "Africa/Harare" },      // Central Africa Time
  { label: "EAT", offset: 3, ianaTimezone: "Africa/Nairobi" },      // East Africa Time
  { label: "SAST", offset: 2, ianaTimezone: "Africa/Johannesburg" },     // South Africa Standard Time

  // === MIDDLE EAST ===
  { label: "AST", offset: 3, ianaTimezone: "Asia/Riyadh" },      // Arabia Standard Time
  { label: "GST", offset: 4, ianaTimezone: "Asia/Dubai" },      // Gulf Standard Time
  { label: "IRST", offset: 3.5, ianaTimezone: "Asia/Tehran" },   // Iran Standard Time
  { label: "IST(IL)", offset: 2, ianaTimezone: "Asia/Jerusalem" },  // Israel Standard Time
  { label: "EEST(EG)", offset: 3, ianaTimezone: "Africa/Cairo" }, // Egypt Time

  // === OCEANIA ===
  { label: "AWST", offset: 8, ianaTimezone: "Australia/Perth" },     // Australian Western Standard Time
  { label: "ACST", offset: 9.5, ianaTimezone: "Australia/Adelaide" },   // Australian Central Standard Time
  { label: "ACSST", offset: 10.5, ianaTimezone: "Australia/Adelaide" }, // Australian Central Summer Time
  { label: "AEST", offset: 10, ianaTimezone: "Australia/Sydney" },    // Australian Eastern Standard Time
  { label: "AEDT", offset: 11, ianaTimezone: "Australia/Sydney" },    // Australian Eastern Daylight Time
  { label: "NZST", offset: 12, ianaTimezone: "Pacific/Auckland" },    // New Zealand Standard Time
  { label: "NZDT", offset: 13, ianaTimezone: "Pacific/Auckland" },    // New Zealand Daylight Time
  { label: "FJST", offset: 13, ianaTimezone: "Pacific/Fiji" },    // Fiji Time
];

// Major forex trading timezones for dropdown (8-10 most important)
export const MAJOR_TIMEZONES: Timezone[] = [
  { label: "JST", offset: 9, ianaTimezone: "Asia/Tokyo" },      // Japan Standard Time
  { label: "HKT", offset: 8, ianaTimezone: "Asia/Hong_Kong" },  // Hong Kong Time
  { label: "SGT", offset: 8, ianaTimezone: "Asia/Singapore" },  // Singapore Standard Time
  { label: "CET", offset: 1, ianaTimezone: "Europe/Paris" },    // Central European Time
  { label: "BST", offset: 1, ianaTimezone: "Europe/London" },   // British Summer Time
  { label: "MSK", offset: 3, ianaTimezone: "Europe/Moscow" },   // Moscow Standard Time
  { label: "EST", offset: -5, ianaTimezone: "America/New_York" },    // Eastern Standard Time
  { label: "PST", offset: -8, ianaTimezone: "America/Los_Angeles" }, // Pacific Standard Time
  { label: "AEST", offset: 10, ianaTimezone: "Australia/Sydney" },   // Australian Eastern Standard Time
  { label: "NZST", offset: 12, ianaTimezone: "Pacific/Auckland" },   // New Zealand Standard Time
];

// Standard Time Session Ranges (Winter: no DST)
export const SESSIONS_STANDARD: SessionData[] = [
  {
    name: "Sydney",
    main: {
      key: 'sydney_session',
      name: "Sydney Session",
      range: [21, 30], // 9pm to 6am UTC (standard time)
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
      range: [23, 32], // 11pm to 8am UTC (no DST in Japan)
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
      range: [8, 17], // 8am to 5pm UTC (GMT, no daylight saving)
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
      range: [8, 9],
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
      range: [7, 10],
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
      range: [13, 22], // 1pm to 10pm UTC (EST, UTC-5)
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
      range: [13, 17],
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
      range: [12, 15],
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
      range: [18, 20],
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

// Daylight Saving Time Session Ranges (Summer: DST active)
export const SESSIONS_DAYLIGHT: SessionData[] = [
  {
    name: "Sydney",
    main: {
      key: 'sydney_session',
      name: "Sydney Session",
      range: [20, 29], // 8pm to 5am UTC (AEDT, UTC+11)
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
      range: [23, 32], // 11pm to 8am UTC (JST, no DST)
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
      range: [7, 16], // 7am to 4pm UTC (BST, UTC+1)
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
      range: [12, 21], // 12pm to 9pm UTC (EDT, UTC-4)
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

// Default to standard time (will be overridden by App based on DST status)
export const SESSIONS: SessionData[] = SESSIONS_STANDARD;

// Session-to-Pairs Mapping for "Pairs to Trade" component
export const SESSION_PAIRS_MAP: Record<string, string[]> = {
  'Sydney': ['AUD/USD', 'AUD/JPY', 'NZD/USD', 'AUD/NZD'],
  'Asia': ['USD/JPY', 'GBP/JPY', 'AUD/JPY', 'EUR/JPY', 'USD/CNH'],
  'London': ['EUR/USD', 'GBP/USD', 'EUR/GBP', 'GBP/JPY', 'EUR/JPY'],
  'New York': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'US30', 'NAS100'],
  'New York Session': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CAD', 'US30', 'NAS100'],
  'London-NY Overlap': ['EUR/USD', 'GBP/USD', 'USD/JPY'],
  'London Killzone': ['EUR/USD', 'GBP/USD'],
  'NY AM Killzone': ['EUR/USD', 'GBP/USD', 'US30', 'NAS100'],
  'NY PM Killzone': ['USD/JPY', 'EUR/USD'],
  'Asia-London Overlap': ['EUR/JPY', 'GBP/JPY', 'EUR/GBP'],
  'Sydney-Asia Overlap': ['AUD/JPY', 'NZD/JPY', 'USD/JPY'],
};