import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Animation preferences context for managing global animation settings
 * and respecting user accessibility preferences (prefers-reduced-motion)
 */

interface AnimationContextValue {
  /** Whether the user has requested reduced motion via OS/browser settings */
  prefersReducedMotion: boolean;
  /** Global animation enabled state (can be toggled by user preference) */
  animationEnabled: boolean;
  /** Setter for animation enabled state */
  setAnimationEnabled: (enabled: boolean) => void;
}

const AnimationContext = createContext<AnimationContextValue | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

/**
 * Provides animation preferences to all child components
 * Automatically detects and respects prefers-reduced-motion media query
 */
export function AnimationProvider({ children }: AnimationProviderProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  useEffect(() => {
    // Check for prefers-reduced-motion media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
      // Automatically disable animations if user prefers reduced motion
      if (event.matches) {
        setAnimationEnabled(false);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return (
    <AnimationContext.Provider
      value={{
        prefersReducedMotion,
        animationEnabled: animationEnabled && !prefersReducedMotion,
        setAnimationEnabled,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

/**
 * Hook to access animation preferences
 * @throws Error if used outside AnimationProvider
 * @returns AnimationContextValue with animation preferences
 *
 * @example
 * ```tsx
 * const { prefersReducedMotion, animationEnabled } = useAnimation();
 *
 * <motion.div
 *   animate={{ opacity: 1 }}
 *   transition={{ duration: animationEnabled ? 0.3 : 0 }}
 * />
 * ```
 */
export function useAnimation(): AnimationContextValue {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
}

/**
 * HOC to wrap components with animation preferences
 * @param Component - Component to wrap
 * @returns Wrapped component with animation context
 */
export function withAnimation<P extends object>(
  Component: React.ComponentType<P & AnimationContextValue>
) {
  return function AnimatedComponent(props: P) {
    const animationContext = useAnimation();
    return <Component {...props} {...animationContext} />;
  };
}
