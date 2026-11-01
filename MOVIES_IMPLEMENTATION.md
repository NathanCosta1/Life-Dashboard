# Movies Implementation Plan

## Purpose

Add a movie-watching dashboard to MISC at `/misc/movies`.

Movies is a personal viewing and review collection with a separate watchlist. It
does not belong under Books, Music, Games, or a top-level dashboard module.
Keep it isolated under MISC alongside Screen Time and Secret.

The MISC index should show the new destination as a cinema-style card. Secret
should remain the small borderless top-right link.

Recommended routes:

```text
/misc
/misc/movies
```

Use one source-specific layout under `src/app/misc/movies/` and route-local
styles under `src/app/misc/movies/movies.css`. Do not add movie colors, scenery,
font treatments, or dashboard components to the global MISC shell.

## Source

Environment variable:

```text
GOOGLE_SHEET_ID_MOVIES
```

The inspected spreadsheet is titled `Movies`.

| Tab | Purpose | Inspected headers |
|---|---|---|
| `Reviews / Notes` | Watched movies, ratings, viewing context, and notes | `Movie`, `Watched Date`, `Rating`, `With Who?`, `Where?`, `Notes / Review` |
| `To Watch` | Intended viewing queue and interest metadata | `Title`, `Did Maddy say she is interested?`, `Description` |

Keep both tabs server-only and read them through the existing Google Sheets
helper. Do not send sheet IDs, credential data, watchlist contents, notes, or raw
source rows to client components.

Create a dedicated source module:

```text
src/lib/misc/movies/
  types.ts
  sources.ts
  parser.ts
  data.ts
  movies.test.ts
```

Add this inspector command:

```json
"inspect:movies": "node --env-file=.env.local scripts/inspect-movies.mjs"
```

The inspector should print:

- spreadsheet title and exact tab names,
- header values and column positions,
- populated row counts,
- rating units and malformed rating examples,
- date parse failures,
- review and watchlist row counts,
- missing/non-empty values by column,
- no notes, names, viewing locations, or private source content.

## Inspected Source Shape

The `Reviews / Notes` tab currently has:

```text
Movie
Watched Date
Rating
With Who?
Where?
Notes / Review
```

Current examples include:

```text
The Housemaid | 12/23/2025 | 3/10 | Maddy, Mom, Sophia | Dartmouth AMC
The Minecraft Movie | 1/24/2026 | 4/10 | Maddy | Home...
Verity | 1/24/2026 | 4/10 | Maddy | Regal Short Pump
American Psycho | 10/18/2026 | 6/10 | Maddy | Home...
Nightcrawler | 10/26/2026 | 7/10 |  Maddy | Home...
```

The `To Watch` tab currently has:

```text
Title
Did Maddy say she is interested?
Description
```

Current named examples include The Matrix, The Big Short, Donnie Brasco,
Pulp Fiction, and Scarface. Donnie Brasco also has an interest marker and
description.

Do not interpret these examples as fixed fixtures. Implementation and tests
must use representative test data and read the current sheet at runtime.

## Data Contract

```text
MovieReview {
  id
  title
  watchedDate: normalized ISO date or null
  watchedDateLabel: original source label or null
  rating: number or null
  ratingScale: 10
  companions: string[]
  companionText: original source text or null
  location: string | null
  notes: string | null
  sourceRowNumber: number
}

MovieWatchlistItem {
  id
  title
  interestedByMaddy: boolean | null
  description: string | null
  sourceRowNumber: number
}

MovieIssue {
  source
  tab
  rowNumber
  field
  message
}

MoviesLibrary {
  reviews: MovieReview[]
  watchlist: MovieWatchlistItem[]
  summary: MovieSummary
  issues: MovieIssue[]
}

MovieSummary {
  reviewCount
  watchlistCount
  averageRating: number | null
  highestRatedReview: MovieReview | null
  lowestRatedReview: MovieReview | null
  firstWatch: MovieReview | null
  latestWatch: MovieReview | null
  companionCounts: NamedCount[]
  locationCounts: NamedCount[]
  yearlySummaries: MovieYearSummary[]
}
```

Use `null` for missing or malformed values. Never use zero to represent a blank
rating, date, description, or watchlist interest marker.

## Parser Guardrails

### Reviews / Notes

- Validate exact header names after normalized whitespace/case comparison.
- Skip fully blank rows.
- Require a nonblank movie title.
- Parse ratings only when a complete value is recognized:
  - preferred source shape: `n/10`
  - accept whitespace around numbers
  - reject negative values, values above 10, and values without a valid scale
- Preserve the original rating text alongside the numeric value only if useful
  for a diagnostic.
- Parse `M/D/YYYY`, `M/D/YY`, and valid ISO source strings.
- Preserve the raw date label. Normalize only when parsing is unambiguous.
- Report invalid dates rather than constructing dates from nearby cells.
- Split `With Who?` on commas and trimmed separators while preserving the
  original companion text separately if desired.
- Keep notes as one intact multiline string; preserve paragraph line breaks.
- Do not trim meaningful review punctuation or rewrite review copy.
- Report duplicate movie/title and date combinations instead of silently
  dropping them. The same movie may legitimately be watched more than once,
  so do not automatically de-duplicate reviews.

### To Watch

- Skip fully blank rows.
- Require a title.
- Normalize `Y`/`Yes`/`Interested` values as true.
- Normalize `N`/`No`/`Not interested` as false if those values appear later.
- Preserve any unknown or blank interest value as `null`; never infer interest
  from an empty cell or a description.
- Keep descriptions intact in source order and as multiline text.

### Missing value rules

If the source has no reviews:

- show an empty theater state instead of zero-filled hero statistics;
- omit ratings charts and ranking cards instead of claiming no movies;
- show the watchlist if it has usable rows.

If only one review is available:

- show the rating and count;
- do not show a trend, growth, or best-vs-average comparison;
- do not extrapolate an annual trajectory.

Do not label absent data "unavailable because of an error."

## Derived Statistics

Derive all ordinary statistics from normalized reviews. The UI must visibly
label any aggregate as rounded, calculated, or source-derived.

Recommended metrics:

- total watched
- average rating from valid reviews
- median rating
- highest-rated movie
- lowest-rated movie
- first and latest watch
- watch count by year
- average rating by year
- companion frequency, split only by exact normalized names
- home versus theater viewing frequency by normalized location/fuzzy grouping
- reviews with notes percentage
- watchlist count
- marked interested watchlist count

Recommended chart views:

- yearly rating bars, one bar per valid rating in that year
- cumulative movie count as a thin projection line
- rating distribution on a 1-10 scale
- companion leaderboard
- location/type ledger
- rating scatter or horizontal ranking strip
- watchlist marquee

Keep charts usable on small screens. Use plain text summaries next to visual
encodings. Provide accessible names and visible keyboard focus on controls.

### Derived calculation rules

- Average rating = sum of valid ratings / number of valid ratings.
- Median rating = middle value of sorted valid ratings, or mean of the two
  central values for an even count.
- Weighted trends must not use missing ratings as zero.
- Year is derived only from a normalized watched date.
- A review without a date remains in lifetime totals but is excluded from
  year charts.
- Location grouping should begin exact/trimmed/case-normalized only. Initial
  implementation should not infer that "Dartmouth AMC" and "Regal Short Pump"
  belong to the same theater.
- For companion counts, split comma-separated names and count each companion
  once per movie to avoid duplicate mentions on one row.
- Do not compute a year-over-year change for fewer than two valid yearly sets.
- Keep ties stable and alphabetical.
- Highest and lowest ratings can show tied values if a stable ranking is
  documented; avoid visually implying one winner when ratings tie.

## Visual Direction

The Movies page should feel like an old/current mixed-purpose movie theater,
not a red generic card dashboard.

### Overall art direction

- Deep black and maroon auditorium background.
- Burgundy velvet accents.
- Warm amber marquee bulbs and projection-light gold.
- Cream ticket-paper text surfaces.
- Cinemascope borders and aspect ratios.
- Slight film grain texture rendered locally, not as a page-wide body effect.
- Use large serif poster typography for titles and the marquee.
- Use monospaced labels for dates, ratings, source diagnostics, and counts.
- Route typography should remain isolated from Finance, Books, Games, and MISC.

The page itself can use the visual metaphor of a theater program:

- marquee header
- screen/projection hero
- red velvet curtain side accents
- seat or ticket rows
- concession-style stat labels
- film-reel or sprocket details used sparingly

### Desktop composition

```text
+---------------------------------------------------------------+
| MARQUEE                                                        |
| MOVIES                                                         |
| Showing now: 2026  |  [review count]                         |
+---------------------------------------------------------------+
| FEATURED SCREEN                                                |
| latest/average/highest in cinematic typography                 |
+---------------------------------------------------------------+
| ticket strip | rating distribution | yearly attendance        |
+---------------------------------------------------------------+
| REVIEW LEDGER                                                  |
| title | date | rating | companions | location | review        |
+---------------------------------------------------------------+
| NOW SCREENING / TO WATCH marquee                               |
+---------------------------------------------------------------+
```

### Mobile composition

- collapse the marquee into a two-line sign;
- keep the feature screen as one primary stat at a time;
- stack rating bars and annual attendance;
- retain complete review text with visible "Show notes" disclosure controls;
- preserve readable table-like review fields as cards, not tiny responsive grids;
- move the watchlist to a horizontally styled vertical queue.

### Hero screen

Build a cinematic feature panel with:

- latest movie title and date;
- latest rating rendered as a large ticket-number / 10;
- average rating;
- total watched.

When a latest watch is missing, show an intentionally dark but explicit state
such as "No screening recorded yet." Do not synthesize a movie or rating.

### Rating visual

Create a 1-10 rating strip that resembles theater admission tickets or projector
meter marks. Each filled segment represents one valid rating at that score.
Hover/focus detail should identify the exact movie title, date, and rating.

Alternative when there are fewer than two valid ratings:

- show one large score block per valid review;
- do not show a distribution shape that implies sample coverage.

### Annual attendance

Use one vertical or horizontal bar per watched year. Label:

- review count;
- average valid rating;
- number of undated reviews separately.

Use colors and patterns for ratings rather than color alone. Include a numeric
label on every bar.

### Review ledger

Keep the user's Notes / Review paragraphs intact. Recommended presentation:

- movie title;
- date;
- location;
- companions;
- rating ticket;
- collapsed notes by default on long entries;
- expanded note text remains in source order, preserving paragraph breaks;
- "Source issue" indicator only when an invalid or missing value is flagged.

Do not rewrite or summarize source review text.

### Watchlist

Style `To Watch` as a marquee queue or intermission board.

- title as the main line;
- interest marker as a small label only when true, false, or unknown is known;
- description in source order;
- unknown interest remains unmarked.

No selection or progress state should be inferred from this page. It is not a
completed-movies queue.

## Optional Poster Treatment

The source does not include poster URLs. Do not make poster art a source
requirement.

If implemented later:

- use the title and year only for a public metadata lookup;
- proxy or cache requests server-side;
- store the normalized cover contract, not raw provider payloads;
- never expose provider keys;
- use a designed typographic poster fallback;
- provide a live diagnostic if artwork is missing;
- do not mistake missing artwork for missing movie data.

A cinematic treatment should not depend on external artwork being available.
The text-led marquee, ticket strips, and review ledger are the primary visual
identity.

## Isolation and Route Safety

- Add `src/lib/misc/movies` only to Movies-specific files and route imports.
- Add `src/app/misc/movies/movies.css` only to the Movies layout/page.
- Reuse existing global primitives sparingly if they do not restyle MISC.
- Extend the MISC card grid only enough to support the new Movies card.
- Keep the existing MISC palette and Screen Time route unchanged.
- Keep Secret visually unchanged.
- Do not add Movie routes to the top-level sidebar.
- Do not add Movies into Screen Time, Books, Finance, or Music contracts.

## Loading, Errors, and Source Diagnostics

Add:

- `src/app/misc/movies/loading.tsx` styled as a dimming theater marquee;
- `src/app/misc/movies/error.tsx` showing a contained source-error state;

Do not leak Google sheet IDs, service-account emails, API credentials, or raw
transport exceptions. Follow the existing MISC error design and show useful
action text such as:

```text
The Movies sheet could not be loaded. Check the source tab names and connection.
```

Display source issues in a route-local diagnostics panel only when issues exist.
Include tab, row, field, and a plain-language parser message.

## Cache and Refresh

Source reads should use Next cache semantics consistent with MISC modules:

- one-hour revalidation;
- cache tags such as `misc:movies`;
- tag invalidation only if an existing invalidation pattern already supports it;
- no scheduled external writes or push integration.

Google Sheets changes are not live:

- source data refreshes after revalidation or server restart;
- external changes require a manual refresh or scheduled/deployment hook until
  webhook infrastructure is added;
- practical cadence: inspect after adding movies, ratings, notes, or watchlist
  entries.

## Inspector and Tests

Add `inspect:movies` to `package.json`.

Focused parser tests should cover:

- both exact tab headers;
- missing headers and structural diagnostics;
- valid `n/10` ratings;
- malformed or out-of-range ratings;
- M/D/YYYY date parsing and invalid dates;
- blank rating and date preservation;
- multiline review notes;
- comma-separated companion de-duplication;
- repeated movie reviews on different dates;
- exact watchlist interest values;
- blank/unknown interest preserved as null;
- watchlist descriptions;
- yearly totals and average rating with undated reviews excluded from years;
- missing-review empty state;
- stable ties and alphabetical ordering;
- insufficient-year and insufficient-data behavior;
- source issues and row numbering.

Add rendering/interaction tests or browser checks for:

- expanded and collapsed review notes;
- keyboard-accessible note disclosures;
- annual and rating visuals with accessible summaries;
- reduced-motion behavior;
- desktop/mobile route isolation.

## Implementation Sequence

1. Add the source contract and inspector.
2. Add the parser, normalized types, loader, and cache tags.
3. Add parser tests and fixture coverage.
4. Add `/misc/movies`, loading, error, and route-local CSS.
5. Build the cinema marquee hero, ticket-rating strip, yearly attendance, review
   ledger, and watchlist queue.
6. Add the Movies card and keep Secret in its existing top-right treatment.
7. Update the README current modules and data refresh skill.
8. Run focused tests, lint, production build, and desktop/mobile route checks.

## Refresh Skill Requirements

Update both:

- `README.md`
- `.github/skills/life-dashboard-data-refresh/SKILL.md`

The README should add Movies under MISC and the `inspect:movies` workflow.

The refresh skill should document:

- environment variable: `GOOGLE_SHEET_ID_MOVIES`;
- tabs: `Reviews / Notes`, `To Watch`;
- inspector: `npm run inspect:movies`;
- parser and loader locations;
- cache duration and tag;
- rating unit, date format, missing-value, and duplicate-review rules;
- subjective/derived statistic rules;
- the expected refresh cadence after watchlist or review edits.
