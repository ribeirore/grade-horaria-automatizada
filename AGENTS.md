# Repository Guidelines

## Project Structure & Module Organization

This is a React 19, TypeScript, and Vite application for the LIA Impact Lab Case 3.

- `src/main.tsx` boots the React application and imports global styles.
- `src/App.tsx` is the current top-level UI component; add feature components under `src/` as the product grows.
- `src/App.css` contains component/page styling, while `src/index.css` holds global CSS and resets.
- `src/components/` contains the catalog, availability form, priorities, calendar and review dialog.
- `src/domain/` contains catalog preparation, the form reducer, draft validation and versioned storage; unit tests live alongside these modules.
- `src/data/catalog.json` is the pinned, aggregated official offer. Prepare it with `scripts/prepare-catalog.ts`; never add raw CSVs or teacher/room pseudonyms to the public bundle.
- `tests/browser/` exercises the production preview under the configured GitHub Pages base path; `docs/evidence/` records visual audit rounds.
- `docs/` contains the competition plan, AI decision log, and final-report draft.
- `public/` contains static assets copied directly to the Vite build, including the redistributed font licenses.

Use only official Impact Lab offer data. Preserve a class identity as `(periodo, turma_id)` and normalize duplicate schedule rows before suggesting timetables.

## Build, Test, and Development Commands

Use Node.js 22.12+ and npm.

```bash
npm install       # install locked dependencies
npm run dev       # start the Vite development server
npm run build     # type-check with TypeScript and create a production build
npm run lint      # run oxlint over the project
npm run preview   # serve the most recent production build locally
npm test          # run Vitest domain tests
npm run test:e2e  # run Chromium flows and axe checks against the production preview
```

Run `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` before handoff. Install Chromium with `npx playwright install chromium` once. Generation and comparison remain unavailable; the calendar displays only user-entered unavailability. Preserve the nested `grade-horaria-automatizada/` copy and pre-existing local work.

## Coding Style & Naming Conventions

Follow the existing style: two-space indentation, single quotes, no semicolons, and trailing commas in multiline calls. Use functional components and PascalCase names (for example, `ScheduleGrid.tsx`); use camelCase for variables and functions. Prefer case-data terms such as `turmaId` and `periodo`. Keep parsing, normalization, conflict detection, and ranking in small testable modules.

## Testing Guidelines

Place unit tests near their unit or in `src/**/*.test.ts`. Cover catalog deduplication, missing names/credits, period drafts, invalid blocks and incompatible priorities. When the scheduling engine is implemented, add indivisible class blocks, collisions, unavailable slots, and ranking ties with deterministic fixtures. Do not claim support for prerequisites or curriculum completion: they are out of scope. Re-run the independent `scripts/verify-catalog.py` comparison after preparing data or revising the interface.

## Commit & Pull Request Guidelines

The short repository history uses concise imperative summaries, including conventional prefixes such as `chore:`. Prefer messages like `feat: add timetable conflict detector` or `docs: record data-normalization decision`.

For pull requests, explain the user-facing change, list validation commands, link the related requirement or issue, and attach screenshots for UI changes. Update `docs/AI_LOG.md` for material AI-assisted decisions.
