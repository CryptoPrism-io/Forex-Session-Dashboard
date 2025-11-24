import React, { useRef, useState } from 'react';
import { IconCalendarTab, IconChartsTab, IconGuideTab, IconWorldClockTab, IconTarget } from './icons';

type ViewType = 'overview' | 'calendar' | 'charts' | 'guide' | 'clocks';

interface BottomNavBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const tabs = [
    {
      id: 'overview' as ViewType,
      label: 'Overview',
      icon: IconTarget,
      activeClass: 'bg-blue-500/20 border border-blue-400/40',
      textClass: 'text-blue-300',
      glowColor: '#60a5fa'
    },
    {
      id: 'calendar' as ViewType,
      label: 'Calendar',
      icon: IconCalendarTab,
      activeClass: 'bg-emerald-500/20 border border-emerald-400/40',
      textClass: 'text-emerald-300',
      glowColor: '#6ee7b7'
    },
    {
      id: 'charts' as ViewType,
      label: 'Charts',
      icon: IconChartsTab,
      activeClass: 'bg-cyan-500/20 border border-cyan-400/40',
      textClass: 'text-cyan-300',
      glowColor: '#67e8f9'
    },
    {
      id: 'guide' as ViewType,
      label: 'Guide',
      icon: IconGuideTab,
      activeClass: 'bg-amber-500/20 border border-amber-400/40',
      textClass: 'text-amber-300',
      glowColor: '#fcd34d'
    },
    {
      id: 'clocks' as ViewType,
      label: 'World',
      icon: IconWorldClockTab,
      activeClass: 'bg-violet-500/20 border border-violet-400/40',
      textClass: 'text-violet-300',
      glowColor: '#c4b5fd'
    },
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowScrollButton(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 safe-area-inset-bottom">
      <div className="relative">
        {/* Horizontal Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-center gap-2 px-2 py-2 overflow-x-auto scrollbar-hide"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[72px] flex-shrink-0 scroll-snap-align-start ${
                  isActive ? tab.activeClass : 'hover:bg-slate-800/50'
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? tab.textClass : 'text-slate-400'
                  }`}
                  style={
                    isActive
                      ? { filter: `drop-shadow(0 0 4px ${tab.glowColor})` }
                      : undefined
                  }
                />
                <span
                  className={`text-[10px] font-medium transition-colors whitespace-nowrap ${
                    isActive ? tab.textClass : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fade Effect on Right */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-900/95 to-transparent pointer-events-none" />

        {/* Scroll Button */}
        {showScrollButton && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 flex items-center justify-center shadow-lg transition-all hover:bg-slate-700/80"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scroll-snap-align-start {
          scroll-snap-align: start;
        }
      `}</style>
    </nav>
  );
};

export default BottomNavBar;
