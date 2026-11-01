# Screen Time Implementation Plan

## Purpose

Add a personal screen-time tracker under the MISC module.

Recommended route:

- `/misc/screen-time`

Screen time is not a general game, fitness, finance, work, or secret activity.
It is an individual one-off tracking collection, so it belongs under **MISC**
while remaining a first-class, source-isolated page.

The MISC index should gain a second permanent destination:

1. `Secret`
2. `Screen Time`

Secret should remain visually smaller and anchored as the corner/private
collection. Screen Time should be a normal MISC subpage card.

## Source

Environment variable:

- `GOOGLE_SHEET_ID_SCREEN_TIME`

The spreadsheet is titled `2026 Phone Screen Time`.

The inspector found two tabs:

| Tab | Meaning |
|---|---|
| `Nathan` | Nathan's weekly and extra-day screen-time history |
| `Maddy` | Maddy's weekly and extra-day screen-time history |

Both tabs use a weekly cadence with a stated annual goal of fewer than 1,000
hours. The goal is 2026-specific and should not be silently reused by future
years. If another year is added, the parser should either require a year in the
contract or label the goal as a source-scoped 2026 goal.

## Observed Source Shape

The primary data begins in column A:

| Column | Header |
|---|---|
| A | `WEEK` |
| B | `AVG` |
| C | `GOAL < 1000 HOURS` |
| D | `Hours so far` |
| E | `Total for on pace for ~ <1000` |
| G | `Extra days not part of the weeks` |
| H | Extra-day value paired with the extra-day label |
| I | Optional source note, including imputation notes |

The source is laid out in two side-by-side reporting blocks:

1. Weekly rows in columns A-E.
2. Extra days and summary values beginning in column G.

### Nathan tab

The initial weeks include:

```text
1/4 - 1/11  | 2.916666667 daily average | 29.3 hours so far
1/11 - 1/18 | 4.1             daily average | 58.0 hours so far
1/18 - 1/25 | 2.666666667    daily average | 76.7 hours so far
```

It also contains extra-day records such as January 1 at 2.3 hours and summary
metadata near the right side of the sheet.

The source has 52 returned weekly rows, but the final loaded range may contain
blank trailing rows or summaries mixed into later sections. Do not infer that
every returned row is a week.

### Maddy tab

The structure matches Nathan's:

```text
WEEK
AVG
GOAL < 1000 HOURS
Hours so far
Total for on pace for ~ <1000
```

The inspected source includes intentionally imputed daily values, such as:

```text
3.192208673 <- (imputed mean)
```

This must remain visible as a source note. Do not silently present an imputed
day as an original measurement.

## Routing

Use one source-specific route under MISC:

```text
/misc
/misc/screen-time
```

Do not add the route to the sidebar as a separate top-level destination. It is
already part of MISC.

The route must include an obvious back link to `/misc`.

## Data Contract

Create a dedicated parser and server loader:

```text
src/lib/misc/screen-time/
  types.ts
  sources.ts
  parser.ts
  data.ts
  screen-time.test.ts
```

Recommended types:

```text
ScreenTimeOwner = "Nathan" | "Maddy"

ScreenTimeWeek {
  label: string
  dailyAverageHours: number | null
  hoursSoFar: number | null
  onPaceHours: number | null
  sourceRowNumber: number
}

ScreenTimeExtraDay {
  label: string
  hours: number | null
  note: string | null
  sourceRowNumber: number
  imputed: boolean
}

ScreenTimeSummary {
  owner: ScreenTimeOwner
  totalHours: number | null
  extraDayHours: number | null
  latestWeek: ScreenTimeWeek | null
  highestWeekAverage: ScreenTimeWeek | null
}

ScreenTimeLibrary {
  year: 2026
  goalHours: 1000
  people: ScreenTimeSummary[]
  issues: ScreenTimeIssue[]
}
```

The owner must be derived from the exact tab name. Do not merge Nathan and
Maddy into a shared unnamed record list.

Missing values stay `null`.

## Source Parsing Rules

### Weekly rows

- Only parse rows where column A looks like a week label.
- Accept labels matching a source-like `M/D - M/D` pattern.
- Reject summary text such as `Total Hours`, although summary columns can be
  handled separately if they occur in recognizable summary locations.
- Parse `AVG` as daily hours.
- Parse `Hours so far` as cumulative weekly hours if the value is numeric.
- Parse `Total for on pace` as cumulative on-pace hours if numeric.
- Do not compare blank source cells to zero.
- Do not silently convert `AVG` from percentage, days, minutes, or decimal
  percentages.
- A source average is already hours per day.
- Preserve source decimal precision through parsing; format only at render time.
- De-duplicate exact repeated week labels if source copying creates duplicate
  rows. When duplicates are valid historical observations with separate notes,
  preserve them and add a diagnostic rather than silently deleting the rows.

### Extra days

- Parse extra-day labels from the right-hand block.
- Recognized labels include month/day combinations and summary labels.
- Do not parse summary labels such as `Total Hours` as extra days.
- Parse optional values in column H.
- Preserve notes in column I.
- Mark records as `imputed` only when a recognized source note explicitly says
  they are imputed.
- Do not extrapolate missing daily values.
- Do not add extra-day values into week totals unless the source contract
  defines that extra days are separate and the UI explains the distinction.

### Summary values

- Do not rely exclusively on `Hours so far` for the latest total if source
  totals are malformed or stale. Derive a candidate total only from valid
  numeric weekly cumulative values, then expose conflicts with source summary
  totals as diagnostics.
- The `GOAL < 1000 HOURS` column currently does not contain values in the
  inspected range. It is a header/goal label, not a row-level source figure.
- Preserve `1000` as the route-level goal for this source but distinguish it
  from actual source hours.
- Future years should add their own source contract rather than dynamic
  assumptions.

### Date and year rules

- The sheet title identifies `2026`; normalize week labels against that year.
- Convert week labels such as `1/4 - 1/11` into an exact normalized range only
  when year rollover is unambiguous.
- Preserve the original label in the normalized contract.
- For Jan-Dec ranges, assign year 2026. If a label crosses December to January
  or a future year is added, report the ambiguity instead of guessing.
- UI date formatting must not vary due to the browser locale.

## Derived Statistics

Use only parsed weekly rows.

Recommended metrics:

- current cumulative hours
- goal remaining
- distance from on-pace hours
- average daily use
- weeks recorded
- highest weekly average
- lowest weekly average
- recent-four-week average
- annual projected total from the latest cumulative value and elapsed weeks
- percent of annual goal used

Projection guardrails:

- Use a simple current-rate projection only if at least two weekly records
  exist with valid cumulative totals.
- Formula for elapsed-week projection:

```text
annual projection = latest hours so far / elapsed weeks * 52
```

- Never label this as an actual outcome or forecast the user's behavior.
- Keep the source summary's own `Total for on pace` value separate from the
  derived projection.
- If no valid rows exist, hide the projection rather than showing a zero.
- Missing or stale cumulative values must produce diagnostics.

Do not create or remove page stats based on Tiny/Transient counts. The source
already supports durable year-level tracking.

## Visual Direction

Build this as a route-local "phone usage log / annual instrument panel."

### Art direction

- Dark charcoal/ink background.
- Muted phone-screen green or signal amber.
- A thick physical meter/tachometer aesthetic.
- Monospaced labels for hours, weeks, and source values.
- Large headline hours left aligned rather than a card grid.
- Keep route visuals inside `/misc/screen-time`.
- Do not reuse the Secret lock-screen, vault, or private-color system.
- Do not visually imply surveillance, shame, or moral judgment.
- Use direct copy: `Recorded use`, `Against goal pace`, `Weekly average`.

Avoid generic wellness-dashboard aesthetics, soft gradients, stock phone
illustrations, and motivational copy.

### Desktop composition

1. Back link to `/misc`.
2. Route header:
   - `2026`
   - `Screen Time`
   - source owner selector if both people are loaded
3. A large goal meter:
   - current recorded hours
   - 1,000-hour goal
   - remaining hours
4. A cumulative-hours trend:
   - source cumulative hours
   - source on-pace line
5. A recent-week strip or chart:
   - each week label
   - daily average
   - hours increase between weeks
6. Owner summary comparison, only if both owners are meaningful:
   - latest cumulative hours
   - daily average
   - pace distance
7. Extra-days panel preserving labels, values, and imputation notes.
8. Diagnostics section only when there are malformed or missing source values.

The user asked for Screen Time in MISC, so Nathan and Maddy remain family data
owners rather than separate top-level modules.

### Owner selector

Use an accessible segmented selector:

- `Nathan`
- `Maddy`

The selected owner should be reflected in all route statistics and charts.
Do not show a combined total unless it is explicitly labeled as two-person
combined data; deriving it without consent would create an unsupported product
decision.

Default selection should be `Nathan`, unless source inspections or the data
confirm a stronger project default.

### Mobile composition

- Stack the owner selector as a two-column control.
- Show the goal meter full-width.
- Keep one weekly data point per row rather than overcrowding it.
- Make the cumulative chart horizontally readable if it has more than ten
  weeks, or reduce to a readable 52-week compressed plot with text equivalents.
- Stack extra days below the chart.
- Preserve visible focus and keyboard states.

### Accessibility

- Every chart needs an accessible name.
- Provide text summaries and table or list equivalents for all chart values.
- Use underlined/tabular numbers rather than red-green-only progress states.
- Do not animate values between owner selections.
- Add reduced-motion behavior if any transitions are used.
- Keep contrast strong for muted historical series and goal lines.

## Implementation Structure

```text
src/app/misc/screen-time/page.tsx
src/app/misc/screen-time/error.tsx

src/components/misc/
  screen-time-dashboard.tsx
  screen-time-meter.tsx
  screen-time-chart.tsx
  screen-time-week-list.tsx

src/app/misc/misc.css
```

Keep owner selection client-side, but normalize and pass a complete source
snapshot from the server. Do not read environment variables or Google data in
browser components.

## Server and Cache Behavior

- Create `src/lib/misc/screen-time/data.ts`.
- Use one-hour Next.js cache revalidation initially.
- Proposed cache tags:
  - `misc`
  - `misc:screen-time`
- Read only the `Nathan` and `Maddy` tabs.
- Never expose spreadsheet IDs, credentials, or raw private source data to
  client components.
- Return parser issues rather than failing the whole page for individual
  malformed week or extra-day rows.
- Missing source tabs should produce a clear server route error state naming
  only the environment variable/module, not the sheet ID or private URL.

## Inspector and Package Script

The inspector is currently present at:

- `scripts/inspect-screen-time.mjs`
- package script: `npm run inspect:screen-time`

The inspector should print:

- spreadsheet title
- exact tab names
- declared and populated row counts
- weekly headers
- first weekly records
- extra-day block records
- source summary labels
- populated cell counts by column
- any notes or imputation markers

Do not use source summary values as the normalized week contract without
inspection and parser tests.

## Tests

Add focused parser tests covering:

- Nathan and Maddy remain separate.
- valid `M/D - M/D` week labels are parsed.
- blank weekly rows do not become zero values.
- malformed numeric values produce diagnostics.
- extra-day values remain separate from week totals.
- `(imputed mean)` or equivalent notes are preserved and marked imputed.
- `Total Hours` is not parsed as a week or extra day.
- cumulative hours and on-pace values stay independent.
- source values below zero or implausible values are diagnosed.
- a missing Maddy/Nathan tab produces clear loader/parser errors.
- fewer than two valid records hide projection calculations.
- 2026 is used for source date normalization without mutating original labels.
- owner switching derives all values only from the selected owner's records.

## Implementation Order

1. Refine the inspector output if sample values are not sufficient.
2. Implement types, parser, and source contract.
3. Add server-only loader and cache tags.
4. Add parser tests.
5. Add MISC Screen Time card and route.
6. Build the owner selector, goal meter, trend, extra-day ledger, and diagnostics.
7. Add route-local CSS and mobile behavior.
8. Run focused tests, lint, build, and live-route checks.

