# SPEC.md — Personal OS (Life Dashboard)

## 1. Project Overview & Vision
A unified, modular personal dashboard ("Personal OS") that acts as an interactive visual layer on top of personal data stored in Google Drive and Google Sheets. 

Instead of opening disparate spreadsheets, this application transforms raw tracking data into actionable dashboards, sleek charts, and interactive calculators. The design should look and feel like a modern, premium SaaS analytics platform.

---

## 2. Core Architecture Principles

1. **Zero-Cost Infrastructure ($0 Running Cost):**
   - **Frontend & Hosting:** Next.js deployed on Vercel's Hobby (free) tier.
   - **Database & Storage:** Google Sheets / Google Drive API acts as the headless backend and single source of truth. No hosted databases (PostgreSQL, Supabase, etc.) to manage or pay for.
   - **Authentication/Security:** Google Service Account with read-only access to specific sheet IDs via environment variables.

2. **Extreme Modularity ("Plug-and-Play" Modules):**
   - Built as a modular monolith. Each domain (`finance`, `recipes`, `fitness`, `career`) lives in its own isolated route directory.
   - Modules must be decoupled: if the Recipes module breaks, the Finance module continues functioning without issue.
   - Adding a new life domain should be as simple as:
     1. Creating a new route folder (`/src/app/[module]/page.tsx`).
     2. Adding a nav item to the sidebar config.

3. **Data Safety First:**
   - The app is primarily **read-only** or append-only. 
   - Core data remains in Google Sheets so that data is never locked in, lost, or corrupted if the web app fails.

---

## 3. Tech Stack

- **Framework:** Next.js (App Router, React 19 / Server Components)
- **Language:** TypeScript (Strict mode enabled)
- **Styling:** Tailwind CSS (Dark mode by default)
- **UI Components:** Shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Data Visualization:** Recharts (integrated via Shadcn Chart components)
- **Data Fetching:** Google Sheets API (`googleapis` npm package or lightweight fetch with JWT)

---

## 4. Information Architecture & Layout

### Global Layout (`/src/app/layout.tsx`)
- **Persistent Sidebar Navigation:**
  - **Dashboard (`/`):** High-level summary widgets across all active modules.
  - **Finance (`/finance`):** Net worth tracker, asset breakdown, FIRE simulator. *(Phase 1 Priority)*
  - **Recipes & Kitchen (`/recipes`):** Recipe repository, random meal generator, grocery list builder. *(Future)*
  - **Fitness (`/fitness`):** Running logs, lifting PRs, workout tracking. *(Future)*
  - **Career & Learning (`/career`):** Reading list, skill trees, certification roadmap. *(Future)*
  - **Bottom Section:** Quick-links to external Google Drive folders, system status, theme toggle.

- **Mobile View:** Collapsible drawer/bottom sheet navigation for full mobile responsiveness.

---

## 5. Data Flow & Google Drive Integration
[ Google Drive / Google Sheets ]
│
▼ (Google Sheets API via Service Account)
[ /src/lib/sheets.ts ] <-- Reusable, typed generic fetcher
│
▼
[ Server Components / Route Handlers ]
│
▼
[ UI Components (Charts, Metric Cards, Calculators) ]

- **Generic Sheet Utility:** A centralized utility in `/src/lib/sheets.ts` that accepts a `spreadsheetId` and `range`, parses rows into structured JSON, and enforces TypeScript types.
- **Caching & Performance:** Leverage Next.js `fetch` cache and `revalidate` tags (e.g., revalidate data every 1–6 hours or on-demand via a manual "Refresh Data" button) to stay well within Google API rate limits.

---

## 6. Design & UX Guidelines

- **Theme:** Dark mode default (neutral slate/zinc backgrounds with subtle borders `#27272a`).
- **Cards:** Elevated cards (`bg-card`, subtle rounded corners `rounded-xl`, light border).
- **Typography:** Inter or Geist sans; clean tabular numbers (`font-mono` / `tabular-nums`) for currency and metrics.
- **Empty & Loading States:** Every dashboard module must have clean skeleton loaders (`Skeleton` component) and friendly error boundaries if Google Sheets fails to respond.

---

## 7. Phased Roadmap

- **Phase 1 (Foundation):**
  - Base Shell Layout + Sidebar Navigation.
  - Google Sheets API utility setup.
- **Phase 2:**
  - **Finance Module** (Net Worth, Investing, Income & Expenses, Vacations,
    Housing, and FIRE planning).
- **Phase 3:**
  - **Music Module:** random album picker for the "Albums: To listen"
    playlist and year-by-year Replay/Everything browsing and statistics.
  - See [PHASE_3_MUSIC.md](./PHASE_3_MUSIC.md) for the detailed plan.
- **Phase 4:**
  - **Fitness & Habit Tracker** (5K running log, pushup/training progress).
- **Phase 5:**
  - **Unified Home Dashboard** (Aggregated high-level overview cards from all modules).
