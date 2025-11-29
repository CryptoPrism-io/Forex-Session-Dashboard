# Next Steps - FX Data Integration

## ✅ Sprint 1 Complete (Weeks 1-2) - Backend API Layer

**Status:** 100% COMPLETE
**Completion Date:** November 29, 2025

### What We Built
- ✅ 8 REST API endpoints reading from fx_global database
- ✅ Database connection to fx_global with 36 instruments
- ✅ All endpoints tested and working with real data
- ✅ Complete API documentation

---

## 🚀 Sprint 2: Frontend Core Features (Weeks 3-4)

**Estimated Hours:** 24 hours
**Target Completion:** December 13, 2025

### Overview
Build React components and hooks to display FX data from the backend API, focusing on the top 3 PRD features:
1. **Position Size Calculator** (PRD Priority 1 - RICE: 216)
2. **Volatility Indicators** (PRD Priority 2 - RICE: 100.8)
3. **Best Pairs Widget** (PRD Priority 8)

---

## 📋 Sprint 2 Subtasks (10 tasks)

### Phase 1: Custom React Hooks (Day 1-3) - 8 hours

**Task 1:** Create `src/hooks/useFXPrice.ts` hook
- Fetch current price for single instrument
- Auto-refresh every 60 seconds
- Return: `{ price, loading, error }`
- **Estimated:** 2 hours

**Task 2:** Create `src/hooks/useFXVolatility.ts` hook
- Fetch volatility metrics (HV-20, HV-50, ATR, SMA, BB)
- Auto-refresh every 1 hour
- Support both single instrument and all instruments
- **Estimated:** 3 hours

**Task 3:** Create `src/hooks/useFXCorrelation.ts` hook
- Fetch correlation matrix or filtered pairs
- Cache results (updates daily only)
- **Estimated:** 2 hours

**Task 4:** Test all hooks with real data
- Verify polling intervals work correctly
- Check error handling
- **Estimated:** 1 hour

---

### Phase 2: Constants & Config (Day 4) - 2 hours

**Task 5:** Add INSTRUMENTS constant to `src/constants.ts`
```typescript
export const INSTRUMENTS = [
  { name: 'EUR_USD', displayName: 'EUR/USD', assetClass: 'FX' },
  { name: 'GBP_USD', displayName: 'GBP/USD', assetClass: 'FX' },
  // ... all 36 instruments
];
```
- Get instrument list from API endpoint `/api/fx/prices/all`
- Add proper types and structure
- **Estimated:** 2 hours

---

### Phase 3: Risk Calculator Component (Day 5-7) - 8 hours

**Task 6:** Create `src/components/RiskCalculator.tsx`

**Features:**
- Input: Account balance, risk %, stop loss pips, currency pair
- Calculate: Position size in lots based on ATR
- Display: Recommended lot size, max risk amount, current ATR
- Use `useFXVolatility` hook to get ATR value

**Formula:**
```
Risk Amount = Account Balance × (Risk % / 100)
Lot Size = Risk Amount / (Stop Loss Pips × Pip Value)
```

**UI Structure:**
```
┌─────────────────────────────────────┐
│  Position Size Calculator           │
├─────────────────────────────────────┤
│  Currency Pair: [EUR_USD ▼]         │
│  Account Balance: [$10,000]         │
│  Risk Per Trade: [1%]               │
│  Stop Loss: [50 pips]               │
├─────────────────────────────────────┤
│  📊 Recommended Position Size        │
│  0.20 lots                          │
│  Max Risk: $100 | ATR: 0.00117      │
└─────────────────────────────────────┘
```

**Estimated:** 8 hours

---

### Phase 4: Volatility Components (Day 8-9) - 6 hours

**Task 7:** Create `src/components/VolatilityMeter.tsx`
- Single instrument volatility display
- Show: HV-20, HV-50, ATR with color coding
- Green (low), Yellow (medium), Red (high)
- **Estimated:** 3 hours

**Task 8:** Create `src/components/VolatilityPanel.tsx`
- Table/grid showing all 36 instruments
- Columns: Instrument, HV-20, ATR, SMA-30, BB Width
- Sortable by volatility level
- Color-coded rows
- **Estimated:** 3 hours

---

### Phase 5: Best Pairs Widget (Day 10) - 3 hours

**Task 9:** Create `src/components/BestPairsWidget.tsx`
- Display top 10 recommended pairs for hedging
- Fetch from `/api/fx/best-pairs?category=hedging`
- Show: Pair 1, Pair 2, Correlation, Score
- Handle empty state gracefully (table currently empty)
- **Estimated:** 2 hours

**Task 10:** Integrate all components into App
- Add "FX Data" tab to `src/App.tsx`
- Update tab state: `type ActiveView = 'calendar' | 'clocks' | 'charts' | 'guide' | 'fxdata'`
- Create new view component to hold Risk Calculator, Volatility Panel, Best Pairs
- Test responsive layout
- **Estimated:** 1 hour

---

## 🎨 UI/UX Guidelines

### Design Principles
1. **Consistency:** Match existing dashboard styling (Tailwind CSS)
2. **Performance:** Components should render in < 2 seconds
3. **Accessibility:** Full keyboard navigation, ARIA labels
4. **Responsive:** Mobile-first design with collapsible sections

### Color Coding (Volatility)
- **Green:** Low volatility (< 0.005)
- **Yellow:** Medium volatility (0.005 - 0.015)
- **Red:** High volatility (> 0.015)

### Animation
- Use Framer Motion for component transitions
- Respect `prefers-reduced-motion` setting
- Keep animations under 300ms

---

## 📁 File Structure After Sprint 2

```
src/
├── components/
│   ├── RiskCalculator.tsx          ← NEW (PRD P1)
│   ├── VolatilityPanel.tsx         ← NEW (PRD P2)
│   ├── VolatilityMeter.tsx         ← NEW
│   ├── BestPairsWidget.tsx         ← NEW (PRD P8)
│   ├── ForexChart.tsx              (existing)
│   ├── SessionClocks.tsx           (existing)
│   └── ...
├── hooks/
│   ├── useFXPrice.ts               ← NEW
│   ├── useFXVolatility.ts          ← NEW
│   ├── useFXCorrelation.ts         ← NEW
│   └── useSessionAlerts.ts         (existing)
├── constants.ts                    ← MODIFY (add INSTRUMENTS)
└── App.tsx                         ← MODIFY (add fxdata tab)
```

---

## 🧪 Testing Checklist

### Functionality Tests
- [ ] Risk calculator produces correct lot sizes
- [ ] Volatility data refreshes every 1 hour
- [ ] Instrument dropdown shows all 36 instruments
- [ ] Best pairs widget handles empty state
- [ ] All components render without errors

### Performance Tests
- [ ] Initial render < 2 seconds
- [ ] No layout thrashing during updates
- [ ] Polling doesn't cause memory leaks
- [ ] Components unmount cleanly

### Accessibility Tests
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

---

## 📊 Success Criteria

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Risk calculator accuracy | 100% | Manual validation with sample data |
| Volatility data refresh | Every 1 hour | Check network tab for API calls |
| Component render time | < 2s | React DevTools Profiler |
| User can switch instruments | Yes | Test dropdown functionality |
| Mobile responsive | Yes | Test on 375px width (iPhone SE) |

---

## 🚧 Known Limitations & Future Work

### Sprint 2 Scope
- ✅ Building 4 core components
- ✅ Polling-based updates (60s for prices, 1h for volatility)
- ❌ **NOT** implementing WebSocket (deferred to Phase 2)
- ❌ **NOT** implementing Auth/Payments (deferred to Phase 2)
- ❌ **NOT** implementing Correlation Matrix heatmap (Sprint 3)
- ❌ **NOT** implementing Danger Zones overlay (Sprint 3)

### Technical Debt
- Best pairs table currently empty (pipeline needs to populate)
- No caching layer (consider Redis in Sprint 3)
- API calls not rate-limited (add in production)

---

## 🔗 Sprint 3 Preview (Weeks 5-6)

After Sprint 2, we'll build:
1. **Correlation Matrix Heatmap** (PRD P5) - 21×21 visual correlation
2. **News Danger Zones** (PRD P4) - Overlay high-impact events on ForexChart
3. **Session Alerts Enhancement** - Add volatility-based triggers
4. **Historical Charts** - Integrate candles data into ForexChart

**Estimated:** 30 hours

---

## 💻 Development Commands

### Start Both Servers (Required for Sprint 2)

```bash
# Terminal 1: Backend API
cd server
node server.js
# Server runs on http://localhost:5000

# Terminal 2: Frontend Dev Server
npm run dev
# App runs on http://localhost:3000
```

### Verify Backend API

```bash
# Test prices endpoint
curl "http://localhost:5000/api/fx/prices/current?instrument=EUR_USD"

# Test volatility endpoint
curl "http://localhost:5000/api/fx/volatility/EUR_USD"

# Test all prices (for instruments list)
curl "http://localhost:5000/api/fx/prices/all"
```

### Create New Component (Template)

```bash
# Create component file
touch src/components/RiskCalculator.tsx

# Template structure:
import React, { useState } from 'react';
import { useFXVolatility } from '../hooks/useFXVolatility';

export function RiskCalculator() {
  // Component logic here
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* UI here */}
    </div>
  );
}
```

---

## 📚 Reference Documentation

- **Sprint 1 Report:** [SPRINT1_COMPLETION_REPORT.md](SPRINT1_COMPLETION_REPORT.md)
- **API Documentation:** [server/FX_API_DOCUMENTATION.md](server/FX_API_DOCUMENTATION.md)
- **Integration Plan:** [FX_INTEGRATION_PLAN.md](FX_INTEGRATION_PLAN.md)
- **Project README:** [CLAUDE.md](CLAUDE.md)
- **Original PRD:** [Forex Dashboard PRD – Complete Document.pdf](Forex Dashboard PRD – Complete Document.pdf)

---

## ❓ FAQ

**Q: Can I skip Sprint 2 and jump to Sprint 3?**
A: No - Sprint 2 components are prerequisites for Sprint 3 features.

**Q: Do I need to rebuild the backend API?**
A: No - All backend work is complete. Just start the server with `node server.js`.

**Q: What if best_pairs_tracker table is still empty?**
A: The widget handles this gracefully with a "No data available yet" message.

**Q: Should I use Redux or Context API?**
A: No - The project uses React hooks only. Continue this pattern.

**Q: Can I modify the database schema?**
A: No - Database is managed by DataPipeline-FX-APP. Read-only access only.

**Q: How do I test without running frontend?**
A: Use curl or Postman to test API endpoints directly.

---

## 🎯 Sprint 2 Quick Start

**Day 1 - Right Now:**

1. Verify backend is running:
   ```bash
   cd server && node server.js
   ```

2. Create first hook file:
   ```bash
   mkdir -p src/hooks
   touch src/hooks/useFXPrice.ts
   ```

3. Implement useFXPrice hook (see [FX_API_DOCUMENTATION.md](server/FX_API_DOCUMENTATION.md#usage-examples) for template)

4. Test hook in browser console:
   ```javascript
   const { price } = useFXPrice('EUR_USD');
   console.log(price);
   ```

**That's it! You're ready to start Sprint 2.**

---

**Current Status:** Ready to begin Sprint 2
**Next Action:** Create useFXPrice.ts hook
**Estimated Sprint 2 Completion:** December 13, 2025

---

*Last Updated: November 29, 2025*
*Sprint 1 Status: ✅ COMPLETE*
*Sprint 2 Status: 🚀 READY TO START*
