# Data Model: Scratch Card Example

**Feature**: [spec.md](spec.md) (v0.1.0) | **Plan**: [plan.md](plan.md)

Types from `@repo/game-core` (`GameResult`, `TrackingEvent`, `GameAdapter`, `HttpConfig`) are reused as is; see `specs/002-game-core/data-model.md`.

## Names (`src/game-name.ts`, FR-012/FR-013)

| Field | Value (this template) | Source |
|---|---|---|
| `PACKAGE_NAME` | `scratch-card-example` | `package.json` `name` |
| `GAME_ID` | `scratch-card-example` | `= PACKAGE_NAME` |
| `SDK_GLOBAL_NAME` | `ScratchCardExampleSDK` | `toSdkGlobalName(PACKAGE_NAME)` |
| SDK file name | `scratch-card-example-sdk.js` | `` `${GAME_ID}-sdk.js` `` |

`toSdkGlobalName(name)`: split on `-`, drop empty parts, upper-case the first letter of each part, keep the rest, join, append `SDK`. Examples: `scratch-card-example` → `ScratchCardExampleSDK`; `lucky-wheel` → `LuckyWheelSDK`; `quiz` → `QuizSDK`.

## SdkConfig (argument of `init`, FR-005)

| Field | Type | Required | Rule (else console error, nothing rendered) |
|---|---|---|---|
| `gameId` | string | yes | non-empty |
| `baseUrl` | string | yes | non-empty |
| `getAccessTokenFunc` | `() => string \| Promise<string>` | yes | function |
| `sendTrackingFunc` | `(event: TrackingEvent) => void \| Promise<void>` | no | function if present |
| `width` | number | no | finite and > 0 if present; default 360 |
| `height` | number | no | finite and > 0 if present; default 480 |

Container: a CSS selector string that matches an element, or an `Element`. Anything else → console error.

## MountOptions (`mountGame`, internal)

`{ gameId, adapter, httpConfig, sendTrackingFunc?, width, height }` → returns `{ unmount(): void }`. Standalone uses `LocalAdapter`; SDK uses `RemoteAdapter` with `httpConfig = { baseUrl, getAccessTokenFunc }`.

## ScratchGrid (`src/scratch-progress.ts`, FR-020)

- `size`: whole number ≥ 1 (default `GRID_SIZE = 20`)
- `cells`: readonly boolean array of length `size × size`, row-major; `true` = scratched
- `scratchAt(grid, x, y, radius)`: marks every cell whose centre `((col + 0.5) / size, (row + 0.5) / size)` is within `radius` (default `BRUSH_RADIUS = 0.08`, card units) of `(x, y)`; returns a new grid
- `scratchProgress(grid)`: `scratched / (size × size)`, always in [0, 1]
- Reveal rule: `scratchProgress(grid) >= REVEAL_THRESHOLD` (0.5)

## Card round state (`ScratchCard`, FR-014..FR-019)

```text
loading ──initGame ok──▶ covered ──progress ≥ 0.5──▶ submitting ──result──▶ outcome
   │                        ▲                             │
   └─initGame error─▶ loadError                           └─error─▶ submitError
                            │                                            │
                            └──────── "Play again" (resetResult) ◀───────┴── from outcome
```

- `loading`: loading state shown; no card. `game_open` was sent on mount.
- `loadError`: error text, no card, no "Play again" (nothing to replay without config).
- `covered`: fresh grid (progress 0) and full cover.
- `submitting`: cover cleared (revealed); `game_reveal` sent; `submitResult(1)` called once; further scratching ignored.
- `outcome`: text per table below; `game_result` sent once with `{ status, isWin }`; "Play again" shown.
- `submitError`: error text from the context error; "Play again" shown.
- "Play again": `resetResult()`, new grid, state `covered`.

## Outcome text (FR-017)

| `result.status` | `isWin` | Shown text |
|---|---|---|
| `SUCCESS` | `true` (with `reward`) | `reward.name` |
| `SUCCESS` | `true` without `reward`, or `false` | `result.message` |
| `OUT_OF_TURN` / `MAINTENANCE` / `ERROR` | any | `result.message` |
| (submit failed: no result, context `error`) | — | fixed text "Something went wrong. Please try again." |

Other fixed texts: loading state `Loading…`; load error `Could not load the game. Please try again later.`; button `Play again`.

## Tracking events (FR-019)

| Name | When | Params |
|---|---|---|
| `game_open` | once, when the game mounts | none |
| `game_reveal` | once per card, on reaching the threshold | none |
| `game_result` | once per received result | `{ status, isWin }` |
