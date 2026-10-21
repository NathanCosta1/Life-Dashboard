# Specification: Budget and Cash Flow Enhancements

This specification outlines the UI/UX enhancements for the **Budget** and **Cash Flow** sections under the Finance tab, addressing browser input arrow clutter, tightly-coupled spreadsheet labels, and the cramped Sankey visualization.

---

## 1. Eliminate Browser Up/Down Arrows (Input Spinners)

### Problem
In the scenario editor, the inputs are currently standard `<input type="number">`. This causes browsers to render default up/down spinner buttons (arrows), which look cluttered and don't match the clean, polished input design used in the FIRE calculator.

### Solution
1. **Global CSS Rule**: Add a global CSS utility in `src/app/globals.css` to disable number input spinner arrows across all modern browsers.
2. **Text Input with Decimal Mode**: Refactor the budget scenario inputs to use `type="text" inputMode="decimal"` combined with a React `draft` state (just like the inputs in the FIRE calculator dashboard). This completely prevents browser spinner arrows and provides a much smoother editing experience (committing on blur or enter).

---

## 2. Use Broad, User-Facing Budget Categories

### Problem
The Budget page should be a planning tool, not a visual copy of its source spreadsheet. Raw line items, footnotes, asterisks, source rows, and “Sheet:” labels make it feel too tightly coupled to that document.

### Solution
- Group imported values into broad, editable categories:
  - **Investing** — 401(k), ESPP, Roth IRA, taxable brokerage; employer match estimate shown separately.
  - **Fun** — dining, hobbies, and discretionary spending.
  - **Savings** — cash savings and short-term goals.
  - **Living** — internet, rent, fees, trash.
  - **Car** — maintenance and gas.
  - **Groceries** — food at home.
  - Income and taxes remain distinct.
- Map source values internally; do not display raw labels, source row numbers, sheet/tab details, or footnote markers in the normal UI.
- If source data combines Fun and Savings, initialize that amount under Fun and initialize Savings at `$0`; users edit each category independently.
- Categories without a matching source value (such as Groceries) start at `$0`.
- Scenario edits remain local/shareable and never write back to source data.

### Workplace benefit estimates

Add a collapsed **Workplace investing benefits** panel with small, pure-model
calculations sourced from the starting budget values:

- Estimate 401(k) employer match using eligible annual pay, employee 401(k)
  contributions, and a configurable default match cap of 7.5% of pay. The
  estimate is `min(employee contribution, eligible pay × match rate)`, assuming
  contributions are sufficient to receive the full match.
- Estimate ESPP discount value using annual ESPP contributions and a
  configurable default 15% market-price discount:
  `contribution × discount / (1 - discount)`.
- Show Roth IRA as a user-controlled “Maxed for the year” status. Do not
  hard-code an annual legal contribution limit.
- Keep these estimates outside of Sankey income/outflows and free-to-allocate
  totals; label them as estimates based on the starting plan.

Implement formulas as named pure model functions with tests; keep default
assumptions together in a small typed configuration rather than embedding
calculations in JSX.

---

## 3. Grand, Non-Overlapping Sankey Diagram

### Problem
The cash-flow Sankey should be a prominent visualization, not a compressed chain. Ribbons and labels must not overlap, including when categories are zero or the plan is over budget.

### Solution
- Use one prominent income node, smooth proportional ribbons, and a vertically stacked destination column.
- Scale ribbon widths to allocated amounts and retain a wide canvas; allow horizontal scrolling on narrow screens instead of squeezing labels.
- Keep source and destination order identical so ribbons do not cross. Reserve readable rows for zero-value categories without drawing fake nonzero ribbons.
- Show unassigned money as the remaining balance. When allocations exceed income, show the over-budget amount explicitly and keep all ribbons distinct.
- Use broad category descriptions beside destination amounts, never source-sheet labels.
- Keep category labels, descriptions, and currency values inside each destination node with adequate right padding.
- Use flat category colors; avoid gradients that reduce contrast or compete with the ribbon layout.

---

## Implementation Plan

1. **Global Styles**: Update `src/app/globals.css` to disable number-input spinners.
2. **Budget Inputs Refactoring**: Update `src/components/finance/budget-dashboard.tsx` to use draft state with text/decimal input style (no arrows).
3. **Category Mapping**:
   - Convert imported rows to broad scenario categories.
   - Keep source labels and rows out of the normal UI.
   - Initialize the combined Fun/Savings value under Fun and Savings at zero.
4. **Sankey Layout**:
   - Build proportional ribbons from income to every destination.
   - Provide room for every destination, including zero-value categories.
   - Verify responsive behavior and explicitly show over-allocation.
