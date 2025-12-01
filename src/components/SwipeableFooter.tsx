import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import SocialLinks from './SocialLinks';
import InstallButton from './InstallButton';
import AlertsToggleHeader from './AlertsToggleHeader';
import { IconTradingFlow } from './icons';

interface SwipeableFooterProps {
  installState: 'available' | 'installed' | 'unsupported' | 'dismissed';
  onInstallClick: () => void;
  alertConfig: { enabled: boolean; soundEnabled: boolean };
  onToggleAlerts: () => void;
  onToggleSound: () => void;
}

const SwipeableFooter: React.FC<SwipeableFooterProps> = ({
  installState,
  onInstallClick,
  alertConfig,
  onToggleAlerts,
  onToggleSound,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Swipe up to expand (negative offset.y)
    // Swipe down to collapse (positive offset.y)
    if (info.offset.y < -50 || info.velocity.y < -500) {
      setIsExpanded(true);
    } else if (info.offset.y > 50 || info.velocity.y > 500) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Swipeable Footer Drawer */}
      <motion.footer
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ y: isExpanded ? -100 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 safe-area-inset-bottom"
        style={{ marginBottom: '60px' }} // Space for bottom nav bar
      >
        {/* Swipe Handle */}
        <div className="flex justify-center pt-2 pb-2">
          <div className="w-10 h-0.5 rounded-full bg-slate-600/50" />
        </div>

        {/* Compact Action Row */}
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          {/* Left side - Brand Icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex-shrink-0">
            <IconTradingFlow className="w-4 h-4 text-cyan-300" />
          </div>

          {/* Center - Action Buttons */}
          <div className="flex items-center gap-2">
            <AlertsToggleHeader
              alertConfig={alertConfig}
              onToggle={onToggleAlerts}
              onToggleSound={onToggleSound}
            />
            <InstallButton
              onClick={onInstallClick}
              show={installState === 'available' || installState === 'dismissed'}
              hasNativePrompt={installState === 'available'}
            />
          </div>

          {/* Right side - Social Links */}
          <SocialLinks />
        </div>

        {/* Disclaimer - Compact */}
        <div className="px-4 pb-2">
          <p className="text-center text-slate-500 text-[9px] font-light leading-tight">
            Data is illustrative. Not financial advice.
          </p>
        </div>

        {/* Expanded Content (when swiped up) */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-3 border-t border-slate-700/30 pt-3"
          >
            <div className="text-center">
              <p className="text-[10px] text-slate-400 mb-1">Full Disclaimer</p>
              <p className="text-[9px] text-slate-500 leading-snug">
                Always verify session times with your broker.<br />
                Market conditions may vary.
              </p>
            </div>
          </motion.div>
        )}
      </motion.footer>

      {/* Desktop Footer (unchanged) */}
      <footer className="hidden md:flex w-full mt-2 flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 text-slate-500 text-[10px] sm:text-xs font-light">
        <p className="text-center sm:text-left">Data is illustrative. Always verify times with your broker. Not financial advice.</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/40 shadow-inner shadow-cyan-500/20">
            <IconTradingFlow className="w-5 h-5 text-cyan-300" />
          </div>
          <AlertsToggleHeader
            alertConfig={alertConfig}
            onToggle={onToggleAlerts}
            onToggleSound={onToggleSound}
          />
          <InstallButton
            onClick={onInstallClick}
            show={installState === 'available' || installState === 'dismissed'}
            hasNativePrompt={installState === 'available'}
          />
          <SocialLinks />
        </div>
      </footer>
    </>
  );
};

export default SwipeableFooter;
