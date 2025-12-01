import { DependencyList, useMemo } from 'react';

const isPerformanceSupported =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.measure === 'function' &&
  typeof performance.clearMarks === 'function' &&
  typeof performance.clearMeasures === 'function';

const safeMeasure = (label: string, startMark: string, endMark: string) => {
  if (!isPerformanceSupported) return;
  performance.mark(endMark);
  performance.measure(label, startMark, endMark);
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(label);
};

export function useInstrumentedMemo<T>(
  label: string,
  factory: () => T,
  deps: DependencyList
) {
  return useMemo(() => {
    const startMark = `${label}-start`;
    if (isPerformanceSupported) {
      performance.mark(startMark);
    }

    try {
      return factory();
    } finally {
      safeMeasure(label, startMark, `${label}-end`);
    }
  }, deps);
}
