# Budget Finance Subtab: Implementation Plan

## Purpose

Add a Budget subtab to the Finance area backed by the new `Budget` Google
Sheet. The first version turns Nathan's pay-period budget into an
interactive cash-flow model:

- Show where income goes.
- Make savings and investing visible separately from ordinary spending.
- Show how much money is unallocated and available to invest.
- Let the user change scenario values without writing back to Google Sheets.
- Provide useful monthly and annual equivalents for comparison with the FIRE
  calculator.
- Make the Budget and FIRE tabs reinforce one another without silently
  changing FIRE assumptions.

The primary visualization should be an interactive Sankey-style flow:

```text
Household income
  -> Taxes
  -> Core living
  -> Flexible spending
  -> Retirement investing
  -> Other investing
  -> Unallocated / available to invest
```

The source sheet is a planning document, not a normalized transaction table.
The implementation should preserve that distinction and expose parsing
diagnostics rather than implying more precision than the sheet contains.

## Observed source structure

Spreadsheet:

- Title: `Budget`
- Tab: `Planned`
- Observed range: `A1:Z100`
- Declared grid: 1,000 rows x 27 columns
- Populated content: 29 rows in the inspected range

The tab contains parallel blocks; only Nathan is in scope.

### Nathan block

- Header: `Nathan`
- Frequency: `Per Biweekly Pay Period`
- `Taxes`: 990
- `401K*`: 942.307692
- `ESPP**`: 709.615385
- `Car (Insurance + Maintainence)***`: 150
- `Rent (utilities, fees, etc.)`: 920
- `Fun / Savings****`: 1,018.846154
- `Pay*****`: 4,730.769231
- `Total Expenses******`: formula `=SUM(C2:C8)`

The current formula total includes taxes, investing, and the flexible
“Fun / Savings” bucket. It should therefore not be treated as “ordinary
spending” without classification.

The second household block is explicitly ignored. It is not loaded, normalized, or
displayed by the Nathan-only Budget subtab.

### Notes and caveats in the source

The sheet includes explanatory notes in column E and household responsibility
notes in rows 28-29:

- Nathan pays housing-related expenses.
- The excluded household block pays food, gas, subscriptions, and household
  items; those values are intentionally not included.
- The Nathan pay note excludes a sign-on bonus, relocation payment, and target
  bonus.
- Insurance has prepayment and sharing notes.
- The 401(k) line references a 7.5% match.
- The ESPP line is explicitly marked as requiring confirmation.
- The budget excludes one-time move-in and furniture expenses.
- The sheet is specifically annotated for an August 17–December 31, 2025
  planning period.

These notes should be preserved as diagnostics/context, not discarded during
parsing.

## Product decisions

### 1. Normalize internally to monthly values

The source values are per biweekly pay period. The normalized model should
retain:

- Original amount
- Original frequency
- Source person
- Source label
- Source row number
- Source note, when present
- Classification
- Monthly equivalent
- Annual equivalent

For recurring per-pay-period values:

```text
monthly equivalent = biweekly amount × 26 / 12
annual equivalent = biweekly amount × 26
```

Use 26 pay periods per year, not simply `amount × 2`, so the Budget tab can
line up with FIRE's annual spending and contribution assumptions.

The UI should label this conversion clearly:

```text
Source: biweekly pay period
Planning view: monthly equivalent
```

### 2. Separate income, taxes, spending, and investing

The normalized classification should distinguish at least:

- `income`
- `tax`
- `housing`
- `transportation`
- `food`
- `household`
- `subscriptions`
- `flexible-spending`
- `retirement-investing`
- `other-investing`
- `unallocated`
- `unknown`

Classification should use explicit parser rules and preserve the original
label. Suggested initial rules:

- `Pay` -> income
- `Taxes` -> tax
- `401K`, `401K / ...` -> retirement-investing
- `ESPP` -> other-investing
- `Rent`, housing, utilities, fees -> housing
- `Car`, gas, insurance, maintenance -> transportation
- groceries, food -> food
- household -> household
- subscriptions -> subscriptions
- Fun / Savings -> flexible-spending with an ambiguity flag

Do not silently classify a combined `Fun / Savings / 401K` value as entirely
spending or entirely investing. Represent it as an unresolved mixed bucket
until the user assigns a split.

### 3. Keep source values and scenario values separate

The Budget page should have two layers:

1. **Source budget**
   - Parsed from Google Sheets.
   - Read-only.
   - Used as the initial scenario.
2. **Scenario budget**
   - Editable in the browser.
   - Never writes back to the sheet.
   - Used for the Sankey, free-to-invest amount, and FIRE handoff.

The UI should offer a reset action:

```text
Reset to sheet values
```

The scenario should be serializable in the URL, using compact query parameters
or a versioned encoded payload. It should not be stored in Google Sheets.

## Proposed page layout

Route:

```text
/finance/budget
```

### Header

```text
Finance / Budget
Budget
Interactive monthly cash-flow plan

[Source period: Biweekly] [View: Monthly v] [Reset to sheet values]
```

Show a small source-context note:

```text
Based on the Planned tab. Values are converted from biweekly pay periods.
```

### Summary cards

Recommended cards:

1. **Monthly household income**
2. **Monthly core spending**
3. **Monthly investing**
4. **Free to invest**
5. **Savings rate**

Definitions:

```text
monthly income = all income lines
monthly core spending = taxes + classified living expenses,
                       excluding investing and unallocated money
monthly investing = retirement investing + other investing
free to invest = income - taxes - spending - investing
savings rate = investing / income
```

Taxes should be displayed separately in the flow and included in the cash
outflow, but the card labels should make clear whether “spending” includes
taxes. Recommended copy:

```text
Core outflows
Includes taxes and classified living expenses
```

If the result is negative:

```text
Overallocated by $X/month
```

If positive:

```text
$X/month available to invest or assign
```

### Main Sankey flow

Build the flow from normalized scenario nodes and links:

```text
Household income
  -> Nathan income

Nathan income
  -> Taxes
  -> Household spending categories
  -> Retirement investing
  -> Other investing
  -> Unallocated
```

The first implementation may aggregate both people into household-level
categories if individual-to-category ownership makes the graph too noisy.
Person-level toggling can be added later.

Node groups should have stable colors:

- Income: cyan/blue
- Taxes: slate
- Core spending: amber
- Flexible spending: purple
- Retirement investing: green
- Other investing: teal
- Unallocated/free to invest: emerald
- Unknown/ambiguous: orange

### Interaction behavior

The Sankey must be more than a static picture:

- Hover a node to highlight connected links.
- Hover a link to show source, destination, amount, frequency, and percent of
  source.
- Click a category to focus its corresponding editor rows.
- Use keyboard-focusable controls for category values; do not make the SVG the
  only way to edit data.
- Keep the chart usable when a category is zero.
- Show an explicit negative/overallocated state instead of drawing negative
  Sankey widths.

Recommended link tooltip:

```text
Rent -> Core spending
$1,993/month
42% of classified household outflows
Source: Nathan, biweekly budget
```

## Editable budget controls

Place an editor below or beside the Sankey:

```text
Income
  Nathan pay                         $X / month
Taxes
  Nathan taxes                       $X / month

Core spending
  Rent / housing                     $X / month
  Car / transportation               $X / month
  Food                               $X / month
  Household                          $X / month
  Subscriptions                      $X / month
  Flexible / fun                     $X / month

Investing
  Nathan 401(k)                      $X / month
  Nathan ESPP                        $X / month
  Unassigned free-to-invest          $X / month
```

Use the same text/inputMode approach as the FIRE calculator:

- Avoid browser number spinners.
- Commit on blur or Enter.
- Support clearing and retyping without leading-zero artifacts.
- Show monthly values by default, with an annual view toggle.
- Preserve the original biweekly source amount in a detail tooltip or
  expandable row.

For the mixed Nathan source label, expose its ambiguity:

```text
Nathan "Fun / Savings"
  Spending share                     [ 50% ]
  Investing share                    [ 50% ]
```

If the split is not confirmed, label it:

```text
Mixed source bucket — scenario split
```

Do not imply that the sheet itself provides that split.

## Free-to-invest calculations

The page should answer the user’s likely action question directly:

```text
Free to invest =
total income
- taxes
- classified spending
- current investing
```

Two related numbers should be shown:

### Existing investing

The amount already assigned to 401(k), ESPP, Roth-like savings, or other
investing categories.

### Additional free-to-invest

The amount remaining after all current assignments:

```text
additional free-to-invest =
income - taxes - spending - existing investing
```

If the user increases a spending field, the free-to-invest amount should
decrease immediately. If the user increases an investing field, it should
decrease while total savings rate increases.

When additional free-to-invest is positive, provide an action affordance:

```text
Assign all free cash to investing
```

This should update only the local scenario, not the source sheet.

When negative, provide:

```text
Reduce spending or investing assignments by $X/month to balance the plan.
```

## FIRE calculator integration

The Budget page should synergize with FIRE without silently overwriting FIRE
inputs.

### FIRE handoff actions

Add explicit actions:

```text
Use budget spending in FIRE calculator
Use budget investing in FIRE calculator
Open FIRE with this scenario
```

Recommended behavior:

- “Use budget spending” passes the budget's annual classified retirement
  spending to FIRE as a URL parameter.
- “Use budget investing” passes annual existing investing plus selected
  additional free-to-invest.
- “Open FIRE with this scenario” opens `/finance/fire` with the budget-derived
  values encoded in the FIRE query parameters.

Do not replace FIRE's `$40,000` planning baseline automatically. The user
should choose when to use the budget value because the Budget sheet contains
current-life categories, taxes, shared costs, and ambiguous savings buckets
that may not equal desired retirement spending.

### Useful integration outputs

The Budget page should calculate and expose:

- Annual current spending excluding investing
- Annual spending including taxes
- Annual existing investing
- Annual total potential investing
- Monthly and annual free-to-invest
- Budget-derived savings rate
- A suggested FIRE annual contribution value
- A suggested FIRE annual spending value with an explicit definition

The FIRE handoff should include a small explanatory label:

```text
Budget-derived values are suggestions. Review taxes, shared expenses,
one-time costs, and retirement-only spending before using them.
```

## Source loading and data model

### New source registry entry

Add a `budget` source to `src/lib/finance/sources.ts`:

- Environment variable: `GOOGLE_SHEET_ID_BUDGET`
- Default tab: `Planned`
- Range: `'Planned'!A1:Z100`
- Status: `semi-structured`
- Revalidation: approximately one hour

The supplied spreadsheet ID should be placed in the local environment as:

```text
GOOGLE_SHEET_ID_BUDGET=...
```

It should not be hardcoded in source code or documentation.

### Normalized types

Add types similar to:

```ts
type BudgetFrequency = "biweekly" | "monthly" | "annual";
type BudgetCategory =
  | "income"
  | "tax"
  | "housing"
  | "transportation"
  | "food"
  | "household"
  | "subscriptions"
  | "flexible-spending"
  | "retirement-investing"
  | "other-investing"
  | "unallocated"
  | "unknown";

type BudgetLine = {
  person: string;
  sourceLabel: string;
  sourceAmount: number;
  sourceFrequency: BudgetFrequency;
  monthlyAmount: number;
  annualAmount: number;
  category: BudgetCategory;
  ambiguity: "none" | "mixed-source-label" | "unknown-label";
  sourceTab: string;
  sourceRow: number;
  note?: string;
};
```

The dashboard model should additionally contain:

- `sourceLines`
- `scenarioLines`
- `householdIncome`
- `taxes`
- `coreSpending`
- `existingInvesting`
- `additionalFreeToInvest`
- `totalPotentialInvesting`
- `savingsRate`
- `diagnostics`
- `sourcePeriodLabel`
- `sourceNotes`

### Parser strategy

The parser should:

1. Detect person headers in column A.
2. Detect frequency rows in column B.
3. Detect line labels and amounts in columns B/C.
4. Treat `Pay` as income.
5. Treat `Total Expenses` as a source total/check, not a category.
6. Preserve formulas and compare formula-rendered totals with calculated line
   totals where possible.
7. Capture notes in column E and trailing responsibility notes.
8. Preserve source row numbers.
9. Emit diagnostics for:
   - Missing amount
   - Unknown label
   - Mixed label
   - Formula total mismatch
   - One-time or period-limited note
   - Negative or invalid amount

Do not make the parser depend on the exact current row numbers beyond the
source-block detection rules.

## URL scenario design

Use a versioned query scheme so the Budget page can be shared:

```text
/finance/budget?v=1&view=monthly&...
```

Possible state:

- Display mode: monthly or annual
- Edited line values
- Mixed-bucket split percentages
- Whether free cash has been assigned to investing

Keep the URL compact and avoid embedding raw notes or unnecessary duplicate
values. The source sheet remains the authority for reset behavior.

## Diagnostics and source transparency

Show a collapsible “Source notes and assumptions” section:

- Source tab and row for each line
- Original biweekly amount
- Converted monthly amount
- Formula or source-total discrepancy
- Ambiguous mixed categories
- Period-specific note about August–December 2025
- Excluded bonus and one-time expense notes

Use explicit language:

```text
This is a scenario interpretation of the Planned tab.
It is not a transaction ledger.
```

## Implementation slices

### Slice 1: Source inspection and contracts

- [ ] Add `GOOGLE_SHEET_ID_BUDGET` to local environment configuration.
- [ ] Add Budget to the safe finance inspection command.
- [ ] Record the observed `Planned` structure and diagnostics.
- [ ] Add normalized Budget types.
- [ ] Add fixtures for both person blocks, mixed labels, formulas, notes, and
  missing rows.

### Slice 2: Parser and loader

- [ ] Implement person-block detection.
- [ ] Parse biweekly line items.
- [ ] Convert biweekly values to monthly and annual values.
- [ ] Classify categories.
- [ ] Preserve source coordinates and notes.
- [ ] Validate source totals without treating them as spending categories.
- [ ] Add cached Budget loader and central exports.

### Slice 3: Budget model

- [ ] Build household totals.
- [ ] Calculate taxes, core spending, existing investing, free-to-invest,
  potential investing, and savings rate.
- [ ] Add mixed-bucket scenario split handling.
- [ ] Add diagnostics and overallocated states.

### Slice 4: Budget page shell

- [ ] Add `/finance/budget`.
- [ ] Add Finance navigation link.
- [ ] Add source-neutral loading/error states.
- [ ] Add monthly/annual display switch.
- [ ] Add reset-to-sheet-values behavior.

### Slice 5: Sankey and editable scenario UI

- [ ] Implement Sankey node/link model.
- [ ] Add hover and focus tooltips.
- [ ] Add category editor controls.
- [ ] Add mixed-bucket split editor.
- [ ] Add free-to-invest action.
- [ ] Add negative/overallocated state.

### Slice 6: FIRE integration

- [ ] Add budget-derived spending/contribution summaries.
- [ ] Add explicit FIRE handoff actions.
- [x] Generate FIRE query parameters without silent overwrites.
- [x] Explain budget-to-FIRE interpretation differences.

### Slice 7: URL sharing and verification

- [ ] Serialize editable scenario state.
- [ ] Restore shared scenarios after hydration safely.
- [ ] Add parser/model/UI tests.
- [ ] Verify tooltip accessibility and keyboard focus.
- [ ] Verify empty, ambiguous, negative, and formula-mismatch cases.
- [ ] Run tests, TypeScript, lint, build, and diff checks.

## Test plan

### Parser tests

- Detect Nathan and stop before second household block blocks.
- Parse the per-biweekly frequency.
- Parse income, tax, spending, and investing lines.
- Ignore blank rows and notes as line items.
- Preserve source row numbers.
- Preserve source notes.
- Classify combined `Fun / Savings` as ambiguous.
- Treat `Total Expenses` as a check, not an ordinary expense.
- Handle formulas and formula-rendered totals.
- Report malformed and missing amounts.

### Model tests

- Convert biweekly to monthly using `26 / 12`.
- Convert biweekly to annual using `× 26`.
- Calculate household income.
- Calculate taxes separately.
- Calculate core spending excluding investments.
- Calculate existing investing.
- Calculate additional free-to-invest.
- Calculate savings rate.
- Show negative free cash when overallocated.
- Preserve mixed-bucket ambiguity in the scenario.
- Assign free cash to investing without changing source lines.

### UI tests

- Render all summary cards.
- Toggle monthly and annual views.
- Edit a line and update the Sankey totals.
- Edit a line and update free-to-invest.
- Focus a node/link and expose its tooltip.
- Keyboard-operate category controls.
- Reset scenario to source values.
- Open FIRE with explicit budget-derived query parameters.
- Restore a shared Budget URL without hydration errors.

## Recommended first release scope

The first release should include:

- Source parsing for the current `Planned` tab.
- Monthly and annual normalized views.
- Four/five summary metrics including free-to-invest.
- A household-level Sankey.
- Editable category values.
- An explicit ambiguity label for the mixed Nathan savings bucket.
- Reset-to-sheet-values.
- Source diagnostics.
- Explicit FIRE handoff links.

Defer until after the first release:

- Fully person-specific Sankey paths.
- Automatic transaction reconciliation.
- Bonus and one-time income modeling.
- Historical month-by-month actual-vs-planned tracking.
- Automatic optimization of the “best” investment account.
- Writing scenario changes back to Google Sheets.

## Definition of done

- The Budget tab loads through the shared cached Sheets layer.
- The parser correctly handles both person blocks and their notes.
- The UI makes biweekly-to-monthly conversion visible.
- The Sankey balances or clearly reports an overallocated budget.
- Free-to-invest updates immediately when editable values change.
- Ambiguous mixed buckets are visibly marked and editable.
- FIRE handoff values are explicit and reversible.
- Shared scenario URLs restore all editable state.
- No source credentials or spreadsheet IDs are exposed to the client.
- Tests cover formulas, conversions, classifications, ambiguity, and negative
  free cash.
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and
  `git diff --check` pass.
