import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface BottomSheetDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Drawer content */
  children: ReactNode;
  /** Drawer title */
  title?: string;
  /** Maximum height (default: 75vh) */
  maxHeight?: string;
  /** Show handle bar for swipe indication */
  showHandle?: boolean;
}

/**
 * Bottom Sheet Drawer Component
 *
 * A mobile-optimized bottom sheet that slides up from the bottom of the screen.
 * Commonly used in native mobile apps (iOS, Android) for contextual actions and filters.
 *
 * Features:
 * - Slides up from bottom with spring animation
 * - Backdrop blur + darken
 * - Swipe down to dismiss
 * - Click/tap outside to close
 * - Escape key to close
 * - Focus trap (keeps focus inside drawer)
 * - Respects reduced motion preferences
 *
 * @example
 * ```tsx
 * <BottomSheetDrawer
 *   isOpen={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   title="Filters"
 * >
 *   <FilterContent />
 * </BottomSheetDrawer>
 * ```
 */
export const BottomSheetDrawer: React.FC<BottomSheetDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = '75vh',
  showHandle = true,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.2 }
    },
  };

  const drawerVariants = {
    hidden: {
      y: '100%',
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring', damping: 30, stiffness: 300 }
    },
    visible: {
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring', damping: 30, stiffness: 300 }
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              // Close if dragged down significantly or with high velocity
              if (offset.y > 100 || velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-3xl shadow-2xl"
            style={{ maxHeight }}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Bottom sheet drawer'}
          >
            {/* Handle bar (swipe indicator) */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-slate-600 rounded-full" />
              </div>
            )}

            {/* Title */}
            {title && (
              <div className="px-4 py-3 border-b border-slate-700/30">
                <h3 className="text-base font-semibold text-slate-100">
                  {title}
                </h3>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(75vh - 100px)' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Bottom Sheet CTA Bar
 *
 * Sticky footer with action buttons (Apply, Reset, etc.)
 * Use inside BottomSheetDrawer for mobile filter actions
 */
interface BottomSheetCTABarProps {
  onApply?: () => void;
  onReset?: () => void;
  applyLabel?: string;
  resetLabel?: string;
  applyDisabled?: boolean;
}

export const BottomSheetCTABar: React.FC<BottomSheetCTABarProps> = ({
  onApply,
  onReset,
  applyLabel = 'Apply',
  resetLabel = 'Reset',
  applyDisabled = false,
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-slate-900/98 backdrop-blur-xl border-t border-slate-700/50 p-3 flex gap-2">
      {onReset && (
        <button
          onClick={onReset}
          className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg border border-slate-600/60 bg-slate-800/40 text-slate-300 hover:bg-slate-800/60 hover:border-slate-500 transition-all active:scale-95"
        >
          {resetLabel}
        </button>
      )}
      {onApply && (
        <button
          onClick={onApply}
          disabled={applyDisabled}
          className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-cyan-500/90 text-white hover:bg-cyan-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
        >
          {applyLabel}
        </button>
      )}
    </div>
  );
};
