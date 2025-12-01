import { useEffect, useState } from 'react';

/**
 * Custom hook to detect if the user prefers reduced motion
 * Respects the OS/browser accessibility setting: prefers-reduced-motion
 *
 * Use this for components that need to conditionally disable animations
 * without using the full AnimationContext.
 *
 * @returns boolean - true if user prefers reduced motion, false otherwise
 *
 * @example
 * ```tsx
 * import { motion } from 'framer-motion';
 *
 * function MyComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       initial={{ opacity: 0 }}
 *       animate={{ opacity: 1 }}
 *       transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Disable animations entirely for reduced motion users
 * const prefersReducedMotion = useReducedMotion();
 *
 * if (prefersReducedMotion) {
 *   return <div className="static-content">{content}</div>;
 * }
 *
 * return <motion.div animate={{ x: 100 }}>{content}</motion.div>;
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value based on current media query state
    setPrefersReducedMotion(mediaQuery.matches);

    // Create event handler for media query changes
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers (Safari < 14, older Edge)
      // @ts-ignore - deprecated API but needed for older browsers
      mediaQuery.addListener(handleChange);
      // @ts-ignore
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Utility function to get animation duration based on reduced motion preference
 * Returns 0 if reduced motion is enabled, otherwise returns the specified duration
 *
 * @param duration - Desired animation duration in seconds
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns number - Duration (0 if reduced motion, original duration otherwise)
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 *
 * <motion.div
 *   animate={{ opacity: 1 }}
 *   transition={{ duration: getAnimationDuration(0.3, reducedMotion) }}
 * />
 * ```
 */
export function getAnimationDuration(duration: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : duration;
}

/**
 * Utility function to get Framer Motion transition config respecting reduced motion
 *
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Framer Motion transition config object
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 *
 * <motion.div
 *   initial={{ opacity: 0, y: 20 }}
 *   animate={{ opacity: 1, y: 0 }}
 *   transition={getMotionTransition(reducedMotion)}
 * />
 * ```
 */
export function getMotionTransition(reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0 };
  }

  return {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  };
}
