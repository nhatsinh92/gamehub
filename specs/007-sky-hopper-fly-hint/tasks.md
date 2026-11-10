# Tasks: Sky Hopper ready-screen hint says how to fly

**Input**: Design documents from `/specs/007-sky-hopper-fly-hint/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/game-ui.md, quickstart.md

**Tests**: Required (constitution Principle III). Tag each test `[007:FR-###]`; assert the whole expected value (CLAUDE.md Rule 2); see each new/changed test fail before the code change.

## Phase 1: User Story 1 - Ready-screen hint teaches the flying input (Priority: P1)

**Goal**: The ready screen shows "Tap or press Space to fly" and nothing else changes.

**Independent Test**: `pnpm --filter sky-hopper test` passes; ready screen hint equals "Tap or press Space to fly".

### Tests first (must fail before T005)

- [ ] T001 [P] [US1] In `apps/sky-hopper/src/SkyHopper.test.tsx` change the expected ready hint in the loading→ready test (line ~44) to "Tap or press Space to fly" and tag the test `[007:FR-001]`; the whole expected array stays `["Tap or press Space to fly", "0", 1, null]` (FR-002: the rest of the array is unchanged).
- [ ] T002 [P] [US1] In `apps/sky-hopper/src/SkyHopper.input.test.tsx` change both expected ready hints (lines ~42 and ~90) to "Tap or press Space to fly"; tag `[007:FR-001]`.
- [ ] T003 [P] [US1] In `apps/sky-hopper/src/SkyHopper.replay.test.tsx` change the expected ready hint after "Play again" (line ~50) to "Tap or press Space to fly"; tag `[007:FR-001]`. The full expected array stays `["Tap or press Space to fly", "0", null, null]` (covers FR-002 for the other values).
- [ ] T004 [P] [US1] Add `apps/sky-hopper/src/hintContract.test.ts` tagged `[007:FR-003]`: read `specs/005-sky-hopper/contracts/game-ui.md` and assert the `ready` table row equals the full expected row text with `.hint` "Tap or press Space to fly". Run all of T001–T004 and confirm they fail.

### Implementation

- [ ] T005 [US1] In `apps/sky-hopper/src/SkyHopper.tsx` (line 12) change `hint` to "Tap or press Space to fly"; no other change.
- [ ] T006 [US1] In `specs/005-sky-hopper/contracts/game-ui.md` (line 11) change the ready row hint to "Tap or press Space to fly"; change only that table cell. Do not edit 005's `spec.md` (its prose has no exact hint text, so no Version bump is needed there).

## Phase 2: Polish

- [ ] T007 Search the repo (excluding `node_modules`, and 005's historical `tasks.md`/`quickstart.md`) for "Tap or press Space to start": no match remains (SC-001).
- [ ] T008 Run `pnpm turbo run lint check-types test --continue`; all pass (SC-002).

## Dependencies

T001–T004 (parallel, red) → T005, T006 (green) → T007 → T008.

## Implementation Strategy

Single story, MVP is the whole feature: tests red, then the string and contract changes, then verify.
