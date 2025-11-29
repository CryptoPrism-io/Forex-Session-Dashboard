# 📂 Project Structure

**Forex Session Trading Dashboard** - Complete directory organization guide

Last Updated: November 29, 2025

---

## 🌳 Directory Tree

```
Forex-Session-Dashboard/
│
├── 📁 src/                          # Frontend source code (React 19 + TypeScript)
│   ├── components/                  # React components
│   │   ├── ForexChart.tsx          # Main 24-hour timeline chart
│   │   ├── SessionClocks.tsx       # 4 timezone clocks
│   │   ├── EconomicCalendar.tsx    # Economic events calendar
│   │   ├── SessionGuide.tsx        # Trading session reference
│   │   ├── ChartTooltip.tsx        # Chart hover tooltip
│   │   ├── Tooltip.tsx             # Accessible tooltip system
│   │   ├── Menu.tsx                # Accessible menu components
│   │   ├── TickerTape.tsx          # Price ticker tape
│   │   └── InstallButton.tsx       # PWA install button
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useReducedMotion.ts     # Accessibility hook
│   │   ├── useTickerData.ts        # Ticker data fetching
│   │   └── usePWAInstall.ts        # PWA install logic
│   │
│   ├── backup-temp/                 # Temporary backup files
│   │   └── temp_App_snippet.txt    # Code snippets
│   │
│   ├── App.tsx                      # Main app component
│   ├── constants.ts                 # Session/timezone constants
│   ├── types.ts                     # TypeScript type definitions
│   ├── index.tsx                    # App entry point
│   └── vite-env.d.ts               # Vite environment types
│
├── 📁 server/                       # Backend API (Express.js + PostgreSQL)
│   ├── api/                         # API route handlers
│   │   ├── calendar/                # Economic calendar API
│   │   │   ├── events.js           # Event endpoints
│   │   │   └── stats.js            # Statistics endpoints
│   │   │
│   │   └── fx/                      # FX data API (NEW - Sprint 1)
│   │       ├── prices.js           # Price endpoints (2)
│   │       ├── volatility.js       # Volatility metrics (2)
│   │       ├── candles.js          # Historical OHLC data (1)
│   │       ├── correlation.js      # Correlation matrix (2)
│   │       └── bestPairs.js        # Trading recommendations (1)
│   │
│   ├── routes/                      # Route registration
│   │   ├── calendar.js             # Calendar routes
│   │   └── fx.js                   # FX data routes
│   │
│   ├── db.js                        # Database connection pools
│   ├── server.js                    # Express app entry point
│   ├── test-fx-db.js               # Database connectivity test
│   ├── package.json                 # Backend dependencies
│   └── FX_API_DOCUMENTATION.md      # Complete API reference
│
├── 📁 docs/                         # All project documentation
│   ├── sprint-reports/              # Sprint planning & reports
│   │   ├── FX_INTEGRATION_PLAN.md          # 6-week integration plan
│   │   ├── NEXT_STEPS.md                   # Sprint 2 guide (current)
│   │   ├── README_SPRINT1.md               # Sprint 1 quick reference
│   │   └── SPRINT1_COMPLETION_REPORT.md    # Sprint 1 detailed report
│   │
│   ├── deployment/                  # Deployment documentation
│   │   ├── GCP-DEPLOYMENT.md               # Cloud Run deployment guide
│   │   └── GCP-DEPLOYMENT-CHECKLIST.md     # Pre-deployment checklist
│   │
│   ├── prd/                         # Product requirements
│   │   ├── Forex Dashboard PRD – Complete Document.pdf
│   │   └── feature-roadmap-2025.txt
│   │
│   ├── README.md                    # Documentation index
│   ├── ANIMATIONS.md                # Animation system guide
│   ├── CHANGELOG.md                 # Version history
│   ├── PERFORMANCE.md               # Performance optimization
│   ├── PWA_FIX_SUMMARY.md          # PWA implementation notes
│   └── image.png                    # Reference image
│
├── 📁 public/                       # Static assets
│   ├── manifest.json                # PWA manifest
│   └── icons/                       # App icons (various sizes)
│
├── 📁 dist/                         # Production build output
│   ├── index.html                   # Built HTML
│   ├── assets/                      # Bundled JS/CSS
│   └── manifest.json                # PWA manifest
│
├── 📁 .github/                      # GitHub Actions workflows
│   └── workflows/
│       ├── deploy.yml               # Cloud Run deployment
│       └── pages.yml                # GitHub Pages deployment
│
├── 📄 Root Configuration Files
│   ├── package.json                 # Frontend dependencies
│   ├── package-lock.json            # Dependency lock file
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vite.config.ts               # Vite build configuration
│   ├── index.html                   # HTML entry point
│   ├── Dockerfile                   # Docker container config
│   ├── env.yaml                     # Cloud Run environment vars
│   ├── .dockerignore                # Docker ignore patterns
│   ├── .gitignore                   # Git ignore patterns
│   └── metadata.json                # Project metadata
│
├── 📄 Project Documentation (Root)
│   ├── README.md                    # Main project README
│   ├── CLAUDE.md                    # Development guidelines
│   └── PROJECT_STRUCTURE.md         # This file
│
└── 📁 Environment Files
    ├── .env.local                   # Local environment variables
    ├── .env.production              # Production environment
    └── .env.production.local        # Production local overrides
```

---

## 📊 Key Directories Explained

### `/src` - Frontend Source Code
**Purpose:** All React components, hooks, and TypeScript source files
**Key Files:**
- `App.tsx` - Main application component with routing and state
- `constants.ts` - Session definitions, timezones, clock configs
- `types.ts` - TypeScript type definitions

**Components:**
- Session visualization (ForexChart, SessionClocks)
- Economic calendar integration
- Accessibility features (Tooltip, Menu)

### `/server` - Backend API
**Purpose:** Express.js API serving forex data and economic calendar
**Databases:**
- `dbcp` - Economic calendar events
- `fx_global` - FX pipeline data (36 instruments)

**API Endpoints:**
- `/api/calendar/*` - Economic calendar (4 endpoints)
- `/api/fx/*` - FX data (8 endpoints - NEW)

### `/docs` - Documentation
**Purpose:** Centralized documentation repository
**Subdirectories:**
- `sprint-reports/` - Sprint planning and completion reports
- `deployment/` - Infrastructure and deployment guides
- `prd/` - Product requirements and roadmaps

### `/public` - Static Assets
**Purpose:** Static files served directly (no processing)
**Contents:**
- PWA manifest
- App icons (various sizes)
- Favicons

### `/dist` - Build Output
**Purpose:** Production-ready build artifacts
**Generated by:** `npm run build`
**Deployed to:** Cloud Run and GitHub Pages

---

## 🔧 Configuration Files

### Build & Development
| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build configuration, API proxy |
| `tsconfig.json` | TypeScript compiler options |
| `package.json` | Frontend dependencies and scripts |
| `server/package.json` | Backend dependencies |

### Deployment
| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Docker build |
| `env.yaml` | Cloud Run environment variables |
| `.dockerignore` | Files excluded from Docker build |

### Environment
| File | Purpose | Committed? |
|------|---------|------------|
| `.env.local` | Local development vars | ❌ No |
| `.env.production` | Production vars template | ✅ Yes |
| `.env.production.local` | Production overrides | ❌ No |

---

## 📁 File Naming Conventions

### Documentation
- **UPPERCASE.md** - Top-level docs (README, CHANGELOG, etc.)
- **kebab-case.md** - Feature/technical docs
- **SPRINT[N]_*.md** - Sprint-specific documentation

### Source Code
- **PascalCase.tsx** - React components
- **camelCase.ts** - Utilities, hooks, types
- **kebab-case.js** - Server-side modules

### Directories
- **lowercase** - All directory names
- **hyphenated** - Multi-word directories (e.g., `sprint-reports`)

---

## 🗂️ File Organization Rules

### Where to Put New Files

**React Components:**
```
src/components/ComponentName.tsx
```

**Custom Hooks:**
```
src/hooks/useHookName.ts
```

**API Endpoints:**
```
server/api/category/endpoint.js
server/routes/category.js
```

**Documentation:**
```
docs/                          # General technical docs
docs/sprint-reports/           # Sprint-specific docs
docs/deployment/               # Infrastructure docs
docs/prd/                      # Product requirements
```

**Tests:**
```
src/components/__tests__/ComponentName.test.tsx
server/api/__tests__/endpoint.test.js
```

---

## 📦 Dependencies

### Frontend (`package.json`)
- **React 19.2** - UI framework
- **Framer Motion 11.18** - Animations
- **React Aria 1.13** - Accessibility
- **Recharts** - Charts library
- **Vite** - Build tool

### Backend (`server/package.json`)
- **Express** - HTTP server
- **PostgreSQL (pg)** - Database client
- **CORS** - Cross-origin support
- **Dotenv** - Environment variables

---

## 🚀 Common Operations

### Development
```bash
# Start frontend dev server
npm run dev                    # → http://localhost:3000

# Start backend API server
cd server && node server.js    # → http://localhost:5000
```

### Building
```bash
# Build frontend for production
npm run build                  # → dist/

# Preview production build
npm run preview                # → http://localhost:4173
```

### Testing
```bash
# Test database connection
cd server && node test-fx-db.js

# Test API endpoint
curl "http://localhost:5000/api/fx/prices/all"
```

---

## 📖 Documentation Navigation

**Getting Started:**
1. [Main README](README.md) - Project overview
2. [CLAUDE.md](CLAUDE.md) - Development guidelines
3. [docs/README.md](docs/README.md) - Documentation index

**Current Work:**
- [Sprint 1 Complete](docs/sprint-reports/README_SPRINT1.md)
- [Sprint 2 Guide](docs/sprint-reports/NEXT_STEPS.md)

**Technical Docs:**
- [API Reference](server/FX_API_DOCUMENTATION.md)
- [Animations](docs/ANIMATIONS.md)
- [Performance](docs/PERFORMANCE.md)

---

## 🔍 Finding Specific Files

**"Where is the ForexChart component?"**
→ `src/components/ForexChart.tsx`

**"Where are the API endpoints?"**
→ `server/api/fx/*.js` (8 endpoints)

**"Where is the Sprint 1 report?"**
→ `docs/sprint-reports/SPRINT1_COMPLETION_REPORT.md`

**"Where are the session constants?"**
→ `src/constants.ts`

**"Where is the database connection?"**
→ `server/db.js`

---

## 🧹 Cleanup & Maintenance

### Regular Cleanup
```bash
# Remove old node_modules
rm -rf node_modules server/node_modules
npm install
cd server && npm install

# Remove build artifacts
rm -rf dist

# Clean git untracked files
git clean -fdx
```

### Backup Important Files
- `src/` - All source code
- `server/` - Backend code
- `docs/` - Documentation
- `.env.production.local` - Environment secrets

---

## 📊 Project Stats

| Category | Count | Location |
|----------|-------|----------|
| **Frontend Components** | 15+ | `src/components/` |
| **Custom Hooks** | 5+ | `src/hooks/` |
| **API Endpoints** | 12 | `server/api/` |
| **Documentation Files** | 15+ | `docs/` |
| **Database Tables** | 7 | PostgreSQL (fx_global) |
| **Total Lines of Code** | ~5000+ | Entire project |

---

## 🎯 Next Steps

**For New Developers:**
1. Read [README.md](README.md)
2. Read [CLAUDE.md](CLAUDE.md)
3. Check [docs/sprint-reports/NEXT_STEPS.md](docs/sprint-reports/NEXT_STEPS.md)

**For Contributors:**
1. Follow naming conventions above
2. Place files in correct directories
3. Update documentation when adding features
4. Keep this file updated with major changes

---

*Last Updated: November 29, 2025*
*Current Sprint: 2 (Frontend Components)*
*Project Status: Active Development*
