# Phase 2: Financial Dashboard

Build the first useful Finance module on top of a stable, explicitly defined
data contract. The existing `Vacation Finances` workbook should remain read-only
and can inform future expense views, but it is not a normalized net-worth source.

- [ ] 1. Define the net-worth data source and contract
  - Identify an existing structured sheet or create a dedicated net-worth tab.
  - Document required fields: date, assets, liabilities, and optional account/category fields.
  - Add environment-based spreadsheet and range configuration.
- [ ] 2. Add a typed Finance data adapter
  - Parse and validate rows through `src/lib/sheets.ts`.
  - Handle dates, currency values, blank rows, and malformed records explicitly.
  - Keep the adapter independent from UI components.
- [ ] 3. Build Net Worth summary cards
  - Display Assets, Liabilities, and Total Net Worth.
  - Include loading, empty, and data-error states.
- [ ] 4. Render historical net-worth trend
  - Add Recharts only if the dependency is needed.
  - Plot the validated date/net-worth series with a responsive accessible chart.
- [ ] 5. Add Finance route refresh and caching behavior
  - Use the Sheets cache configuration from the integration helper.
  - Provide a clear refresh path without exposing credentials or write access.
- [ ] 6. Validate the Finance module end to end
  - Test against representative real or sanitized sheet data.
  - Run lint, type-check, production build, and manual route verification.
