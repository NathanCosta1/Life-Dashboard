# FIRE Calculator

The FIRE calculator is a local, interactive planning tool at `/finance/fire`. It models financial independence (FI), Coast FI, portfolio growth, contribution behavior, milestone timing, and retirement-horizon outcomes.

The calculator is intentionally separate from the source finance sheets. It can use dashboard data to prefill a few values, but edits made in the calculator remain local to the page and never write back to Google Sheets.

## Product purpose

The calculator answers several related questions:

- What portfolio value is required to support the planned annual spending?
- How much of that full FI target has already been reached?
- When might the portfolio reach full FI under the selected assumptions?
- What happens if spending or monthly investing changes?
- How does a different real-return assumption affect the trajectory?
- If a retirement age is supplied, when could contributions stop under a Coast FI strategy?
- If contributions stop at Coast FI, does the portfolio still reach the full FI target by the desired retirement age?

The primary projection is useful without a retirement target. Retirement age and years-to-retirement are optional planning inputs used for the Coast FI and retirement-horizon analysis.

## Location and architecture

- Route: `/finance/fire`
- Server page: [`src/app/finance/fire/page.tsx`](./src/app/finance/fire/page.tsx)
- Client dashboard: [`src/components/finance/fire-dashboard.tsx`](./src/components/finance/fire-dashboard.tsx)
- Calculation model: [`src/lib/finance/fire-model.ts`](./src/lib/finance/fire-model.ts)
- Finance test coverage: [`src/lib/finance/finance.test.ts`](./src/lib/finance/finance.test.ts)

The server page loads Net Worth and Investing data in parallel, constructs a FIRE dashboard model, and passes that model to the client dashboard. The calculation functions are pure with respect to their inputs and are directly testable.

## User interface overview

The page is organized into:

1. Page header and retirement-horizon status
2. Assumption controls
3. Summary metric cards
4. Main portfolio projection
5. Scenario analysis
6. Projected milestones
7. Optional Coast FI projection
8. Shareable scenario URL and working-month insight

The Coast FI-specific controls, milestone row, banner, and chart only appear while **Set a retirement target** is enabled.

## Shareable scenario URLs

The calculator serializes its current state into query parameters in the page URL. After a scenario is edited, the URL updates without a full page reload. Copying that URL and opening it elsewhere restores the scenario.

The URL includes:

- Investable portfolio
- Annual spending
- Annual contributions
- Real return
- Withdrawal rate
- Years to retirement
- Desired retirement age
- Whether contribution growth is enabled
- Annual/monthly display mode
- Whether retirement planning is enabled

The URL state is applied after the initial client render so shared scenarios do not create a server/client hydration mismatch. The URL uses compact parameter keys to keep shared links reasonably short.

A small note at the bottom of the page includes a link to the current scenario URL:

> P.S. Copy this link to share your current parameters.

The reset action restores the dashboard defaults and rewrites the URL to match the reset state.

## Working-month freedom insight

The summary row contains a fourth, compact supporting card alongside Full FI progress, Coast FI progress, and portfolio-supported spending:

```text
One working month buys:
  monthly contributions / monthly spending
  months of freedom
```

Because both values are monthly, this is equivalent to annual contributions divided by annual spending. For example:

- Monthly contributions: `$2,000`
- Monthly spending: `$3,333`
- Freedom purchased per working month: approximately `0.6 months`

The card is intentionally a secondary perspective metric rather than a primary FI target card. It displays the value as `X.X mo` with the detail “Each month of work buys approximately.” If spending is zero, the displayed value resolves to `0.0` instead of producing an invalid division result.

## Prefilled defaults

The page uses dashboard data where it is useful, while keeping planning assumptions intentionally explicit.

### Starting portfolio

The starting portfolio defaults to the latest available Net Worth record's `netWorth` value. Negative values are clamped to zero.

### Annual spending

Annual spending defaults to a `$40,000` planning baseline. It does not automatically use the latest expense record because the FIRE calculator is intended to represent a forward-looking lifestyle assumption rather than blindly treating a potentially incomplete or atypical expense record as the desired retirement budget.

### Annual contributions

Annual contributions are informed by the latest populated Investing year:

1. Identify the most recent year with investment-month data.
2. Sum monthly contribution totals for that year.
3. Count the active months.
4. Calculate the average active-month contribution.
5. Annualize it by multiplying by 12.

Starting contribution balances are not treated as current monthly contributions.

### Return and withdrawal assumptions

The defaults are:

- Real return: `5%`
- Withdrawal rate: `4%`

These are editable assumptions, not guarantees.

### Retirement defaults

Retirement planning is enabled by default with:

- 20 years to retirement
- A retirement age derived from the current age plus 20 years

The current age is derived from the baked-in birthday of July 25, 2003 and the server-provided current date. The page avoids calculating the current date during client rendering, which keeps the initial HTML hydration-safe.

## Assumption controls

### Investable portfolio

The portfolio input is the current investable portfolio used as the starting point for every projection.

### Spending and contributions

Spending and contributions have a shared, compact period switch:

- **Annual**
- **Monthly**

The model stores both values annually. Monthly mode is a presentation and input convenience:

- Displayed monthly spending = annual spending / 12
- Displayed monthly contributions = annual contributions / 12
- A monthly edit is multiplied by 12 before it is sent to the model

Displayed monthly values are rounded to two decimal places to avoid exposing floating-point artifacts such as `3333.3333333333335`.

### Text-based numeric inputs

Numeric controls are text inputs with `inputMode="decimal"` rather than browser number inputs. This provides several intentional behaviors:

- No browser spinner arrows
- Better visual control over the input appearance
- Decimal keyboard hints on supported mobile devices
- Clearing a field and retyping does not preserve a leading zero
- Enter commits the value and blurs the field
- Blur commits the value
- Empty or non-numeric committed input resolves to zero

The input labels have consistent control heights so the retirement controls remain aligned when shown side by side.

### Real return

The real-return input controls the annual return after inflation. A 5% real return means the model grows values in today's-dollar terms at 5% per year.

The model clamps the return so that the annual factor cannot fall below zero. This prevents an invalid return below `-100%`.

### Withdrawal rate

The withdrawal-rate input is used to calculate the full FI number and portfolio-supported spending.

The model prevents the withdrawal rate from becoming zero by applying a minimum internal rate of `0.1%`. This avoids division by zero while still allowing the user to enter a very small rate.

### Contribution growth

The **Contributions grow 3% annually** checkbox is optional.

When enabled:

- Year-one contributions use the entered annual contribution value.
- Each subsequent year's contribution amount is 3% higher than the prior year's amount.
- The increase compounds year over year.

When disabled, the annual contribution amount remains constant.

### Optional retirement target

The **Set a retirement target** checkbox controls the retirement-horizon analysis.

When enabled, the page displays:

- Years to retirement
- Desired retirement age
- Top-level FI-by-retirement status
- Coast FI in projected milestones
- Coast FI projection chart
- Coast FI contribution-stop information

When disabled, the page keeps the main FIRE projection and full FI milestones but removes the retirement controls, retirement banner, Coast FI milestone row, and Coast FI chart. The Coast FI progress summary card remains visible because the calculation model retains its default horizon internally. This allows the calculator to be used as a general FI projection without requiring a desired retirement date.

### Years to retirement and desired retirement age

The two retirement controls are linked:

- Editing years to retirement updates the desired retirement age to current age plus the entered years.
- Editing desired retirement age updates years to retirement to the age difference.
- Years to retirement is clamped to a non-negative value.

These controls represent the same planning horizon in two forms:

- A duration: “How many years until retirement?”
- A date-like age: “At what age should retirement occur?”

## Summary metrics

### Full FI progress

Full FI progress is:

```text
starting portfolio / full FI number
```

The displayed percentage is capped visually at 100%, although the underlying calculation can exceed 100%.

The card also displays the starting portfolio and target amount.

### Coast FI progress

Coast FI progress is:

```text
starting portfolio / Coast FI target today
```

The target shown in the metric card is the Coast FI target calculated for the current date and selected retirement horizon.

This card is based on the retirement planning assumptions even before Coast FI is reached.

### Portfolio-supported spending

Portfolio-supported spending is:

```text
starting portfolio × withdrawal rate
```

It expresses the annual spending that the current portfolio could support under the selected withdrawal rate, without claiming that the user has reached full FI.

### Working-month freedom

The fourth summary card calculates:

```text
annual contributions / annual spending
```

This is mathematically equivalent to monthly contributions divided by monthly spending. It estimates how many months of retirement spending are represented by one additional month of contributions.

## Full FI calculation

The full FI number is calculated as:

```text
FI number = annual spending / withdrawal rate
```

For example, `$40,000` of annual spending at a 4% withdrawal rate produces a `$1,000,000` full FI target.

The main projection starts with the current portfolio and advances one year at a time:

```text
next portfolio =
  current portfolio × (1 + real return)
  + annual contribution
```

The default main projection covers 51 points:

- Year 0, the current year
- Years 1 through 50

The model identifies the first projected year in which the base projection reaches or exceeds the FI number. That year is the estimated full FI year. If the target is not reached within the 50-year model horizon, the year is `null` and the UI displays “Beyond projection” or “Beyond 50-year view” where appropriate.

## Main portfolio projection chart

The main chart displays:

- A solid cyan base portfolio path
- A gray dotted lower-return path
- A gray dotted higher-return path
- A yellow dotted horizontal FI target line
- A small y-axis with dollar labels
- Horizontal dotted dollar guide lines
- Deterministic five-year x-axis labels
- A vertical FI marker when full FI is reached within the displayed projection

### Return range

The range uses two additional paths:

- Lower path: selected real return minus 2 percentage points
- Higher path: selected real return plus 2 percentage points

For example, with a 5% real-return assumption:

- Lower path: 3%
- Base path: 5%
- Higher path: 7%

The lower and higher paths use the same starting portfolio and contribution assumptions as the base path.

### Chart scale

The chart is visually concentrated around the meaningful pre-FI period and a short post-FI tail rather than always showing the full 50-year range at equal prominence.

The displayed range extends far enough to show:

- The FI marker, if reached
- A short period after the FI marker
- At least a minimum readable projection window when FI is not reached

### Axes and labels

- The x-axis uses deterministic five-year label positions.
- The FI marker is labeled `FI` rather than repeating a nearby year label, preventing overlapping year labels.
- The y-axis uses adaptive steps:
  - `$100,000` increments for smaller ranges
  - `$250,000` increments for medium ranges
  - `$500,000` increments for ranges at or above `$1,000,000`

The chart has horizontal scrolling on narrow screens instead of compressing the labels until they become unreadable.

## Chart tooltips and accessibility

The chart does not depend solely on thin SVG strokes for interaction. It places larger transparent hover and focus targets over each year's data point.

This makes the tooltip easier to trigger with a mouse and supports keyboard navigation.

### Base path tooltip

Hovering or focusing a base-path target shows:

- Year
- Base portfolio value
- Lower-return value
- Higher-return value

### Lower and higher return tooltip targets

The dotted lower and higher paths each have their own transparent focus/hover targets and accessible labels. Selecting one still presents the same year's comparison values so the return scenarios can be compared directly.

### Coast contribution tooltip targets

The Coast FI chart adds a separate target for each year's cumulative contribution value. These targets expose:

- Year
- Cumulative contribution amount
- Portfolio amount at that same year

This is separate from the portfolio path and ensures that the dotted contribution line can be inspected even when it is close to the portfolio line.

### Tooltip presentation

Tooltips:

- Use the existing non-bold visual style
- Show the year prominently but without special series-heavy typography
- Use tabular numeric values
- Position themselves to avoid running off the right side of the chart
- Use `role="status"` for the rendered tooltip

The SVG itself also uses accessible labels for:

- The overall chart
- The FI target line
- Lower-return path
- Higher-return path
- Cumulative contribution path
- Individual yearly hit targets

## Scenario analysis

The **What moves the date?** section shows quick comparisons using the same core assumptions:

- Spend `$5K` less
- Spend `$10K` more in retirement
- Invest `$1K` more per month
- Invest `$1K` less per month
- Barista FI with `$10K/year` of side income
- Coast Today with `$0` future contributions

The contribution scenarios adjust annual contributions by `$12,000`, corresponding to `$1,000` per month.

The retirement-spending scenario increases annual retirement spending by `$10,000` for the FI calculation. It represents a retirement-lifestyle change rather than an increase to current spending.

The Barista FI scenario reduces annual retirement spending by `$10,000`, reducing the FI target by `$10,000 / withdrawal rate`. At a 4% withdrawal rate, that is a `$250,000` target reduction.

The Coast Today scenario sets future annual contributions to zero and shows the year in which the starting portfolio reaches the full FI number through compounding alone.

Each scenario displays:

- The estimated full FI year
- The estimated age at that year
- “Beyond 50-year view” when the target is not reached in the model horizon

The scenarios intentionally focus on the projected year and age rather than adding a separate “years sooner” comparison line.

The section also explains that the main chart range uses the selected return assumption plus or minus 2 percentage points.

## Projected milestones

Projected milestones are sorted numerically by target amount rather than by the order in which they are defined.

The milestone list includes:

- `$100,000`
- `$500,000`
- `$1,000,000`
- Full FI target calculated from spending and withdrawal rate
- Coast FI target when retirement planning is enabled

Each milestone displays:

- Target amount
- Milestone label where applicable
- Percent complete based on the current starting portfolio
- Projected calendar year when available
- Estimated age when a year is available

If the Coast FI target is not reached by the retirement horizon, the Coast FI row explicitly says:

```text
Not reached by retirement
```

Full FI and fixed-dollar milestones can extend beyond the visible 50-year view. In that case, the row reports that the milestone is beyond the projection.

## Coast FI model

Coast FI is not treated as a permanently fixed dollar target after the current date. The required target changes as the retirement date gets closer.

### Coast FI target today

The current Coast FI target is:

```text
Coast target today =
  FI number / (1 + real return) ^ years to retirement
```

This is the amount that could grow to the full FI number over the entire remaining retirement horizon without additional contributions.

### Time-adjusted Coast FI target

During the Coast projection, the model recalculates the target for each future year:

```text
target for a future year =
  FI number / (1 + real return) ^ remaining years to retirement
```

The portfolio is allowed to keep receiving contributions until it meets the target corresponding to the remaining time.

This prevents a logical error where the calculator would use today's Coast target years after today, stop contributions too early, and then discover that the portfolio no longer has enough time to reach full FI.

### Contribution stop rule

Contributions stop only when all of the following are true:

1. The current simulated year is not past the retirement horizon.
2. The Coast FI threshold for the remaining years has been reached or exceeded.
3. A Coast FI stop year has not already been recorded.

Once the threshold is reached:

- Portfolio growth continues at the selected real return.
- New contributions are zero.
- The stop year is recorded as `coastReachedYear`.
- Cumulative contributions stop increasing.

If the threshold is never reached by retirement, contributions continue through the retirement year and `coastReachedYear` remains `null`.

## Coast FI projection chart

The Coast FI chart is shown only when retirement planning is enabled.

If Coast FI is not reached by the selected retirement date, the chart is intentionally replaced with a highlighted explanation. In that case contributions continue throughout the horizon, so a separate Coast FI chart would duplicate the ordinary contribution-included projection.

It displays:

- A solid portfolio path
- A dotted cumulative contributions path
- The FI target line
- A vertical yellow dotted Coast FI marker when contributions stop
- A `Coast FI` label at the stop marker
- Per-year hover/focus targets for both portfolio and contribution values

The chart uses the retirement-horizon projection rather than the ordinary full-FI projection. Its purpose is to answer:

> What happens if contributions stop once Coast FI is reached?

The summary below the chart reports either:

- `Contributions stop in YYYY; projected at retirement: $X`
- `Coast FI is not reached by retirement; contributions continue through YYYY.`

## Retirement-horizon status

When retirement planning is enabled, the top-level banner compares the ordinary contribution projection at the selected retirement horizon with the full FI number.

### Green status

```text
On track for FI by retirement
```

This means:

```text
ordinary projection at retirement >= full FI number
```

### Red status

```text
Not on track for FI by retirement
```

This means the ordinary projection at the selected retirement age is below the full FI number.

This banner answers the original retirement-horizon question. It is separate from whether Coast FI has already been reached.

## Data and projection distinctions

The calculator maintains separate projections for separate questions:

### Ordinary projection

The ordinary projection keeps contributions flowing according to the entered assumptions. It is used for:

- Full FI year
- Main chart
- Fixed-dollar milestone years
- Retirement-horizon status

### Coast projection

The Coast projection stops contributions after the dynamic Coast FI threshold is reached. It is used for:

- Coast stop year
- Coast chart
- Cumulative contribution path
- Coast retirement value
- Coast-specific FI support result

This distinction matters because a portfolio can be:

- Not Coast FI yet, while still being on track for full FI with continued contributions
- Coast FI reached, with enough time for the portfolio to grow to full FI
- Below the ordinary FI target today, but already Coast FI if it has enough time to compound

## Reset behavior

The **Reset dashboard values** button restores:

- Server-provided portfolio and contribution defaults
- `$40,000` annual spending baseline
- 5% real return
- 4% withdrawal rate
- Default retirement horizon
- Annual display mode
- Contributions-growth checkbox disabled
- Retirement planning enabled

## Locality and persistence

The calculator state is held in the client component. It does not update the underlying Google Sheets data.

The page currently resets to its defaults on a fresh page load. It does not persist custom calculator assumptions as a saved finance record.

## Hydration and rendering considerations

The page is server-rendered and then hydrated as a client component. To keep the initial render stable:

- Current year and age are computed in the server-built dashboard model.
- The client uses those supplied values rather than calling `new Date()` during render.
- SVG dynamic text is represented with stable SVG labels and ARIA attributes.

This avoids server/client markup differences from changing dates, ages, or dynamic SVG title content.

## Validation coverage

The finance test suite covers:

- Currency parsing used by the surrounding finance module
- Investing starting-contribution separation
- Inconsistent investing totals
- Vacation normalization
- Housing parsing and monthly totals
- Full FI number calculation
- Coast FI target calculation
- Full FI progress
- Portfolio-supported spending
- Full FI milestone year
- Lower and higher return paths
- Optional contribution growth
- Coast projection growth
- Dynamic Coast FI stop behavior
- Cumulative contributions stopping after Coast FI
- Coast retirement support success
- Coast retirement support failure
- Coast FI being reached immediately when the starting portfolio already qualifies
- Continued contributions when Coast FI is not reached by retirement
- Immediate full FI when the portfolio already equals the FI target
- Deterministic five-year chart label indexes

The standard validation commands are:

```text
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

## Interpretation notes

This calculator is a scenario model, not a forecast engine. Results are sensitive to:

- Spending
- Withdrawal rate
- Real return
- Contribution amount
- Contribution growth
- Retirement horizon
- Starting portfolio

The calculator uses steady annual modeling and does not currently model taxes, account-specific rules, Social Security, pensions, changing spending, sequence-of-returns risk, variable inflation, debt paydown, or asset allocation changes.
