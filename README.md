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

To inspect the configured Finance spreadsheet without changing it, run:

```bash
npm run inspect:finance
```

This discovers every tab and reports its dimensions, headers, populated-value
counts, and basic inferred types. It intentionally does not print cell contents.

## Project phases

- [Phase 1: Foundation & Integration De-risking](./PHASE_1_MVP.md) — complete.
- [Phase 2: Financial Dashboard](./PHASE_2_FINANCES.md) — next.

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
