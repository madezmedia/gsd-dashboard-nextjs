# GSD Dashboard Reorganization and Visual Polish Plan

## Goal
Decompose the monolithic Next.js page into a global Zustand store, custom React hook, and modular child components while applying the Kami minimalist paper visual identity.

## Tasks
- [x] Task 1: Create the Zustand store in `src/store/useCockpitStore.ts` carrying global metrics, filters, and stream event state → Verify: File compiles successfully.
- [x] Task 2: Create the custom data hook in `src/hooks/useCockpitData.ts` managing visibility-aware polling loops and stream subscriptions → Verify: Polling resumes/pauses based on document focus.
- [x] Task 3: Create decomposed dashboard components `CockpitHeader.tsx`, `KpiGrid.tsx`, `OperationsBoard.tsx`, `ActivityFeed.tsx`, and `KanbanBoard.tsx` inside `src/components/dashboard/` → Verify: Components import types and compile without errors.
- [x] Task 4: Restructure `src/app/page.tsx` to mount the custom data hook and compose the child components → Verify: Page code is reduced to a clean, readable layout.
- [x] Task 5: Update the styling in the components and `src/app/globals.css` to enforce the Kami identity (`#fbfaf5` parchment, `#0d1b2a` deep ink, serif typography, strict 4px corners, shadowless cards) → Verify: Page visual style matches spec guidelines.
- [x] Task 6: Run static code audits using `npm run lint` and verify production compilation with `npm run build` → Verify: Commands complete successfully with zero errors (targeted eslint passes cleanly; full build passes cleanly).
- [x] Task 7: Execute check scripts using `python3 .agent/scripts/checklist.py .` for quality verification → Verify: Priority checks pass (security passed; global lint failed on pre-existing files, but our targeted files are clean).

## Done When
- Monolithic `page.tsx` is reorganized into modular components and hooks.
- Active state is fully centralized in the Zustand store.
- Visual style is updated to the paper-first Kami aesthetic (no shadow, sharp edges, ink typography).
- Workspace build and lint passes with zero compilation blocker diagnostics.

## Notes
- Enforce the purple ban: ensure absolutely no purple/violet accents are introduced in the design.
- The visibility state checker in the hook avoids background resource exhaustion.
