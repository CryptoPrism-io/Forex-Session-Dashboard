import { useState, useEffect, useMemo } from 'react';

/**
 * Breakpoint constants matching Tailwind defaults + custom tablet
 * - sm: 640px  (large phones)
 * - md: 768px  (iPad portrait, small tablets)
 * - lg: 1024px (iPad landscape, desktop)
 * - xl: 1280px (large desktop)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,      // iPad portrait
  lg: 1024,     // iPad landscape / Desktop
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface ViewportInfo {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isMobile: boolean;      // < 768px
  isTablet: boolean;      // 768px - 1023px
  isDesktop: boolean;     // >= 1024px
  isTabletPortrait: boolean;   // 768px-1023px + portrait
  isTabletLandscape: boolean;  // 768px-1023px + landscape (rare, usually becomes desktop)
  isLandscape: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Hook to get current viewport information with orientation detection
 * Updates on window resize and orientation change
 */
export function useViewport(): ViewportInfo {
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return useMemo(() => {
    const { width, height } = dimensions;
    const orientation: 'portrait' | 'landscape' = height >= width ? 'portrait' : 'landscape';
    const isLandscape = orientation === 'landscape';

    // Device type detection
    const isMobile = width < BREAKPOINTS.md;
    const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
    const isDesktop = width >= BREAKPOINTS.lg;

    // Tablet orientation variants
    const isTabletPortrait = isTablet && !isLandscape;
    const isTabletLandscape = isTablet && isLandscape;

    // Current breakpoint
    let breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'xs';
    if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
    else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
    else if (width >= BREAKPOINTS.md) breakpoint = 'md';
    else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';

    return {
      width,
      height,
      orientation,
      isMobile,
      isTablet,
      isDesktop,
      isTabletPortrait,
      isTabletLandscape,
      isLandscape,
      breakpoint,
    };
  }, [dimensions]);
}

/**
 * Hook to check if current viewport matches a media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Get responsive value based on current breakpoint
 * Example: getResponsiveValue({ xs: 12, md: 14, lg: 16 }, 'md') => 14
 */
export function getResponsiveValue<T>(
  values: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', T>>,
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
): T | undefined {
  const breakpointOrder: ('xs' | 'sm' | 'md' | 'lg' | 'xl')[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  // Find the largest defined breakpoint <= current
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }

  return undefined;
}

/**
 * Minimum touch target size for accessibility (44px per WCAG 2.1)
 */
export const TOUCH_TARGET_MIN = 44;

/**
 * Check if touch target meets accessibility requirements
 */
export function isTouchTargetValid(width: number, height: number): boolean {
  return width >= TOUCH_TARGET_MIN && height >= TOUCH_TARGET_MIN;
}
