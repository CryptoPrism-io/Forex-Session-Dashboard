import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { SESSION_PAIRS_MAP } from '../constants';
import { SessionStatus } from '../App';

interface TradingPair {
  symbol: string;
  category: 'forex' | 'indices' | 'crypto';
  sessions: string[];
  volume: number; // 0-100 scale
  spread: number; // Pips
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  color: string; // Session color
}

interface PairsToTradeProps {
  activeSessions: Array<{
    name: string;
    color: string;
    type: 'main' | 'overlap' | 'killzone';
    state: SessionStatus;
    elapsedSeconds: number;
    remainingSeconds: number;
    startUTC: number;
    endUTC: number;
  }>;
  sessionStatus: { [key: string]: SessionStatus };
  currentTime: Date;
}

// Mock spread data (pips)
const SPREAD_DATA: Record<string, number> = {
  'EUR/USD': 0.8,
  'GBP/USD': 1.2,
  'USD/JPY': 0.9,
  'AUD/USD': 1.0,
  'USD/CAD': 1.1,
  'NZD/USD': 1.3,
  'EUR/GBP': 1.0,
  'EUR/JPY': 1.2,
  'GBP/JPY': 1.8,
  'AUD/JPY': 1.3,
  'USD/CNH': 2.5,
  'AUD/NZD': 2.0,
  'NZD/JPY': 1.5,
  'US30': 2.0,
  'NAS100': 1.5,
};

// Volume calculation based on session (0-100 scale)
const SESSION_VOLUME_MAP: Record<string, number> = {
  'London': 95,
  'New York': 90,
  'London-NY Overlap': 100,
  'London Killzone': 85,
  'NY AM Killzone': 85,
  'NY PM Killzone': 70,
  'Asia': 60,
  'Sydney': 40,
  'Asia-London Overlap': 75,
  'Sydney-Asia Overlap': 50,
  'New York Session': 90,
};

// Volatility calculation based on session type
const getVolatility = (sessions: string[]): TradingPair['volatility'] => {
  const hasKillzone = sessions.some(s => s.includes('Killzone'));
  const hasOverlap = sessions.some(s => s.includes('Overlap'));
  const hasLondon = sessions.some(s => s.includes('London'));
  const hasNewYork = sessions.some(s => s.includes('New York'));

  if (hasKillzone) return 'Very High';
  if (hasOverlap) return 'Very High';
  if (hasLondon || hasNewYork) return 'High';
  return 'Medium';
};

// Get pair category
const getPairCategory = (symbol: string): TradingPair['category'] => {
  if (symbol.includes('US30') || symbol.includes('NAS100')) return 'indices';
  if (symbol.includes('BTC') || symbol.includes('ETH')) return 'crypto';
  return 'forex';
};

const PairsToTrade: React.FC<PairsToTradeProps> = ({
  activeSessions,
  sessionStatus,
  currentTime,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Calculate trading pairs based on active sessions
  const tradingPairs = useMemo(() => {
    if (activeSessions.length === 0) return [];

    const pairsMap = new Map<string, TradingPair>();

    activeSessions.forEach(session => {
      const sessionPairs = SESSION_PAIRS_MAP[session.name] || [];

      sessionPairs.forEach(symbol => {
        if (pairsMap.has(symbol)) {
          // Add session to existing pair
          const existingPair = pairsMap.get(symbol)!;
          existingPair.sessions.push(session.name);
          // Update volume to highest session volume
          const sessionVolume = SESSION_VOLUME_MAP[session.name] || 50;
          if (sessionVolume > existingPair.volume) {
            existingPair.volume = sessionVolume;
            existingPair.color = session.color;
          }
        } else {
          // Create new pair
          const sessionVolume = SESSION_VOLUME_MAP[session.name] || 50;
          const sessions = [session.name];

          pairsMap.set(symbol, {
            symbol,
            category: getPairCategory(symbol),
            sessions,
            volume: sessionVolume,
            spread: SPREAD_DATA[symbol] || 1.5,
            volatility: getVolatility(sessions),
            color: session.color,
          });
        }
      });
    });

    // Update volatility based on all sessions for each pair
    pairsMap.forEach(pair => {
      pair.volatility = getVolatility(pair.sessions);
    });

    // Sort by volume (descending) and return top 8
    return Array.from(pairsMap.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);
  }, [activeSessions]);

  // Volatility color mapping
  const getVolatilityColor = (volatility: TradingPair['volatility']) => {
    switch (volatility) {
      case 'Low': return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/40';
      case 'Medium': return 'text-amber-400 bg-amber-500/20 border-amber-400/40';
      case 'High': return 'text-orange-400 bg-orange-500/20 border-orange-400/40';
      case 'Very High': return 'text-red-400 bg-red-500/20 border-red-400/40';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            staggerChildren: 0.05,
            delayChildren: 0.1,
          }
    }
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      y: 10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.3, type: 'tween' }
    }
  };

  if (tradingPairs.length === 0) {
    return (
      <div className="text-[10px] text-slate-400 text-center py-4">
        No active trading pairs
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {tradingPairs.map((pair, index) => (
        <motion.div
          key={pair.symbol}
          variants={cardVariants}
          className="glass-soft rounded-xl p-2 shadow-lg shadow-black/20 hover:scale-102 transition-transform duration-200 cursor-pointer"
          whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
        >
          {/* Header: Symbol + Session Dot */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: pair.color,
                  boxShadow: `0 0 4px ${pair.color}`,
                }}
              />
              <span className="text-[10px] font-bold text-slate-100">
                {pair.symbol}
              </span>
            </div>
            {/* Category Badge */}
            <span className="text-[7px] px-1 py-0.5 rounded bg-slate-700/40 text-slate-400 uppercase tracking-wider">
              {pair.category}
            </span>
          </div>

          {/* Volume Bar */}
          <div className="mb-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] uppercase tracking-wide text-slate-500">Volume</span>
              <span className="text-[8px] font-mono font-bold text-cyan-400">{pair.volume}</span>
            </div>
            <div className="h-1 bg-slate-900/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pair.volume}%`,
                  backgroundColor: pair.color,
                  boxShadow: `0 0 3px ${pair.color}`,
                }}
              />
            </div>
          </div>

          {/* Spread + Volatility Badges */}
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-slate-900/40 rounded-lg p-1 text-center">
              <div className="text-[7px] uppercase tracking-wide text-slate-500">Spread</div>
              <div className="text-[9px] font-bold text-blue-400 font-mono">{pair.spread}</div>
            </div>
            <div className={`rounded-lg p-1 text-center border ${getVolatilityColor(pair.volatility)}`}>
              <div className="text-[7px] uppercase tracking-wide opacity-70">Vol</div>
              <div className="text-[8px] font-bold">{pair.volatility.replace(' ', '')}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PairsToTrade;
