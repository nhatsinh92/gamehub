# Contract: sky-hopper game logic (pure, no DOM)

Modules under `apps/sky-hopper/src/game/`. No module here imports React, touches `document`/`window`, reads time or calls `Math.random` (FR-004). Types and rules: [data-model.md](../data-model.md).

```ts
// config.ts
export interface GameConfig { /* fields in data-model.md */ }
export const CONFIG: Readonly<GameConfig>;

// random.ts
export function createRandom(seed: number): () => number; // [0, 1), mulberry32

// difficulty.ts
export function difficulty(score: number, cfg: GameConfig): { speed: number; gap: number };

// logic.ts
export type Phase = "ready" | "playing" | "over";
export interface Pipe { readonly x: number; readonly gapY: number; readonly gap: number; readonly scored: boolean }
export interface GameState {
  readonly phase: Phase; readonly birdY: number; readonly velocity: number;
  readonly pipes: readonly Pipe[]; readonly score: number; readonly sinceSpawn: number;
}
export function createState(cfg: GameConfig): GameState;
export function step(state: GameState, flap: boolean, cfg: GameConfig, random: () => number): GameState;

// clock.ts
export interface Clock { readonly last: number | null; readonly leftover: number }
export const START_CLOCK: Clock; // { last: null, leftover: 0 }
export function advanceClock(clock: Clock, now: number, cfg: GameConfig): { clock: Clock; steps: number };
export function pauseClock(clock: Clock): Clock;

// canvas-size.ts
export function canvasBitmapSize(dpr: number, cfg: GameConfig): { width: number; height: number; scale: number };
```

Guarantees:

- `step` never mutates its input; `step(s, f, c, createRandom(k))` sequences are reproducible for equal `k` and inputs.
- `random` is called exactly once per spawned pair and never otherwise.
- `draw.ts` (`draw(ctx, state, cfg, scale)`) is the only module using the canvas API; it reads state only.
