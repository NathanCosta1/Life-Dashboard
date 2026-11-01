# Games Directory Proposal

## Recommendation

Make Games a gaming-directory home page instead of a single collection page.

The directory should have two primary destinations:

1. **Library** - the existing digital, analog, watchlist, completed, and disliked game collections.
2. **Random** - isolated one-off projects such as getting-over-it runs, challenges, data visualizations, and future gaming tests.

The existing `GOOGLE_SHEET_ID_GAMES` spreadsheet remains the Library source. The new
`GOOGLE_SHEET_ID_GAMES_GOI` spreadsheet is the first source for the Random
directory and must remain isolated from the library parser.

This structure prevents one-off source layouts, unusual units,
columns, and bespoke calculations from contaminating the regular game library.

## Proposed routes

| Route | Purpose |
|---|---|
| `/games` | Directory landing page |
| `/games/library` | Existing Games dashboard |
| `/games/random` | Index of one-off gaming projects |
| `/games/random/goi-experiment` | GOI Experiment project page |

Compatibility behavior:

- `/games/library` becomes the primary existing-library route.
- `/games` continues to show the directory instead of immediately redirecting.
- `/games?view=...` is optional and does not need to be preserved because the
  library currently uses client-side tabs.
- Existing source data, search, filters, picking, and favorites remain unchanged.

## Games directory visual direction

Use the Game directory as a physical arcade cabinet index rather than another
dashboard menu.

### Art direction

- Charcoal-black outer field.
- Arcade-red and safety-yellow accents.
- Brass or warm-yellow labels for the first random project.
- High-contrast condensed headings and monospaced data labels.
- Large route index numbers.
- Pixel-grid registration marks kept subtle enough not to interfere with text.
- A dense but readable cabinet-style lower navigation.

Avoid:

- generic card grids,
- gaming-controller imagery,
- neon-overdone cyberpunk styling,
- reusing the existing Books, Jobs, or MISC visual systems,
- mixing color or typography from random projects into the main library,
- making one-off projects look permanent before they have enough content.

### Desktop composition

The `/games` page should occupy the full route:

1. A header containing a small `GAMES DIRECTORY` label and `Games`.
2. A two-column cabinet:
   - Library is larger and visually primary.
   - Random is narrower but distinct.
3. The Library tile opens the existing digital/analog collection and includes a
   small source-derived count summary.
4. The Random tile opens the random-project index and shows one active project:
   **GOI Experiment**.
5. A bottom status strip lists source IDs as human labels such as
   `Library: connected` and `Random: 1 project`, never credentials or sheet URLs.

### Mobile composition

- Stack the Library and Random cabinets vertically.
- Keep each destination full-width and at least 180px tall.
- Preserve visible focus rings and use native link/button semantics.
- Do not compress the GOI comparison into tiny chart labels.

## Existing library behavior

Move the current `/games` dashboard to `/games/library`.

Preserve:

- Digital, Analog, Watchlist, Completed, and Disliked views.
- Favorite-owner filters.
- Search.
- The random game picker.
- Favorite highlighting and source notes.
- Route-local responsive behavior.

This route must not be visually redesigned as part of the directory pass.

## Random index

`/games/random` is an archive index, not a feed.

Each random-project tile should include:

- a small project number,
- name,
- source status,
- an optional period or challenge label,
- a short factual subtitle,
- a direct route.

Initially, only GOI Experiment appears.

The first tile can read:

- `Random 01`
- `GOI Experiment`
- `200 consecutive runs`
- `First 100 vs. second 100`

There should be no empty placeholder card for another project.

## GOI Experiment page

### Source findings

The new spreadsheet is titled `Getting Over It Experiment`. It contains one sheet,
`Sheet1`.

The sheet contains:

- 100 run times in `First 100 Runs`.
- 100 run times in `Second 100 Runs`.
- A text note explaining that the runs were not reset between batches.
- Calculated/source-printed summary statistics to the right of the run columns,
  including fastest, slowest, average, median, standard deviation, and threshold counts.

The source is a documented project rather than a normal game library. It must
have its own parser and type contract. Do not merge it with the existing Games
library parser.

### Page visual direction

Build the GOI Experiment page like a run-log instrument panel.

- Warm paper or aged arcade monitor background.
- Thick black separators.
- A two-column “run batch” comparison.
- First 100 and Second 100 presented as separate vertical run tables.
- Yellow highlighted improvements.
- A big comparison strip at the top:
  - run counts,
  - fastest time,
  - average time,
  - median time,
  - standard deviation.
- A histogram or bucket chart for run-time bands.
- A simple first-versus-second average-to-median comparison.
- Source note retained exactly beneath the project header or in a visible
  source-note strip.

Use one strong visual metaphor only: **run-time tape or timing instrumentation**.
Do not add charts for every statistic.

### Suggested desktop layout

1. A `Back to Random` link and `GAMES / RANDOM 01` breadcrumb.
2. Header:
   - `GOI Experiment`
   - `200 consecutive runs`
   - exact source note
3. Four summary instruments:
   - Overall fastest
   - Overall average
   - Runs under 2 minutes
   - Runs over 2:30
4. A comparison section:
   - two side-by-side batch panels,
   - batch averages,
   - fastest and slowest values,
   - median,
   - standard deviation,
   - a clear arithmetic delta where both batches contain valid data.
5. A histogram with 20-second, 30-second, or source-defined time buckets.
6. A 100-cell run timeline for each batch.

The run timelines may use small blocks, dots, or a thermal-style strip. Do not
turn the values into vertical spines. Each dot should expose the exact time with
a visible label in a detail panel or tooltip.

### Run-time formatting

- Preserve source decimal values as the normalized value when parsing.
- Display GOI run times as `m:ss.sss`.
- Keep raw source values available for calculations and diagnostics.
- Never assume an unlabeled value is seconds or minutes; this sheet uses seconds
  and already contains right-side human-readable summaries.
- Compute comparisons only when both values are valid numbers.
- Do not present missing batch values as zero.

### Suggested normalized data contract

```text
GettingOverItLibrary {
  title: "Getting Over It Experiment"
  batches: [
    {
      label: "First 100 Runs"
      runs: number[]
      summary: {
        fastestSeconds: number | null
        slowestSeconds: number | null
        averageSeconds: number | null
        medianSeconds: number | null
        standardDeviationSeconds: number | null
        underTwoMinutes: number | null
        underOneMinuteFifty: number | null
        overTwoMinutesThirty: number | null
      }
    },
    {
      label: "Second 100 Runs"
      runs: number[]
      summary: ...
    }
  ]
  sourceNote: string
  issues: SourceIssue[]
}
```

Names can be adjusted to match existing repository conventions, but source values
must remain separate from derived UI statistics.

## Technical isolation

Add a random-project-specific subtree:

```text
src/lib/games/
  data.ts
  parser.ts
  types.ts
  sources.ts
  random/
    goi-experiment/
      data.ts
      parser.ts
      parser.test.ts
      types.ts
      sources.ts

src/app/games/
  page.tsx
  games.css
  library/
    page.tsx
  random/
    page.tsx
    goi-experiment/
      page.tsx
      goi-experiment.css

src/components/games/
  games-directory.tsx
  random-dashboard.tsx
  goi-experiment-dashboard.tsx
```

The GOI project loader should use Next cache tags such as:

- `games`
- `games:random`
- `games:random:goi-experiment`

The existing `/games/library` loader should remain separate from random-project reads.

Use `server-only` in random-project loaders. Keep credentials, spreadsheet IDs, Google
API calls, and private source metadata outside client components.

## Parser behavior

The GOI parser should:

- read the single `Sheet1` tab;
- require exactly one source title layout;
- detect column A as First 100 Runs and column B as Second 100 Runs;
- accept numeric positive values only;
- ignore blank run cells without counting them as zero;
- preserve malformed values as source issues;
- detect the source note from the sheet's non-run text column;
- avoid duplicating values already printed as summary statistics;
- compute summary statistics only when enough valid data exists;
- produce separate batch summaries;
- support missing summary cells or header drift.

Header drift should produce visible source diagnostics rather than silently
shifting batch columns. The existing library parser should remain unaffected.

## Update and refresh behavior

- Add `GOOGLE_SHEET_ID_GAMES_GOI` to `.env.local` and deployment secrets only.
- Add a dedicated inspector script:
  `npm run inspect:games-goi`
- Add the spreadsheet to the data-refresh skill source map.
- Add a module entry for GOI Experiment under the Games refresh cadence.
- Cache GOI reads through the existing Next data pattern.
- Revalidate after spreadsheet edits or with a documented one-hour refresh.
- Restart the dev server if stale cached source values remain after inspection.

This refresh needs no new database unless GOI moves to real-time polling or push.
Google Sheets does not push changes into Next.js.

## Testing

Add focused tests for:

- 100 values in each batch;
- blank run values;
- malformed run values;
- header drift;
- one batch missing;
- median calculation with even and odd sets;
- average and standard deviation calculation;
- minutes/seconds display formatting;
- threshold counts;
- source-note preservation;
- missing summary behavior;

Test the GOI Experiment page separately from the existing Games library parser.

## Acceptance criteria

- `/games` is a directory hub.
- The current Games collection is available at `/games/library`.
- `/games/random` lists only existing random projects.
- GOI Experiment has a dedicated route and parser.
- The source note is visible and preserved.
- The two 100-run batches are clearly separated.
- Missing values are not displayed as zero.
- Time units are consistent and source data remains server-only.
- No credentials or sheet IDs are rendered.
- Library interactions, favorites, and filters remain intact.
- Mobile has a clear back path and readable run comparison.
- The refresh skill and inspector are updated when the route is implemented.
