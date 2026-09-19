# Phase 2: Financial Dashboard

Build a useful Finance hub from the four existing read-only Google Sheets.
Step 0 is complete: the sources are reachable, but they are presentation
oriented rather than normalized database tables. Phase 2 should therefore use
small source-specific adapters and a shared normalized model at the UI
boundary.

## Step 0: Verified source inventory

- [x] The inspection command now checks all four configured IDs without
  printing spreadsheet IDs, credentials, or cell contents.
- [x] `GOOGLE_SHEET_ID_NET_WORTH` points to **Overall: Income, Expenses, and
  Net Worth** with four tabs:
  - `Net Worth`: a mixed balance-sheet/calculator layout; the first row is not a
    normal record header. It includes a `Year`/`Net Worth` chart block plus
    account labels and blank spacer columns.
  - `Net Worth Milestones`: milestone-oriented two/three-column layout.
  - `Income`: compact `Year`/`Gross Income` records.
  - `Expenses`: compact `Year`/`Expenses` records, with text-like inferred
    values and some blank/spacer rows.
- [x] `GOOGLE_SHEET_ID_INVESTING` points to **Monthly Investments** with:
  - `2026`: a monthly table with a second detail-header row. Account groups
    contain `Starting Contributions`, `Monthly Contributions`, and sometimes
    `Match`; only the latter contribution columns should feed monthly
    contribution charts. The first account columns are balances/starting
    amounts, not new contributions. `Total` includes the monthly contribution
    and match columns, while spacer columns and `Notes` are auxiliary.
  - `2027`: an empty pre-created tab.
- [x] `GOOGLE_SHEET_ID_VACATION_FINANCES` points to **Vacation Finances** with
  four variable-shape tabs: `Mt Marcy`, `Mexico Cruise`, `WVA Hike`, and
  `Mt Rogers (fail)`. Each tab uses a trip title/date string as its first
  populated header rather than a stable column schema; row widths vary and
  blank rows are present.
- [x] `GOOGLE_SHEET_ID_HOUSING` points to **Apartment Finances** with one
  variable-shape `HV - RVA` tab. It has a title-style first row, uneven row
  widths, and no reliable normalized header row in the inspected range.
- [x] The inspection command completed successfully against all four sources.

## Step 1: Freeze contracts from the observed layouts

- [x] Add `src/lib/finance/sources.ts` as the source registry. It maps
  each domain to its environment variable, selected tabs, bounded A1 ranges,
  cache tag, and adapter status. Keep spreadsheet IDs server-only.
- [x] Add shared normalized domain types under `src/lib/finance/types.ts`:
  `NetWorthPoint`, `IncomePoint`, `ExpensePoint`, `InvestmentMonth`,
  `VacationTrip`, and `HousingSnapshot` only where supported by source data.
- [x] Add parser utilities for currency, dates, year/month labels,
  and blank/spacer rows. Parsers must return row-numbered validation errors
  instead of silently coercing malformed values.
- [x] Treat the Net Worth workbook as several blocks, not one table:
  - extract the explicit `Year`/`Net Worth` chart block;
  - separately parse balance-sheet account rows only after identifying their
    row labels and value columns;
  - expose `Income`, `Expenses`, and milestones as separate datasets.
- [x] Treat Investing as a wide-to-long transformation:
  - combine non-empty yearly tabs;
  - ignore spacer columns;
  - use the detail-header row to exclude starting balances and include only
    monthly contributions and match values;
  - map each contribution column to an account name and each row to a month;
  - use the sheet’s `Total` when valid, otherwise calculate a total from valid
    account values and report discrepancies.
- [x] Treat Vacations and Housing as semi-structured documents:
  - inspect rows/cells by position and labels rather than relying on row 1;
  - preserve source tab and row number;
  - do not claim category, date, or per-day metrics unless the source contains
    those fields consistently.
- [x] Add sanitized fixtures matching these layouts in
  `src/lib/finance/fixtures.ts`, including empty 2027,
  spacer rows, unnamed columns, variable trip rows, and malformed currency.

The adapters are pure functions over sheet matrices and preserve source tab and
row coordinates, so adding another yearly investing tab or trip tab only
requires adding it to the source configuration; the normalized UI types do not
change.

## Step 2: Ship the first data-backed Finance views

### Step 2A: Investing

The Investing tab is a contribution cockpit, not a spreadsheet viewer. It
should answer how much was invested, which accounts received contributions, and
whether the contribution pace is changing.

- [x] Implement the reusable Investing loader:
  - discover all four-digit year tabs dynamically;
  - preserve empty tabs such as `2027` as an explicit empty state;
  - read each tab through the cached matrix helper;
  - parse every tab with the same wide-to-long adapter;
  - combine months and preserve tab/row locations.
- [x] Implement the Investing dashboard model:
  - selected-year months and totals;
  - account totals, percentages, active-month counts, and latest contribution;
  - best month, average contribution, month coverage, and three-month rolling
    average;
  - warnings for malformed values and provided-total discrepancies.
- [x] Build the Investing route view with:
  - year selector synced to `year`;
  - view selector synced to `view=overview|accounts|detail`;
  - KPI cards for total invested, average month, best month, and account count;
  - stacked monthly contribution chart with rolling-average overlay;
  - account allocation cards and selected-month detail;
  - explicit empty-year, partial-year, warning, loading, and error states.
- [x] Keep account colors and chart series derived from normalized account names
  so new account columns require no UI changes.

#### Investing UI proposal

```text
Investing                                  [2026 v] [Overview v]

[ Total Invested ] [ Monthly Average ] [ Best Month ] [ Active Accounts ]

[ Stacked Monthly Contributions + 3-Month Rolling Average ]

[ Annual Pace / Month Coverage ] [ Account Allocation ]

[ Selected Month Detail ]
```

- Use stacked monthly bars for account contributions and a rolling-average line.
- Hovering a month shows each account, the total, and whether the total came
  from the sheet or was calculated.
- Clicking a month opens the detail panel; clicking a legend item isolates an
  account series.
- The Investing area uses Overview and Monthly Detail views; account
  allocation is represented through the contribution chart and detail data
  rather than a separate Accounts tab.
- The Detail view shows account values, calculated total, sheet total, notes,
  source row, and any discrepancy warning.
- Do not count unrecorded months as zero. Show recorded-month coverage
  separately from contribution totals.
- For an empty year such as `2027`, show that the tab exists but has no usable
  investment records, with an action to return to the latest populated year.
- Keep chart labels and account colors stable by deriving them from normalized
  account names, not column positions.

#### Investing implementation slices

- [x] **2A.1 Data loader:** dynamic year-tab discovery, cached matrix reads,
  parsing, aggregation, and source-safe diagnostics.
- [x] **2A.2 View model:** KPI, allocation, coverage, rolling-average, and
  discrepancy calculations.
- [x] **2A.3 Route shell:** URL query state, year/view selectors, and independent
  loading/empty/error states.
- [x] **2A.4 Visualizations:** Overview and Monthly Detail views with KPI cards,
  contribution chart, and source detail.
- [x] **2A.5 Verification:** empty 2027, spacer columns, malformed currency,
  inconsistent totals, future-year tabs, and responsive accessibility checks.
- [x] **2A.6 Additional visuals:** contribution calendar and starting-balance
  versus new-contribution comparison.
- [x] **2A.7 Projected yearly rate:** annualize the observed contribution
  rhythm without presenting it as a guaranteed return or investment performance.

### Step 2B: Finance navigation and shared states

- [x] Make `/finance` the Finance module home rather than redirecting directly
  to one data source. It presents cards/buttons for Investing, Net Worth,
  Income & Expenses, Vacations, and Housing.
- [x] Give Investing its own route at `/finance/investing`. Its
  `overview` and `monthly detail` controls are views within the
  Investing area, not peer Finance areas.
- [ ] Add the remaining Finance area routes. Each route should expose only
  metrics supported by its adapter and show an explicit planned/unsupported
  state otherwise.

### Step 2C: Overview / Net Worth

- [x] Use the verified Net Worth chart block for a historical
  trend and latest-value KPI. Add assets/liabilities/month-over-month cards
  only after the balance-sheet rows have been mapped and validated; do not
  infer them from arbitrary labels.

### Step 2D: Income and Expenses

- [x] Add annual comparison cards and a combined
  savings-rate view from the verified yearly datasets. Clearly distinguish
  missing years from zero values.

### Step 2E: Vacations

- [x] **2E.0 Contract discovery:** normalize trip title/date ranges, identify
  total rows, preserve source tabs and raw rows, and distinguish full-trip
  totals from per-person totals. Keep missing values distinct from zero.
- [x] **2E.1 Vacation overview:** show trip count, average/longest duration,
  total and average cost, average cost per day, annual totals, and notable
  trip insights from the current complete trip records.
- [x] **2E.2 Year navigation:** group trips by start year and expose a year
  selector before the individual trip tabs.
- [x] **2E.3 Trip detail tabs:** show date range, duration, total cost,
  per-person cost when explicitly recorded, cost-per-day, and validated
  expense rows/categories.
- [ ] **2E.4 Derived analytics:** add category comparisons and pre-trip versus
  during-trip spending only when labels are explicitly present; never infer
  categories from arbitrary descriptions or count parenthetical notes as
  additional expenses.
- [x] Cost-per-day is now available because all current trip tabs provide
  usable date ranges and explicit total rows. Cross-trip category comparisons
  remain deferred until expense-row semantics are consistently extractable.

### Step 2F: Housing

- [x] Map the `HV - RVA` sections into move-in, setup/furnishing, and monthly
  recurring-cost contracts.
- [x] Implement recurring-cost and monthly trend cards from the mapped sections.

### Step 2G: FIRE calculator

The FIRE calculator is a planning tool rather than a direct source report. It
may be prefilled from Finance data, but all assumptions remain editable and
no calculator changes are written back to Google Sheets.

- [x] Add a standalone `/finance/fire` route linked from the Finance module
  home.
- [x] Prefill the calculator from the latest available net-worth value,
  latest annual expenses, and annualized contributions from the latest
  populated investing year. Label the source years in the UI.
- [x] Keep assumptions explicit and editable: investable portfolio, annual
  spending, annual contributions, real return, withdrawal rate, and years to
  retirement.
- [x] Calculate and display the FI number, full-FI progress, Coast FI target
  and progress, portfolio-supported spending, and an estimated FI year.
- [x] Add a projection chart in today’s dollars with a clearly labeled FI
  target and a bounded 50-year horizon.
- [x] Keep the calculation layer pure and test the core milestone math,
  including already-at-FI portfolios.
- [x] Explain that the projection is educational and assumes steady returns,
  contributions, and spending; do not present it as financial advice or a
  guaranteed forecast.

## Step 3: Reliability and UX

- [x] Keep each source fetch and adapter independent so one malformed workbook
  does not break the Finance route.
- [x] Add loading, empty, unsupported, and error states per view, including
  the distinction between an empty tab (`2027`) and an unavailable source.
- [x] Use bounded ranges after contract mapping instead of production-wide
  `A1:Z100` reads; retain the broad inspector only for deliberate discovery.
- [x] Use the existing read-only cache helper with per-source tags and a
  server-side refresh/revalidation path.
- [x] Keep diagnostics actionable but safe: source, tab, range, row, and field
  are allowed; credentials, spreadsheet IDs, and raw financial cell contents
  are not.

## Step 4: Verification and completion gate

- [x] Add parser/adapter tests for valid, empty, spacer-heavy, malformed, and
  inconsistent-total inputs.
- [x] Run type-check, lint, production build, inspection, and manual responsive
  checks for every supported view.
- [x] Confirm the UI renders correctly with one source unavailable while the
  other views remain usable.
- [x] Phase 2 is complete only when each shipped metric traces to a documented
  source tab/range and validated field. Any metric that requires guessed
  semantics remains explicitly deferred.
