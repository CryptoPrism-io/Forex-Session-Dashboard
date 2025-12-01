import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timezone } from '../types';
import { TIMEZONES } from '../constants';
import { IconX } from './icons';

interface TimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimezone: Timezone;
  onTimezoneChange: (tz: Timezone) => void;
}

const TimezoneModal: React.FC<TimezoneModalProps> = ({
  isOpen,
  onClose,
  selectedTimezone,
  onTimezoneChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTimezones = TIMEZONES.filter((tz) =>
    tz.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (tz: Timezone) => {
    onTimezoneChange(tz);
    onClose();
  };

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
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="glass-soft rounded-2xl shadow-2xl shadow-black/50 p-4 max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-100">Select Timezone</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-700/40 transition-colors"
                  aria-label="Close"
                >
                  <IconX className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search timezones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 mb-4 text-sm rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              />

              {/* Timezone List */}
              <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                {filteredTimezones.map((tz) => (
                  <button
                    key={tz.label}
                    onClick={() => handleSelect(tz)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      selectedTimezone.label === tz.label
                        ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-100'
                        : 'bg-slate-800/40 border border-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600/60'
                    }`}
                  >
                    <div className="text-sm font-medium">{tz.label}</div>
                    {tz.ianaTimezone && (
                      <div className="text-xs text-slate-500 mt-0.5">{tz.ianaTimezone}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TimezoneModal;
