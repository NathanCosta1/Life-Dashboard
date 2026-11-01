# Cornhole Tracking Implementation

## Purpose

Add Cornhole as an ongoing tracking destination inside the Games module.

Recommended route:

- `/games/cornhole`

Cornhole is a tracked game skill, not a one-off experiment. It should not be
placed under `/games/random`, because Random is reserved for isolated
experiments or short-lived projects. It also should not be placed under
Fitness, because Basketball is physical training practice while Cornhole is a
personal competitive-game record.

The Cornhole route should be separate from the Library and Random parsers. A
Cornhole spreadsheet layout must never leak into game-library types or data
loading.

## Source

Environment variable:

- `GOOGLE_SHEET_ID_CORNHOLE`

The inspected spreadsheet is titled `Cornhole Tracking`. It has two tabs:

| Tab | Data |
|---|---|
| `Cornhole Makes` | Standard bag-in-hole session dates, makes, attempts, and percentages |
| `Airmail Makes` | Airmail session dates, makes, attempts, and percentages |

The spreadsheet also contains summary blocks in columns F-G for both tabs.

## Source Inspection Summary

### Cornhole Makes

- The first four columns form the session ledger.
- There are 24 populated session rows visible in the inspected first 25 rows.
- Header row: `Date`, `Makes`, `Attempts`, `Percentage`.
- Dates span from 2021 through 2024.
- Sessions contain source-calculated percentages such as `43.13%` and
  `10.56%`.
- Summary cells include overall percentage, recent-ten percentage, total
  makes, total attempts, and best day percentage.

### Airmail Makes

- Header row matches the Cornhole Makes tab.
- One populated session exists in the inspected first 25 rows:
  - `6/26/21`
  - 21 makes
  - 160 attempts
- Summary cells report:
  - overall `13.13%`
  - recent-ten `13.13%`
  - total makes `21`
  - total attempts `160`
  - best day `13.13%`

Because Airmail has only one session in the current source, its trend
visualization should be disabled rather than drawing a false historical
decline or improvement.

## Data Contract

Create a Cornhole-specific normalization module:

```text
src/lib/games/cornhole/
  types.ts
  sources.ts
  parser.ts
  data.ts
  cornhole.test.ts
```

Recommended normalized contracts:

```text
CornholeSession
- date
- makes
- attempts
- percentage
- sourceRowNumber
- drill

CornholeDrillSummary
- drill
- sessionCount
- totalMakes
- totalAttempts
- weightedPercentage
- bestSession
- averageSessionPercentage
- recentSessions

CornholeLibrary
- title
- drills
- issues
```

Recommended drill union:

```text
"standard" | "airmail"
```

Use `null` for missing values. Never convert missing attempts, makes, dates, or
percentages to zero.

## Parser Guardrails

- Read both tabs by exact tab name.
- Ignore columns F-G summary blocks.
- Ignore fully blank rows.
- Require valid session headers and validate only the first four columns.
- Parse makes and attempts as non-negative integers.
- Exclude attempts equal to zero or malformed attempts.
- Calculate percentages from normalized makes and attempts:

```text
percentage = makes / attempts * 100
```

- Do not trust the source percentage column as the primary calculated result.
- Report a diagnostic when the source percentage and calculated percentage do
  materially disagree, accounting for normal decimal rounding.
- Parse strict dates, but retain original source text for source diagnostics.
- Sort valid sessions by date for charts.
- Keep raw ledger order available for source-order rendering if desired.
- Report makes greater than attempts as malformed source data.
- Preserve a current season or game date without inventing one.
- Do not assume each session used the same shot quantity or rules unless those
  details are available in the source.

## Derived Statistics

For each drill, derive:

- session count
- total makes
- total attempts
- weighted percentage
- average session percentage
- best session percentage
- recent-ten weighted percentage
- most recent session
- valid-session count

The standard Cornhole drill has enough rows for trend work. Airmail should show
a session summary but suppress trend and improvement claims until it has at
least two valid sessions.

Use weighted percentage as the headline because make counts and attempt counts
are unequal across sessions. Do not replace it with a mean of session
percentages.

Do not show:

- improvement between first and last sessions with fewer than two records
- recent-ten statistics with fewer than ten sessions unless labeled as
  `Available sessions`
- combined Cornhole percentage across drills; keep standard and Airmail
  separately identifiable
- percentage bands derived from nonexistent session data

## Visual Direction

Cornhole should feel like a physical tournament board and bag-slinging score
sheet, not an arcade neon dashboard.

### Art direction

- Course green, regulation navy, warm wood, and tournament-red accents.
- Large score-ribbon numbers.
- Monospace ledger labels for Date, Makes, Attempts, and Percentage.
- Board-like geometry: horizontal rails, distance marks, hole targets, or
  scoring ladders.
- A restrained tournament poster mood.
- Keep the route colors local to `/games/cornhole`.
- Do not reuse the Library cabinet theme or the yellow GOI Experiment theme.
- Add reduced-motion behavior to any animated chart or board elements.

### Desktop composition

1. Back link: `← Games directory`.
2. Header:
   - route index
   - `Cornhole`
   - `Throw record`
3. Drill selector:
   - Cornhole Makes
   - Airmail Makes
4. Scoreboard strip:
   - weighted percentage
   - makes
   - attempts
   - sessions
   - recent-ten percentage
5. Session percentage trend.
6. Makes-versus-attempts ledger.
7. Diagnostics section only when source data has an issue.

For Airmail with only one valid session, replace the trend area with a single
session scorecard and a clear `Not enough sessions for a trend` message.

### Mobile composition

- Make the drill selector a full-width segmented control.
- Show the scoreboard as a two-column strip.
- Render the chart full-width with readable date labels.
- Use stacked session records rather than forcing the ledger into a narrow
  table.
- Preserve visible keyboard and focus states for selector and chart controls.

### Chart behavior

Use a session-line or board-mark chart for valid percentages.

- X-axis: normalized session date or source row order for undated data
- Y-axis: percentage
- Dot size: proportional to attempt count
- Accessible summary: session count, weighted percentage, and latest result
- Each point needs an accessible label with date, makes, attempts, and
  percentage
- Text access to all values should remain available outside the visual chart

## Games Directory Integration

Add Cornhole as a permanent Games destination, distinct from Random and the
Library:

```text
/games
  Library
  Cornhole
  Random
```

The updated directory can present three destinations:

- **Library**: existing game collection
- **Cornhole**: ongoing make/attempt tracking
- **Random**: isolated one-off projects such as GOI Experiment

This is preferable to nesting Cornhole under Random or adding it to Games' data
model. The Games directory should link directly to `/games/cornhole`.

On smaller screens, stack all three destinations vertically or use a readable
single-column directory. Do not hide Cornhole behind a generic `Sports` menu.

## Component and Route Structure

Suggested route and components:

```text
src/app/games/cornhole/page.tsx
src/app/games/cornhole/cornhole.css

src/components/games/cornhole-dashboard.tsx
src/components/games/cornhole-shooting-chart.tsx
src/components/games/cornhole-session-ledger.tsx
```

Keep Cornhole CSS with the route instead of extending the library-heavy
`games.css` beyond a directory link. Reuse neutral layout and accessibility
patterns only; do not reuse route palettes or chart metaphors.

The page should include an obvious back link to `/games`, another breadcrumb
link to `Games`, and no dependency on the Library client's selected tab state.

## Server and Cache Behavior

- Create `src/lib/games/cornhole/data.ts`.
- Use a server-only Google Sheets loader.
- Read only the `Cornhole Makes` and `Airmail Makes` tabs.
- Use a one-hour cache revalidation period initially.
- Proposed cache tags:
  - `games`
  - `games:cornhole`
- Keep the spreadsheet ID, credentials, and raw rows out of the client bundle.
- Return parser diagnostics rather than failing the entire page for malformed
  individual sessions.

## Inspector and Tests

Scripts:

- Inspector: `npm run inspect:cornhole`
- Script: `scripts/inspect-cornhole.mjs`

The inspector should print:

- spreadsheet title
- tab names
- declared and populated row counts
- headers
- sample session rows
- source summary blocks
- malformed or blank candidates

Add tests covering:

- standard and Airmail tabs remain separate
- blank rows are ignored
- summary columns are excluded from session counts
- missing percentage is calculated
- zero attempts do not become session data
- makes greater than attempts produce diagnostics
- source-date parsing and invalid-date behavior
- weighted percentage differs from simple average
- recent-ten behavior uses the latest ten valid sessions
- Airmail remains a valid single-session summary without trend claims
- missing source tabs produce clear page diagnostics

## Implementation Order

1. Finalize the parser and data contract.
2. Add the server-only data loader and inspector output refinements.
3. Add Cornhole as a third Games destination.
4. Build the Cornhole dashboard and route-local tournament styling.
5. Add back navigation and mobile behavior.
6. Run focused tests, lint, build, and live-route checks.
