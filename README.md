This is a [Next.js](https://nextjs.org) project for a modular personal dashboard.

## Google Sheets configuration

The server-side Sheets helper in `src/lib/sheets.ts` uses a read-only Google service
account. Add these variables to `.env.local` (never commit this file):

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Share each spreadsheet with the service account email as a Viewer. The helper accepts
a spreadsheet ID and A1 range, maps the first row to field names, and lets callers
parse each row into a typed value. Reads are cached for one hour by default.

The Finance integration should use stable spreadsheet IDs and named ranges or
sheet tabs rather than relying on a Google Drive folder path. Moving a sheet
within Drive does not change its spreadsheet ID. Renaming a tab or changing
column headers can affect consumers, so the parser should validate headers and
the app should keep a small data-contract layer between Sheets and UI components.

The optional FIRE AI overview uses OpenRouter to generate a short overview
automatically for the current scenario, with a manual regenerate option.
Configure its credentials on the server (in `.env.local` for local development
and deployment secrets in production); never expose the key to client code:

```text
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=provider/model
```

Provider usage may incur cost. Without these settings, the ordinary FIRE
calculator remains available and the AI overview reports that it is not
configured.

To inspect the configured Finance spreadsheet without changing it, run:

```bash
npm run inspect:finance
```

This discovers every tab and reports its dimensions, headers, populated-value
counts, and basic inferred types. It intentionally does not print cell contents.

## Current modules

- Dashboard
- Finance
- Music
- Games
  - Library
  - Cornhole
  - Random
- Books
- Jobs
- Fitness
  - Basketball
  - Races
- Meditation
- Hikes
- Recipes
- Misc
  - Secret
  - Screen Time
  - Movies

## Adding or updating a module

Whenever a new module is added, update the
[Life Dashboard data refresh skill](./.github/skills/life-dashboard-data-refresh/SKILL.md)
in the same change. The skill entry should document:

- the source type and environment variable,
- the source tabs, document sections, or named ranges it reads,
- the matching inspector command and package script,
- the cache duration and whether refresh is automatic,
- the files that contain parsing and derived calculations,
- missing-value behavior and unit or plausible-value diagnostics,
- how any subjective or one-off statistics are calculated,
- parser tests and the recommended manual refresh cadence.

Use the refresh skill after source data changes, cached data looks stale, headers
drift, or subjective statistics need recomputation. Correct the Google Sheets or
Google Docs source itself when it contains a wrong value; parsers should validate
and preserve that value rather than silently repairing it.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
