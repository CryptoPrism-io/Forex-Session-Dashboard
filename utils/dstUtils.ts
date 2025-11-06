/**
 * Daylight Saving Time Detection and Management
 *
 * Determines whether major forex trading centers are observing DST
 * and adjusts session times accordingly.
 */

/**
 * Check if a given date is within the US DST period
 * US DST: 2nd Sunday in March to 1st Sunday in November
 */
export const isUSDST = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Before March or after November
  if (month < 2 || month > 10) return false;

  // December-February is definitely not DST
  if (month === 0 || month === 1) return false;

  // November: DST ends on 1st Sunday
  if (month === 10) {
    return day < 8 || (day <= 14 && dayOfWeek !== 0) || (day > 14 && dayOfWeek !== 0 && day < 7);
  }

  // March: DST starts on 2nd Sunday
  if (month === 2) {
    return day > 7 && (dayOfWeek === 0 || day > 14);
  }

  // April-October: always DST
  return true;
};

/**
 * Check if a given date is within the UK/Europe DST period
 * UK/EU DST: Last Sunday in March to Last Sunday in October
 */
export const isEuropeDST = (date: Date): boolean => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  // Before March or after October
  if (month < 2 || month > 9) return false;

  // January-February is definitely not DST
  if (month === 0 || month === 1) return false;

  // October: DST ends on last Sunday
  if (month === 9) {
    // Find the last Sunday of October
    const lastDay = new Date(year, 10, 0).getDate(); // Get last day of October
    const lastSunday = lastDay - new Date(year, 9, lastDay).getDay();
    return day < lastSunday;
  }

  // March: DST starts on last Sunday
  if (month === 2) {
    // Find the last Sunday of March
    const lastDay = new Date(year, 3, 0).getDate(); // Get last day of March
    const lastSunday = lastDay - new Date(year, 2, lastDay).getDay();
    return day > lastSunday;
  }

  // April-September: always DST
  return true;
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
