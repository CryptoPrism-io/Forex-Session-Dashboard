import React, { useState, useMemo, useEffect } from 'react';
import { useFXVolatility } from '../hooks/useFXVolatility';
import { useFXPrice } from '../hooks/useFXPrice';
import { useFXAvailableInstruments } from '../hooks/useFXAvailableInstruments';
import { INSTRUMENTS } from '../constants';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const formatPercentLabel = (value: number) => {
  const isWhole = Number.isInteger(value);
  return isWhole ? `${value}%` : `${value.toFixed(2).replace(/\.?0+$/, '')}%`;
};

const formatLots = (value: number) => {
  if (value === 0) return '0.00';
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
};

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatPercent = (value: number) => {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(2).replace(/\.?0+$/, '')}%`;
};

const CONTRACT_SIZE = 100000;

type ConversionStatus = 'ready' | 'loading' | 'missing';

interface ConversionData {
  rate: number | null;
  status: ConversionStatus;
}

const formatMidPrice = (value?: string, decimals = 5) => {
  if (!value) return null;
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(decimals);
};

const formatInstrumentValue = (value: number | null | undefined, decimals: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return value.toFixed(decimals).replace(/\.?0+$/, '') || '0';
};

const formatPipValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(3);
};

export function RiskCalculator() {
  const riskMin = 0.5;
  const riskMax = 5;
  const riskStep = 0.25;
  // Internal stop-loss in pips
  const stopLossPipMin = 5;
  const stopLossPipMax = 100;
  const stopLossPipStep = 1;

  const [selectedInstrument, setSelectedInstrument] = useState('EUR_USD');
  const [accountBalance, setAccountBalance] = useState('50000');
  const [riskPercent, setRiskPercent] = useState(1);
  const [stopLossPips, setStopLossPips] = useState(50);
  const [leverage, setLeverage] = useState(50);
  const [stopLossUnit, setStopLossUnit] = useState<'ticks' | 'pips'>('ticks');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [pairSearch, setPairSearch] = useState('');
  const [showCustomBalance, setShowCustomBalance] = useState(false);
  const [customBalanceValue, setCustomBalanceValue] = useState('');

  const accountBalanceValue = parseFloat(accountBalance) || 0;

  const { volatility, loading, error } = useFXVolatility(selectedInstrument);
  const { instruments: availableInstrumentNames } = useFXAvailableInstruments();

  const instrumentSetFromApi = useMemo(() => {
    if (!availableInstrumentNames) return null;
    return new Set(availableInstrumentNames);
  }, [availableInstrumentNames]);

  const instrumentsWithData = useMemo(() => {
    if (!instrumentSetFromApi || instrumentSetFromApi.size === 0) return INSTRUMENTS;
    const filtered = INSTRUMENTS.filter((instrument) => instrumentSetFromApi.has(instrument.name));
    return filtered.length > 0 ? filtered : INSTRUMENTS;
  }, [instrumentSetFromApi]);

  const instrumentSet = useMemo(
    () => new Set(instrumentsWithData.map((inst) => inst.name)),
    [instrumentsWithData]
  );

  const { price: instrumentPrice } = useFXPrice(selectedInstrument);

  const conversionInstrument = useMemo(() => {
    if (!selectedInstrument) return null;
    const [, quote] = selectedInstrument.split('_');
    if (!quote || quote === 'USD') return null;
    const quoteUsd = `${quote}_USD`;
    if (instrumentSet.has(quoteUsd)) return quoteUsd;
    const usdQuote = `USD_${quote}`;
    if (instrumentSet.has(usdQuote)) return usdQuote;
    return null;
  }, [selectedInstrument, instrumentSet]);

  const {
    price: conversionPrice,
    loading: conversionLoading,
    error: conversionError,
  } = useFXPrice(conversionInstrument);

  const conversionData: ConversionData = useMemo(() => {
    const [, quote] = selectedInstrument.split('_');
    if (!quote || quote === 'USD') {
      return { rate: 1, status: 'ready' };
    }
    if (!conversionInstrument) {
      return { rate: null, status: 'missing' };
    }
    if (conversionLoading) {
      return { rate: null, status: 'loading' };
    }
    if (conversionError) {
      return { rate: null, status: 'missing' };
    }
    if (!conversionPrice?.mid) {
      return { rate: null, status: 'missing' };
    }
    const mid = parseFloat(conversionPrice.mid);
    if (!Number.isFinite(mid) || mid <= 0) {
      return { rate: null, status: 'missing' };
    }
    if (conversionInstrument === `${quote}_USD`) {
      return { rate: mid, status: 'ready' };
    }
    if (conversionInstrument === `USD_${quote}`) {
      return { rate: 1 / mid, status: 'ready' };
    }
    return { rate: null, status: 'missing' };
  }, [selectedInstrument, conversionInstrument, conversionPrice, conversionLoading, conversionError]);

  const pricePrecision = useMemo(() => (selectedInstrument.includes('JPY') ? 3 : 5), [selectedInstrument]);
  const liveMidDisplay = useMemo(
    () => formatMidPrice(instrumentPrice?.mid, pricePrecision),
    [instrumentPrice, pricePrecision]
  );
  const atrPrecision = useMemo(() => (selectedInstrument.includes('JPY') ? 3 : 5), [selectedInstrument]);

  useEffect(() => {
    if (!instrumentSet.has(selectedInstrument)) {
      const fallback = instrumentsWithData[0]?.name;
      if (fallback) {
        setSelectedInstrument(fallback);
      }
    }
  }, [instrumentSet, instrumentsWithData, selectedInstrument]);

  // Extract unique currencies from available instruments
  const availableCurrencies = useMemo(() => {
    const currencySet = new Set<string>();
    instrumentsWithData.forEach((instrument) => {
      const [base, quote] = instrument.name.split('_');
      currencySet.add(base);
      currencySet.add(quote);
    });
    return Array.from(currencySet).sort();
  }, [instrumentsWithData]);

  // Filter instruments by selected currency and optional search query
  const filteredInstruments = useMemo(() => {
    const byCurrency = !selectedCurrency
      ? instrumentsWithData
      : instrumentsWithData.filter((instrument) => {
          const [base, quote] = instrument.name.split('_');
          return base === selectedCurrency || quote === selectedCurrency;
        });

    const normalizedSearch = pairSearch
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    if (!normalizedSearch) return byCurrency;

    return byCurrency.filter((instrument) => {
      const display = instrument.displayName.toUpperCase().replace('/', '');
      const name = instrument.name.toUpperCase().replace('_', '');
      return display.includes(normalizedSearch) || name.includes(normalizedSearch);
    });
  }, [selectedCurrency, instrumentsWithData, pairSearch]);

  const calculations = useMemo(() => {
    const balance = accountBalanceValue;
    const risk = riskPercent || 0;
    const stopLoss = stopLossPips || 0;
    const leverageValue = leverage || 1;

    // Get ATR value from volatility data
    const atrValue = volatility && !Array.isArray(volatility)
      ? parseFloat(volatility.atr)
      : null;

    // Risk amount
    const riskAmount = balance * (risk / 100);

    const pipSize = selectedInstrument.includes('JPY') ? 0.01 : 0.0001;
    const pipValueQuotePerLot = pipSize * CONTRACT_SIZE;
    const conversionReady = conversionData.status === 'ready' && conversionData.rate !== null && conversionData.rate > 0;
    const pipValueUSDPerLot = conversionReady ? pipValueQuotePerLot * (conversionData.rate as number) : 0;

    const canCalculate = conversionReady && balance > 0 && risk > 0 && stopLoss > 0 && pipValueUSDPerLot > 0;

    if (!canCalculate) {
      const reason = !conversionReady
        ? (conversionData.status === 'loading' ? 'price-loading' : 'price-missing')
        : 'inputs';

      return {
        riskAmount: riskAmount.toFixed(2),
        positionSizeLots: 0,
        atr: atrValue,
        atrPips: atrValue !== null ? atrValue / pipSize : null,
        margin: 0,
        pipValuePerLot: pipValueUSDPerLot,
        isValid: false,
        reason,
      };
    }

    const positionSizeLots = riskAmount / (stopLoss * pipValueUSDPerLot);
    const requiredMargin = leverageValue > 0
      ? (positionSizeLots * CONTRACT_SIZE) / leverageValue
      : positionSizeLots * CONTRACT_SIZE;

    return {
      riskAmount: riskAmount.toFixed(2),
      positionSizeLots,
      atr: atrValue,
      atrPips: atrValue !== null ? atrValue / pipSize : null,
      margin: requiredMargin,
      pipValuePerLot: pipValueUSDPerLot,
      isValid: true,
      reason: null,
    };
  }, [accountBalance, riskPercent, stopLossPips, volatility, selectedInstrument, leverage, conversionData]);

  const atrDisplay = calculations.atr !== null && calculations.atr !== undefined
    ? formatInstrumentValue(calculations.atr, atrPrecision)
    : 'N/A';
  const atrPipDisplay = calculations.atrPips !== null && calculations.atrPips !== undefined
    ? `${formatPipValue(calculations.atrPips)} pips`
    : 'N/A';

  const ticksPerPip = 10; // Broker: 10 ticks = 1 pip for FX
  const stopLossTicks = stopLossPips * ticksPerPip;

  // Display ranges
  const tickMin = 10;
  const tickMax = 1000;
  const tickStep = 5;

  const stopDisplayMin = stopLossUnit === 'pips' ? stopLossPipMin : tickMin;
  const stopDisplayMax = stopLossUnit === 'pips' ? stopLossPipMax : tickMax;
  const stopDisplayStep = stopLossUnit === 'pips' ? stopLossPipStep : tickStep;
  const stopDisplayValue = stopLossUnit === 'pips'
    ? clamp(stopLossPips, stopLossPipMin, stopLossPipMax)
    : clamp(stopLossTicks, tickMin, tickMax);

  const accountBalancePresets = [
    { label: '2.5K', value: '2500' },
    { label: '5K', value: '5000' },
    { label: '10K', value: '10000' },
    { label: '25K', value: '25000' },
    { label: '50K', value: '50000' },
    { label: '100K', value: '100000' },
  ];

  const leveragePresets = [10, 20, 30, 40, 50, 100];

  const handleCustomBalance = () => {
    setShowCustomBalance(true);
    setCustomBalanceValue(accountBalance);
  };

  const applyCustomBalance = () => {
    if (customBalanceValue && parseFloat(customBalanceValue) > 0) {
      setAccountBalance(customBalanceValue);
      setShowCustomBalance(false);
    }
  };

  const adjustRisk = (delta: number) => {
    setRiskPercent((prev) => {
      const next = clamp(Number((prev + delta).toFixed(2)), riskMin, riskMax);
      return parseFloat(next.toFixed(2));
    });
  };

  const adjustStopLoss = (delta: number) => {
    // Adjust in pips internally, regardless of current display unit
    setStopLossPips((prev) => {
      const next = clamp(prev + delta, stopLossPipMin, stopLossPipMax);
      return Math.round(next / stopLossPipStep) * stopLossPipStep;
    });
  };

  const riskProgress = ((riskPercent - riskMin) / (riskMax - riskMin)) * 100;
  const stopLossProgress = ((stopLossPips - stopLossPipMin) / (stopLossPipMax - stopLossPipMin)) * 100;

  const riskMarks = [0.5, 1, 2, 3, 4, 5];

  return (
    <div className="glass-soft rounded-xl p-4 shadow-xl shadow-black/30 border border-slate-700/30">
      <div className="space-y-3">
        {/* Currency Filter */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Filter by Currency
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCurrency('')}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                selectedCurrency === ''
                  ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-100'
                  : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40'
              }`}
            >
              All
            </button>
            {availableCurrencies.map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                  selectedCurrency === currency
                    ? 'bg-cyan-500/30 border border-cyan-400/50 text-cyan-100'
                    : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Currency Pair Dropdown */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
              Currency Pair
            </label>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              value={pairSearch}
              onChange={(e) => setPairSearch(e.target.value)}
              placeholder="Search or type symbol (e.g. GBPUSD)"
              className="flex-1 px-2 py-1.5 bg-slate-900/60 text-slate-200 text-xs border border-slate-700/60 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400/60 placeholder:text-slate-500"
            />
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800/50 text-slate-200 text-sm border border-slate-600/40 rounded-lg focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
            >
              {filteredInstruments.map((instrument) => (
                <option key={instrument.name} value={instrument.name}>
                  {instrument.displayName}
                </option>
              ))}
            </select>
          </div>
          {liveMidDisplay && (
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Live mid</span>
              <span className="text-cyan-300 font-semibold">{liveMidDisplay}</span>
            </div>
          )}
          </div>

          {/* Account Balance */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
              Account Balance ($)
            </label>
            {showCustomBalance ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customBalanceValue}
                  onChange={(e) => setCustomBalanceValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-800/50 text-slate-200 text-sm border border-slate-600/40 rounded-lg focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all"
                  placeholder="Enter amount"
                  autoFocus
                />
                <button
                  onClick={applyCustomBalance}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/30 border border-emerald-400/50 text-emerald-100 hover:bg-emerald-500/40 transition-all"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowCustomBalance(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {accountBalancePresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setAccountBalance(preset.value)}
                    className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      accountBalance === preset.value
                        ? 'bg-emerald-500/30 border border-emerald-400/50 text-emerald-100'
                        : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={handleCustomBalance}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40 transition-all col-span-3 sm:col-span-2"
                >
                  Custom
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Leverage */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1.5">
            Leverage
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {leveragePresets.map((value) => (
              <button
                key={value}
                onClick={() => setLeverage(value)}
                className={`px-2 py-1.5 text-[11px] font-medium rounded-lg transition-all ${
                  leverage === value
                    ? 'bg-blue-500/30 border border-blue-400/50 text-blue-100'
                    : 'bg-slate-700/20 border border-slate-600/40 text-slate-400 hover:bg-slate-700/40'
                }`}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>

        {/* Risk & Stop Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Risk Per Trade */}
          <div className="glass-soft rounded-lg p-3 border border-slate-700/30 bg-slate-900/30">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Risk Per Trade (%)</p>
                <p className="text-[10px] text-slate-500">0.5% – 5%</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustRisk(-riskStep)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/70 text-slate-200 text-sm border border-slate-700/60 hover:text-cyan-200 hover:border-cyan-500/40 transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min={riskMin}
                  max={riskMax}
                  step={riskStep}
                  value={riskPercent}
                  onChange={(e) => {
                    const value = clamp(parseFloat(e.target.value) || riskMin, riskMin, riskMax);
                    setRiskPercent(parseFloat(value.toFixed(2)));
                  }}
                  className="w-16 px-2 py-1 text-center text-sm border border-slate-700/60 rounded-md bg-slate-800/70 text-slate-100 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/40"
                />
                <button
                  type="button"
                  onClick={() => adjustRisk(riskStep)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/70 text-slate-200 text-sm border border-slate-700/60 hover:text-cyan-200 hover:border-cyan-500/40 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <input
                type="range"
                min={riskMin}
                max={riskMax}
                step={riskStep}
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                className="risk-slider w-full h-2 bg-slate-700/30 rounded-lg appearance-none cursor-pointer"
                style={
                  {
                    '--slider-progress': `${riskProgress}%`,
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.5%</span>
                <span>2%</span>
                <span>3%</span>
                <span>5%</span>
              </div>
            </div>
          </div>

          {/* Stop Loss */}
          <div className="glass-soft rounded-lg p-3 border border-slate-700/30 bg-slate-900/30">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Stop Loss</p>
                <p className="text-[10px] text-slate-500">
                  5 – 100 pips ({tickMin} – {tickMax} ticks)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustStopLoss(-stopLossPipStep)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/70 text-slate-200 text-sm border border-slate-700/60 hover:text-cyan-200 hover:border-cyan-500/40 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={stopDisplayMin}
                    max={stopDisplayMax}
                    step={stopDisplayStep}
                    value={stopDisplayValue}
                    onChange={(e) => {
                      const raw = parseFloat(e.target.value) || stopDisplayMin;
                      const clampedDisplay = clamp(raw, stopDisplayMin, stopDisplayMax);
                      const pipsValue =
                        stopLossUnit === 'pips' ? clampedDisplay : clampedDisplay / ticksPerPip;
                      const snappedPips = Math.round(pipsValue / stopLossPipStep) * stopLossPipStep;
                      setStopLossPips(clamp(snappedPips, stopLossPipMin, stopLossPipMax));
                    }}
                    className="w-20 px-2 py-1 text-center text-sm border border-slate-700/60 rounded-md bg-slate-800/70 text-slate-100 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => adjustStopLoss(stopLossPipStep)}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800/70 text-slate-200 text-sm border border-slate-700/60 hover:text-cyan-200 hover:border-cyan-500/40 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center rounded-full bg-slate-800/80 border border-slate-700/70 text-[10px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setStopLossUnit('ticks')}
                    className={`px-2 py-0.5 ${
                      stopLossUnit === 'ticks'
                        ? 'bg-cyan-500/30 text-cyan-100'
                        : 'text-slate-400'
                    }`}
                  >
                    Ticks
                  </button>
                  <button
                    type="button"
                    onClick={() => setStopLossUnit('pips')}
                    className={`px-2 py-0.5 border-l border-slate-700/70 ${
                      stopLossUnit === 'pips'
                        ? 'bg-cyan-500/30 text-cyan-100'
                        : 'text-slate-400'
                    }`}
                  >
                    Pips
                  </button>
                </div>
              </div>
            </div>
            <div>
              <input
                type="range"
                min={stopDisplayMin}
                max={stopDisplayMax}
                step={stopDisplayStep}
                value={stopDisplayValue}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value) || stopDisplayMin;
                  const clampedDisplay = clamp(raw, stopDisplayMin, stopDisplayMax);
                  const pipsValue =
                    stopLossUnit === 'pips' ? clampedDisplay : clampedDisplay / ticksPerPip;
                  const snappedPips = Math.round(pipsValue / stopLossPipStep) * stopLossPipStep;
                  setStopLossPips(clamp(snappedPips, stopLossPipMin, stopLossPipMax));
                }}
                className="stop-loss-slider w-full h-2 bg-slate-700/30 rounded-lg appearance-none cursor-pointer"
                style={
                  {
                    '--slider-progress': `${stopLossProgress}%`,
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                {stopLossUnit === 'pips' ? (
                  <>
                    <span>{stopLossPipMin}</span>
                    <span>{(stopLossPipMin + stopLossPipMax) / 2}</span>
                    <span>{stopLossPipMax}</span>
                  </>
                ) : (
                  <>
                    <span>{tickMin}</span>
                    <span>{(tickMin + tickMax) / 2}</span>
                    <span>{tickMax}</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 text-right">
                ≈ {stopLossPips.toFixed(1)} pips • {Math.round(stopLossTicks)} ticks
              </div>
            </div>
          </div>
        </div>


        {/* Results */}
        <div className="pt-3 border-t border-slate-700/30">
          {loading ? (
            <div className="text-slate-400 text-[10px] text-center py-3">Loading volatility data...</div>
          ) : error ? (
            <div className="text-red-400 text-[10px] text-center py-3">Error: {error}</div>
          ) : calculations.isValid ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
              <div className="glass-soft rounded-lg px-2 py-1.5 text-center border border-cyan-500/20 bg-cyan-500/5">
                <div className="text-[8px] uppercase tracking-wide text-slate-500 mb-0.5">
                  Position Size
                </div>
                <div className="text-sm font-bold text-cyan-300">
                  {formatLots(calculations.positionSizeLots)}
                  <span className="text-[9px] font-normal text-slate-400 ml-0.5">lots</span>
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Fee ${formatCurrency(calculations.positionSizeLots * 4)}
                </div>
              </div>
              <div className="glass-soft rounded-lg px-2 py-1.5 text-center border border-slate-700/20">
                <div className="text-[8px] uppercase tracking-wide text-slate-500 mb-0.5">
                  Max Risk
                </div>
                <div className="text-sm font-bold text-emerald-400">
                  ${calculations.riskAmount}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {formatPercent(riskPercent)}
                </div>
              </div>
              <div className="glass-soft rounded-lg px-2 py-1.5 text-center border border-blue-500/20 bg-blue-500/5">
                <div className="text-[8px] uppercase tracking-wide text-slate-500 mb-0.5">
                  Margin Needed
                </div>
                <div className="text-sm font-bold text-blue-300">
                  ${formatCurrency(calculations.margin)}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {accountBalanceValue > 0
                    ? formatPercent((calculations.margin / accountBalanceValue) * 100)
                    : 'N/A'}
                </div>
              </div>
              <div className="glass-soft rounded-lg px-2 py-1.5 text-center border border-slate-700/20">
                <div className="text-[8px] uppercase tracking-wide text-slate-500 mb-0.5">
                  ATR (instrument)
                </div>
                <div className="text-sm font-bold text-amber-300">
                  {atrDisplay}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">
                  {atrPipDisplay}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-xs text-center py-4">
              {calculations.reason === 'price-loading'
                ? 'Waiting for live price data...'
                : calculations.reason === 'price-missing'
                  ? 'Live price unavailable for this pair. Please try again later.'
                  : 'Please fill in all fields with valid values'}
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Risk Per Trade Slider */
        .risk-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #67e8f9;
          cursor: pointer;
          border: 2px solid #0e7490;
          box-shadow: 0 0 8px rgba(103, 232, 249, 0.5);
        }

        .risk-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #67e8f9;
          cursor: pointer;
          border: 2px solid #0e7490;
          box-shadow: 0 0 8px rgba(103, 232, 249, 0.5);
        }

        .risk-slider::-webkit-slider-runnable-track {
          background: linear-gradient(to right,
            #0e7490 0%,
            #0e7490 var(--slider-progress),
            #334155 var(--slider-progress),
            #334155 100%
          );
          height: 8px;
          border-radius: 4px;
        }

        .risk-slider::-moz-range-track {
          background: #334155;
          height: 8px;
          border-radius: 4px;
        }

        .risk-slider::-moz-range-progress {
          background: #0e7490;
          height: 8px;
          border-radius: 4px;
        }

        /* Stop Loss Slider */
        .stop-loss-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #67e8f9;
          cursor: pointer;
          border: 2px solid #0e7490;
          box-shadow: 0 0 8px rgba(103, 232, 249, 0.5);
        }

        .stop-loss-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #67e8f9;
          cursor: pointer;
          border: 2px solid #0e7490;
          box-shadow: 0 0 8px rgba(103, 232, 249, 0.5);
        }

        .stop-loss-slider::-webkit-slider-runnable-track {
          background: linear-gradient(to right,
            #0e7490 0%,
            #0e7490 var(--slider-progress),
            #334155 var(--slider-progress),
            #334155 100%
          );
          height: 8px;
          border-radius: 4px;
        }

        .stop-loss-slider::-moz-range-track {
          background: #334155;
          height: 8px;
          border-radius: 4px;
        }

        .stop-loss-slider::-moz-range-progress {
          background: #0e7490;
          height: 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
