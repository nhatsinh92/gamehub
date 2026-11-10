export const W = 360;
export const H = 480;
export const BLOCK_H = 24;
export const BASE_WIDTH = 200;
export const PERFECT_PX = 4;
export const START_SPEED = 140; // px per second
export const SPEED_STEP = 15;
export const MAX_SPEED = 320;
export const BLOCKS_PER_SPEEDUP = 5;
const FALL_MS = 700;

export interface Block {
  x: number;
  w: number;
}
export interface Falling extends Block {
  level: number;
  age: number;
}
export type Phase = "ready" | "playing" | "over";

export interface State {
  phase: Phase;
  /** Top of the tower (the base block has score 0). */
  top: Block;
  /** The sliding block; same width as `top`. */
  slider: Block;
  dir: 1 | -1;
  score: number;
  falling: Falling[];
}

export function createState(): State {
  const base = { x: (W - BASE_WIDTH) / 2, w: BASE_WIDTH };
  return {
    phase: "ready",
    top: base,
    slider: { x: 0, w: base.w },
    dir: 1,
    score: 0,
    falling: [],
  };
}

export function speedFor(score: number): number {
  const steps = Math.floor(score / BLOCKS_PER_SPEEDUP);
  return Math.min(MAX_SPEED, START_SPEED + steps * SPEED_STEP);
}

/** Moves the slider (bouncing between the board edges) and ages falling pieces. */
export function tick(state: State, dtMs: number): State {
  const falling = state.falling
    .map((f) => ({ ...f, age: f.age + dtMs }))
    .filter((f) => f.age < FALL_MS);
  if (state.phase === "over") return { ...state, falling };
  let x = state.slider.x;
  let dir = state.dir;
  x += dir * speedFor(state.score) * (dtMs / 1000);
  const max = W - state.slider.w;
  if (x < 0) {
    x = -x;
    dir = 1;
  } else if (x > max) {
    x = 2 * max - x;
    dir = -1;
  }
  x = Math.min(max, Math.max(0, x));
  return { ...state, slider: { x, w: state.slider.w }, dir, falling };
}

/** The player drops the block: first press starts, later presses place. */
export function drop(state: State): State {
  if (state.phase === "over") return state;
  if (state.phase === "ready") return { ...state, phase: "playing" };
  const { top, slider } = state;
  const level = state.score + 1;
  const left = Math.max(top.x, slider.x);
  const right = Math.min(top.x + top.w, slider.x + slider.w);
  if (right <= left) {
    return {
      ...state,
      phase: "over",
      falling: [...state.falling, { ...slider, level, age: 0 }],
    };
  }
  const perfect = Math.abs(slider.x - top.x) <= PERFECT_PX;
  const placed: Block = perfect ? { x: top.x, w: top.w } : { x: left, w: right - left };
  const falling = [...state.falling];
  if (!perfect) {
    const cutX = slider.x < top.x ? slider.x : right;
    const cutW = slider.x < top.x ? left - slider.x : slider.x + slider.w - right;
    falling.push({ x: cutX, w: cutW, level, age: 0 });
  }
  return {
    ...state,
    top: placed,
    slider: { x: slider.x, w: placed.w },
    score: state.score + 1,
    falling,
  };
}

/** Vertical scroll in px so the top of the tower stays visible. */
export function cameraY(score: number): number {
  return Math.max(0, (score + 1) * BLOCK_H - H * 0.55);
}

/** Canvas y of the top edge of a block at `level` (0 is the base). */
export function levelY(level: number, camera: number): number {
  return H - (level + 1) * BLOCK_H + camera;
}

export function fallOffset(age: number): number {
  const t = age / 1000;
  return 400 * t * t;
}

export function blockColor(level: number): string {
  return `hsl(${(200 + level * 9) % 360} 65% 55%)`;
}
