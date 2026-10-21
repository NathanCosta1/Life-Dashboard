# Phase 3: Music

Build two read-only music experiences from the Google Sheet configured by
`GOOGLE_SHEET_ID_MUSIC`: a random album picker based on **Albums: To Listen**
and a year-by-year browser for the workbook's **Replay** and **Everything**
playlists. Treat the sheet as the source of truth. The current workbook has no
chart-rank, album-artist, artwork, or direct URL columns, so the UI must not
imply that those fields are available.

## Goals and scope

- [x] Ship `/music/albums`, a playful, accessible picker that selects an album
  represented by a song in **Albums: To listen**.
- [x] Ship `/music/years`, a year selector for annual Replay and Everything
  playlists with aggregate listening-list statistics.
- [x] Add Music to the global navigation and keep the module isolated from
  Finance, Recipes, Fitness, and other modules.
- [x] Keep all source access read-only. The picker, filters, and URL state must
  never write to Google Sheets or Apple Music.
- [x] Document any source limitations and only show metrics supported by
  validated fields.

## Confirmed source contract

- `GOOGLE_SHEET_ID_MUSIC` points to a workbook with a `README` tab and a
  `My Apple Music Library` tab. The library's populated table begins at `A1`
  and currently has these fields: `Track name`, `Artist name`, `Album`,
  `Playlist name`, `Type`, `ISRC`, and `Apple - id`.
- Playlist membership is encoded in each library row's `Playlist name`; annual
  lists are not separate tabs. Production reads are bounded to columns A:I and
  the configured tab's declared row count, capped at 10,000.
- **Albums: To Listen** currently has 223 playlist rows. The picker creates
  one candidate per normalized album title plus credited artist and uses the
  first matching track as its representative. The workbook has no separate
  album-artist field, so a song's credited artist is the available grouping
  key.
- The library currently contains Replay playlists named `Replay YYYY` for
  2020–2025 and Everything playlists named `YYYY - Everything` for 2024–2026.
  Years with both playlist types keep them separate in the UI and in list
  counts. Future playlists are recognized by these name patterns.
- Current Replay lists contain 99, 100, 100, 96, 100, and 100 rows respectively
  for 2020–2025. The Everything lists contain 228, 257, and 171 rows for
  2024–2026; they are displayed as exported and are not described as Top 100s.
- The source contains no explicit rank, image, or direct URL fields. Track
  order is therefore labeled as sheet order, not chart rank. The `Apple - id`
  field is not used to construct unverified outbound links.
- The source supplies ISRCs for many, but not all, tracks. Valid ISRC is the
  preferred recording key; missing or malformed ISRC falls back to normalized
  title and credited artist. A fallback identity is joined to an ISRC only
  when that title/artist pair maps to exactly one known ISRC. Original display
  values are retained apart from surrounding whitespace.
- Track statistics count a recording at most once per playlist; artist
  statistics count distinct track appearances, treating the complete credited
  artist string as one name. Album statistics group by normalized album title
  because no album-artist field exists; self-titled albums by different artists
  may therefore collide.
- Album selections are uniform across distinct candidates, can repeat on the
  next spin, and are not persisted. The application makes no writes to Sheets
  or Apple Music.

## Step 0: Inspect and freeze the source contract

- [x] Add a safe music inspection command, following the repository's existing
  Google Sheets inspection patterns. It may print tab names, bounded ranges,
  row/column counts, and headers, but must not print spreadsheet IDs,
  credentials, or unnecessary personal cell contents.
- [x] Verify that the configured source is reachable using the existing
  read-only service-account integration.
- [x] Identify the playlist tab or section, its header row, the track/album
  identity fields, optional artwork and URL fields, and the exact bounded
  range.
- [x] Discover annual lists and document how year, track, artist, album, chart
  position, artwork, and URL are represented. Record title rows, blank rows,
  repeated headers, footers, and irregular row widths.
- [ ] Verify whether album, artist, and song names include featured artists,
  remaster/version annotations, explicit/clean variants, or inconsistent
  punctuation/capitalization.
- [x] Keep a sanitized fixture of representative source rows, including empty,
  malformed, and irregular cases. Do not commit live personal listening
  history as a fixture.
- [x] Document the confirmed tab names, bounded ranges, field mappings, and
  unresolved ambiguities here before implementation proceeds.

## Step 1: Define normalized music data and parsing behavior

- [x] Add isolated music source configuration under `src/lib/music/`, mapping
  the `GOOGLE_SHEET_ID_MUSIC` environment variable to confirmed tabs/ranges
  and a dedicated cache tag. Keep the spreadsheet ID server-only.
- [x] Define normalized types for playlist tracks, distinct album candidates,
  annual chart tracks, yearly list metadata, diagnostics, and aggregate
  statistics.
- [x] Use `listSheetTabs` to verify the library tab and bound `readSheetMatrix`
  to the declared sheet rows. Discover annual lists from validated playlist
  names in the library rows rather than assuming one worksheet tab per year.
- [x] Implement pure source-specific parsers. Preserve source tab and row
  coordinates for diagnostics. Skip blank/spacer rows, distinguish missing
  fields from empty strings, and report malformed rows instead of silently
  treating them as valid tracks.
- [x] Preserve original display text. Normalize only for comparison and
  deduplication; do not rewrite source metadata or merge uncertain identities.
- [x] Prefer a stable track identifier such as an ISRC if the sheet provides
  one. Otherwise compare normalized title and credited artist; retain version
  qualifiers when they distinguish recordings.
- [x] Deduplicate album-picker candidates using normalized album title plus
  credited artist. The workbook has no separate album-artist or album-ID
  field; title variants remain separate and self-titled albums are disambiguated
  using the available credited artist.
- [x] For annual songs, use a provided stable recording ID when available;
  otherwise use normalized title and credited artist, retaining meaningful
  version distinctions. Do not infer equivalence across live, remix, or
  re-recorded versions.
- [x] Parse and validate chart positions when present. Keep source row order as
  a fallback display order, but label it as source order rather than rank when
  no rank field can be validated.
- [x] Keep row-level parsing diagnostics bounded and actionable (tab, row,
  field, reason); never include credentials, spreadsheet IDs, or raw
  financial/personal data in logs.

## Step 2: Albums to listen — random album picker

### Data and behavior

- [x] Load the confirmed **Albums: To Listen** source through a cached,
  server-only loader and normalize its tracks into distinct album candidates.
- [x] Show each candidate's album title, credited artist, representative track,
  and artwork/link only when those fields exist and validate. The current
  source does not provide artwork or a verified URL.
- [x] Provide a prominent **Choose a random album** control. Each accepted
  spin selects uniformly from the distinct candidates, independent of row
  order and duplicate representative tracks.
- [x] Animate a short wheel/spin presentation, then settle on the selected
  album and reveal its details. The selected result must be generated by the
  data model, not by animation position or client-side display ordering.
- [x] Respect reduced-motion preferences; users must receive the same result
  and clear completion announcement without animation.
- [x] Provide a clear empty state when no valid candidates exist, a loading
  state, and an actionable error state when the sheet cannot be read.
- [x] If malformed rows are skipped but some candidates remain, keep the
  picker usable and show a concise partial-data warning.
- [x] Do not mark an album listened, remove it from the playlist, or persist
  spin history. A page refresh may choose a new result only after the user
  spins again.

### Proposed layout

```text
Music / Albums to listen

[Choose a random album]

              [Animated album wheel]

             Your next album:
               Album title
                 Artist
              Representative track

          N unique albums in the picker
```

- The wheel is a presentation of a random choice, not a manual selector whose
  segment weights can bias the result.
- If a wheel cannot clearly represent all candidates (for example, a large
  playlist), use a bounded visual wheel/deck animation that still selects
  uniformly from the full candidate list.
- Show how many unique albums are eligible. If multiple playlist tracks map
  to one album, the album is counted once.
- Link externally only when a valid source URL is supplied; do not synthesize
  URLs from untrusted cell content.

## Step 3: Annual playlists and listening statistics

### Annual list browser

- [x] Load each validated year list independently and combine it into a
  normalized catalog while retaining year, playlist name, source order, and
  source coordinates.
- [x] Present a year selector populated from available lists, defaulting to
  the latest year with usable tracks.
- [x] Display the selected year's tracks in sheet order with track, artist,
  album, and source row. Do not show rank, artwork, or Apple Music links
  because the workbook does not provide these fields.
- [x] Include search over track, artist, and album, plus sorting by title or
  artist. Filtering must not alter the underlying aggregate
  statistics.
- [x] Show the selected playlist row count without padding it to 100 or
  implying that Everything lists are Replay Top 100s.
- [x] Keep malformed rows visible as partial-data diagnostics without
  discarding other annual playlists.

### Cross-year statistics

The first version should include the following, provided the required fields
are present:

- [x] **Most recurring song:** rank recordings by number of distinct playlists
  containing them. Duplicate rows in one playlist count once. Normalize by
  valid ISRC when available and otherwise by title/credited artist.
- [x] **Most recurring album:** rank normalized album titles by distinct
  playlists represented. Count a title once per playlist; clearly label that
  albums are title-matched because album artist is not exported.
- [x] **Top 10 artists:** count unique track appearances across playlists.
  Normalize case and whitespace but treat the complete credited artist field
  as one name; collaborations are not split into inferred artist identities.
- [x] **Yearly list size:** show source playlist counts per year and selected
  list size; do not treat the Everything playlist row counts as Top 100s.
- [x] **Unique catalog:** show unique recordings and album titles across all
  usable annual rows, with missing metadata coverage where relevant.
- [ ] **Repeat rate:** deferred; the source mixes overlapping playlist types
  in some years, so a single cross-year repeat percentage would be ambiguous.
- [x] **Chart position insights:** rank is not in the source; show sheet order
  only and defer rank comparisons.
- [x] Define deterministic tie handling, count units, and missing-metadata
  rules in tests and UI labels. Do not infer artists from album titles or
  guess identities based on approximate string similarity.

### Proposed layout

```text
Music / Year in Review              [Year: 2025 v] [Playlist: Replay v]

[Unique Songs] [Unique Album Titles] [Playlists] [Tracks in Selected Playlist]

[Most Recurring Songs] [Most Recurring Albums]
[Top 10 Artists]

[Search tracks...] [Sort: Sheet order v]
[Track] [Credited Artist] [Album] [Sheet Row]
```

- Aggregate cards and rankings are cross-year unless clearly labeled as
  selected-year metrics.
- Selecting a year filters the track list and selected-year count, not the
  cross-year rankings.
- For long lists, use responsive pagination or a performant list pattern
  already used in the application; keep keyboard and screen-reader navigation
  available.
- The source exports neither artwork nor direct track URLs, so the first
  version uses text-only track rows and does not construct Apple Music links.

## Step 4: Navigation, caching, errors, and accessibility

- [x] Add a **Music** item to the global sidebar. It should route to one of the
  two shipped pages and make the second page discoverable through an in-module
  link or tab navigation.
- [x] Keep loading, empty, partial-data, and error states distinct. A missing
  environment variable or inaccessible spreadsheet must be reported as an
  error, not as an empty playlist.
- [x] Cache source reads with a dedicated music tag and an explicit revalidate
  interval consistent with existing sheet-backed modules. Do not create
  client-side requests containing the spreadsheet ID.
- [x] Use the existing one-hour cache lifetime. No explicit server-side
  revalidation route existed in the project, so this phase adds no manual
  refresh control.
- [x] Make controls keyboard operable, provide visible focus states, label
  selectors/search, announce spin completion accessibly, and respect
  `prefers-reduced-motion`.
- [x] Keep both pages responsive and aligned with the app's existing dark
  theme and shared card/loading/error conventions.

## Step 5: Tests and completion gate

- [x] Add sanitized fixture-based tests for headers, blank rows, duplicate
  tracks/albums, duplicate rows within one list, missing metadata, empty
  playlists, and partial data.
- [x] Test album deduplication, stable track identity, credited artist
  counting, per-year unique counts, recurring-song/list counts, recurring
  albums, deterministic ties, and missing-field coverage.
- [x] Keep random selection as a pure model operation with an injectable
  random value. Test boundary values and index mapping for equal candidate
  intervals, exclusion of invalid candidates, and empty/single-candidate
  behavior; avoid flaky statistical tests. Keep animation details out of
  selection logic tests.
- [x] Verify malformed playlist rows are isolated to their own playlist
  metrics, and an invalid sheet schema is presented as a source error.
- [x] Run the repository's relevant tests, lint, type-check, and production
  build.
- [x] Manually verify both pages at desktop/mobile widths, including year/list
  selection, responsive overflow, keyboard spin activation, reduced motion,
  standard spin animation, and partial data.
- [ ] Manually force empty-source and Google Sheets error states before
  deployment.
- [ ] Phase 3 is complete when every displayed statistic has a documented
  definition and traceable source fields, malformed rows do not prevent other
  playlist data from rendering, and a source-level error is reported clearly.

## Out of scope for this phase

- Editing playlists, marking albums listened, or writing data back to Sheets
  or Apple Music.
- Apple Music API integration, authentication, scraping, or playback control.
- AI-generated recommendations, listening predictions, or subjective genre
  classification.
- Inferring missing release years, chart ranks, artist aliases, or recording
  equivalence from external sources.
- A full listening-history timeline beyond the annual Replay and Everything
  playlists currently provided in the workbook.
