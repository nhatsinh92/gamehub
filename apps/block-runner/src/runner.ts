// Pure endless-runner rules: no DOM, no timers. One `step` is one tick.
export const WORLD_WIDTH = 360;
export const WORLD_HEIGHT = 240;
export const GROUND_Y = 190;
export const RUNNER_X = 40;
export const RUNNER_W = 22;
export const RUNNER_H = 30;
export const BLOCK_W = 16;
export const OBSTACLE_H = 28;
export const GRAVITY = 0.6;
export const JUMP_VELOCITY = 11;
export const BASE_SPEED = 5;
export const SPEED_STEP = 0.5;
export const MAX_SPEED = 10;
export const POINTS_PER_SPEEDUP = 100;
/** Score gained per px scrolled. */
export const SCORE_PER_PX = 0.2;
const HIT_INSET = 3;

export interface Obstacle {
  x: number;
  /** width in blocks, 1..3 */
  blocks: number;
}

export interface RunnerState {
  /** height of the runner's feet above the ground, px */
  height: number;
  velocity: number;
  distance: number;
  obstacles: Obstacle[];
  /** px of free ground still to scroll before the next obstacle spawns */
  gapLeft: number;
  over: boolean;
}

export const score = (s: RunnerState): number =>
  Math.floor(s.distance * SCORE_PER_PX);

export const speedFor = (points: number): number =>
  Math.min(
    MAX_SPEED,
    BASE_SPEED + Math.floor(points / POINTS_PER_SPEEDUP) * SPEED_STEP,
  );

/** Ground a full jump covers at this speed; gaps are always wider. */
const jumpSpan = (speed: number): number =>
  speed * ((2 * JUMP_VELOCITY) / GRAVITY + 1);

const nextGap = (speed: number, rand: () => number): number =>
  jumpSpan(speed) + 3 * BLOCK_W + RUNNER_W + rand() * 200;

export function createState(): RunnerState {
  return {
    height: 0,
    velocity: 0,
    distance: 0,
    obstacles: [],
    gapLeft: WORLD_WIDTH - RUNNER_X,
    over: false,
  };
}

function hits(o: Obstacle, height: number): boolean {
  const left = RUNNER_X + HIT_INSET;
  const right = RUNNER_X + RUNNER_W - HIT_INSET;
  const oRight = o.x + o.blocks * BLOCK_W;
  return right > o.x && left < oRight && height < OBSTACLE_H - HIT_INSET;
}

export function step(
  s: RunnerState,
  jump: boolean,
  rand: () => number,
): RunnerState {
  if (s.over) return s;
  const speed = speedFor(score(s));
  let { height, velocity } = s;
  if (jump && height === 0) velocity = JUMP_VELOCITY;
  if (velocity !== 0 || height > 0) {
    height = Math.max(0, height + velocity);
    velocity = height === 0 ? 0 : velocity - GRAVITY;
  }
  let obstacles = s.obstacles
    .map((o) => ({ ...o, x: o.x - speed }))
    .filter((o) => o.x + o.blocks * BLOCK_W > 0);
  let gapLeft = s.gapLeft - speed;
  if (gapLeft <= 0) {
    const blocks = 1 + Math.floor(rand() * 3);
    obstacles = [...obstacles, { x: WORLD_WIDTH, blocks }];
    gapLeft = nextGap(speed, rand) + blocks * BLOCK_W;
  }
  return {
    height,
    velocity,
    distance: s.distance + speed,
    obstacles,
    gapLeft,
    over: obstacles.some((o) => hits(o, height)),
  };
}
