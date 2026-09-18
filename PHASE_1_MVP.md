# Phase 1: Foundation & Integration De-risking

This phase establishes the application shell and verifies that the app can safely
read the current Google Sheets data. The financial dashboard is intentionally
planned for the next phase because the inspected workbook contains trip-expense
tabs rather than a normalized net-worth dataset.

- [x] 1. Set up Shadcn UI & dark theme base layout
- [x] 2. Create sidebar navigation with active routes (/finance, /recipes, etc.)
- [x] 3. Build Google Sheets API integration helper
- [x] 3a. Test Sheets access and document the Finance data shape

## Outcome

- The dark responsive application shell is working.
- Sidebar routes and module placeholders are in place.
- Read-only Google Sheets authentication is configured and verified.
- The current `Vacation Finances` workbook has four variable-shape trip-expense tabs.
- Moving the workbook in Google Drive is safe because integration uses its spreadsheet ID.