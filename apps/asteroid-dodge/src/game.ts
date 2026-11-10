export const WORLD_W = 320;
export const WORLD_H = 420;
export const SHIP_R = 11;
export const SHIP_Y = WORLD_H - 30;
export const SHIP_SPEED = 260;
const MIN_GAP = 90;
const BAND = 90;
const RAMP_SECONDS = 90;

export interface Rock {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  /** vertex radius factors (0.8 to 1.15) that make the rock irregular */
  shape: number[];
}

export interface GameState {
  shipX: number;
  rocks: Rock[];
  time: number;
  spawnIn: number;
  over: boolean;
}

export const START_STATE: GameState = {
  shipX: WORLD_W / 2,
  rocks: [],
  time: 0,
  spawnIn: 0.5,
  over: false,
};

/** 0 at the start, 1 once the difficulty cap is reached. */
export function difficulty(time: number): number {
  return Math.min(time / RAMP_SECONDS, 1);
}

export function clampShip(x: number): number {
  return Math.min(WORLD_W - SHIP_R, Math.max(SHIP_R, x));
}

/** True when the rocks near `candidate` still leave a free gap the ship can use. */
export function hasGap(rocks: Rock[], candidate: Rock): boolean {
  const near = [...rocks, candidate].filter(
    (r) => Math.abs(r.y - candidate.y) < BAND + r.r + candidate.r,
  );
  const spans = near
    .map((r) => [r.x - r.r, r.x + r.r] as const)
    .sort((a, b) => a[0] - b[0]);
  let edge = 0;
  let widest = 0;
  for (const [from, to] of spans) {
    widest = Math.max(widest, from - edge);
    edge = Math.max(edge, to);
  }
  widest = Math.max(widest, WORLD_W - edge);
  return widest >= MIN_GAP;
}

function makeRock(rng: () => number, d: number): Rock {
  const r = 10 + rng() * 16;
  const speed = (90 + rng() * 90) * (1 + 1.2 * d);
  return {
    x: r + rng() * (WORLD_W - 2 * r),
    y: -r,
    r,
    vx: (rng() - 0.5) * 30,
    vy: speed,
    shape: Array.from({ length: 9 }, () => 0.8 + rng() * 0.35),
  };
}

export function hitsShip(state: GameState): boolean {
  return state.rocks.some(
    (k) => Math.hypot(k.x - state.shipX, k.y - SHIP_Y) < k.r * 0.9 + SHIP_R * 0.8,
  );
}

/** Advances the game by `dt` seconds; `dir` is -1, 0 or 1 (keyboard steering). */
export function step(
  state: GameState,
  dt: number,
  dir: number,
  rng: () => number,
): GameState {
  if (state.over) return state;
  const d = difficulty(state.time);
  const rocks = state.rocks
    .map((k) => ({ ...k, x: k.x + k.vx * dt, y: k.y + k.vy * dt }))
    .filter((k) => k.y - k.r < WORLD_H && k.x > -k.r * 2 && k.x < WORLD_W + k.r * 2);
  let spawnIn = state.spawnIn - dt;
  if (spawnIn <= 0) {
    const candidate = makeRock(rng, d);
    if (hasGap(rocks, candidate)) {
      rocks.push(candidate);
      spawnIn = (0.75 - 0.5 * d) * (0.7 + 0.6 * rng());
    } else spawnIn = 0.05;
  }
  const next: GameState = {
    shipX: clampShip(state.shipX + dir * SHIP_SPEED * dt),
    rocks,
    time: state.time + dt,
    spawnIn,
    over: false,
  };
  return { ...next, over: hitsShip(next) };
}

export function scoreOf(state: GameState): number {
  return Math.floor(state.time);
}
