# Forex Session Dashboard - UI Documentation

**Version**: 1.0.0
**Last Updated**: December 2024
**Total Components**: 41
**Screenshots**: 50+

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Component Reference](#component-reference)
   - [Core Layout Components](#core-layout-components)
   - [Trading Tools](#trading-tools)
   - [Information Displays](#information-displays)
   - [Modals & Overlays](#modals--overlays)
   - [UI Components](#ui-components)
4. [Feature Guides](#feature-guides)
5. [Screenshot Gallery](#screenshot-gallery)
6. [Design System Reference](#design-system-reference)
7. [API Integration Reference](#api-integration-reference)

---

## Executive Summary

The **Forex Session Dashboard** is a professional-grade trading visualization tool designed for forex traders. It provides real-time session monitoring, economic calendar integration, position sizing calculations, and correlation analysis across 28 currency pairs.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Session Timeline** | Visual 24-hour timeline showing Sydney, Tokyo, London, New York sessions |
| **Economic Calendar** | Live economic events with AG Grid integration |
| **Position Calculator** | Risk-based lot sizing with live ATR data |
| **Correlation Analysis** | Heatmap and network graph for pair correlations |
| **Volatility Monitor** | HV-20, ATR, SMA-30 for all instruments |
| **World Clocks** | 4 analog clocks with session status indicators |
| **PWA Support** | Installable on mobile and desktop |

### Responsive Breakpoints

| Viewport | Width | Layout |
|----------|-------|--------|
| Mobile | < 768px | Single column, bottom tab navigation |
| Tablet | 768px - 1024px | 2-column grid, tab navigation |
| Desktop | > 1024px | 4-quadrant Bento grid layout |

---

## Architecture Overview

### Component Hierarchy

```
App.tsx (Root Orchestrator)
├── Desktop (>= 1024px)
│   └── BentoDesktopLayout
│       ├── DesktopNavbar
│       ├── Left Sidebar (20%)
│       │   ├── Time Card
│       │   ├── Active Sessions
│       │   └── PairsToTrade
│       └── Right Content Grid (80%)
│           ├── ForexChart / VolumeChart
│           ├── EconomicCalendar
│           └── SessionClocks
│
└── Mobile/Tablet (< 1024px)
    ├── OverviewPanel (home)
    ├── EconomicCalendar (calendar tab)
    ├── ForexChart (charts tab)
    ├── SessionGuide (guide tab)
    ├── WorldClockPanel (clocks tab)
    ├── FXToolsPanel (fx tools tab)
    ├── BestPairsWidget (screener tab)
    └── BottomNavBar (8 tabs)
```

### State Management

The application uses React hooks exclusively (no Redux/Context):

| State | Location | Purpose |
|-------|----------|---------|
| `selectedTimezone` | App.tsx | User's selected timezone (84 options) |
| `currentTime` | App.tsx | Real-time clock (1-second updates) |
| `sessionStatus` | App.tsx | OPEN/CLOSED/WARNING for each session |
| `activeSessions` | App.tsx | Currently active sessions array |
| `activeView` | App.tsx | Current tab/page selection |
| `alertConfig` | useSessionAlerts | Notification preferences |
| `installState` | usePWAInstall | PWA installation status |

### Data Flow

```
User Interaction → State Update → Render Cycle

Hooks Architecture:
├── usePWAInstall() → PWA installation management
├── useSessionAlerts() → Session notifications
├── useReducedMotion() → Animation preferences
├── useViewport() → Responsive breakpoint detection
├── useFXVolatility(instrument) → ATR data (1h cache)
├── useFXPrice(instrument) → Live prices (60s refresh)
├── useFXCorrelationMatrix() → Pair correlations
└── useFXAvailableInstruments() → Instrument list
```

---

## Component Reference

### Core Layout Components

#### 1. App.tsx
**File**: `src/App.tsx` (747 lines)
**Purpose**: Root orchestrator for the entire application

**Props Interface**: None (root component)

**Key State Variables**:
```typescript
const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(getInitialTimezone());
const [currentTime, setCurrentTime] = useState(new Date());
const [activeView, setActiveView] = useState<ViewType>('page1');
const [leftPaneOpen, setLeftPaneOpen] = useState(() => /* localStorage */);
const [isTimezoneMenuOpen, setIsTimezoneMenuOpen] = useState(false);
const [showHelpModal, setShowHelpModal] = useState(false);
```

**User Interactions**:
- Timezone selection via TimezoneModal
- Tab/page navigation
- Alert toggling
- PWA installation
- Help modal access

**Responsive Behavior**:
- Desktop (>= 1024px): Renders `BentoDesktopLayout`
- Mobile/Tablet (< 1024px): Renders tab-based layout with `BottomNavBar`

**Screenshot**: `desktop/01-trading-desk-timeline.png`

---

#### 2. BentoDesktopLayout.tsx
**File**: `src/components/BentoDesktopLayout.tsx` (302 lines)
**Purpose**: 4-quadrant desktop grid layout

**Props Interface**:
```typescript
interface BentoDesktopLayoutProps {
  selectedTimezone: Timezone;
  currentTime: Date;
  nowLine: number;
  sessionStatus: { [key: string]: SessionStatus };
  activeSessions: ActiveSessionData[];
  currentDSTStatus: boolean;
  onTimezoneSettingsClick: () => void;
  onHelpClick: () => void;
  alertConfig: { enabled: boolean; soundEnabled: boolean };
  onToggleAlerts: () => void;
  onToggleSound: () => void;
  installState: 'available' | 'dismissed' | 'installed' | 'unsupported';
  onInstallClick: () => void;
  onNavigatePage?: (pageNum: number) => void;
  pageViewContent?: React.ReactNode;
}
```

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│              DesktopNavbar (52px)               │
├──────────┬──────────────────────────────────────┤
│   Left   │  ┌──────────────┬──────────────┐    │
│  Sidebar │  │  ForexChart  │  Economic    │    │
│   (20%)  │  │              │  Calendar    │    │
│          │  ├──────────────┴──────────────┤    │
│          │  │      SessionClocks (row-2)   │    │
│          │  └─────────────────────────────┘    │
└──────────┴──────────────────────────────────────┘
```

**Visual Elements**:
- Glass morphism cards (`glass-soft` class)
- Gradient time display (day/night themes)
- Session progress bars with color-coded states
- Lazy-loaded ForexChart and EconomicCalendar

---

#### 3. DesktopNavbar.tsx
**File**: `src/components/DesktopNavbar.tsx` (120 lines)
**Purpose**: Top navigation bar for desktop layout

**Props Interface**:
```typescript
interface DesktopNavbarProps {
  onHelpClick: () => void;
  onProfileClick?: () => void;
  alertConfig: { enabled: boolean; soundEnabled: boolean };
  onToggleAlerts: () => void;
  onToggleSound: () => void;
  installState: 'available' | 'dismissed' | 'installed' | 'unsupported';
  onInstallClick: () => void;
  onNavigatePage?: (pageNum: number) => void;
}
```

**User Interactions**:
- Page navigation buttons: Trading Desk, Screener, AI Assistant, Backtesting
- Alert toggle button
- PWA install button
- Help icon
- Profile icon (optional)

**Visual Elements**:
- Fixed height: 52px
- Glass blur background (`backdrop-blur-xl glass-soft`)
- Gradient logo text: `FX_Saarthi`
- Hover states with cyan accent

---

#### 4. BottomNavBar.tsx
**File**: `src/components/BottomNavBar.tsx` (176 lines)
**Purpose**: Mobile tab navigation (8 tabs)

**Props Interface**:
```typescript
type ViewType = 'overview' | 'calendar' | 'charts' | 'guide' | 'clocks' | 'fxdata' | 'screener' | 'aiChat';

interface BottomNavBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}
```

**Tab Configuration**:
| Tab | Label | Icon | Active Color |
|-----|-------|------|--------------|
| overview | Overview | IconTarget | blue |
| calendar | Calendar | IconCalendarTab | emerald |
| charts | Charts | IconChartsTab | cyan |
| guide | Guide | IconGuideTab | amber |
| clocks | World | IconWorldClockTab | violet |
| fxdata | FX Tools | IconTarget | cyan |
| screener | Screener | IconTradingFlow | pink |
| aiChat | AI Chat | IconGlobe | purple |

**Visual Elements**:
- Horizontally scrollable with snap-scroll
- Fade gradient on right edge
- Scroll button indicator
- Safe area inset for notched devices

**Screenshot**: `iphone/01-overview.png`

---

#### 5. OverviewPanel.tsx
**File**: `src/components/OverviewPanel.tsx` (250 lines)
**Purpose**: Mobile home/overview screen

**Props Interface**:
```typescript
interface OverviewPanelProps {
  selectedTimezone: Timezone;
  currentTime: Date;
  activeSessions: ActiveSessionData[];
  onTimezoneSettingsClick: () => void;
  installState: 'available' | 'installed' | 'unsupported' | 'dismissed';
  onInstallClick: () => void;
  alertConfig: { enabled: boolean; soundEnabled: boolean };
  onToggleAlerts: () => void;
  onToggleSound: () => void;
}
```

**Visual Sections**:
1. **Current Time Card**: Large time display with day/night gradient
2. **Active Sessions**: Progress bars with elapsed/remaining time
3. **Timezone Button**: Quick access to timezone settings
4. **Social Links**: Mobile-only social media links

**Day/Night Theming**:
- Daytime (6:00-18:00): Amber/orange gradient, sun icon
- Nighttime: Blue/indigo gradient, moon icon

---

### Trading Tools

#### 6. ForexChart.tsx
**File**: `src/components/ForexChart.tsx` (1271 lines)
**Purpose**: 24-hour session timeline with economic events

**Props Interface**:
```typescript
interface ForexChartProps {
  nowLine: number;
  currentTimezoneLabel: string;
  timezoneOffset: number;
  sessionStatus: { [key: string]: SessionStatus };
  currentTime?: Date;
  isDSTActive?: boolean;
  activeSessions?: SessionData[];
  isAutoDetectDST?: boolean;
  manualDSTOverride?: boolean | null;
  onToggleDSTOverride?: (override: boolean | null) => void;
  onAutoDetectToggle?: (enabled: boolean) => void;
  fullscreenButton?: React.ReactNode;
}
```

**View Modes**:
| Mode | Component | Description |
|------|-----------|-------------|
| timeline | SessionBlocks | Per-session horizontal bars |
| volume | VolumeChart | Trading volume area chart |
| volatility | VolatilityPanel | Instrument volatility table |
| position | RiskCalculator | Position size calculator |
| correlation | CorrelationHeatMap | Pair correlation matrix |
| ai | Coming Soon | AI trading suggestions |

**Key Features**:
- Web Worker for session calculations
- Economic event indicators with stacking
- Blinking "Now" line with glow effect
- Layer filters (Sessions, Overlaps, Killzones, Volume, News)
- DST auto-detection with manual override

**Animation System**:
```typescript
const sessionBarVariants = {
  hidden: { scaleY: 0.8, opacity: 0 },
  visible: { scaleY: 1, opacity: 1, transition: { delay: i * 0.05 } },
  hover: { scaleY: 1.25 }
};
```

**Screenshots**:
- `desktop/01-trading-desk-timeline.png`
- `ipad/01-trading-desk-timeline.png`

---

#### 7. VolumeChart.tsx
**File**: `src/components/VolumeChart.tsx`
**Purpose**: Trading volume area chart visualization

**Data Source**: Hardcoded 48-point volume profile (30-min intervals)

**Volume Profile Pattern**:
```
00:00–02:30 → Sydney quiet (18-21)
03:00–05:30 → Asia builds (23-42)
06:00–08:30 → Tokyo peak (46-70)
09:00–11:30 → London burst (75-92)
12:00–14:30 → NY AM Killzone peak (90-100)
15:00–17:30 → Overlap decline (94-70)
18:00–20:30 → NY-only (68-44)
21:00–23:30 → Rollover lull (40-26)
```

**Screenshot**: `desktop/02-trading-desk-volume.png`

---

#### 8. VolatilityPanel.tsx
**File**: `src/components/VolatilityPanel.tsx`
**Purpose**: Instrument volatility table with HV-20, ATR

**Data Hook**: `useFXVolatility()`

**Table Columns**:
| Column | Description |
|--------|-------------|
| Instrument | Currency pair name |
| HV-20 | 20-day historical volatility |
| ATR | Average True Range |
| SMA-30 | 30-period simple moving average |
| BB Width | Bollinger Band width |

**Color Coding**:
- Green: Low volatility
- Yellow: Medium volatility
- Red: High volatility

**Screenshot**: `desktop/03-trading-desk-volatility.png`

---

#### 9. RiskCalculator.tsx
**File**: `src/components/RiskCalculator.tsx`
**Purpose**: Position size calculator with live data

**User Input Flow**:

**Step 1: Currency Pair Selection**
- Filter buttons: All, AUD, CAD, CHF, CNH, EUR, GBP, HKD, JPY, NZD, USD, XAG, XAU
- Searchable dropdown with 28 instruments
- Live mid price display

**Step 2: Account Parameters**
- Balance presets: 2.5K, 5K, 10K, 25K, 50K, 100K, Custom
- Leverage options: 10x, 20x, 30x, 40x, 50x, 100x

**Step 3: Risk Configuration**
- Risk slider: 0.5% - 5% (0.25% increments)
- Stop loss: 5-100 pips or 50-1000 ticks

**Step 4: Results Grid**
| Card | Color | Value |
|------|-------|-------|
| Position Size | Cyan | Lots with fee |
| Max Risk | Green | Dollar amount |
| Margin Needed | Blue | Percentage |
| ATR | Amber | Pips value |

**Core Calculation**:
```typescript
riskAmount = accountBalance × (riskPercent / 100)
pipValueQuote = pipSize × 100000
pipValueUSD = pipValueQuote × conversionRate
positionSize = riskAmount / (stopLossPips × pipValueUSD)
```

**Data Hooks**:
- `useFXVolatility(instrument)` → ATR value
- `useFXPrice(instrument)` → Live mid price
- `useFXAvailableInstruments()` → Instrument list

**Screenshot**: `desktop/04-trading-desk-position-size.png`

---

#### 10. CorrelationHeatMap.tsx
**File**: `src/components/CorrelationHeatMap.tsx`
**Purpose**: Pair correlation matrix visualization

**Library**: @nivo/heatmap (ResponsiveHeatMap)

**Data Hook**: `useFXCorrelationMatrix()`

**Color Scale**:
| Correlation | Color |
|-------------|-------|
| > 0.7 | Blue (strong positive) |
| > 0.3 | Green (moderate positive) |
| > -0.3 | Gray (weak) |
| > -0.7 | Orange (moderate negative) |
| ≤ -0.7 | Red (strong negative) |

**Screenshot**: `desktop/05-trading-desk-correlation.png`

---

#### 11. CorrelationNetworkGraph.tsx
**File**: `src/components/CorrelationNetworkGraph.tsx` (313 lines)
**Purpose**: Interactive network graph for correlations

**Library**: @nivo/network (ResponsiveNetwork)

**Props**: None (self-contained)

**Key State**:
```typescript
const [correlationThreshold, setCorrelationThreshold] = useState(0.5);
```

**Network Data Structure**:
```typescript
interface NetworkNode {
  id: string;      // Currency pair
  height: number;
  size: number;    // Node size (12px)
  color: string;   // Cyan (#22d3ee)
}

interface NetworkLink {
  source: string;
  target: string;
  distance: number;  // Inverse of correlation
}
```

**Visual Elements**:
- Threshold slider (0.0 - 1.0)
- Connection count display
- Color-coded links by correlation strength
- Custom tooltips for nodes and links
- Info panel explaining interpretation

---

#### 12. BestPairsWidget.tsx
**File**: `src/components/BestPairsWidget.tsx`
**Purpose**: Pair recommendations screener

**Categories**:
- Hedging pairs
- Trending pairs
- Reversal pairs

**API Endpoint**: `GET /api/fx/best-pairs?category={category}`

**Table Columns**:
| Column | Description |
|--------|-------------|
| Pair 1 | First instrument |
| Pair 2 | Second instrument |
| Correlation | Correlation coefficient |
| Score | Recommendation score |

**Screenshot**: `desktop/07-screener-page.png`

---

### Information Displays

#### 13. EconomicCalendar.tsx
**File**: `src/components/EconomicCalendar.tsx`
**Purpose**: Economic events with AG Grid

**Library**: AG Grid Community

**API Endpoint**: `GET /api/calendar/events`

**Filters**:
- Date range (Yesterday, Today, Tomorrow, Week)
- Currency pairs (multi-select)
- Impact levels (High, Medium, Low)

**Table Columns**:
| Column | Description |
|--------|-------------|
| Time | Event timestamp in user timezone |
| Currency | Affected currency |
| Event | Event name |
| Impact | High/Medium/Low badge |
| Forecast | Expected value |
| Previous | Previous value |
| Actual | Released value |

**Screenshot**: `iphone/02-calendar.png`

---

#### 14. SessionGuide.tsx
**File**: `src/components/SessionGuide.tsx`
**Purpose**: Session reference tables

**Sections**:
1. **Main Sessions**: Sydney, Tokyo, London, New York times
2. **Session Overlaps**: Multi-session overlap periods
3. **Killzones**: High liquidity institutional trading periods

**DST Toggle**: Winter (Standard Time) ↔ Summer (Daylight Saving Time)

**Screenshot**: `iphone/04-guide.png`

---

#### 15. WorldClockPanel.tsx
**File**: `src/components/WorldClockPanel.tsx`
**Purpose**: Global clocks with economic events

**Components**:
- SessionClocks (4 analog clocks)
- Upcoming economic events list

---

#### 16. SessionClocks.tsx
**File**: `src/components/SessionClocks.tsx`
**Purpose**: 4 analog session clocks

**Clock Configuration**:
| City | Timezone | Accent Color |
|------|----------|--------------|
| Sydney | Australia/Sydney | Cyan (#38bdf8) |
| Tokyo | Asia/Tokyo | Pink (#f472b6) |
| London | Europe/London | Yellow (#facc15) |
| New York | America/New_York | Green (#34d399) |

**Update Frequency**: 100ms (smooth second hand)

**Visual States**:
- Card border glows when session is active
- Status dot pulses on WARNING state
- Hour/minute/second hands with drop shadows

**Screenshot**: `iphone/05-world-clocks.png`

---

#### 17. PairsToTrade.tsx
**File**: `src/components/PairsToTrade.tsx` (260 lines)
**Purpose**: Active pairs widget based on sessions

**Props Interface**:
```typescript
interface PairsToTradeProps {
  activeSessions: ActiveSessionData[];
  sessionStatus: { [key: string]: SessionStatus };
  currentTime: Date;
}
```

**Data Structure**:
```typescript
interface TradingPair {
  symbol: string;
  category: 'forex' | 'indices' | 'crypto';
  sessions: string[];
  volume: number;      // 0-100 scale
  spread: number;      // Pips
  volatility: 'Low' | 'Medium' | 'High' | 'Very High';
  color: string;
}
```

**Animation**: Framer Motion staggered entrance (50ms delay)

---

#### 18. FXToolsPanel.tsx
**File**: `src/components/FXToolsPanel.tsx`
**Purpose**: Tabbed tools container for mobile

**Tabs**:
1. Position Size Calculator
2. Volatility Panel
3. Correlation Heatmap

---

#### 19. ChartTooltip.tsx
**File**: `src/components/ChartTooltip.tsx`
**Purpose**: Session hover tooltips

**Tooltip Types**:
1. **Session Tooltip**: Name, time range, volatility, recommended pairs, strategy
2. **Event Tooltip**: Impact, time, currency, forecast/previous/actual

---

### Modals & Overlays

#### 20. TimezoneModal.tsx
**File**: `src/components/TimezoneModal.tsx`
**Purpose**: Timezone selector with 84 timezones

**Features**:
- Searchable timezone list
- Grouped by region (Americas, Europe, Asia, etc.)
- Auto-detect option
- Offset display (UTC+/-HH:MM)

---

#### 21. HelpGuideModal.tsx
**File**: `src/components/HelpGuideModal.tsx`
**Purpose**: Help documentation modal

**Sections**:
- Getting Started
- Session Understanding
- Economic Calendar Usage
- Keyboard Shortcuts

---

#### 22. InstallModal.tsx
**File**: `src/components/InstallModal.tsx`
**Purpose**: PWA installation prompt

**Browser Detection**:
- Chrome/Edge: Native install prompt
- Safari: "Add to Home Screen" instructions
- Firefox: Installation not supported message

---

#### 23. BottomSheetDrawer.tsx
**File**: `src/components/BottomSheetDrawer.tsx`
**Purpose**: Mobile filter drawer

**Animation**: Slide up from bottom with drag-to-dismiss

---

#### 24. Menu.tsx
**File**: `src/components/Menu.tsx`
**Purpose**: Popover menu system

**Exported Components**:
- `PopoverMenu`: Base menu container
- `CheckboxMenuItem`: Toggle items
- `MenuSection`: Grouped items with headers
- `MenuButton`: Clickable actions

---

### UI Components

#### 25-41. Utility Components

| Component | File | Purpose |
|-----------|------|---------|
| AlertsToggle | AlertsToggle.tsx | Alert enable/disable toggle |
| AlertsToggleHeader | AlertsToggleHeader.tsx | Header alerts control |
| CalendarErrorBoundary | CalendarErrorBoundary.tsx | Error boundary for calendar |
| DateFilterPills | DateFilterPills.tsx | Date range filter buttons |
| FilterChip | FilterChip.tsx | Filter badge/chip |
| FullscreenButton | FullscreenButton.tsx | Fullscreen toggle |
| InstallButton | InstallButton.tsx | PWA install button |
| KeyboardShortcutsHelp | KeyboardShortcutsHelp.tsx | Keyboard shortcuts panel |
| MultiSelectDropdown | MultiSelectDropdown.tsx | Multi-select dropdown |
| SocialLinks | SocialLinks.tsx | Social media links |
| SwipeableFooter | SwipeableFooter.tsx | Mobile swipeable footer |
| TickerTape | TickerTape.tsx | Scrolling ticker |
| Tooltip | Tooltip.tsx | Accessible tooltips |
| TooltipPortal | TooltipPortal.tsx | Portal for tooltips |
| VersionDisplay | VersionDisplay.tsx | Version info display |
| VolatilityMeter | VolatilityMeter.tsx | Visual volatility gauge |
| ComingSoonPage | ComingSoonPage.tsx | Placeholder pages |
| icons | icons.tsx | SVG icon components |

---

## Feature Guides

### Feature 1: Session Timeline Visualization

**Overview**: The session timeline provides a visual representation of global forex trading sessions across a 24-hour period.

**Components Involved**:
- ForexChart.tsx (main)
- SessionBlocks (sub-component)
- SessionEventIndicators (sub-component)

**User Journey**:
1. View current time position via blinking "Now" line
2. Identify active sessions (highlighted bars)
3. Check overlap periods for high liquidity
4. Monitor economic events (colored dots)
5. Adjust timezone via header dropdown
6. Toggle DST mode if needed

**Screenshot**: `desktop/01-trading-desk-timeline.png`

---

### Feature 2: Economic Calendar

**Overview**: Real-time economic calendar with filtering and AG Grid integration.

**Components Involved**:
- EconomicCalendar.tsx
- DateFilterPills.tsx
- FilterChip.tsx

**API Endpoints**:
```
GET /api/calendar/events?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
GET /api/calendar/currencies
GET /api/calendar/today?date=YYYY-MM-DD
```

**Screenshot**: `iphone/02-calendar.png`

---

### Feature 3: Position Size Calculator

See [RiskCalculator.tsx](#9-riskcalculatortsx) for complete documentation.

**Screenshot**: `desktop/04-trading-desk-position-size.png`

---

### Feature 4: Correlation Analysis

**Overview**: Two visualizations for understanding currency pair correlations.

**Heatmap View**:
- Matrix grid showing all pair correlations
- Color-coded cells (-1 to +1 scale)
- Click to highlight specific pairs

**Network Graph View**:
- Force-directed graph layout
- Threshold slider to filter weak correlations
- Interactive node/link tooltips

**Screenshots**:
- `desktop/05-trading-desk-correlation.png`

---

### Feature 5: Volatility Monitoring

**Overview**: Real-time volatility metrics for all 28 instruments.

**Metrics Displayed**:
| Metric | Description |
|--------|-------------|
| HV-20 | 20-day historical volatility (annualized) |
| ATR | Average True Range (14-period) |
| SMA-30 | 30-period simple moving average |
| BB Width | Bollinger Band width (volatility indicator) |

**Screenshot**: `desktop/03-trading-desk-volatility.png`

---

### Feature 6: World Clocks

**Overview**: Four analog clocks showing major trading center times.

**Components**:
- SessionClocks.tsx (analog clocks)
- WorldClockPanel.tsx (container with events)

**Features**:
- Smooth second hand animation (100ms update)
- Session status indicators
- Upcoming events list

**Screenshot**: `iphone/05-world-clocks.png`

---

### Feature 7: Pairs Screener

**Overview**: AI-powered pair recommendations for different trading strategies.

**Categories**:
- Hedging: Negatively correlated pairs
- Trending: Strong directional pairs
- Reversal: Mean-reverting opportunities

**Screenshot**: `desktop/07-screener-page.png`

---

### Feature 8: PWA Installation

**Overview**: Progressive Web App support for mobile and desktop.

**Installation States**:
| State | Description |
|-------|-------------|
| available | Browser supports installation |
| installed | App already installed |
| unsupported | Browser doesn't support PWA |
| dismissed | User declined installation |

**Browser-Specific Behavior**:
- Chrome/Edge: Native `beforeinstallprompt` event
- Safari: Manual "Add to Home Screen" instructions
- Firefox: Not supported message

---

## Screenshot Gallery

### Desktop Screenshots (1920x1080)

| # | Filename | Description |
|---|----------|-------------|
| 1 | `01-trading-desk-timeline.png` | Session timeline view |
| 2 | `02-trading-desk-volume.png` | Volume chart view |
| 3 | `03-trading-desk-volatility.png` | Volatility panel |
| 4 | `04-trading-desk-position-size.png` | Position calculator |
| 5 | `05-trading-desk-correlation.png` | Correlation heatmap |
| 6 | `06-trading-desk-ai-suggestions.png` | AI suggestions (coming soon) |
| 7 | `07-screener-page.png` | Pairs screener |
| 8 | `08-ai-assistant-page.png` | AI assistant page |
| 9 | `09-backtesting-page.png` | Backtesting page |
| 10 | `10-timezone-dropdown-open.png` | Timezone selector |

### iPad Screenshots (1024x1366)

| # | Filename | Description |
|---|----------|-------------|
| 1 | `01-trading-desk-timeline.png` | Timeline on iPad |
| 2 | `02-trading-desk-volume.png` | Volume on iPad |
| 3 | `03-trading-desk-volatility.png` | Volatility on iPad |
| 4 | `04-trading-desk-position-size.png` | Calculator on iPad |
| 5 | `05-trading-desk-correlation.png` | Correlation on iPad |
| 6 | `06-screener-page.png` | Screener on iPad |
| 7 | `07-ai-assistant-page.png` | AI Assistant on iPad |
| 8 | `08-backtesting-page.png` | Backtesting on iPad |

### iPhone Screenshots (390x844)

| # | Filename | Description |
|---|----------|-------------|
| 1 | `01-overview.png` | Home/overview tab |
| 2 | `02-calendar.png` | Economic calendar tab |
| 3 | `03-charts.png` | Charts tab |
| 4 | `04-guide.png` | Session guide tab |
| 5 | `05-world-clocks.png` | World clocks tab |
| 6 | `06-fx-tools.png` | FX tools tab |
| 7 | `07-screener.png` | Screener tab |
| 8 | `08-ai-chat.png` | AI chat tab |

---

## Design System Reference

### Color Palette

#### Session Colors
| Session | Color | Hex |
|---------|-------|-----|
| Sydney | Cyan | #38bdf8 |
| Tokyo | Pink | #f472b6 |
| London | Yellow | #facc15 |
| New York | Green | #34d399 |

#### Status Colors
| Status | Color | Hex |
|--------|-------|-----|
| OPEN | Green | hsl(120, 70%, 55%) |
| CLOSED | Red | hsl(0, 60%, 45%) |
| WARNING | Amber | hsl(35, 100%, 60%) |

#### UI Colors
| Element | Color | Usage |
|---------|-------|-------|
| Background | #0f1419 | App background |
| Card | rgba(33,45,74,0.65) | Glass cards |
| Border | rgba(148,163,184,0.18) | Card borders |
| Text Primary | #e2e8f0 | Main text |
| Text Secondary | #94a3b8 | Muted text |
| Accent | #22d3ee | Cyan accent |

### Typography

| Element | Size | Weight | Font |
|---------|------|--------|------|
| Logo | 20px | Bold | System |
| Heading | 14px | Semibold | System |
| Body | 12px | Normal | System |
| Caption | 10px | Medium | System |
| Mono | 12px | Normal | Monospace |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Component padding |
| md | 12px | Card padding |
| lg | 16px | Section spacing |
| xl | 24px | Layout gaps |

### Glass Morphism Classes

```css
.glass-soft {
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(14,26,44,0.88));
  border: 1px solid rgba(180, 198, 231, 0.20);
  box-shadow: 0 20px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
  backdrop-filter: blur(20px);
}

.glass-shell {
  background: linear-gradient(145deg, rgba(11,18,32,0.9), rgba(15,23,42,0.9), rgba(12,17,29,0.95));
  border: 1px solid rgba(148, 163, 184, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

### Animation Specifications

| Animation | Duration | Easing | Property |
|-----------|----------|--------|----------|
| Tooltip Enter | 200ms | ease-out | opacity, scale |
| Tooltip Exit | 150ms | ease-in | opacity |
| Session Bar | 300ms | ease-out | scaleY |
| Bar Stagger | 50ms | - | delay |
| Event Indicator | 400ms | spring | scale, opacity |
| Now Line Blink | 1000ms | ease-in-out | opacity |
| Left Pane Slide | spring | stiffness: 300 | x, opacity |

---

## API Integration Reference

### Calendar API

```
Base URL: /api/calendar

GET /events
  Query: startDate, endDate, currencies[], impact[]
  Response: { data: CalendarEvent[], count: number }

GET /currencies
  Response: { data: string[] }

GET /today
  Query: date (YYYY-MM-DD)
  Response: { data: CalendarEvent[] }

GET /stats
  Response: { total: number, byImpact: {...}, byCurrency: {...} }
```

### FX Data API

```
Base URL: /api/fx

GET /prices/current
  Query: instrument (e.g., EUR_USD)
  Response: { instrument, bid, ask, mid, time }

GET /prices/all
  Response: { data: Price[] }

GET /volatility/:instrument
  Response: { instrument, hv20, atr, sma30, bbWidth }

GET /correlation-matrix
  Response: { data: CorrelationPair[] }

GET /best-pairs
  Query: category (hedging|trending|reversal)
  Response: { data: PairRecommendation[] }

GET /instruments
  Response: { data: string[] }
```

### Response Types

```typescript
interface CalendarEvent {
  id: number;
  time_utc: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string | null;
  previous: string | null;
  actual: string | null;
}

interface Price {
  instrument: string;
  bid: number;
  ask: number;
  mid: number;
  time: string;
}

interface CorrelationPair {
  pair1: string;
  pair2: string;
  correlation: number;
  updated_at: string;
}
```

---

## Appendix

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Open help modal |
| `Escape` | Close modal/menu |
| `Tab` | Navigate focusable elements |
| `1-8` | Switch tabs (mobile) |

### Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 80+ | Full support |
| Firefox | 75+ | No PWA install |
| Safari | 14+ | Limited PWA |
| Edge | 80+ | Full support |

### Known Limitations

1. PWA installation not available in Firefox
2. Correlation matrix requires backend data
3. Economic calendar depends on external data feed
4. WebSocket support planned for future release

---

*Documentation generated from codebase analysis and screenshot inventory.*
