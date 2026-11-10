# Research: sky-hopper

All Technical Context items were known from the repository; no NEEDS CLARIFICATION remained. Decisions below.

## R1. Create the app with the generator, then replace gameplay

- **Decision**: `pnpm gen-game sky-hopper` then `pnpm install` (spec FR-001). Delete `ScratchCard.tsx`, `ScratchCanvas.tsx`, `ScratchCard.test.tsx`, `scratch-progress.ts`, `scratch-progress.test.ts`; replace the content of `styles.ts`; replace the scratch helpers (`scratch`, `scratchAll`, `stubCanvasRect`) in `test-helpers.tsx` with frame and input drivers.
- **Rationale**: the issue requires the generator path; spec 004 guarantees the generated app passes all checks before any edit.
- **Alternatives**: copying by hand (forbidden by the issue).

## R2. Template tests to adapt

Only tests that drive the scratch-card UI change; their `[003:FR-###]` tags stay.

| File | Test | Change |
|---|---|---|
| `sdk.test.ts` | `[003:FR-003] [003:FR-024]` embedded round | play a round (tap, then frames until the bird hits the ground) instead of `scratchAll`; same URL/header/console assertions |
| `sdk.test.ts` | `beforeEach` | `stubCanvasRect` replaced by the frame driver install |
| `standalone.test.tsx` | `[003:FR-001] [003:FR-003]` | play a round instead of `scratchAll`; still expects the LocalAdapter reward name and no fetch |
| `ScratchCard.test.tsx`, `scratch-progress.test.ts` | all | deleted (scratch gameplay, FR-003); the outcome-text, play-again, loading and load-error checks reappear in `SkyHopper.test.tsx` tagged `[005:FR-###]` |

Unchanged: `game-name.test.ts`, `repo-hygiene.test.ts` (README keeps its four headings, spec FR-002), `sdk-build.test.ts`, the other `sdk.test.ts` tests (`[003:FR-011]` still expects exactly `[{ name: "game_open" }]` before any tap, which FR-020 satisfies).

## R3. Fixed time step

- **Decision**: a pure accumulator `advanceClock(clock, frameMs, cfg) → { clock, steps }`. Frame time (ms between `requestAnimationFrame` timestamps) is clamped to `cfg.maxSteps × cfg.stepSeconds` (12 × 1/120 s = 0.1 s), added to the leftover, and whole steps are taken; the rest carries over. The React layer runs `step()` that many times.
- **Rationale**: classic fixed-timestep loop; same steps at 60 Hz and 120 Hz for the same total time (spec FR-014, SC-002). 1/120 s divides both 1/60 and 1/120 exactly, so whole-frame totals map to whole steps. The leftover is kept in seconds and compared with a small epsilon (1e-9), so float rounding never drops a step (2 × 1/120 s always gives 2 steps).
- **Alternatives**: variable step `dt × velocity` (device-dependent collisions, fails determinism); `setInterval` (drifts and keeps running when hidden).

## R4. Pause while hidden

- **Decision**: listen to `document.visibilitychange`. When hidden: cancel the pending animation frame. When visible: reset the last timestamp, so the first frame after return counts 0 elapsed time, then continue. Independently, R3's clamp bounds any long frame.
- **Rationale**: browsers stop `requestAnimationFrame` in hidden tabs, but the first timestamp after return would otherwise include the whole hidden time (spec FR-015). In an app web view the same event fires when the app goes to background.
- **Alternatives**: relying on the clamp alone (would still advance 0.1 s after return; the spec says no advance for the hidden time); `blur`/`focus` (fires on host page clicks, wrong signal).

## R5. Seeded random source

- **Decision**: `createRandom(seed: number): () => number`, the mulberry32 algorithm (32-bit state, a few lines, no dependency). Game state does not hold the generator; `step` takes the random function. Production seed: `Math.floor(Math.random() * 2 ** 32)` per round; tests pass fixed seeds.
- **Rationale**: tiny, fast, good enough for gap positions, deterministic (spec FR-005).
- **Alternatives**: a random library (new dependency, Principle IV); `Math.random` directly (not seedable).

## R6. Input

- **Decision**: `pointerdown` on the canvas (with `touch-action: none` and `preventDefault`) and `keydown` on the focusable game root (`tabIndex={0}`) for `event.code === "Space"`, ignoring `event.repeat` and calling `preventDefault`. A press sets a `flapPending` flag consumed by the next step (one flap per press, even if several steps run in that frame). Clicking/tapping focuses the root.
- **Rationale**: one flap per press without key-up tracking (FR-013); listening on the game root, not `window`, keeps the host page's Space behaviour when the game is not focused (spec edge case).
- **Alternatives**: `window` keydown (hijacks the host page's scrolling); tracking held state with keyup (more code, same result).

## R7. Canvas size and drawing

- **Decision**: `canvasBitmapSize(dpr, cfg) → { width, height, scale }` with `scale = min(max(dpr, 1), 2)` and size `round(450 × scale) × round(700 × scale)`. The canvas CSS box fits inside the `.game` box keeping the 450:700 aspect (`aspect-ratio` plus `max-width/max-height: 100%`). `draw(ctx, state, cfg)` uses `ctx.setTransform(scale, 0, 0, scale, 0, 0)` and draws rectangles (sky, pipes, ground, bird) and the score text. When `getContext("2d")` returns null (test DOM), drawing is skipped.
- **Rationale**: FR-016; simple shapes (issue out of scope: sprites). A device pixel ratio below 1 still uses 1.
- **Alternatives**: DOM elements per pipe (not a canvas, the issue asks for one); WebGL (overkill).

## R8. Default embed size

- **Decision**: keep the template defaults `DEFAULT_WIDTH 360`, `DEFAULT_HEIGHT 480` and the `[003:FR-010]` test unchanged; the canvas letterboxes inside. Hosts pass `width`/`height` for a better fit (README example uses 360×560).
- **Rationale**: changing the defaults would change a template contract test, which FR-002 allows only for scratch-card UI dependencies.

## R9. Round driving in UI tests

- **Decision**: `test-helpers.tsx` gets `installFrames()` which stubs `requestAnimationFrame`/`cancelAnimationFrame` (queue) and returns `frames(n, ms)` to run `n` frames `ms` apart inside `act()`, plus `tap(el)`, `pressSpace(el, { repeat })` and `setHidden(bool)` (defines `document.visibilityState`, dispatches `visibilitychange`). `playToGround()` taps once and runs frames until the over screen: with the starting values the bird hits the ground about 1.3 s after one flap, before the first pipe reaches it (about 1.7 s), so the score is 0 whatever the seed.
- **Rationale**: deterministic UI tests without a browser (issue: no end-to-end tests).

## R10. Best score

- **Decision**: React state in the game component, `max(best, score)` on game over; lost on unmount (spec Assumption 2).
