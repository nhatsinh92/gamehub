---

description: "Task list for sky-hopper"
---

# Tasks: sky-hopper

**Input**: Design documents from `specs/005-sky-hopper/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Required (constitution Principle III, test-first). Every new test is tagged `[005:FR-###]` in its name, asserts the whole expected value (CLAUDE.md Rule 2), and is seen failing on stubs before the code exists. Kept template tests keep their `[003:FR-###]` tags.

**Organization**: Tasks are grouped by user story. Paths are relative to the repository root; `APP` = `apps/sky-hopper`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story from spec.md (US1–US5)

---

## Phase 1: Setup

**Purpose**: Create the app with the generator (spec FR-001, research R1).

- [ ] T001 From the repository root run `pnpm gen-game sky-hopper`, then `pnpm install` (never create `apps/sky-hopper` by hand); confirm `pnpm turbo run lint check-types test --filter=sky-hopper` passes on the untouched copy
- [ ] T002 Create the stub modules from [contracts/game-logic.md](contracts/game-logic.md) with the exact exported signatures and placeholder bodies (return the input state, 0 steps, `{ speed: 0, gap: 0 }`, a random that returns 0, size 0×0): `APP/src/game/config.ts`, `APP/src/game/random.ts`, `APP/src/game/difficulty.ts`, `APP/src/game/logic.ts`, `APP/src/game/clock.ts`, `APP/src/game/canvas-size.ts`, `APP/src/game/draw.ts` (no-op), `APP/src/best-score.ts` (`bestScore` returns 0); UI stubs so UI tests fail on behaviour, not on imports: `APP/src/SkyHopper.tsx` (renders an empty `.game` child), `APP/src/use-game-loop.ts` (no-op hook), `APP/src/GameCanvas.tsx` (renders nothing)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Config and test drivers every story uses.

- [ ] T003 [P] Write `APP/src/game/config.test.ts`: `[005:FR-006] CONFIG equals the starting values` — `toEqual` the whole object from [data-model.md](data-model.md) GameConfig table (width 450, height 700, groundHeight 80, gravity 790, flapVelocity −290, birdX 120, birdWidth 34, birdHeight 24, pipeWidth 70, pipeSpacing 240, gapMargin 60, speedStart 170, speedMax 280, speedPerPoint 5, gapStart 200, gapMin 140, gapPerPoint 3, stepSeconds 1/120, maxSteps 12); see it fail, then fill `APP/src/game/config.ts` (frozen object)
- [ ] T004 Replace the scratch helpers in `APP/src/test-helpers.tsx` (remove `stubCanvasRect`, `scratch`, `scratchAll`; keep `TOKEN`, `WIN`, `fakeAdapter`, `flush`, `renderApp`) with the drivers of research R9: `installFrames()` (stubs `requestAnimationFrame`/`cancelAnimationFrame` with a queue, returns `frames(n, ms)` running `n` frames `ms` apart inside `act()`), `tap(el)` (pointerdown), `pressSpace(el, { repeat = false })` (keydown `code: "Space"`), `setHidden(hidden)` (defines `document.visibilityState`, dispatches `visibilitychange`), `playToGround(root, frames)` (one tap, then frames of 1000/60 ms until `.over` appears, at most 300 frames)

**Checkpoint**: config and drivers ready.

---

## Phase 3: User Story 1 - Player plays a round from ready to game over (Priority: P1) 🎯 MVP

**Goal**: pure, seeded game logic and a playable canvas round.

**Independent Test**: logic tests with fixed seeds and scripted flaps; UI test taps and sees ready → playing → over.

### Tests for User Story 1 (write first, see them fail on the stubs)

- [ ] T005 [P] [US1] `APP/src/game/random.test.ts`: `[005:FR-005] same seed gives the same first 5 numbers` (`toEqual` the exact mulberry32 values for seed 1, computed once and pasted), `[005:FR-005] numbers are in [0, 1)` (1000 draws), `[005:FR-005] a different seed gives a different sequence`
- [ ] T006 [P] [US1] `APP/src/game/logic.test.ts` (phases and physics): `[005:FR-007] createState is ready` (`toEqual` `{ phase: "ready", birdY: 310, velocity: 0, pipes: [], score: 0, sinceSpawn: 240 }`); `[005:FR-007] ready without flap is unchanged`; `[005:FR-007] [005:FR-008] flap in ready starts playing with flap velocity` (whole state after one step, per the data-model example: velocity −290 (no gravity on a flap step), birdY 310 − 290/120, one pipe `{ x: 450, gap: 200, scored: false, gapY: 160 + 300 × r }` where r is the first value of the seeded random, sinceSpawn 170/120); `[005:FR-008] one step without flap adds gravity·dt then moves`; `[005:FR-008] flap in playing sets velocity to −290`; `[005:FR-007] over ignores flaps and does not move`; `[005:FR-004] step does not mutate its input` (deep-frozen input, compare to a structured clone)
- [ ] T007 [P] [US1] `APP/src/game/logic.pipes.test.ts`: `[005:FR-009] a pair spawns every 240 px scrolled` (exact pipe x list after N steps); `[005:FR-009] gap centre maps random 0 and 1 to the range ends` (random → 0 gives gapY 160, → 0.999… gives just under 460 for gap 200); `[005:FR-009] pipes past the left edge are removed`; `[005:FR-010] score rises by 1 when birdX + birdWidth > x + pipeWidth, once per pair` (state with one pipe just before the edge, step twice, `toEqual` score 1 and `scored: true`); `[005:FR-010] [005:FR-011] pass and hit in the same step keeps the point and ends`
- [ ] T008 [P] [US1] `APP/src/game/logic.collide.test.ts`: `[005:FR-011]` table of whole-state cases — bird top ≤ 0 → over; bird bottom ≥ 620 → over; bird box overlapping a pipe x range outside the gap → over; bird inside the gap → playing
- [ ] T009 [P] [US1] `APP/src/game/logic.determinism.test.ts`: `[005:FR-005] same seed and flap script give identical state lists` (600 steps, flaps at fixed step indices, `toEqual` two runs); `[005:FR-005] another seed gives different gap positions`
- [ ] T010 [P] [US1] `APP/src/game/purity.test.ts`: `[005:FR-004] game modules use no DOM, React, time or Math.random` — read every non-test `APP/src/game/*.ts` except `draw.ts`, `toEqual([])` the list of files containing `react`, `document`, `window`, `Math.random`, `Date`, `performance`, `requestAnimationFrame`
- [ ] T011 [US1] `APP/src/SkyHopper.test.tsx` (round flow, uses T004 drivers): `[005:FR-021] loading text then ready` (`.status` "Loading…", then `.hint` "Tap or press Space to start", `.score` "0", one `canvas.play`); `[005:FR-021] load error shows the template text and taps do nothing` (`submitResult` calls `[]`); `[005:FR-007] tap starts playing; frames move the game; ground ends the round` (`.hint` gone, then `.over` present via `playToGround`)
- [ ] T012 [US1] `APP/src/SkyHopper.input.test.tsx`: `[005:FR-013] Space on the game root starts the round; repeat keydowns are ignored` (Space then 5 keydowns with `repeat: true` in ready: tracking `toEqual([game_open, game_start])`; in playing, a held Space (`repeat: true` only) gives the same time to `.over` as no input, measured in frames, while a fresh press delays it); `[005:FR-013] Space keydown default is prevented`; `[005:FR-013] other keys do nothing`; `[005:FR-013] taps while over do not start a round`

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement `createRandom` (mulberry32) in `APP/src/game/random.ts` (research R5)
- [ ] T014 [US1] Implement `createState` and `step` in `APP/src/game/logic.ts` per [data-model.md](data-model.md) transitions and collision rules; gap centre "uniform in `[gapMargin + gap/2, playable − gapMargin − gap/2]`"; `random` called exactly once per spawned pair; use `difficulty()` (stub returns start values until US4: implement it as `{ speed: cfg.speedStart, gap: cfg.gapStart }` for now); keep functions under 60 lines
- [ ] T015 [P] [US1] Implement `draw(ctx, state, cfg, scale)` in `APP/src/game/draw.ts`: sky, pipes, ground, bird as rectangles, score text; simple colours only
- [ ] T016 [US1] Implement `APP/src/use-game-loop.ts` (rAF loop calling `advanceClock` and `step` `steps` times, consuming a one-shot `flapPending` flag on the first step) and `APP/src/GameCanvas.tsx` (`canvas.play`, `pointerdown` → flap and focus root, draws when `getContext("2d")` is not null)
- [ ] T017 [US1] Replace `APP/src/ScratchCard.tsx` with `APP/src/SkyHopper.tsx` (screens from [contracts/game-ui.md](contracts/game-ui.md); `.game` root `tabIndex=0` handles Space keydown per research R6) and render `<SkyHopper />` in `APP/src/App.tsx`
- [ ] T018 [US1] Replace `APP/src/styles.ts` content with the game CSS (canvas keeps 450:700 aspect inside `.game`, `touch-action: none`; `.hint`, `.score`, `.over`, `.prize`, `.status`, `button`)

**Checkpoint**: a round can be played; US1 tests pass.

---

## Phase 4: User Story 2 - Round result is submitted and shown; player plays again (Priority: P1)

**Goal**: submit once, show the outcome, score and best, replay, tracking.

**Independent Test**: fake adapter outcomes, `playToGround`, assert texts, calls and events.

### Tests for User Story 2 (write first)

- [ ] T019 [US2] `APP/src/SkyHopper.result.test.tsx`: `[005:FR-017] game over submits the score once` (`calls.submitResult` `toEqual([0])` after extra frames and taps); `[005:FR-018]` table of outcomes copied from the template's outcome rows (win with reward → `.prize` "Golden Ticket"; no win, win without reward, OUT_OF_TURN, MAINTENANCE, ERROR → `.status` message; submit error → "Something went wrong. Please try again."), each also asserting `.final-score` "Score: 0" and `.best-score` "Best: 0"; `[005:FR-018] waiting for the server shows score and best and no button` (adapter whose submit stays pending)
- [ ] T020 [US2] `APP/src/SkyHopper.replay.test.tsx`: `[005:FR-019] Play again calls resetResult and returns to ready` (`.hint` present, `.score` "0", no `.over`), second round submits again (`toEqual([0, 0])`); `[005:FR-018] [005:FR-019] best score rule` in `APP/src/best-score.test.ts` (pure `bestScore(prev, score)` exported from `APP/src/best-score.ts`: table `prev, score → best` `[0,0 → 0]`, `[3,0 → 3]`, `[3,5 → 5]`) and `[005:FR-019] best score is kept across rounds` (UI shows "Best: 0" on the second over screen; a UI round with a score above 0 is not driven, because gap positions depend on the production seed, research R9); `[005:FR-020] tracking for a round and a replay` (`toEqual` `[game_open, game_start, game_over{score:0}, game_start, game_over{score:0}]`)

### Implementation for User Story 2

- [ ] T021 [US2] In `APP/src/SkyHopper.tsx` add the round hook (adapted from the template's `useRound`): on phase → over call `sendTracking({ name: "game_over", params: { score } })` and `submitResult(score)` once (ref guard), track `failed`; `game_start` on ready → playing; best via `bestScore` implemented in `APP/src/best-score.ts` (stub in T002); "Play again" calls `resetResult()`, new `createState`, new seed, clears the guard; outcome rendering as the template's `Outcome`

**Checkpoint**: US1 + US2 pass; the game is shippable.

---

## Phase 5: User Story 3 - Same game on every screen, no jump after a pause (Priority: P1)

**Goal**: fixed steps, pause when hidden, DPR cap.

**Independent Test**: clock and canvas-size pure tests; hidden-tab UI test.

### Tests for User Story 3 (write first)

- [ ] T022 [P] [US3] `APP/src/game/clock.test.ts`: `[005:FR-014] first frame takes 0 steps`; `[005:FR-014] after a first frame, 60 frames of 1000/60 ms and 120 frames of 1000/120 ms both take 120 steps` (`toEqual` the step totals `[120, 120]` and leftovers ≈ 0); `[005:FR-014] leftover carries` (frame of 13 ms → 1 step, leftover 13/1000 − 1/120); `[005:FR-014] a 2000 ms frame takes 12 steps`; `[005:FR-015] pauseClock resets last and leftover` (`toEqual(START_CLOCK)`), and after pause a frame 30 s later takes 0 steps
- [ ] T023 [P] [US3] `APP/src/game/canvas-size.test.ts`: `[005:FR-016]` table `dpr → { width, height, scale }`: 0.5 → 450×700×1, 1 → 450×700×1, 1.5 → 675×1050×1.5, 2 → 900×1400×2, 3 → 900×1400×2, `NaN`/0 → 450×700×1
- [ ] T024 [US3] `APP/src/SkyHopper.timing.test.tsx`: `[005:FR-014] the same round at 60 Hz and at 120 Hz ends on the same step count` (count frames×ms until `.over` for both rates: equal elapsed time within one frame); `[005:FR-015] hidden mid-round, 30 s later visible: no advance` (no `.over` after returning and one frame although 30 s would have hit the ground; then the round still ends after the normal remaining time); `[005:FR-016] canvas width/height attributes are 900×1400 at devicePixelRatio 3`; destroy mid-round leaves no queued frame and no `visibilitychange` effect (edge case)

### Implementation for User Story 3

- [ ] T025 [P] [US3] Implement `advanceClock`, `pauseClock`, `START_CLOCK` in `APP/src/game/clock.ts` exactly as in [data-model.md](data-model.md) Clock (epsilon 1e-9)
- [ ] T026 [P] [US3] Implement `canvasBitmapSize` in `APP/src/game/canvas-size.ts` (`scale = min(2, max(1, dpr || 1))`, sizes rounded)
- [ ] T027 [US3] In `APP/src/use-game-loop.ts` add the `visibilitychange` listener (hidden: cancel frame, `pauseClock`; visible: `pauseClock`, request frame) and cleanup on unmount; in `APP/src/GameCanvas.tsx` size the bitmap from `canvasBitmapSize(window.devicePixelRatio)`

**Checkpoint**: timing behaviour holds.

---

## Phase 6: User Story 4 - Difficulty grows with the score, within limits (Priority: P2)

**Goal**: speed and gap follow the score within limits.

**Independent Test**: difficulty table; pairs keep their spawn gap.

- [ ] T028 [P] [US4] `APP/src/game/difficulty.test.ts`: `[005:FR-012]` table `score → { speed, gap }`: 0 → {170, 200}, 1 → {175, 197}, 10 → {220, 170}, 20 → {270, 140}, 22 → {280, 140}, 1000 → {280, 140}; monotonic check over 0..100 (`toEqual([])` list of violations)
- [ ] T029 [P] [US4] Add to `APP/src/game/logic.pipes.test.ts`: `[005:FR-012] a pair keeps its spawn gap after the score rises; new pairs use the new gap; all pipes scroll at the current speed`
- [ ] T030 [US4] Implement `difficulty` in `APP/src/game/difficulty.ts` (`speed = min(speedMax, speedStart + speedPerPoint × score)`, `gap = max(gapMin, gapStart − gapPerPoint × score)`)

---

## Phase 7: User Story 5 - Developer uses the game as the example (Priority: P2)

**Goal**: template contract kept, scratch gameplay gone, README updated.

- [ ] T031 [P] [US5] `APP/src/template-files.test.ts`: `[005:FR-001] package name is sky-hopper` and `GAME_ID`/`SDK_GLOBAL_NAME` are `sky-hopper`/`SkyHopperSDK`; `[005:FR-003] no scratch-card gameplay file remains` (`toEqual([])` existing among `ScratchCard.tsx`, `ScratchCanvas.tsx`, `ScratchCard.test.tsx`, `scratch-progress.ts`, `scratch-progress.test.ts`; and `toEqual([])` src files containing `scratch`, case-insensitive); `[005:FR-022] dependencies and devDependencies equal the template's` (`toEqual` against `apps/scratch-card-example/package.json`); `[005:FR-002] README "What this is" describes sky-hopper and the last section names pnpm gen-game`
- [ ] T032 [US5] Adapt `APP/src/sdk.test.ts` (`beforeEach` uses `installFrames`; `[003:FR-003] [003:FR-024]` embedded round uses `playToGround`, same URL/header/console expectations) and `APP/src/standalone.test.tsx` (`playToGround` instead of `scratchAll`, same expectations) per research R2; keep their tags
- [ ] T033 [US5] Delete `APP/src/ScratchCard.tsx`, `APP/src/ScratchCanvas.tsx`, `APP/src/ScratchCard.test.tsx`, `APP/src/scratch-progress.ts`, `APP/src/scratch-progress.test.ts`
- [ ] T034 [US5] Rewrite `APP/README.md` keeping the headings `What this is`, `Scripts`, `SDK usage`, `Starting a new game from this template` (template test `[003:FR-023]`): describe the game and its config, SDK example with `SkyHopperSDK` and `width: 360, height: 560`, and "run `pnpm gen-game <name>`; this game is the example of a real game"

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T035 Coverage check: every FR-001..FR-022 appears in at least one `[005:FR-###]` test name under `APP/src` (grep), fix gaps
- [ ] T036 Run `pnpm turbo run lint check-types test --continue` and `pnpm turbo run buildSdk --filter=sky-hopper`; fix until all pass
- [ ] T037 Walk through [quickstart.md](quickstart.md) checks that can run headless (build output, `SkyHopperSDK` global)

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T004) → stories.
- US1 (T005–T018) first; US2 (T019–T021) needs `SkyHopper.tsx` from US1; US3 logic tests/impl (T022, T023, T025, T026) are independent of US1, its UI test and wiring (T024, T027) need US1; US4 needs `logic.ts` (T014); US5 T032–T033 need US1's component and drivers, T031/T034 are independent.
- Within each story: tests first and seen failing (commit `test(red)`), then implementation (commit `feat(green)`).

### Parallel Opportunities

- T005–T010 (different test files); T013, T015; T022, T023, T025, T026; T028, T029; T031, T034.

## Parallel Example: User Story 1

```text
Task: "random.test.ts"   Task: "logic.test.ts"   Task: "logic.pipes.test.ts"
Task: "logic.collide.test.ts"   Task: "logic.determinism.test.ts"   Task: "purity.test.ts"
```

## Implementation Strategy

1. MVP: Setup, Foundational, US1, US2 → a playable round that submits and replays.
2. Add US3 (timing), US4 (difficulty), US5 (example cleanup), then Polish.
3. One `test(red)` commit with all new tests failing on the stubs, one `feat(green)` commit, as the build prompt requires.

## Notes

- Never edit `.github/`, `.specify/memory/`, `.specify/templates/`, `CLAUDE.md`, `prompts/`, `packages/eslint-config/`, `packages/typescript-config/`.
- No new dependency (FR-022).
