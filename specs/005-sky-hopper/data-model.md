# Data model: sky-hopper

All types live in `apps/sky-hopper/src/game/`. Units: logical px, seconds. y grows downward; the playable height is `0 … height − groundHeight`.

## GameConfig (`config.ts`, spec FR-006)

One frozen object `CONFIG`; tests may pass a modified copy.

| Field | Value | Meaning |
|---|---|---|
| `width`, `height` | 450, 700 | play area |
| `groundHeight` | 80 | ground band at the bottom; playable height = 620 |
| `gravity` | 790 | px/s² added to vertical velocity |
| `flapVelocity` | −290 | px/s set on flap |
| `birdX`, `birdWidth`, `birdHeight` | 120, 34, 24 | bird box: left edge x, size; y is the box centre |
| `pipeWidth` | 70 | |
| `pipeSpacing` | 240 | horizontal distance between pair left edges |
| `gapMargin` | 60 | min distance of a gap edge from the top edge and from the ground |
| `speedStart`, `speedMax`, `speedPerPoint` | 170, 280, 5 | px/s |
| `gapStart`, `gapMin`, `gapPerPoint` | 200, 140, 3 | px |
| `stepSeconds` | 1/120 | fixed step |
| `maxSteps` | 12 | catch-up limit per frame |

## Pipe

| Field | Type | Rule |
|---|---|---|
| `x` | number | left edge; spawns at `width` |
| `gapY` | number | gap centre, uniform in `[gapMargin + gap/2, playable − gapMargin − gap/2]` (FR-009) |
| `gap` | number | gap size at spawn time; never changes (FR-012) |
| `scored` | boolean | set once when `birdX + birdWidth > x + pipeWidth` (FR-010; "front passes back edge") |

Removed when `x + pipeWidth < 0`.

## GameState (`logic.ts`)

| Field | Type |
|---|---|
| `phase` | `"ready" \| "playing" \| "over"` |
| `birdY` | number (box centre; starts at playable / 2 = 310) |
| `velocity` | number |
| `pipes` | `readonly Pipe[]` |
| `score` | number |
| `sinceSpawn` | number, px scrolled since the last spawn; a pair spawns when it reaches `pipeSpacing` (first pair spawns on the first playing step: starts at `pipeSpacing`) |

### Transitions (`step(state, flap, cfg, random) → GameState`, pure)

```text
ready   --flap-->            playing, then the playing step below runs with flap = true
ready   --no flap-->         ready (unchanged)
playing --each step-->       1. velocity = flap ? flapVelocity : velocity + gravity·dt   (no gravity on a flap step)
                             2. birdY += velocity·dt
                             3. every pipe x −= speed(score)·dt; sinceSpawn += speed(score)·dt
                             4. if sinceSpawn ≥ pipeSpacing: spawn a pair at x = width (not moved this step), sinceSpawn −= pipeSpacing
                             5. remove pipes with x + pipeWidth < 0
                             6. score pairs passed (FR-010)
                             7. collide (FR-011) → over
playing --collision-->       over (score already includes a pair passed in the same step)
over    --any-->             over (unchanged)
```

Example (seed-independent part): ready + flap → `{ phase: "playing", velocity: −290, birdY: 310 − 290/120, pipes: [{ x: 450, gap: 200, scored: false, gapY: … }], score: 0, sinceSpawn: 170/120 }`.

`createState(cfg)` returns the ready state. "Play again" calls `createState` again.

### Collision (FR-011)

Bird box: `[birdX, birdX + birdWidth] × [birdY − h/2, birdY + h/2]`. Over when `top ≤ 0`, or `bottom ≥ height − groundHeight`, or the box overlaps a pipe's x range and is not fully inside `[gapY − gap/2, gapY + gap/2]`.

## Difficulty (`difficulty.ts`, FR-012)

`difficulty(score, cfg) → { speed, gap }`:
`speed = min(speedMax, speedStart + speedPerPoint × score)`, `gap = max(gapMin, gapStart − gapPerPoint × score)`.
Examples: 0 → {170, 200}; 1 → {175, 197}; 10 → {220, 170}; 20 → {270, 140}; 22 → {280, 140}; 1000 → {280, 140}.

## Random (`random.ts`, FR-005)

`createRandom(seed) → () => number` in `[0, 1)`, mulberry32.

## Clock (`clock.ts`, FR-014, FR-015)

`Clock = { last: number | null, leftover: number }`.
`advanceClock(clock, now, cfg) → { clock, steps }`: if `last` is null, 0 steps and `last = now`; else `elapsed = min((now − last)/1000, maxSteps × stepSeconds) + leftover`, `steps = floor(elapsed / stepSeconds + 1e-9)`, `leftover = max(0, elapsed − steps × stepSeconds)`.
`pauseClock(clock) → { last: null, leftover: 0 }` (called on hidden and on visible).

## Canvas size (`canvas-size.ts`, FR-016)

`canvasBitmapSize(dpr, cfg) → { width, height, scale }`, `scale = min(2, max(1, dpr || 1))`. 1 → 450×700; 1.5 → 675×1050; 2 and 3 → 900×1400.

## UI round state (`SkyHopper.tsx`)

`best: number` (max score since mount), `submitting/failed` like the template's round hook, tracking per FR-020.
