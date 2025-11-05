import { useRef, useState, useEffect } from 'react';

interface Position {
  top: number;
  right: number;
  placement: 'below' | 'above';
}

const MENU_HEIGHT = 260; // Approximate height of the menu in pixels
const BUFFER = 20; // Pixel buffer from viewport edges

/**
 * Custom hook for smart popover positioning with collision detection
 * Automatically flips popover above if there's not enough space below
 */
export const usePopoverPosition = () => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ top: 0, right: 0, placement: 'below' });

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Determine placement based on available space
    const shouldPlaceAbove = spaceBelow < MENU_HEIGHT + BUFFER && spaceAbove > MENU_HEIGHT + BUFFER;

    if (shouldPlaceAbove) {
      // Position menu above the trigger
      setPosition({
        top: triggerRect.top - MENU_HEIGHT - 8, // 8px gap
        right: window.innerWidth - triggerRect.right,
        placement: 'above',
      });
    } else {
      // Position menu below the trigger (default)
      setPosition({
        top: triggerRect.bottom + 8, // 8px gap
        right: window.innerWidth - triggerRect.right,
        placement: 'below',
      });
    }
  };

  // Update position when menu opens and on window resize
  useEffect(() => {
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);

  // Re-calculate position when dependencies change
  useEffect(() => {
    updatePosition();
  }, [triggerRef]);

  return {
    triggerRef,
    position,
    placement: position.placement,
  };
};
