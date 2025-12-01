import { useMemo } from 'react';
import { ProcessedEvent } from '../types';

/**
 * Categorize an economic event based on keywords in its name
 * Returns an array of categories that apply to this event
 */
export function categorizeEvent(eventName: string): string[] {
  const categories: string[] = [];
  const name = eventName.toLowerCase();

  // Inflation-related
  if (name.includes('cpi') || name.includes('inflation') || name.includes('pce') || name.includes('ppi')) {
    categories.push('Inflation');
  }

  // GDP & Economic Growth
  if (name.includes('gdp') || name.includes('growth') || name.includes('economic') && !name.includes('calendar')) {
    categories.push('GDP & Growth');
  }

  // Employment & Labor Market
  if (
    name.includes('employment') ||
    name.includes('jobs') ||
    name.includes('nfp') ||
    name.includes('payroll') ||
    name.includes('unemployment') ||
    name.includes('labor') ||
    name.includes('jobless')
  ) {
    categories.push('Employment');
  }

  // Interest Rates & Monetary Policy
  if (
    name.includes('rate') && !name.includes('unemployment') ||
    name.includes('interest') ||
    name.includes('policy') ||
    name.includes('fed') && name.includes('rate') ||
    name.includes('fomc')
  ) {
    categories.push('Interest Rate');
  }

  // Retail & Consumer Spending
  if (
    name.includes('retail') ||
    name.includes('sales') && !name.includes('house') ||
    name.includes('consumer') && (name.includes('spending') || name.includes('confidence'))
  ) {
    categories.push('Retail & Sales');
  }

  // Manufacturing & Industrial
  if (
    name.includes('pmi') ||
    name.includes('manufacturing') ||
    name.includes('industrial') ||
    name.includes('factory') ||
    name.includes('ism')
  ) {
    categories.push('Manufacturing');
  }

  // Central Bank Communications
  if (
    name.includes('speech') ||
    name.includes('testimony') ||
    name.includes('statement') ||
    name.includes('minutes') ||
    name.includes('governor') ||
    name.includes('chairman') ||
    name.includes('president') && (name.includes('fed') || name.includes('ecb') || name.includes('boe'))
  ) {
    categories.push('Central Bank');
  }

  // Trade & Balance
  if (
    name.includes('trade') ||
    name.includes('balance') && !name.includes('sheet') ||
    name.includes('export') ||
    name.includes('import')
  ) {
    categories.push('Trade Balance');
  }

  // Housing Market
  if (
    name.includes('housing') ||
    name.includes('house') && (name.includes('price') || name.includes('sales') || name.includes('start')) ||
    name.includes('mortgage') ||
    name.includes('building')
  ) {
    categories.push('Housing');
  }

  // Business Sentiment & Surveys
  if (
    name.includes('sentiment') ||
    name.includes('confidence') && !name.includes('consumer') ||
    name.includes('survey') ||
    name.includes('outlook') ||
    name.includes('expectations')
  ) {
    categories.push('Business Sentiment');
  }

  // If no categories matched, assign to "Other"
  if (categories.length === 0) {
    categories.push('Other');
  }

  return categories;
}

/**
 * Extract unique event types from calendar data
 *
 * @param events - Array of economic calendar events
 * @returns Sorted array of unique event type categories
 *
 * @example
 * ```tsx
 * const events = [
 *   { event: "US CPI Data", ... },
 *   { event: "Fed Chair Speech", ... }
 * ];
 * const eventTypes = useEventTypes(events);
 * // Returns: ["Central Bank", "Inflation"]
 * ```
 */
export function useEventTypes(events: ProcessedEvent[]): string[] {
  return useMemo(() => {
    const typesSet = new Set<string>();

    events.forEach(event => {
      if (event.event) {
        const categories = categorizeEvent(event.event);
        categories.forEach(category => typesSet.add(category));
      }
    });

    // Convert to array and sort alphabetically
    return Array.from(typesSet).sort();
  }, [events]);
}

/**
 * Check if an event belongs to any of the selected types
 *
 * @param event - Event to check
 * @param selectedTypes - Array of selected event type categories
 * @returns true if event matches any selected type
 *
 * @example
 * ```tsx
 * const matches = eventMatchesTypes(
 *   { event: "US CPI Data" },
 *   ["Inflation", "Employment"]
 * );
 * // Returns: true (CPI Data is categorized as "Inflation")
 * ```
 */
export function eventMatchesTypes(
  event: ProcessedEvent,
  selectedTypes: string[]
): boolean {
  if (!event.event || selectedTypes.length === 0) {
    return true; // Show all if no filter
  }

  const eventCategories = categorizeEvent(event.event);
  return selectedTypes.some(type => eventCategories.includes(type));
}
