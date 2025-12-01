/**
 * Daylight Saving Time Detection and Management
 *
 * Determines whether major forex trading centers are observing DST
 * and adjusts session times accordingly.
 */

const normalizeToStartOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, occurrence: number): Date => {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (occurrence - 1) * 7;
  return new Date(year, month, day);
};

const getLastWeekdayOfMonth = (year: number, month: number, weekday: number): Date => {
  const lastOfMonth = new Date(year, month + 1, 0);
  const lastWeekday = lastOfMonth.getDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  const day = lastOfMonth.getDate() - offset;
  return new Date(year, month, day);
};

/**
 * Check if a given date is within the US DST period
 * US DST: 2nd Sunday in March (inclusive) to 1st Sunday in November (exclusive)
 */
export const isUSDST = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Definitely not DST outside of March-November window
  if (month < 2 || month > 10) return false;

  const currentDay = normalizeToStartOfDay(date);
  const dstStart = getNthWeekdayOfMonth(year, 2, 0, 2); // 2nd Sunday in March
  const dstEnd = getNthWeekdayOfMonth(year, 10, 0, 1); // 1st Sunday in November

  return currentDay >= dstStart && currentDay < dstEnd;
};

/**
 * Check if a given date is within the UK/Europe DST period
 * UK/EU DST: Last Sunday in March (inclusive) to Last Sunday in October (exclusive)
 */
export const isEuropeDST = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Definitely not DST outside of March-October window
  if (month < 2 || month > 9) return false;

  const currentDay = normalizeToStartOfDay(date);
  const dstStart = getLastWeekdayOfMonth(year, 2, 0); // Last Sunday in March
  const dstEnd = getLastWeekdayOfMonth(year, 9, 0); // Last Sunday in October

  return currentDay >= dstStart && currentDay < dstEnd;
};

/**
 * Check if a given date is within the Australian DST period
 * Australia DST: 1st Sunday in October to 1st Sunday in April
 */
export const isAustraliaDST = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // DST runs October to April (crosses calendar year)
  // October onwards: DST starts on 1st Sunday
  if (month >= 9) {
    return month === 9 ? day >= 8 && dayOfWeek === 0 : true;
  }

  // April: DST ends on 1st Sunday
  if (month === 3) {
    return day < 8 || (day <= 14 && dayOfWeek !== 0);
  }

  // May-September: not DST
  if (month >= 4 && month <= 8) return false;

  // January-March: DST active
  return true;
};

/**
 * Determine if DST is currently active in major forex centers
 * For simplicity, we use the intersection of US and Europe DST periods
 * (this is when both are observing DST simultaneously)
 */
export const isDSTActive = (date: Date = new Date()): boolean => {
  // DST is "active" when BOTH US and Europe are observing DST
  // This is the overlapping period (mid-March to late October)
  return isUSDST(date) && isEuropeDST(date);
};

/**
 * Get the session time offset based on DST status
 * Returns -1 for DST (times shift 1 hour earlier in UTC)
 * Returns 0 for standard time (no offset)
 */
export const getSessionTimeOffset = (isDST: boolean, sessionType: 'london' | 'newyork' | 'sydney' | 'tokyo'): number => {
  if (!isDST) return 0;

  switch (sessionType) {
    case 'london':
      return isEuropeDST(new Date()) ? -1 : 0;
    case 'newyork':
      return isUSDST(new Date()) ? -1 : 0;
    case 'sydney':
      return isAustraliaDST(new Date()) ? -1 : 0;
    case 'tokyo':
      // Japan does not observe DST
      return 0;
    default:
      return 0;
  }
};

/**
 * Calculate session times based on DST status
 * Returns adjusted UTC hour range [start, end]
 */
export const getSessionRange = (
  standardRange: [number, number],
  isDST: boolean,
  sessionType: 'london' | 'newyork' | 'sydney' | 'tokyo'
): [number, number] => {
  const offset = getSessionTimeOffset(isDST, sessionType);

  if (offset === 0) {
    return standardRange;
  }

  // Adjust both start and end times
  let [start, end] = standardRange;
  start += offset;
  end += offset;

  // Normalize times to 0-48 range (handling overnight sessions)
  start = ((start % 48) + 48) % 48;
  end = ((end % 48) + 48) % 48;

  return [start, end];
};
