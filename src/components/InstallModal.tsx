import React from 'react';
import { BrowserInfo } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  browserInfo: BrowserInfo | null;
}

const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, browserInfo }) => {
  if (!isOpen || !browserInfo) return null;

  const renderInstructions = () => {
    const { isIOS, isSafari, isChrome, isFirefox, isEdge, isSamsung } = browserInfo;

    // iOS Safari - Add to Home Screen
    if (isIOS && isSafari) {
      return (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              1
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Tap the Share button</h3>
              <p className="text-xs text-slate-400 mt-1">Look for the square with an upward arrow (□↑) at the bottom of the screen</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              2
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Scroll down and select</h3>
              <p className="text-xs text-slate-400 mt-1">Tap "Add to Home Screen" from the menu</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              3
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Confirm and add</h3>
              <p className="text-xs text-slate-400 mt-1">Tap "Add" in the top-right corner. The app icon will appear on your home screen</p>
            </div>
          </div>
        </div>
      );
    }

    // Safari macOS - Not supported
    if (!isIOS && isSafari) {
      return (
        <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
          <p className="text-sm text-slate-300">
            <strong>Safari on macOS</strong> doesn't support PWA installation. Please use <strong>Chrome</strong> or <strong>Edge</strong> for the best experience, or access this site in your browser as normal.
          </p>
        </div>
      );
    }

    // Chrome Desktop & Android
    if (isChrome) {
      return (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              1
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Look for the install icon</h3>
              <p className="text-xs text-slate-400 mt-1">In the address bar (top of screen), you should see a plus-in-circle icon (⊕)</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              2
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Click the install icon</h3>
              <p className="text-xs text-slate-400 mt-1">Or use the menu (⋮) &gt; "Install Global FX Trading Sessions"</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              3
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Confirm installation</h3>
              <p className="text-xs text-slate-400 mt-1">Click "Install" in the popup dialog. The app will be added to your system</p>
            </div>
          </div>
        </div>
      );
    }

    // Edge
    if (isEdge) {
      return (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              1
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Click the app icon</h3>
              <p className="text-xs text-slate-400 mt-1">Look for the plus-in-circle icon (+) in the address bar</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              2
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Or use the menu</h3>
              <p className="text-xs text-slate-400 mt-1">Menu (•••) &gt; "Apps" &gt; "Install this site as an app"</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              3
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Confirm</h3>
              <p className="text-xs text-slate-400 mt-1">Click "Install" to complete the installation</p>
            </div>
          </div>
        </div>
      );
    }

    // Firefox
    if (isFirefox) {
      return (
        <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
          <p className="text-sm text-slate-300 mb-3">
            <strong>Firefox</strong> has limited PWA support. For the best experience:
          </p>
          <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
            <li>Bookmark this site for quick access</li>
            <li>Or use Chrome, Edge, or Safari for full PWA features</li>
          </ul>
        </div>
      );
    }

    // Samsung Internet
    if (isSamsung) {
      return (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              1
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Open the menu</h3>
              <p className="text-xs text-slate-400 mt-1">Tap the menu button (three horizontal lines)</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              2
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Select "Add page to"</h3>
              <p className="text-xs text-slate-400 mt-1">Choose "Home screen" from the options</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
              3
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Confirm</h3>
              <p className="text-xs text-slate-400 mt-1">Tap "Add" to add the app to your home screen</p>
            </div>
          </div>
        </div>
      );
    }

    // Generic fallback
    return (
      <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
        <p className="text-sm text-slate-300 mb-3">
          To install this app, look for an "Install" or "Add to Home Screen" option in your browser menu.
        </p>
        <p className="text-xs text-slate-400">
          For the best experience, we recommend using Chrome, Edge, or Safari on iOS.
        </p>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-3xl shadow-2xl shadow-black/40 pointer-events-auto max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-cyan-600/20 border-b border-slate-800/50 p-4 sm:p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Install App
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {browserInfo.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                How to install
              </h3>
              {renderInstructions()}
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>💡 Tip:</strong> Once installed, you can open the app directly from your home screen or app drawer without using a browser.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/50 p-4 sm:p-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-medium text-sm transition-all duration-200"
            >
              Maybe Later
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 hover:border-cyan-300/60 text-cyan-300 hover:text-cyan-100 font-medium text-sm transition-all duration-200"
            >
              Got It!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallModal;
