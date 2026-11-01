---
name: life-dashboard-data-refresh
description: "Refresh and validate Life Dashboard data from Google Sheets and Docs. Use when source values change, a new module is updated, cache data looks stale, parser diagnostics appear, or subjective one-off statistics need recomputation."
argument-hint: "[module name, source file, or all]"
user-invocable: true
disable-model-invocation: false
---

# Life Dashboard Data Refresh

Use this workflow when source data changes or a dashboard result needs to be recomputed.

## Source-of-truth model

- Google Sheets and Google Docs remain server-only source stores.
- Environment variables in `.env.local` identify those sources.
- Parsers normalize source data into typed contracts and must preserve missing values, notes, and source diagnostics.
- Never infer a missing date, total, rating, status, genre, or measurement.
- The route UI should derive ordinary counts, distributions, rankings, and averages from normalized data.
- Subjective or presentation-only calculations may live in application code, but they must be documented and tested when their meaning is not obvious from the source.

## Refresh procedure

### When adding a module

Update this skill and the README in the same change whenever a module is added
or its source contract materially changes. At minimum, record:

- the module and source-of-truth environment variable,
- the inspected tabs, document sections, or named ranges,
- the inspector script and `package.json` command,
- the parser, loader, tests, and route locations,
- the cache and revalidation period,
- missing-value, unit, and plausible-value handling,
- subjective calculation rules for bespoke statistics,
- the expected manual refresh cadence.

1. Identify the module and source:

| Module | Source | Inspector |
|---|---|---|
| Finance | Multiple `GOOGLE_SHEET_ID_*` finance sheets | `npm run inspect:finance` |
| Music | `GOOGLE_SHEET_ID_MUSIC` | `npm run inspect:music` |
| Meditation | `GOOGLE_SHEET_ID_MEDITATION` | `npm run inspect:meditation` |
| Games | `GOOGLE_SHEET_ID_GAMES` | `npm run inspect:games` |
| Games / Random / GOI Experiment | `GOOGLE_SHEET_ID_GAMES_GOI` | `npm run inspect:games-goi` |
| Fitness / Basketball | `GOOGLE_SHEET_ID_BASKETBALL` | `npm run inspect:basketball` |
| Fitness / Races | `GOOGLE_SHEET_ID_RACES` | `npm run inspect:races` |
| Games / Cornhole | `GOOGLE_SHEET_ID_CORNHOLE` | `npm run inspect:cornhole` |
| MISC / Screen Time | `GOOGLE_SHEET_ID_SCREEN_TIME` | `npm run inspect:screen-time` |
| MISC / Movies | `GOOGLE_SHEET_ID_MOVIES` | `npm run inspect:movies` |
| Books | `GOOGLE_SHEET_ID_BOOKS` | `npm run inspect:books` |
| Jobs | `GOOGLE_SHEET_ID_JOBS` | `npm run inspect:jobs` |
| Secret | `GOOGLE_SHEET_ID_SECRET_SHEET` | `npm run inspect:secret` |
| Recipes | `GOOGLE_DOC_ID_RECIPES` | `npm run inspect:recipes` |
| Hikes | `GOOGLE_DOC_ID_HIKING` | `npm run inspect:hikes` |

2. Inspect the relevant source before changing it. Run the matching inspector and review:
   - Actual headers and tab names.
   - Populated row counts.
   - New or missing columns.
   - Source notes and formatting.
   - Suspicious values, especially units, zeros, dates, currencies, and ratings.

3. Correct source data rather than parser output when the source value itself is wrong.
   - Treat extra zeros, copied salary/hourly values, and wrong units as source corrections.
   - Do not silently divide, annualize, or repair a value unless the source contract explicitly defines that behavior.
   - Report implausible values through a parser diagnostic and let the user verify them.

4. Run the focused parser tests for the module.

   `npm test`

   Add or update focused parser tests for new columns, changed formats, missing values, and duplicate rows.

5. Refresh development cache by restarting the Next.js server if the previously loaded cached source remains visible. Next source reads use configured cache durations, commonly one hour.

6. Validate the route and mobile layout locally.

   `npm run dev`

7. Before completion, run:

   `npm run lint`
   `npm run build`

## Automatic behavior

- Normal source reads are already server-cached and periodically revalidated through the existing Next cache configuration.
- Google Sheets and Docs do not push changes into this dashboard. Automatic external refresh requires scheduled revalidation, deployment hooks, or webhook integration.
- No source should be treated as live data unless a push or polling implementation explicitly defines its latency.
- Until push infrastructure exists, practical refresh cadence is:
  - Finance, jobs, and books: check after bulk edits or at least weekly.
  - Music, games, meditation, and vault activity: check after adding records.
  - Recipes and hikes: inspect after source edits, since document paragraphs are less structured.

## Subjective statistics

For source-derived music stats, bespoke rankings, or other one-off analysis:

1. List the exact source fields used.
2. Define inclusion, de-duplication, missing-data, and tie-break rules.
3. Implement the calculation in or beside the module's parser.
4. Add focused tests for the calculation.
5. Keep source notes intact.
6. Remove visualizations if the source has insufficient data.

Examples of subjective updates:
- Music artist frequency after library or playlist changes.
- Music release-year ranking.
- Books average rating or annual reading wall.
- Jobs pay progression, compensation units, and current-role logic.

These calculations should not require a schema migration and should update automatically after source values are revalidated, when the calculation is truly derived from source data.
