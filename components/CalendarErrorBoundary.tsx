import React from 'react';

interface CalendarErrorBoundaryProps {
  children: React.ReactNode;
}

interface CalendarErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

class CalendarErrorBoundary extends React.Component<
  CalendarErrorBoundaryProps,
  CalendarErrorBoundaryState
> {
  constructor(props: CalendarErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): CalendarErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message ?? 'Unexpected error',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('EconomicCalendar crashed:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="max-w-md w-full bg-slate-900/70 border border-red-500/30 rounded-2xl p-5 text-center space-y-3 shadow-xl shadow-black/30 backdrop-blur-xl">
            <div className="text-sm font-semibold text-red-300 uppercase tracking-[0.3em]">
              Calendar offline
            </div>
            <p className="text-slate-200 text-sm">
              We couldn&apos;t load the economic calendar stream.{' '}
              <span className="text-slate-400">
                {this.state.errorMessage || 'Please try again.'}
              </span>
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-500/20 text-red-100 border border-red-400/50 hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CalendarErrorBoundary;

