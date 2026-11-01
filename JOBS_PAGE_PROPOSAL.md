# Jobs and Career Progression Module Proposal

## Recommendation

Create a separate **Jobs** module rather than adding this source to Finance.

The sheet is a career-history timeline: company, role, employment dates, pay at the start and end of the role, pay type, bonuses, and notes. These data describe professional progression and work experience. Finance currently models money mechanics and financial planning: budgets, cash flow, investments, net worth, vacation spending, and housing costs.

The Jobs and Finance modules should remain independent now. Jobs may later surface one carefully defined compensation figure inside a Finance view, but Finance should not become the home for a career timeline.

Recommended sidebar entry:

- Jobs
- Route: `/jobs`
- Order: near Finance, Books, and Games as another major life category

The source spreadsheet remains server-only. Its configured environment variable should be read only by server loaders and inspector scripts. No sheet ID, service-account credential, or private source URL belongs in client components or page output.

## Source Inspection Summary

The configured `GOOGLE_SHEET_ID_JOBS` spreadsheet was inspected through the Google Sheets read-only API.

### Source shape

- Spreadsheet title: `Job and Salary Progresion`
- One tab: `Sheet1`
- The tab declares 1,000 rows and 28 columns
- Eight non-empty record rows were returned
- Only nine source columns currently contain headers
- There are no additional formatted tabs or separate salary sheets

### Headers

| Header | Populated records | Interpretation |
|---|---:|---|
| Company | 8 | Employer or organization |
| Title | 8 | Role or position |
| Start Date | 8 | Employment start |
| End Date | 7 | Employment end; one blank row is the current role |
| Start Pay | 8 | Pay recorded when the role began |
| End Pay | 8 | Pay recorded when or before the role ended |
| Salary (S) or Hourly (H) | 8 | Compensation unit/type |
| Bonuses | 1 | Optional sign-on, relocation, or other bonus text |
| Notes | 3 | Source notes and scheduling context |

The remaining 19 declared columns are not headers and currently contain no source data.

## What the Source Supports

The source is small, personal, and chronologically legible. It can support:

- a career timeline in source order or start-date order
- company and role histories
- an hourly-versus-salary split
- start-to-end pay changes within each role
- current-versus-completed employment status
- pay progression over calendar time
- employer frequency
- role duration
- full source notes
- bonus details for roles that include them

The inspected source currently contains:

- eight roles
- one current role
- seven roles with an end date
- seven hourly roles
- one salary role
- five unique companies or organizations when repeated source names are grouped
- three rows with notes
- one row with bonuses

Exact employer and role totals should be calculated from parsed text, with source whitespace and line breaks normalized only for display.

## Source Data Quality and Parser Guardrails

The sheet should be normalized rather than corrected silently.

### Data that should remain separate

Keep these concepts separate in the type model:

- start pay
- end pay
- pay type
- bonus text
- date-based employment
- note text

Do not infer:

- annual salary from hourly pay
- hourly pay from annual salary
- bonuses as wages
- annualized compensation totals across overlapping roles
- a missing end date as a zero-duration role
- a missing bonus as zero

The one blank `End Date` should be represented as `current: true` or `endDate: null`. It must not be silently converted to today's date unless the interface explicitly says that it is still current.

### Current parsing issues

- The `Salary (S) or Hourly (H)` header wraps across two lines. The parser should match a trimmed normalized header, not rely on the rendered newline.
- `Company`, `Title`, and `Start Date` are populated for all eight records.
- Company and title values may contain leading or trailing whitespace, line breaks, or repeated internal spaces. Normalize display whitespace but preserve the original source string for notes and source issues.
- `End Date`, `Bonuses`, and `Notes` contain intentional blanks.
- Dates should be strict-parsed using the source's `MM/DD/YYYY` format. Invalid dates should be reported and excluded from timeline calculations rather than guessed.
- Pay values should be parsed as decimal strings or exact numeric source values. A pay value must retain whether it came from an hourly or salary record.
- One inspected salary pay value is unusually large if interpreted literally. The parser must display or flag it as source data until its unit and intended format are confirmed; it must not silently divide, rewrite, or round it.
- The source title contains a spelling issue. It is a source label and should not automatically change sheet values.
- The first header row should be required and validated even if the source returns cells past column I as blank.

## Recommended Route Structure

Use one route tree with no transient or application-specific submodules:

- `/jobs` - Career overview
- `/jobs/timeline` - Optional chronological expansion
- `/jobs/companies/[company]` - Optional company detail

Do not create routes for every pay or bonus category unless a meaningful quantity of records later exists. The initial eight-record source is best served by one strong overview plus a company/role ledger.

## Visual Direction: Career Museum / Staff Ledger

The Jobs route should feel like a quiet career archive, not a generic HR dashboard and not a Finance page with extra charts.

### Overall composition

- Warm paper background with black ink and restrained oxblood accents
- Large serif masthead: "Career Record"
- Small monospace accession numbers and source metadata
- A centered timeline rail as the primary visual structure
- Ledger cards for roles rather than stacked analytics cards
- Current-role marker clearly different from completed roles
- Newspaper/archive styling with strict rules, folio-style section labels, and ample negative space

Avoid the generic financial-dashboard language of accounts, portfolio value, yield, recurring income, and net growth.

### Color and type

- Paper: warm off-white
- Ink: charcoal
- Oxblood: current or highlighted role
- Brass: salary and compensation detail markers
- Slate: hourly roles and completed positions
- Large bookish serif for company names and titles
- Monospace labels for dates, durations, and accession numbers

Keep route colors inside `/jobs` and `jobs.css`. Do not modify the global shell theme or the Finance route palette.

### Career timeline

Each employment record can be represented by a horizontal archive band or a vertical timeline rail:

1. Date span at left
2. Company mark and role title at center
3. Pay context at right
4. Optional note or bonus disclosure
5. Current role called out with a distinct marker

Use source dates exactly. Display missing dates as "Not provided," not as "Present" unless a record is separately classified as current.

## Stats

The initial page should favor durable career facts over tiny, unstable counts.

### Headline stats

- Years of career history, based on the first start date and latest end/current date
- Total roles
- Unique companies
- Completed roles
- Current roles
- Hourly roles
- Salary roles
- Roles with documented notes
- Roles with bonuses

Do not calculate "months in workforce" with an imprecise overlap model unless overlaps are detected and handled explicitly.

### Progression stats

- Start-to-end pay change for each role
- Largest positive pay change within one role, only when both pay values are parseable and both use the same pay type
- Roles with no pay increase
- Current compensation type
- Number of employers

Hourly and salary rates are fundamentally different units. Never merge their values into one chart.

### Recommended visuals

- career timeline: primary
- compensation pathway: start and end pay per role, visually separated by H/S type
- small employer-frequency list, only if more than one role repeats the company
- current-role archive card
- notes ledger
- source-integrity panel

Do not create a single "all pay" chart because the source mixes hourly rates and annual salary compensation.

## Career Record Components

Suggested React structure:

```text
src/app/jobs/
  layout.tsx
  page.tsx
  loading.tsx
  error.tsx
  jobs.css

src/components/jobs/
  career-dashboard.tsx
  career-timeline.tsx
  role-ledger.tsx
  source-note-list.tsx

src/lib/jobs/
  types.ts
  sources.ts
  parser.ts
  data.ts
  jobs.test.ts
  index.ts
```

These are route-local patterns matching the implementation already used by Books, Music, and Finance.

## Typed Data Model

```ts
type PayType = "hourly" | "salary";

type JobRecord = {
  id: string;
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  startPay: number | null;
  endPay: number | null;
  payType: PayType | null;
  bonusText: string | null;
  notes: string | null;
  rowNumber: number;
};

type CareerLibrary = {
  jobs: JobRecord[];
  currentJobs: JobRecord[];
  completedJobs: JobRecord[];
  uniqueCompanies: Array<{ name: string; count: number }>;
  hourlyJobs: JobRecord[];
  salaryJobs: JobRecord[];
  sourceIssues: Array<{
    rowNumber: number;
    field: string;
    message: string;
  }>;
};
```

## Parser Requirements

The parser should:

- validate required headers: Company, Title, Start Date, Start Pay, End Pay, and compensation type
- normalize the wrapped compensation header
- strict-check `MM/DD/YYYY` values
- trim display whitespace and collapse line breaks
- parse pay as a decimal or number only when valid
- preserve unknown compensation types instead of guessing
- preserve bonus and note text
- treat a blank end date as a current role, without inventing an end date
- report duplicate or malformed rows
- sort valid timeline records by normalized start date
- calculate role duration only with both valid dates and only after detecting overlaps
- never convert pay units across the hourly/salary divide
- keep invalid records visible as source issues if included in the dashboard

## Server Loading and Caching

Add:

- `GOOGLE_SHEET_ID_JOBS` to a server-only Jobs source configuration
- Google Sheets metadata and bounded read range for `Sheet1`
- `unstable_cache` or the existing Next.js server cache pattern
- a bounded tab/row range rather than reading the entire sheet
- non-leaky loading and source-error states
- route-local `loading.tsx` and `error.tsx`

The sheet tab should initially be named through a checked constant or metadata lookup. If `Sheet1` is later renamed, data loading should locate the export tab by expected headers rather than assuming the display name.

## SEO and Accessibility

- Semantic `<main>`, `<section>`, and ordered timeline markup
- Accessible names for role timeline items
- Visible focus states and keyboard-accessible disclosures
- Reduced-motion behavior
- Color never used as the only distinction between pay types or current roles
- Small text kept at readable contrast and minimum sizes
- Source notes kept in source order
- Any pay chart labels include units

## Suggested Initial Page

### Masthead

"Career Record"

### Primary Timeline

Eight role records ordered by start date, with accession numbers and clear start/end spans.

### Right Ledger

- Seven completed
- One current
- Seven hourly
- One salary
- Unique company count
- Source notes count

### Employer Frequency

Only show repeating employers, not a decorative list of every employer.

### Source Notes

Keep `Notes` and `Bonuses` content intact, but render multiline text with whitespace preserved where practical.

## Testing

Add focused Vitest coverage for:

- required header validation
- multiline compensation header matching
- strict date parsing
- blank end date as current
- decimal pay parsing
- invalid pay values
- hourly and salary records remaining separate
- missing bonuses and notes remaining null
- source ordering and chronological sorting
- duplicate row handling
- compensation-unit mismatch rejection
- overlap-safe duration calculations
- exact employer frequency
- reconciling parsed records to row counts

The first implementation should pass:

1. Source inspector
2. Jobs parser tests
3. ESLint
4. Production build
5. HTTP checks for `/jobs`
6. Desktop and mobile visual review

## Acceptance Criteria

- Jobs is visibly separate from Finance in navigation
- `/jobs` loads only the server-side Jobs sheet
- No Google credentials or private sheet URLs reach client code
- Every role shows source-supported company, title, dates, and pay context
- Current employment is represented without fabricating an end date
- Hourly and salary data remain separate
- Missing notes and bonuses are not rendered as zero
- Source parsing issues are visible but not leak raw implementation details
- Route-local styling never changes Finance or the sidebar's global theme
- No annualized cross-unit compensation claims are invented
