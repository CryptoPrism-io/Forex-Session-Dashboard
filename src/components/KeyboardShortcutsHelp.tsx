import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX } from './icons';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'T', description: 'Focus Session Timeline Chart', category: 'Navigation' },
  { key: 'C', description: 'Focus Economic Calendar', category: 'Navigation' },
  { key: 'K', description: 'Focus Session Clocks', category: 'Navigation' },
  { key: 'G', description: 'Focus Session Guide', category: 'Navigation' },
  { key: 'S', description: 'Focus Active Sessions', category: 'Navigation' },
  { key: 'Z', description: 'Open Timezone Selector', category: 'Settings' },
  { key: '?', description: 'Show this help dialog', category: 'Help' },
  { key: 'Esc', description: 'Close dialogs / Blur focus', category: 'General' },
];

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
          >
            <div className="glass-soft rounded-2xl shadow-2xl shadow-black/50 p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">Keyboard Shortcuts</h2>
                  <p className="text-xs text-slate-400">Navigate faster with these shortcuts</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700/40 transition-colors"
                  aria-label="Close"
                >
                  <IconX className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="space-y-4">
                {Object.entries(groupedShortcuts).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {items.map((shortcut) => (
                        <div
                          key={shortcut.key}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/60 transition-colors"
                        >
                          <span className="text-sm text-slate-300">{shortcut.description}</span>
                          <kbd className="px-2 py-1 text-xs font-mono font-semibold rounded bg-slate-900/60 border border-slate-600/50 text-slate-100 shadow-inner">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Tip */}
              <div className="mt-5 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center">
                  💡 Shortcuts work when you're not typing in an input field
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsHelp;
