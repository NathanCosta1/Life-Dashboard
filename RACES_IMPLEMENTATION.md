# Races Implementation Plan

## Purpose

Add a race and run-results module under Fitness at `/fitness/races`.

This page should be a personal race archive, not a workout tracker and not a
generic running dashboard. Keep it isolated from Basketball and Games through
a dedicated source parser, dedicated data contract, route-local components, and
route-local styles.

Recommended routes:

- `/fitness` - Fitness directory with Basketball and Races cards
- `/fitness/basketball` - Existing basketball shooting record
- `/fitness/races` - Race archive, results, and race-day details

The Races route should not add running colors, typography, cards, or chart
components to the shared Fitness or global shell themes.

## Source

Environment variable:

- `GOOGLE_SHEET_ID_RACES`

The inspected spreadsheet is titled `Races`.

| Tab | Purpose |
|---|---|
| `INTRO` | Personal source notes and sheet maintenance instructions |
| `Races` | Race ledger and race-day record |

The application should read only the `Races` tab for normal page data. Use
`INTRO` only for inspector diagnostics or source maintenance; it must not be
rendered on the route.

## Inspected Source Shape

The inspected `Races` tab has these exact headers:

| Index | Header |
|---:|---|
| 1 | Name |
| 2 | Location |
| 3 | Date |
| 4 | DOW |
| 5 | Time Of Day |
| 6 | Ran w/ |
| 7 | Training |
| 8 | Goals |
| 9 | Time |
| 10 | Place |
| 11 | Splits |
| 12 | My Watch Stats |
| 13 | Course Conditions |
| 14 | Weather |
| 15 | Weight |
| 16 | Price |
| 17 | Amenities |
| 18 | Playlist |
| 19 | Results Link |
| 20 | Pictures Link |
| 21 | MISC |

The inspector found 20 populated race-ledger rows. The source includes:

- early 5K records from 2012 and 2015
- Disney and other half-marathons
- 5K, 10K, and half-marathon distances
- recent Park Run and local-race records
- several races with multiple athletes in the same source row
- future or incomplete-looking entries that must not be guessed into results
- free-form notes in goals, training, watch stats, conditions, weather,
  amenities, and miscellaneous source fields
- mixed formatting in time, place, and companion fields

Representative source patterns include:

- elapsed times in `22:33`, `2:17:35`, and mixed multiline person/time entries
- places such as `59/96`, `1/77`, and multiline age-group details
- split strings with comma-separated or multiline values
- race names that identify the distance, such as `5K`, `10K`, and
  `Half Marathon`
- names and locations for both completed and upcoming records

The markdown and implementation must not publish private race notes, personal
companion names, playlists, links, photos, weather records, or body-weight
values more publicly than the existing personal dashboard intends. These values
may remain server-side and visible only because the dashboard route is private.
Do not expose sheet IDs, credentials, raw source rows, or Google links in client
bundle code.

## Data Contract

Create:

```text
src/lib/fitness/races/
  types.ts
  sources.ts
  parser.ts
  data.ts
  races.test.ts
```

Add a race-specific inspector:

```text
scripts/inspect-races.mjs
```

Package command:

```json
"inspect:races": "node --env-file=.env.local scripts/inspect-races.mjs"
```

Suggested normalized types:

```text
RaceIssue {
  source
  tab
  rowNumber
  field
  message
}

RaceResultPerson {
  name
  resultTimeSeconds: number | null
  resultTimeLabel: string | null
  placeLabel: string | null
  sourceOrder
}

RaceRecord {
  id
  name
  normalizedName
  location: string | null
  date: string | null
  dateLabel: string | null
  dayOfWeek: string | null
  timeOfDay: string | null
  companions: string[]
  companionText: string | null
  training: string | null
  goals: string | null
  primaryTimeSeconds: number | null
  primaryTimeLabel: string | null
  placeLabel: string | null
  distanceLabel: string | null
  distanceMeters: number | null
  distanceUnit: "5k" | "10k" | "half-marathon" | "marathon" | "other" | null
  splits: string[]
  splitLabels: string[]
  watchStats: string | null
  courseConditions: string | null
  weather: string | null
  weight: number | null
  weightRaw: string | null
  price: string | null
  amenities: string | null
  playlist: string | null
  resultsUrl: string | null
  picturesUrl: string | null
  notes: string | null
  people: RaceResultPerson[]
  status: "completed" | "upcoming" | "unknown"
  sourceRowNumber
}

RaceSummary {
  raceCount
  completedCount
  upcomingCount
  firstRace
  latestRace
  validTimeCount
  personalBestByDistance
  racesByYear
  racesByDistance
  podiumCount
}

RaceLibrary {
  title
  races
  summary
  issues
}
```

`null` represents missing or unrecognized source values. A missing time or
place is not zero. A missing body weight must not become a zero or be used in
charts.

## Parser Guardrails

### Headers and rows

- Read `Races` by exact normalized tab name.
- Validate the 21 expected header names.
- Report missing or reordered headers through source diagnostics.
- Skip fully blank rows.
- Require a nonblank race name.
- Preserve source row number; never rely on array index alone.
- Preserve source notes, text, and line breaks.

### Date and status

- Parse unambiguous `M/D/YYYY`, `M/D/YY`, and valid ISO values.
- Preserve `Date` as `dateLabel`; normalize it to ISO only after validation.
- Derive `dayOfWeek` from the source when present; report disagreement with
  the parsed date only if the implementation can safely parse both values.
- Do not mark an incomplete future result as completed merely because the
  source row exists.
- Use the following status rule:
  - `completed` when at least one primary result/time is valid, or the source
    row clearly has an elapsed date and completed place record
  - `upcoming` only when a future date exists and there is no completed result
  - `unknown` otherwise
- The Nov 14, 2026 Richmond half-marathon row should remain visible as an
  upcoming/planned entry instead of a completed zero-result record.

Status is presentation-derived from normalized results and the current date,
not a source-authoritative column. It must be documented and tested.

### Distance

There is no dedicated distance column. Distance must be derived conservatively:

- only from explicit race-name text
- recognize `5K`, `10K`, and half-marathon labels
- recognize `10K Road Race`, Park Run, and named race title variants only when
  an explicit distance is present
- report ambiguous/unrecognized distances instead of inferring a distance from
  the course name alone
- set `distanceMeters` only for common normalized values, initially:
  - 5K: 5000
  - 10K: 10000
  - half marathon: 21097.5
  - marathon: 42195
- do not convert a race into 5K because it “looks short”

### Times and splits

Elapsed race times and split strings are free-form source fields. Preserve every
raw text value and provide optional structured values only after successful
validation.

Primary time rules:

- parse `MM:SS`, `H:MM:SS`, and unambiguous full-duration variants
- parse person-prefixed values only as separate person records
- validate negative, impossible, and unreasonably long durations
- retain raw primary time text even if parsing fails
- for `HH:MM:SS` values where the apparent hours are implausibly high for the
  recognized distance, allow the race-name/distance context to select whether
  the first component is minutes plus an extra zero
- never convert source text to zero seconds for a blank or malformed value

Example:

- a 5K text like `33:58:00` should be diagnosed and parsed only with a
  distance-aware disambiguation rule, not treated as a 33-hour race
- `2:17:35` is an unambiguous half-marathon-style elapsed time
- multiline `Me: 1:39:57` values must not overwrite the raw result column or
  create a single race-wide average

Splits:

- split multiline values and comma-separated values conservatively
- preserve original text and source order
- parse numeric duration labels only if every supplied segment is valid
- do not calculate pace or total distance from an incomplete split list

### Places and people

- Preserve the raw place text intact.
- Do not merge all people into a generic average.
- Recognize colon-delimited multiline person records when a person name is
  explicitly before the colon.
- Preserve companion text separately from parsed people.
- Parse overall place only when it is a safe pattern such as `X/Y` or an
  explicitly separated single result.
- If a cell contains many people, create separate person result entries.
- Keep records like `Dad: 502th` and notes such as “age division” as raw text
  rather than inventing true ordinal or normalized placement values.

`ordinalsLike` should remain text. Do not claim an age-group win or podium from
friendly text unless an unambiguous numeric place is present.

### Training, goals, watch data, and notes

- Preserve multiline text in source order.
- Do not rewrite or summarize source notes.
- Keep body weight as raw text and an optional numeric pounds value only when
  the source format is unambiguous.
- Do not infer weight units beyond the source label or dashboard conventions.
- Keep monetary text as source label/value text.
- Keep Google URLs server-only in normalized data. The UI should render a link
  only when it is a valid `http` or `https` URL.
- Do not scrape playlist, results, picture, weather, or external-service data.

## Derived Statistics

Derive ordinary statistics only from valid normalized values.

Recommended summary metrics:

- completed race count
- race count by year
- race count by distance
- primary 5K personal best
- primary 10K personal best
- primary half-marathon personal best
- latest completed race
- earliest race
- podium or unambiguous top-three count
- number of races with notes
- number of races with watch stats
- current or most recent place
- multi-person race count

Recommended charts:

1. **Race bib / headline**
   - total completed races
   - total years represented
   - fastest 5K
   - fastest half marathon
   - latest result
2. **Finish-time progression**
   - one line by distance group
   - never combine seconds across 5K, 10K, and half-marathon distances
3. **Year ticker**
   - race count by year
   - one bar per year with no invented zero entries
4. **Distance distribution**
   - route-map-like segments or a race-distance ring
5. **Personal best board**
   - best 5K, 10K, and half-marathon with race name and date
6. **Course ledger**
   - newest completed first
   - expandable race-day notes
7. **Upcoming race card**
   - future date, race name, location, goals, and countdown only if data exists

Required rules:

- exclude missing times from trend and average calculations
- do not treat a missing result as a slow time or a DNF
- calculate personal best by minimum elapsed time within the same normalized
  distance group
- do not calculate a pace if distance or elapsed time is missing
- convert average result only after testing that both values use the same unit
- show source review diagnostics separately from normal records
- if fewer than two comparable results exist, hide trends and improvement claims
- a single race is enough for a personal-best display, but not a trend

## Visual Direction

Build the Races page as a **race-number / finishing-result** board inspired
by timing mats, race bibs, course markers, and paper race packets. Avoid
generic card grids and standard green-medical fitness styling.

### Art system

Route-local palette:

- warm race-bib ivory or slightly gray paper
- asphalt black or deep charcoal
- safety orange as the main event accent
- electric green or cyan as a secondary split-time color, but only in small
  data-mark roles
- muted red for penalties, warnings, or source diagnostics

Typography:

- Impact/condensed display for the route title, race distances, and headline PRs
- monospace for dates, bib numbers, elapsed time, splits, place fractions, and
  source row numbers
- readable serif or restrained sans copy for notes and location names

Textures and motifs:

- stop-watch and timing-board numbering
- thin course-distance rail lines
- dotted route maps built from source years or course sequence
- race-bib corner perforations
- black-and-orange start-line marks
- topographic or running-course contours behind large stats
- no decorative fake GPS routes; use no invented coordinates or course paths

Everything visual must be traceable to source values or neutral layout texture.
Do not imply that an empty weather field means bad weather, that missing
location means home, or that an absent split means a skipped segment.

### Desktop composition

1. Fitness back link.
2. Paper-race-header with large `RACES` display, race count, and archive years.
3. Featured current personal-best strip:
   - 5K
   - 10K
   - half marathon
4. Distance filter controls:
   - All
   - 5K
   - 10K
   - Half Marathon
   - Other
5. Finish-time progression:
   - grouped by normalized distance
6. Year attendance strip.
7. Race-result ledger newest first.
8. Expanded race row with:
   - location/date
   - elapsed time
   - overall and age placement
   - splits
   - weather/course conditions
   - watch stats
   - companion text
   - training/goals/notes
9. Source issues shown only when needed.

### Mobile composition

- Keep the distance filters horizontally scrollable or wrapping.
- Stack the personal-best strip into a 1-column or 2-column finish board.
- Turn race records into stacked bib cards rather than compressed tables.
- Preserve time and place values in large, readable mono type.
- Keep notes collapsed by default so source text does not dominate the first
  screen.
- Keep links accessible as labeled text rather than hiding them under icons.
- Respect reduced-motion preferences for chart and card transitions.

### Interaction

Optional focused interactions:

- distance-filter buttons update visible records and chart selections
- year filter with all valid source years
- expandable race note drawer
- button controls with visible focus
- no drag-only navigation

If no filtering is implemented, group the ledger by distance with clear plain
language headings. Do not add controls that imply filtering is live when it is
not.

### Accessibility

- Charts require accessible names and text equivalents beside them.
- Use semantic time elements for dates.
- No color-only meaning for podium or upcoming states.
- Preserve visible keyboard focus.
- Add reduced-motion handling for any route animation.
- Keep race notes in readable plain text with preserved paragraphs.
- Ensure large display headlines do not hide source dates, times, or places.

## Cache and Refresh

- Source: Google Sheets, server-only
- Environment variable: `GOOGLE_SHEET_ID_RACES`
- Tab read: `Races`
- Cache duration: one hour
- Cache tags: `fitness`, `fitness:races`, and `google-sheets`
- Use the existing `unstable_cache` matrix helper
- Manual refresh cadence: after adding or correcting a race
- Reload the Next.js development server if cached source data looks stale

Exact spreadsheet ID and credentials stay in `.env.local`.

## Inspector and Testing

The inspector should print:

- spreadsheet title
- exact tab names
- tab dimensions and populated-row counts
- exact 21 race headers
- source distance labels found in names
- time formats that could not be classified
- date formats and parse failures
- valid and malformed place/weight/URL patterns
- missing fields by column
- no race notes, URLs, companion names, weather values, weight values, or
  personal source text

Use Vitest tests for:

- exact header validation
- 5K, 10K, and half-marathon distance recognition
- blank/malformed date and time handling
- ambiguous duration parsing
- multiline time and place preservation
- companion and result-person extraction
- future/incomplete race status
- personal-best calculations within one distance group only
- missing values staying null
- source note and split line-break preservation
- duplicate race dates remain separate records
- invalid URL handling

Tests should use representative synthetic data. Do not depend on the current
sheet becoming a fixture.

## Insufficient Data Behavior

- no races: show an empty archive and no fake ranking
- one race: show its result and source details, but no time trend
- one distance group: show a personal best but no improvement claim
- no valid future date: do not show a countdown or upcoming label
- no place: omit placement rather than showing `0/0`
- no time: omit duration and pace instead of displaying zero
- no notes: omit the notes panel or show an empty source-neutral state

## README and Refresh Skill Updates

When implementation begins, update:

- `README.md` Fitness module list and Races source workflow
- `.github/skills/life-dashboard-data-refresh/SKILL.md`
- package scripts with `inspect:races`
- `src/app/fitness/page.tsx` with a Races card

Keep `/fitness/races` isolated and do not add it to the global sidebar as a
top-level route.
