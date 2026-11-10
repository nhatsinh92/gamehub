# Implementation Plan: sky-hopper

**Branch**: `005-sky-hopper` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md) (v0.1.0, Draft)

**Input**: Feature specification from `specs/005-sky-hopper/spec.md`

## Summary

Generate `apps/sky-hopper` with `pnpm gen-game sky-hopper`, keep the template's SDK, mount, adapters, names and hygiene code and tests, and replace the scratch-card gameplay with a one-tap flapper. The game logic is a set of pure modules under `src/game/` (config, seeded random, difficulty, `step`, fixed-step clock, canvas size); a thin React layer (`SkyHopper.tsx`, `GameCanvas.tsx`, `use-game-loop.ts`) runs the clock on `requestAnimationFrame`, pauses on `visibilitychange`, turns pointer/Space presses into one flap each, draws simple shapes on a canvas capped at device pixel ratio 2, and on game over submits the score and shows the outcome like the template. Research: [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2, ESM, React 19.3.1 (template versions)

**Primary Dependencies**: `@repo/game-core` (workspace), `react`, `react-dom`; dev tools as in the template (Vite 8.3.5, Vitest 5.1.0, happy-dom 21.0.4, ESLint 10.9.1). Nothing new

**Storage**: none (best score in memory, spec Assumption 2)

**Testing**: Vitest; pure logic tests in Node, UI tests in happy-dom with stubbed `requestAnimationFrame` (research R9); new tests tagged `[005:FR-###]`, kept template tests `[003:FR-###]`

**Target Platform**: modern mobile and desktop browsers, standalone page and embedded SDK script (Shadow DOM)

**Project Type**: web game app in the pnpm/turbo monorepo (`apps/`)

**Performance Goals**: 60–120 fps rendering; simulation 120 steps/s regardless of display; at most 12 steps per frame

**Constraints**: lint `max-lines-per-function` 60, `max-lines` 400; pure logic has no DOM/time/`Math.random`; template contract tests unchanged except scratch-UI driving (FR-002); canvas bitmap ≤ 2× logical

**Scale/Scope**: one game, ~10 small source modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Spec-First | Spec 005 v0.1.0 (Draft) drives this plan; every behaviour traces to an FR | Pass (pending owner approval) |
| II. Humans Decide | AI drafts only; the owner approves in the PR. The name change from the issue (spec Assumption 1) is flagged for review | Pass |
| III. Verified Against the Spec | Every FR-001..FR-022 has at least one `[005:FR-###]` test, written and seen failing on stubs first (tasks order red before green) | Pass (enforced in tasks) |
| IV. Simplicity | No new dependency; mulberry32 in a few lines instead of a library; no game engine; logic split into small pure modules because the issue requires pure, seeded, testable logic | Pass |
| V. No Secrets or Personal Data | Only the score is sent; the test token is the template's fake one; nothing stored | Pass |

**Post-design re-check (after Phase 1)**: unchanged.

## New dependencies

None.

## Project Structure

### Documentation (this feature)

```text
specs/005-sky-hopper/
├── spec.md
├── plan.md              # This file
├── research.md          # R1–R10
├── data-model.md        # config, state, transitions, clock, canvas size
├── quickstart.md
├── contracts/
│   ├── game-logic.md    # pure module signatures
│   └── game-ui.md       # DOM selectors, input, server calls, tracking
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
apps/sky-hopper/                    # created by pnpm gen-game sky-hopper
├── README.md                       # four template headings; describes this game (FR-002)
├── package.json                    # name sky-hopper (generated, unchanged)
└── src/
    ├── game/
    │   ├── config.ts               # CONFIG (FR-006)
    │   ├── random.ts  + .test.ts   # createRandom (FR-005)
    │   ├── difficulty.ts + .test.ts# difficulty (FR-012)
    │   ├── logic.ts   + .test.ts   # createState, step (FR-004, 007–012)
    │   ├── clock.ts   + .test.ts   # advanceClock, pauseClock (FR-014, FR-015)
    │   ├── canvas-size.ts + .test.ts # canvasBitmapSize (FR-016)
    │   ├── purity.test.ts          # game/ imports nothing from DOM/React, no Math.random/Date/performance (FR-004)
    │   └── draw.ts                 # canvas drawing, shapes only
    ├── best-score.ts + .test.ts    # bestScore(prev, score) (FR-018)
    ├── use-game-loop.ts            # rAF + clock + visibilitychange + flap flag
    ├── GameCanvas.tsx              # canvas element, bitmap size, pointer input, draw
    ├── SkyHopper.tsx               # loading/ready/playing/over screens, submit, best, tracking, Space input
    ├── SkyHopper.test.tsx          # UI, input, round end, outcome, replay, tracking, pause, cleanup
    ├── App.tsx                     # renders <SkyHopper /> instead of <ScratchCard />
    ├── styles.ts                   # new CSS
    ├── test-helpers.tsx            # fakeAdapter, renderApp kept; frame/input drivers replace scratch helpers
    ├── template-files.test.ts      # scratch files gone, deps unchanged (FR-001, FR-003, FR-022)
    ├── sdk.test.ts, standalone.test.tsx  # scratch driving → playToGround (R2)
    └── (unchanged) game-name.*, sdk.ts, mount-game.tsx, main.tsx, repo-hygiene.test.ts, sdk-build.test.ts
```

**Structure Decision**: one new app under `apps/`, laid out like the template; pure logic grouped in `src/game/` so the purity test can check one folder.

## Complexity Tracking

No violations.
