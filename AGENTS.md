<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Life Dashboard Project Guidance

## Product

- This is a modular personal operating dashboard built with Next.js App Router,
  React, TypeScript, Tailwind CSS, Vitest, Google Sheets, and Google Docs.
- Keep modules and routes independent. Route data, components, styles, loading
  states, errors, and tests should live close to the module whenever practical.
- Do not let a change in one module break or restyle another module.
- Preserve the neutral sidebar as an orientation device; visual identity belongs
  primarily inside each module route.

## Data and server boundaries

- Google Sheets, Google Docs, service-account credentials, document IDs, API
  failures, and private-source data stay server-only.
- Never expose credentials or private document URLs to client components.
- Normalize source data into small typed contracts before rendering it.
- Preserve source values, missing values, and notes. Do not invent dates,
  measurements, totals, locations, summaries, or status values.
- Use existing parser and inspector patterns for each source. Add an inspector
  script when it helps validate a new Google source.
- Cache external reads through the existing Next.js patterns and surface clear,
  non-leaky loading and error states.

## Visual design

- Every major page should have a cool, deliberate, route-specific visual theme
  that fits its subject.
- Before implementing a new theme, inspect the neighboring active routes and
  avoid repeating their layout, background, typography, card density, chart
  shape, interaction pattern, or navigation metaphor.
- Prefer one strong subject-specific visual system over stacking generic cards
  into another dashboard.
- Use ideas grounded in the data or domain, such as editorial spreads, field
  journals, instrument panels, shelves, maps, posters, ledgers, or terrain.
- Keep the visual treatment local to the route root. Do not leak route colors,
  textures, fonts, or interactions into the global shell or unrelated modules.
- Use bold hierarchy and expressive spacing, but keep labels, values, controls,
  keyboard focus, tables, and plain-language summaries accessible.
- Creative visuals must never hide or replace important numbers.
- Charts need accessible names; interactions need visible focus and keyboard
  support; animations need reduced-motion behavior.

## Copy and content

- Write direct, useful interface copy.
- Do not add generic motivational, inspirational, or hype phrases such as
  "make today count," "own your journey," or "finish strong."
- Do not imply that missing data is zero, complete, unavailable due to a user
  error, or present in the source unless it was parsed.
- Keep source notes intact and in source order. UI copy may label them, filter
  them, or link to them, but must not rewrite or falsely summarize them.

## Implementation

- Make surgical, complete changes and preserve existing behavior.
- Follow existing file structure and TypeScript patterns. Add shared utilities
  only when more than one module genuinely uses them.
- For route work, inspect the relevant guide in
  `node_modules/next/dist/docs/` before changing App Router APIs.
- Add focused parser and interaction tests for new data behavior.
- Validate with the smallest relevant tests first, then lint and production
  build when the change affects shared UI or route structure.
- Check desktop and mobile behavior for route-local redesigns.
