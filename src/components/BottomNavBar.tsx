import React, { useState, useRef, useEffect } from 'react';
import { IconCalendarTab, IconChartsTab, IconGuideTab, IconWorldClockTab, IconTarget, IconTradingFlow, IconGlobe } from './icons';

type ViewType = 'overview' | 'calendar' | 'charts' | 'guide' | 'clocks' | 'fxdata' | 'screener' | 'aiChat';

interface BottomNavBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

// Icon component for "More" menu
const IconMore: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="5" r="1" fill="currentColor" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

// Icon for Tools
const IconTools: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

// Icon for Prices/FX
const IconPrices: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, onViewChange }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  // Primary tabs - 4 main navigation items (minimal black/white theme)
  const primaryTabs = [
    {
      id: 'overview' as ViewType,
      label: 'Home',
      icon: IconTarget,
      activeClass: 'bg-white/10 border-white/30',
      textClass: 'text-white',
      glowColor: '#ffffff'
    },
    {
      id: 'calendar' as ViewType,
      label: 'Calendar',
      icon: IconCalendarTab,
      activeClass: 'bg-white/10 border-white/30',
      textClass: 'text-white',
      glowColor: '#ffffff'
    },
    {
      id: 'charts' as ViewType,
      label: 'Sessions',
      icon: IconChartsTab,
      activeClass: 'bg-white/10 border-white/30',
      textClass: 'text-white',
      glowColor: '#ffffff'
    },
    {
      id: 'fxdata' as ViewType,
      label: 'Prices',
      icon: IconPrices,
      activeClass: 'bg-emerald-500/20 border-emerald-400/40',
      textClass: 'text-emerald-300',
      glowColor: '#34d399'
    },
  ];

  // Secondary items in "More" menu (minimal black/white theme)
  const moreItems = [
    {
      id: 'screener' as ViewType,
      label: 'Screener',
      icon: IconTradingFlow,
      textClass: 'text-neutral-300',
      glowColor: '#d4d4d4'
    },
    {
      id: 'clocks' as ViewType,
      label: 'World Clocks',
      icon: IconWorldClockTab,
      textClass: 'text-neutral-300',
      glowColor: '#d4d4d4'
    },
    {
      id: 'guide' as ViewType,
      label: 'Guide',
      icon: IconGuideTab,
      textClass: 'text-neutral-300',
      glowColor: '#d4d4d4'
    },
    {
      id: 'aiChat' as ViewType,
      label: 'AI Assistant',
      icon: IconGlobe,
      textClass: 'text-neutral-300',
      glowColor: '#d4d4d4'
    },
  ];

  // Check if current view is in "More" menu
  const isMoreActive = moreItems.some(item => item.id === activeView);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/98 backdrop-blur-xl border-t border-slate-800/30 safe-area-inset-bottom">
      {/* More Menu Popup */}
      {showMoreMenu && (
        <div
          ref={moreMenuRef}
          className="absolute bottom-full right-2 mb-2 w-48 bg-slate-950/98 backdrop-blur-xl rounded-2xl border border-slate-700/30 shadow-2xl shadow-black/60 overflow-hidden"
        >
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setShowMoreMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all ${
                  isActive
                    ? 'bg-slate-800/60'
                    : 'hover:bg-slate-800/40 active:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? item.textClass : 'text-slate-400'}`}
                  style={isActive ? { filter: `drop-shadow(0 0 4px ${item.glowColor})` } : undefined}
                />
                <span className={`text-sm font-medium ${isActive ? item.textClass : 'text-slate-300'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current" style={{ color: item.glowColor }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Tab Bar - 5 equal-width tabs */}
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 mx-0.5 rounded-xl transition-all duration-200 min-h-[56px] ${
                isActive
                  ? `${tab.activeClass} border`
                  : 'border border-transparent hover:bg-slate-900/50 active:bg-slate-900/70'
              }`}
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? tab.textClass : 'text-slate-400'
                }`}
                style={
                  isActive
                    ? { filter: `drop-shadow(0 0 6px ${tab.glowColor})` }
                    : undefined
                }
              />
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isActive ? tab.textClass : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 mx-0.5 rounded-xl transition-all duration-200 min-h-[56px] ${
            isMoreActive || showMoreMenu
              ? 'bg-purple-500/25 border border-purple-400/50'
              : 'border border-transparent hover:bg-slate-900/50 active:bg-slate-900/70'
          }`}
        >
          <IconMore
            className={`w-6 h-6 transition-colors ${
              isMoreActive || showMoreMenu ? 'text-purple-300' : 'text-slate-400'
            }`}
            style={
              isMoreActive || showMoreMenu
                ? { filter: 'drop-shadow(0 0 6px #c084fc)' }
                : undefined
            }
          />
          <span
            className={`text-[11px] font-medium transition-colors ${
              isMoreActive || showMoreMenu ? 'text-purple-300' : 'text-slate-500'
            }`}
          >
            More
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
