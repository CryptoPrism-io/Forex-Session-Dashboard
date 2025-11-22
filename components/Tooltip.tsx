import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  TooltipTrigger,
  Tooltip as AriaTooltip,
  OverlayArrow,
  Button,
} from 'react-aria-components';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { TooltipInfo } from '../types';

/**
 * Session Tooltip Content - Displays trading session information
 */
interface SessionTooltipData {
  type: 'session';
  name: string;
  timeRange: string;
  timezoneLabel: string;
  tooltipInfo: TooltipInfo;
}

/**
 * Event Tooltip Content - Displays economic calendar event information
 */
interface EventTooltipData {
  type: 'event';
  impact: string;
  color: string;
  event: string;
  timeUtc: string;
  currency: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

export type TooltipContentData = SessionTooltipData | EventTooltipData;

interface AccessibleTooltipProps {
  /** Content data for the tooltip (session or event) */
  content: TooltipContentData;
  /** Child element that triggers the tooltip (must accept ref and event handlers) */
  children: ReactNode;
  /** Delay before tooltip appears (ms) - defaults to 300ms */
  delay?: number;
  /** React key for list rendering */
  key?: React.Key;
}

/**
 * Unified accessible tooltip component using React Aria
 * Supports both session bar tooltips and economic event tooltips
 *
 * Features:
 * - Automatic ARIA attributes
 * - Keyboard navigation support (Tab + Hover, Escape to close)
 * - Automatic viewport collision detection
 * - Configurable delay (preserves existing 300ms default)
 * - Screen reader support
 *
 * @example
 * ```tsx
 * // Session tooltip
 * <AccessibleTooltip
 *   content={{
 *     type: 'session',
 *     name: 'London Session',
 *     timeRange: '07:00 - 16:00',
 *     timezoneLabel: 'UTC+0',
 *     tooltipInfo: { ... }
 *   }}
 *   delay={300}
 * >
 *   <div>Hover over me</div>
 * </AccessibleTooltip>
 *
 * // Event tooltip
 * <AccessibleTooltip
 *   content={{
 *     type: 'event',
 *     impact: 'high',
 *     color: '#ef4444',
 *     event: 'NFP Release',
 *     timeUtc: '13:30',
 *     currency: 'USD'
 *   }}
 * >
 *   <div>📅</div>
 * </AccessibleTooltip>
 * ```
 */
export function AccessibleTooltip({
  content,
  children,
  delay = 300,
}: AccessibleTooltipProps) {
  const prefersReducedMotion = useReducedMotion();

  // Tooltip animation variants - fade in with gentle scale
  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.15, ease: 'easeOut', type: 'tween' }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.2, ease: 'easeOut', type: 'tween' }
    }
  };

  return (
    <TooltipTrigger
      delay={delay}
      closeDelay={0}
    >
      <Button className="contents">
        {children}
      </Button>
      <AriaTooltip
        offset={10}
        className="
          bg-slate-900/95 backdrop-blur-lg
          border border-slate-700
          rounded-lg shadow-2xl
          text-sm text-slate-200
          z-50
        "
      >
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={tooltipVariants}
          className="p-3"
        >
          <OverlayArrow>
            <svg width={8} height={8} viewBox="0 0 8 8" className="fill-slate-900/95 stroke-slate-700">
              <path d="M0 0 L4 4 L8 0" />
            </svg>
          </OverlayArrow>

          {content.type === 'session' ? (
            <SessionTooltipContent data={content} />
          ) : (
            <EventTooltipContent data={content} />
          )}
        </motion.div>
      </AriaTooltip>
    </TooltipTrigger>
  );
}

/**
 * Session tooltip content component
 */
function SessionTooltipContent({ data }: { data: SessionTooltipData }) {
  return (
    <div className="w-80">
      <h3 className="font-bold text-base text-white mb-2">{data.name}</h3>
      <p className="text-xs text-cyan-300 mb-2">
        <span className="font-semibold">{data.timeRange}</span> {data.timezoneLabel}
      </p>
      <p className="text-xs text-slate-400">
        <strong>Volatility:</strong> {data.tooltipInfo.volatility}
      </p>
      <p className="text-xs text-slate-400">
        <strong>Best Pairs:</strong> {data.tooltipInfo.bestPairs}
      </p>
      <p className="text-xs text-slate-400 pt-2 border-t border-slate-700 mt-2">
        <strong>Strategy:</strong> {data.tooltipInfo.strategy}
      </p>
    </div>
  );
}

/**
 * Event tooltip content component
 */
function EventTooltipContent({ data }: { data: EventTooltipData }) {
  return (
    <div className="w-64">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: data.color,
            boxShadow: `0 0 6px ${data.color}80`,
          }}
        />
        <span className="font-bold text-sm text-white capitalize">
          {data.impact || 'Medium'} Impact
        </span>
      </div>

      <p className="font-semibold text-slate-100 mb-2">{data.event}</p>

      <div className="space-y-1 text-[11px]">
        <p className="text-slate-400">
          <span className="font-semibold">Time (UTC):</span> {data.timeUtc || 'TBD'}
        </p>
        <p className="text-slate-400">
          <span className="font-semibold">Currency:</span> {data.currency || 'N/A'}
        </p>
        {data.forecast && (
          <p className="text-slate-400">
            <span className="font-semibold">Forecast:</span> {data.forecast}
          </p>
        )}
        {data.previous && (
          <p className="text-slate-400">
            <span className="font-semibold">Previous:</span> {data.previous}
          </p>
        )}
        {data.actual && (
          <p className="text-slate-400">
            <span className="font-semibold">Actual:</span> {data.actual}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Simple tooltip wrapper for elements that don't need complex content
 * Just shows plain text on hover
 *
 * @example
 * ```tsx
 * <SimpleTooltip text="Click to toggle view">
 *   <button>Toggle</button>
 * </SimpleTooltip>
 * ```
 */
interface SimpleTooltipProps {
  text: string;
  children: ReactNode;
  delay?: number;
}

export function SimpleTooltip({ text, children, delay = 300 }: SimpleTooltipProps) {
  return (
    <TooltipTrigger delay={delay} closeDelay={0}>
      {children}
      <AriaTooltip
        offset={8}
        className="
          bg-slate-800/95 backdrop-blur
          border border-slate-600
          rounded px-2 py-1
          text-xs text-slate-200
          shadow-lg z-50
          entering:animate-in entering:fade-in entering:duration-200
          exiting:animate-out exiting:fade-out exiting:duration-150
        "
      >
        {text}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
