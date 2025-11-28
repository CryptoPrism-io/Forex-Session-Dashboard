import { useEffect, useRef } from 'react';

interface KeyboardShortcutHandlers {
  onFocusChart?: () => void;
  onFocusCalendar?: () => void;
  onFocusClocks?: () => void;
  onFocusGuide?: () => void;
  onFocusSessions?: () => void;
  onToggleTimezone?: () => void;
  onToggleHelp?: () => void;
  onEscape?: () => void;
}

/**
 * Custom hook for keyboard shortcuts in desktop bento grid layout
 *
 * Shortcuts:
 * - T: Focus Session Timeline Chart
 * - C: Focus Economic Calendar
 * - K: Focus Session Clocks
 * - G: Focus Session Guide
 * - S: Focus Active Sessions sidebar
 * - Z: Toggle Timezone selector
 * - ?: Show keyboard shortcuts help
 * - Esc: Blur current focus
 */
export const useKeyboardShortcuts = (
  enabled: boolean,
  handlers: KeyboardShortcutHandlers
) => {
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for modifier keys - ignore if Ctrl/Cmd/Alt are pressed
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 't':
          event.preventDefault();
          handlers.onFocusChart?.();
          break;

        case 'c':
          event.preventDefault();
          handlers.onFocusCalendar?.();
          break;

        case 'k':
          event.preventDefault();
          handlers.onFocusClocks?.();
          break;

        case 'g':
          event.preventDefault();
          handlers.onFocusGuide?.();
          break;

        case 's':
          event.preventDefault();
          handlers.onFocusSessions?.();
          break;

        case 'z':
          event.preventDefault();
          handlers.onToggleTimezone?.();
          break;

        case '?':
          event.preventDefault();
          handlers.onToggleHelp?.();
          break;

        case 'escape':
          event.preventDefault();
          // Call custom escape handler if provided (e.g., exit fullscreen)
          if (handlers.onEscape) {
            handlers.onEscape();
          }
          // Blur current focused element
          if (document.activeElement instanceof HTMLElement) {
            lastFocusedElement.current = document.activeElement;
            document.activeElement.blur();
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handlers]);

  return {
    lastFocusedElement: lastFocusedElement.current,
  };
};
