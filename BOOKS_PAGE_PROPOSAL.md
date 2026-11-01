# Books Library Experience — Visual and Technical Proposal

## 1. Product direction

Build the Books module as a **private, editorial library archive**, not as a conventional dashboard.

The main experience should feel like entering a small night library: quiet paper surfaces, walnut shelves, oxblood catalog labels, brass year markers, and typography that makes titles and authors feel important. The visual design should be expressive enough to feel unique, while remaining readable and technically isolated from every other route.

Primary pages:

1. `/books` — the library entrance, reading atlas, annual archive, and headline statistics.
2. `/books/shelves/read` — the completed-books archive.
3. `/books/shelves/to-read` — the waiting-library wall.
4. `/books/years/[year]` — an optional year room for the read-history page.

### The deliberately excluded shelves

Do not create permanent module-wide views for:

- Currently Reading
- Did Not Finish
- Left an Impact

These values are transient, too small, or tags rather than stable library sections. They should remain available only as source fields in the book detail view and small optional filters if a future screen genuinely needs them. They should never become navigation destinations or headline dashboard objects.

The primary classification is the Goodreads `Exclusive Shelf`. In the visible experience:

- `read` is the completed archive.
- `to-read` is the waiting library.

`currently-reading` and `did-not-finish` remain valid parsed state values. They can affect library totals and detail metadata, but the proposed information architecture does not give them separate full pages.

## 2. Spreadsheet analysis

`GOOGLE_SHEET_ID_BOOKS` resolves to **My Goodreads Library (Books)**.

### Source structure

| Tab | Purpose | Current shape |
| --- | --- | --- |
| `INTRO` | Owner instructions for the annual export workflow | One instructional tab, not a book source |
| `goodreads_library_export` | Goodreads exported catalog | 255 populated book records |

Useful source columns:

- `Book Id`
- `Title`
- `Author`
- `Additional Authors`
- `ISBN`
- `ISBN13`
- `My Rating`
- `Publisher`
- `Binding`
- `Number of Pages`
- `Year Published`
- `Original Publication Year`
- `Date Read`
- `Date Added`
- `Bookshelves`
- `Bookshelves with positions`
- `Exclusive Shelf`
- `My Review`
- `Read Count`

The loader should not send `Spoiler`, `Private Notes`, full review text, or credential-adjacent data to client components. Review text can be normalized but withheld until an explicit detail feature is approved.

### Current library profile

| Measure | Source result |
| --- | --- |
| Library records | 255 |
| Read | 106 |
| To Read | 130 |
| Currently Reading | 4 |
| Did Not Finish | 15 |
| Left an Impact tag | 5 books |
| Records with reviews | 63 |
| Page-count values present | 248 |
| ISBN13 values present | 208 |
| Read dates present | 106 |
| Added-date values present | 255 |
| Repeated read count | 1 record with `Read Count = 2` |
| Rated records | 81 |
| Explicit unrated records (`My Rating = 0`) | 174 |

The main `read`, `to-read`, `currently-reading`, and `did-not-finish` exclusive-shelf counts reconcile to all 255 records. Counts should still be computed from parsed records rather than hard-coded in the UI.

### Rating data

The export contains:

- 174 unrated books
- 8 rated 1 star
- 16 rated 2 stars
- 19 rated 3 stars
- 22 rated 4 stars
- 15 rated 5 stars
- 1 rated 4.5 stars

Use a precise **rating ledger** rather than a decorative constellation:

- Six horizontal bands cover 5, 4.5, 4, 3, 2, and 1 stars.
- Each band uses an exact count label and a proportional brass-to-oxblood bar.
- A separate unrated row is not displayed as a zero-star band.
- The entrance panel includes exact totals for rated and unrated books.
- The mobile treatment remains the same ledger rows rather than compressing a large point field.

This makes the distribution immediately comparable and avoids decorative points that imply individual books or invented rankings.

### Reading chronology

Recorded read dates cover 2022–2026:

| Year | Books read |
| --- | --- |
| 2022 | 14 |
| 2023 | 44 |
| 2024 | 16 |
| 2025 | 13 |
| 2026 | 19 |

These are the strongest existing annual visuals. The source also contains `Date Added` values from 2022–2026, but this field should be labeled `Added to Goodreads`, never `purchased`.

The year module should feel like walking past a wall of dated reading-year labels:

- Each year is a tall archival spine or brass-framed volume marker.
- Height is based on read-count, with exact counts printed.
- Clicking a year opens `/books/years/2023`.
- The year page has a chronological ledger and a small rating breakdown.
- Missing `Date Read` values are excluded from the annual archive.

### Genre limitation

The current export does **not** contain a genre or subject column. It would be technically incorrect to invent genres from titles or infer them from publisher, author, or external APIs during the first implementation.

The proposal should therefore include one of two explicit branches:

#### Option A — recommended for the first release

Build year-by-year visuals around source-supported dimensions only:

- books read
- rated books
- pages read
- publication era
- author frequency
- longest and shortest source page counts
- number of unrated books

Call this design an **annual reading atlas**, not a genre map.

#### Option B — future enhancement

If you add a `Genre`, `Subjects`, or `Topics` column to the export, or maintain one in a separate sheet tab, then render:

- year-by-year genre shelves;
- the most frequent genre each year;
- genre color accents derived from a fixed vocabulary;
- exact source counts and ties.

The spreadsheet loader should reject or ignore unknown subject values rather than automatically categorizing books. Genre classification must remain a typed source contract and not be derived from book titles without explanation.

## 3. Visual identity

### Route-local art direction

The global sidebar remains neutral. All visual identity lives under `/books`, `/books/layout.tsx`, and `books.css`.

The Books module should use:

- aged ivory catalog paper
- ink-black primary text
- walnut and dark-oak structural surfaces
- oxblood archival accents
- brass gold for ratings and annotations
- deep green for selected navigation states
- tiny monospaced accession numbers
- sharp borders and thin rules rather than soft shadows
- a restrained serif display face for book titles and route headings
- a neutral sans-serif face for controls and data labels

Use fonts already available in the app unless a project-approved font dependency is intentionally added.

### Main entrance — `/books`

The entrance should resemble the atrium of a private library.

#### Opening composition

The first viewport should not be a grid of metric cards. Build a three-part composition:

1. **Catalog masthead**
   - Small label: `PERSONAL CATALOG`
   - Large route title: `The Library`
   - Exact source record count: rendered only after parsing
   - Small search command field

2. **Reading-year frontage**
   - A wood-toned annual reading wall in 2022–2026 order
   - Five year volumes or framed year marks
   - Heights represent read counts
   - The largest current bar is 2023 because it has 44 source-dated reads, not because it is visually inflated
   - Under each year: exact read count

3. **Rating distribution**
   - A dark archival panel on the right
   - Proportional horizontal bars for each positive rating
   - The exact rating distribution in a compact brass-ledger margin
   - A visible legend for rated and unrated
   - No misleading zero-star interpretation

This composition makes two of the strongest data stories immediately visible: chronological reading activity and rating behavior.

#### Physical shelf navigation

Below the entrance is a low physical-shelf composition with two major destinations:

| Shelf | Route | Visual treatment |
| --- | --- | --- |
| Read Archive | `/books/shelves/read` | Oxblood catalog-room wall, completed books |
| Waiting Library | `/books/shelves/to-read` | Tall cool-blue reserve wall, 130-book stack |

Each destination should contain a real count derived from source data. The rest of the source state should not compete in the entrance:

- 4 currently-reading records can be omitted
- 15 did-not-finish records can be omitted
- 5 impact-tagged records can be omitted

No navigation card should imply that these omitted records are zero or deleted. Detail views still retain their source fields.

#### Supporting visual statistics

Use these source-supported or derived displays:

- `Most read year`: source year with highest `Date Read` count
- `2023 reading burst`: 44 reads
- `Rated share`: 81 of 255 records
- `Five-star books`: exact 5-rating count
- `Median pages`: derived only after filtering missing and nonnumeric values
- `Recent additions`: sorted `Date Added`
- `Review coverage`: 63 records with review text

Use no claim that missing review text means no opinion, or that missing pages means a short book.

#### Publication-era lens

Because the export contains original publication years, include a second visual after the two shelf entrances:

- A horizontal century spine from source minimum through source maximum
- Each valid original publication year becomes one archival notch
- Color grouping distinguishes 19th century and earlier, 20th century, and 21st century
- Exact tooltip or list values show source title and year
- Negative years from ancient works remain exact source years, not converted or falsely categorized

This is a more interesting visual than a review card or generic bar chart.

#### Author frequency by shelf

Do not show a global author ranking on the library entrance. It mixes books with different meanings and offers little useful action.

Instead, place the exact most frequent authors in the footer or catalog-rail of each primary shelf:

- Read Archive: frequency within completed books only.
- Waiting Library: frequency within To Read books only.
- Display up to eight exact source author strings.
- A shelf-relative list uses rank, author, and record count.
- Search and author filtering can reuse the list as an optional filter.
- Do not normalize or merge author names unless a canonical source field is added.

### Read Archive — `/books/shelves/read`

Route: `/books/shelves/read`.

The completed archive should feel like an archival reading room rather than a Netflix library.

#### Page structure

1. **Entrance masthead**
   - Breadcrumb: `Library / Read Archive`
   - Large title
   - Exact source count
   - Search field
   - Author filter
   - Rating filter
   - Year-read filter

2. **Chronological letterpress banner**
   - 2022 through 2026 year tabs
   - Exact count on each tab
   - `No Date Read` as a secondary filter
   - A subtle brass rule below the selected year

3. **Book catalog**
   - Default desktop layout: a 5-column book-spine wall
   - Each spine uses title, author, year-read, and rating
   - Unrated books display `Unrated`, not a blank star row or a zero
   - A dense view switch opens a ruled catalog ledger
   - A cover-free design avoids external cover-service dependencies

#### Visual language

- Oxblood background structure
- Light paper cards
- Dark ink title text
- Spine color bands selected from the source rating:
  - gold: rated 4–5
  - amber: 3
  - slate: 1–2
  - paper gray: unrated
- No cover image is inferred or downloaded by default
- Each book tile has a slight title width variation based on its actual text length

#### Sort order

- Default: latest `Date Read`, then title.
- Alternatives: title, author, rating, `Date Added`, page count, and publication year.
- Missing values sort last for every optional data view.
- Ratings sorted descending should keep unrated values in an explicit last group.

### Waiting Library — `/books/shelves/to-read`

Route: `/books/shelves/to-read`.

This shelf should feel like a tall reserve wall viewed from a library balcony.

#### Page structure

- Breadcrumb: `Library / Waiting Library`
- Large title with exact 130-book count
- Search field optimized for a large queue
- Author and publication-era filters
- Source shelf-position display
- Dense catalog cards rather than theatrical spine objects

#### Visual language

- Cool slate and deep blue-gray wall
- Ivory reserve cards
- Brass position numbers
- Thin horizontal shelf rules at intervals
- Tall enough to feel like a stack, but not so tall that navigation is hidden
- On desktop, 4 compact columns or a list view
- On mobile, a list-first layout with title, author, position, and page count

Default sorting should honor the source `Bookshelves with positions` so users see the existing Goodreads order. If a position cannot be parsed, place the record after positioned values and show no fabricated number.

### Year rooms — `/books/years/[year]`

Each year room should feel distinct from the annual wall and avoid a generic card redesign.

The page provides:

- The route-specific year in oversized typography.
- Exact reads in that year.
- A small rating distribution for that subset.
- A vertical timeline ordered by `Date Read`.
- Filtered title/author entries with explicit missing dates excluded.
- Exact page totals where every included record has a valid page count.
- A return link to the library entrance.

This route is optional as a first MVP if route scope needs to stay focused, but it is a natural extension and should be considered part of the complete proposal.

## 4. Technical architecture

### Proposed files

```text
src/lib/books/
  sources.ts
  types.ts
  parser.ts
  data.ts
  books.test.ts

src/components/books/
  books-dashboard.tsx
  library-header.tsx
  annual-reading-wall.tsx
  rating-distribution.tsx
  publication-era-chart.tsx
  author-frequency.tsx
  shelf-navigation.tsx
  book-catalog.tsx
  book-detail.tsx

src/app/books/
  layout.tsx
  page.tsx
  books.css
  loading.tsx
  error.tsx
  shelves/
    [shelf]/
      page.tsx
      not-found.tsx
  years/
    [year]/
      page.tsx
      not-found.tsx
```

### Source configuration

Add a `booksSource` contract:

- environment variable: `GOOGLE_SHEET_ID_BOOKS`
- library tab: `goodreads_library_export`
- maximum bounded rows: `1000`
- revalidation: `60 * 60` seconds
- cache tags: `books`, `books:library`, and optional shelf tags

The loader should call `listSheetTabs`, locate the export tab, bound `rowCount` to the source metadata, and read a bounded range rather than an unbounded sheet request. Header names should be validated before parsing.

### Typed model

```ts
type MainBookShelf = "read" | "to-read";
type SourceBookShelf =
  | MainBookShelf
  | "currently-reading"
  | "did-not-finish";

type BookRecord = {
  sourceBookId: string;
  title: string;
  author: string;
  additionalAuthors: string[];
  isbn: string | null;
  isbn13: string | null;
  rating: 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 | null;
  publisher: string | null;
  binding: string | null;
  pageCount: number | null;
  publicationYear: number | null;
  originalPublicationYear: number | null;
  dateRead: string | null;
  dateAdded: string | null;
  bookshelves: string[];
  bookshelfPositions: string[];
  exclusiveShelf: SourceBookShelf;
  review: string | null;
  readCount: number;
};
```

Required parsing inputs:

- `Book Id`
- `Title`
- `Author`
- `Exclusive Shelf`

Missing optional columns can break an individual feature but should not cause the full route to crash. Missing required columns should produce a clear source-schema error that identifies the missing header without exposing sheet contents.

### Derived server values

Compute these in the server data layer, not ad hoc inside visual components:

- main shelf counts
- rating distribution
- rated and unrated totals
- read counts by year
- added counts by year
- median page count
- author frequency
- publication-era buckets
- review presence count
- search-ready normalized text

Keep source values separate from derived values. Never label derived values as source columns, and never cache them as if they were source fields.

### Data loader sequence

1. Validate `GOOGLE_SHEET_ID_BOOKS`.
2. Require the export tab through sheet metadata.
3. Read the bounded range with cache tags.
4. Reject a missing required-header contract.
5. Normalize each row into `BookRecord`.
6. Build immutable grouped records and derived summaries.
7. Return only normalized safe data to client components.

The source spreadsheet remains read-only. The module does not write back to Goodreads or Google Sheets.

### Inspector script

Add:

```text
npm run inspect:books
```

The inspector should:

- list tab names and dimensions;
- validate required headers;
- report populated-cell counts by column;
- report exclusive-shelf counts;
- report read and added dates by year;
- report rating distribution;
- report custom shelf counts without printing private titles or notes;
- never print credentials, private notes, reviews, ISBNs, or unrelated sheet values.

## 5. Interaction specification

### Search

Search title and author. Normalize case and trim whitespace. Search the full library without page APIs for the first implementation, since 255 records is small.

The search field should support `/` or a visible keyboard hint such as `⌘K`. Opening search should not navigate away from the library route.

### Shelf filtering

Read Archive filters:

- year read
- rating
- author
- `No Date Read`
- unrated

Waiting Library filters:

- author
- publication era
- positioned/unpositioned
- binding

Do not expose currently-reading, DNF, or impact-tag filters as permanent top-level controls.

### Detail view

Use a modal dialog or slide-out inspector opened from a title.

Required fields:

- title
- author
- additional authors
- binding
- publisher
- page count
- publication years
- Goodreads added date
- date read
- exclusive shelf
- bookshelf labels
- rating
- read count

The detail view can also display review text behind an explicit `Review` disclosure. `Spoiler` status should remain visible as a warning and the review should not be shown until the user expands it.

This module should not show externally downloaded book covers.

### Accessibility

- Real links for routes.
- Native buttons and labeled selects for controls.
- Visible keyboard focus with strong contrast.
- Escape closes detail dialogs.
- Dialog focus is trapped and returns to the opener.
- Every interactive catalog point has a text label in addition to color.
- Charts have linked text summaries.
- Color is never the only state distinction.
- Touch targets are at least 44px.
- Reduced-motion media queries disable reveal and transition effects.

### Navigation and back controls

Every Books route should have an obvious, persistent back control:

- Library entrance: a labeled `Life Dashboard` back link.
- Read and To Read shelves: a labeled `The Library` back link above the masthead.
- Year rooms: a labeled `The Library` back link above the year masthead.
- Invalid and error states: a labeled return link that does not depend on browser history.

Back links must be real routes, keyboard focusable, and styled as visible bordered controls rather than plain breadcrumbs.

## 6. Route isolation

The implementation should avoid leaking the library theme:

- Import `books.css` only in `src/app/books/layout.tsx`.
- Give route content a `books-theme` wrapper.
- Do not use library CSS variables outside the Books layout.
- Do not modify shared sidebar styling beyond adding the route link.
- Keep all data loading, parsers, visual components, tests, and loading/error states inside the Books module or shared one-way helpers.
- Keep Google credentials and spreadsheet IDs out of client components.

Global shell changes should be limited to the new `Books` navigation item and existing layout spacing.

## 7. Loading and error design

### Loading

The entrance and shelf routes should use route-local skeletons with the same visual layout:

- catalog masthead
- an outline of the annual wall
- a rating-ledger placeholder
- shelf-number placeholders

Avoid a generic spinner occupying the page.

### Source error

Show the route name and an actionable server-safe message:

- missing environment variable;
- missing export tab;
- missing required header;
- service-account read failure.

Do not include private spreadsheet IDs, service-account emails, raw Google error responses, or review data.

### Empty states

Use source-aware language:

- `No books are recorded on this source shelf.`
- `No books have a Date Read in this year.`
- `No books match this search.`
- `No rating values are present in this view.`

Do not write `no books found because you have no books`.

## 8. Implementation sequence

1. Add Books source configuration and bounded tab loading.
2. Add and run the Books inspector.
3. Add parser types, parser, and synthetic fixtures.
4. Add `/books` entrance with catalog masthead and two-shelf navigation.
5. Add the annual reading wall.
6. Add the rating distribution ledger and exact text summary.
7. Add publication-era and author-frequency views.
8. Add `/books/shelves/read`.
9. Add `/books/shelves/to-read`.
10. Add optional year rooms.
11. Add detail disclosure and review gating.
12. Add the sidebar route.
13. Run tests, lint, and production build.

## 9. Testing

Required parser tests:

- required headers are present;
- missing required headers produce a clear schema error;
- ratings of `0` become `null`;
- valid half-star ratings remain exact;
- valid page counts become finite numbers;
- missing page, date, ISBN, review, and publisher values remain null or empty;
- unknown exclusive shelves produce an explicit parser behavior;
- main read and to-read filters do not alter transient source classifications;
- DNF, currently-reading, and impact tag values remain source metadata only;
- date strings remain source values unless parsed by a strict calendar validator;
- source positions sort before unpositioned records;
- year groups use only valid `Date Read` values;
- unrated records never appear in the positive rating distribution.

Required interaction tests:

- search matches title or author without case sensitivity;
- unknown dynamic shelf slugs return not-found;
- unknown year routes return not-found;
- year counts reconcile with read records;
- rating totals reconcile to the library record count;
- author frequency uses exact parsed author strings;
- missing source values sort last;
- dialog closes with Escape and restores focus.

Fixture data should be synthetic. Do not commit real book titles, review text, private notes, ISBNs, credentials, or Goodreads IDs.

## 10. Acceptance criteria

The implementation is complete when:

- `GOOGLE_SHEET_ID_BOOKS` is never exposed to browser code.
- The sidebar links only to real completed Books routes.
- `/books` looks visually distinct from every neighboring module.
- Read and To Read are the only prominent shelf destinations.
- Annual counts, rating totals, author counts, and page-derived values reconcile exactly with parsed source records.
- Unrated books are never represented as one-star or zero-star ratings.
- Genres are not invented while the source lacks genre data.
- If genre support is later added, it comes from a typed source column and has exact tie and missing-value handling.
- Loading, source-error, empty-result, and invalid-route states are implemented route-locally.
- Desktop and mobile layouts remain readable and distinctive.
- Keyboard, focus, chart text alternatives, dialogs, reduced motion, and color contrast pass.
- Focused Vitest tests pass.
- ESLint passes.
- The production build succeeds.
