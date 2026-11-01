# Basketball Tracking Implementation

## Purpose

Add Basketball as the first implemented destination under the Fitness module.

Recommended route:

- `/fitness` - Fitness directory and future activity overview
- `/fitness/basketball` - Basketball shooting record

The source is personal training data, so it belongs under Fitness rather than
Games, Finance, or the dashboard root. Basketball should remain isolated from
all other Fitness activity so future workouts, cardio, or strength records do
not depend on this sheet's parser.

## Source

Environment variable:

- `GOOGLE_SHEET_ID_BASKETBALL`

The inspected spreadsheet is titled `Basketball Tracking`. It has two tabs:

| Tab | Data |
|---|---|
| `Free Throws` | Free-throw session dates, makes, attempts, and percentages |
| `Three Pointers` | Three-point session dates, makes, attempts, and percentages |

The source also contains summary blocks in columns F-G. These values should
be calculated when practical rather than copied from sheet-formatted values.
The source summary values may be useful for cross-checking but are not the
source of truth for historical session calculations.

## Source Inspection Summary

### Free Throws

- The first four columns form the session ledger.
- There are 24 populated session rows visible in the inspected first 25 rows.
- Header row: `Date`, `Makes`, `Attempts`, `Percentages`.
- Recorded values include:
  - dates from 2023 through 2026
  - makes
  - attempts
  - source-calculated percentages
- Summary cells include overall percentage, recent-ten percentage, total
  makes, total attempts, and best-day percentage.

### Three Pointers

- The first four columns form the session ledger.
- Header row: `Date`, `Makes`, `Attempts`, `Percentages`.
- There are 15 populated session rows visible in the inspected first 25 rows.
- One early or blank row exists between the header and data and must not be
  interpreted as a session.
- Summary cells include overall percentage, recent-ten percentage, total
  makes, total attempts, and best-day percentage.

## Data Contract

Create a Basketball-specific normalization module:

```text
src/lib/fitness/
  basketball/
    types.ts
    sources.ts
    parser.ts
    data.ts
    basketball.test.ts
```

The normalized contracts should contain:

```text
BasketballSession
- date
- makes
- attempts
- percentage
- sourceRowNumber
- drill

BasketballDrillSummary
- drill
- sessionCount
- totalMakes
- totalAttempts
- weightedPercentage
- bestSession
- averageSessionPercentage
- recentSessions

BasketballLibrary
- title
- drills
- issues
```

Recommended drill union:

```text
"free-throws" | "three-pointers"
```

Use `null` for missing values. Do not use zero to represent a missing date,
makes count, attempts count, or percentage.

## Parser Guardrails

- Read both tabs by exact tab name.
- Ignore summary columns to the right of the session ledger.
- Ignore fully blank rows.
- Require a valid header row.
- Parse only non-negative integer makes and attempts.
- Exclude rows where attempts are zero, null, or malformed.
- Calculate percentage from normalized makes and attempts instead of trusting
  the formatted percentage cell:

```text
percentage = makes / attempts * 100
```

- Report source percentage mismatches instead of silently overwriting source
  values. A small rounding difference should be tolerated; a meaningful
  mismatch should produce a diagnostic.
- Use strict source-date parsing. Preserve the original date string alongside
  a normalized date only when date parsing succeeds.
- Sort sessions chronologically for charts while preserving source order in a
  raw ledger.
- Validate plausible session values and report implausible results as source
  diagnostics rather than deleting them:
  - makes must not exceed attempts
  - Free Throws should generally be analyzed independently from Three Pointers
  - unusually large attempt counts should remain visible and flagged
- Do not calculate totals across drills unless the UI explicitly labels a
  combined result.

## Derived Statistics

Use the session rows to derive:

- session count
- total makes
- total attempts
- weighted shooting percentage
- average session percentage
- best-day percentage
- last-ten-session weighted percentage
- most recent session
- change from the earliest to latest session
- improvement between the first and last ten sessions when enough valid data
  exists

The headline percentage should be weighted by attempts, not a plain average of
session percentages, unless the UI explicitly labels it as a simple average.

Rules for insufficient data:

- Do not show a trend if fewer than two valid sessions exist.
- Do not show a recent-ten comparison if fewer than two sessions exist.
- Do not claim improvement or decline when the source has only one result.
- Do not invent missing dates or percentages.

## Visual Direction

Build Basketball as a route-local shooting-log and field-performance board,
not a generic analytics page.

### Art direction

- Indoor-court palette:
  - warm hardwood orange-brown
  - deep gym navy or near-black
  - court-cream paper
  - basketball-orange signal accents
- Use condensed athletics typography for headline numbers.
- Use monospace labels for dates, makes, attempts, and source row numbers.
- Prefer a court-diagram rhythm, scoring lines, and shot-tracking bands over
  floating dashboard cards.
- Keep the existing neutral sidebar visually unchanged.
- Do not import the Games, Jobs, Books, or Finance visual themes.
- Add reduced-motion behavior for transitions.

### Desktop composition

1. Back navigation to `/fitness`.
2. Route header:
   - `BASKETBALL`
   - `Shooter record`
3. Drill switcher between Free Throws and Three Pointers.
4. Scoreboard strip:
   - weighted percentage
   - makes
   - attempts
   - sessions
   - recent-ten percentage
5. Large shoot-percentage timeline.
6. Makes-versus-attempts ledger underneath the chart.
7. Source diagnostics shown only when rows are missing or implausible.

### Mobile composition

- Use a horizontally swipeable or selectable drill switcher.
- Stack headline metrics into a two-column score strip.
- Make the chart horizontally scrollable only if labels become unreadable;
  otherwise normalize the chart to the available width.
- Keep the session ledger as readable stacked records rather than a compressed
  desktop table.

### Chart behavior

The primary chart should be a chronological percentage line with:

- attempt volume represented by a dot or bar size
- best-session marker
- recent-session emphasis
- visible hover and keyboard focus where an interaction is implemented
- date and source values in the accessible tooltip or associated text

SVG and CSS implementations must have accessible names and text equivalents.

## Component and Route Structure

Suggested route and components:

```text
src/app/fitness/page.tsx
src/app/fitness/fitness.css
src/app/fitness/basketball/page.tsx

src/components/fitness/
  fitness-directory.tsx
  basketball-dashboard.tsx
  basketball-shooting-chart.tsx
  basketball-session-ledger.tsx
```

Replace the current Fitness “Coming soon” page with a small directory containing
a Basketball destination. A card for Basketball should show the source-derived
session count only if the source connects successfully.

The Basketball route should expose a persistent back link to `/fitness` in the
page header.

## Server and Cache Behavior

- Create `src/lib/fitness/basketball/data.ts` with a server-only Google Sheets
  loader.
- Read only the two Basketball tabs.
- Revalidate on the existing one-hour pattern unless a more frequent refresh
  is intentionally tested and documented.
- Proposed cache tags:
  - `fitness`
  - `fitness:basketball`
- Never expose the spreadsheet ID, credentials, private URL, or raw token data
  to client components.
- Add parser diagnostics for missing tabs, malformed rows, missing dates, and
  implausible makes-versus-attempts values.

## Inspector and Tests

Scripts are partially scaffolded already:

- Inspector: `npm run inspect:basketball`
- Script: `scripts/inspect-basketball.mjs`

The inspector should eventually print:

- spreadsheet title
- exact tab names
- declared and populated row counts
- headers
- sample session rows
- source summary blocks
- malformed or blank session candidates

Add tests covering:

- free throws and three pointers remain separate
- blank and summary rows are excluded
- missing percentages are calculated rather than inferred as zero
- makes greater than attempts produce diagnostics
- zero attempts do not become zero-percent sessions
- weighted percentage differs correctly from a plain percentage average
- recent-ten weighting uses the last ten valid sessions
- strict invalid-date handling
- insufficient-data states

## Implementation Order

1. Finalize and test the source parser.
2. Add the server-only data loader.
3. Replace the Fitness placeholder with a directory.
4. Build the Basketball dashboard and back link.
5. Add route-local CSS and responsive behavior.
6. Run focused tests, lint, build, and live-route checks.

