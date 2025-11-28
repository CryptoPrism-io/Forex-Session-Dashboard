import React, { lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { IconX } from './icons';

const SessionGuide = lazy(() => import('./SessionGuide'));

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimezoneLabel: string;
  timezoneOffset: number;
}

const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  currentTimezoneLabel,
  timezoneOffset,
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

  // Prevent body scroll when modal is open
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

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.2, type: 'tween' }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.15, type: 'tween' }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-6xl max-h-[90vh] glass-soft rounded-3xl shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30 flex-shrink-0">
              <h2
                id="help-modal-title"
                className="text-xl font-bold text-slate-100"
              >
                Trading Sessions Guide
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-700/20 border border-slate-700/40 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600/60 hover:text-red-400 transition-all duration-200"
                aria-label="Close help modal"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="text-sm text-slate-400">Loading guide...</div>
                  </div>
                }
              >
                <SessionGuide
                  currentTimezoneLabel={currentTimezoneLabel}
                  timezoneOffset={timezoneOffset}
                />
              </Suspense>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HelpGuideModal;
