import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals Reporting Utility
 *
 * Tracks Core Web Vitals and logs them to console in development.
 * In production, these can be sent to analytics.
 *
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift): Target < 0.1
 * - FCP (First Contentful Paint): Target < 1.8s
 * - FID (First Input Delay): Target < 100ms
 * - INP (Interaction to Next Paint): Target < 200ms
 * - LCP (Largest Contentful Paint): Target < 2.5s
 * - TTFB (Time to First Byte): Target < 800ms
 */

const isDev = import.meta.env.DEV;

// Color-coded console output
const getMetricColor = (name: string, value: number): string => {
  const thresholds: Record<string, { good: number; needsImprovement: number }> = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    FID: { good: 100, needsImprovement: 300 },
    INP: { good: 200, needsImprovement: 500 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return '';

  if (value <= threshold.good) return 'color: #10b981; font-weight: bold'; // Green
  if (value <= threshold.needsImprovement) return 'color: #f59e0b; font-weight: bold'; // Amber
  return 'color: #ef4444; font-weight: bold'; // Red
};

const formatValue = (metric: Metric): string => {
  if (metric.name === 'CLS') {
    return metric.value.toFixed(3);
  }
  return `${Math.round(metric.value)}ms`;
};

const logMetric = (metric: Metric) => {
  const color = getMetricColor(metric.name, metric.value);
  const value = formatValue(metric);

  console.log(
    `%c📊 ${metric.name}: %c${value}`,
    'color: #64748b; font-weight: normal',
    color
  );

  // Additional details in dev mode
  if (isDev && metric.entries && metric.entries.length > 0) {
    console.groupCollapsed(`   └─ ${metric.name} details`);
    console.table(metric.entries);
    console.groupEnd();
  }
};

// Send to analytics in production
const sendToAnalytics = (metric: Metric) => {
  // Example: Send to Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    });
  }

  // Example: Send to custom analytics endpoint
  if (!isDev && import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      }),
      keepalive: true,
    }).catch(() => {
      // Fail silently in production
    });
  }
};

const handleMetric = (metric: Metric) => {
  logMetric(metric);
  sendToAnalytics(metric);
};

/**
 * Initialize Web Vitals tracking
 * Call this once in your app's entry point (main.tsx or App.tsx)
 */
export const reportWebVitals = () => {
  onCLS(handleMetric);
  onFCP(handleMetric);
  onFID(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);

  if (isDev) {
    console.log(
      '%c🚀 Web Vitals Tracking Enabled',
      'background: #0ea5e9; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold'
    );
    console.log(
      '%cTargets: CLS < 0.1 | FCP < 1.8s | LCP < 2.5s | FID < 100ms | INP < 200ms | TTFB < 800ms',
      'color: #64748b; font-size: 11px'
    );
  }
};

/**
 * Get current performance metrics snapshot
 * Useful for debugging or displaying in UI
 */
export const getPerformanceSnapshot = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart || 0,
    tcp: navigation?.connectEnd - navigation?.connectStart || 0,
    ttfb: navigation?.responseStart - navigation?.requestStart || 0,
    download: navigation?.responseEnd - navigation?.responseStart || 0,
    domInteractive: navigation?.domInteractive - navigation?.fetchStart || 0,
    domComplete: navigation?.domComplete - navigation?.fetchStart || 0,

    // Paint timing
    fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,

    // Memory (if available)
    memory: (performance as any).memory ? {
      used: Math.round((performance as any).memory.usedJSHeapSize / 1048576), // MB
      total: Math.round((performance as any).memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576), // MB
    } : null,
  };
};
