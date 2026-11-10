export const BOARD_WIDTH = 328;
export const BOARD_HEIGHT = 380;
export const BASKET_WIDTH = 64;
export const BASKET_HEIGHT = 22;
export const OBJECT_RADIUS = 12;
export const START_LIVES = 3;
export const BASKET_SPEED = 320;
export const BASKET_BOTTOM = 8;
const BOMB_CHANCE = 0.25;
const MAX_LEVEL = 8;

export type Kind = "fruit" | "bomb";
export interface Falling {
  id: number;
  x: number;
  y: number;
  kind: Kind;
  color: number;
}
export interface CatchState {
  basketX: number;
  objects: Falling[];
  score: number;
  lives: number;
  over: boolean;
  spawnIn: number;
  nextId: number;
}

export const FRUIT_COLORS = ["#e53935", "#fb8c00", "#fdd835", "#8e24aa"];

export function initialState(): CatchState {
  return {
    basketX: BOARD_WIDTH / 2,
    objects: [],
    score: 0,
    lives: START_LIVES,
    over: false,
    spawnIn: 0.5,
    nextId: 1,
  };
}

export function levelOf(score: number): number {
  return Math.min(MAX_LEVEL, Math.floor(score / 10));
}
export const fallSpeed = (score: number): number => 110 + levelOf(score) * 25;
export const spawnGap = (score: number): number => 1.1 - levelOf(score) * 0.1;

export function clampBasket(x: number): number {
  const half = BASKET_WIDTH / 2;
  return Math.min(BOARD_WIDTH - half, Math.max(half, x));
}

/** Advance the round by dt seconds. rand returns values in [0, 1). */
export function step(
  state: CatchState,
  dt: number,
  rand: () => number,
): CatchState {
  if (state.over) return state;
  let { score, lives, spawnIn, nextId } = state;
  let over = false;
  const objects: Falling[] = [];
  const dy = fallSpeed(score) * dt;
  const basketTop = BOARD_HEIGHT - BASKET_BOTTOM - BASKET_HEIGHT;
  const half = BASKET_WIDTH / 2;
  for (const o of state.objects) {
    const y = o.y + dy;
    const inBasket =
      y + OBJECT_RADIUS >= basketTop &&
      Math.abs(o.x - state.basketX) <= half + OBJECT_RADIUS / 2;
    if (inBasket) {
      if (o.kind === "bomb") over = true;
      else score += 1;
    } else if (y - OBJECT_RADIUS >= BOARD_HEIGHT) {
      if (o.kind === "fruit") lives -= 1;
    } else objects.push({ ...o, y });
  }
  spawnIn -= dt;
  if (spawnIn <= 0) {
    const span = BOARD_WIDTH - 2 * OBJECT_RADIUS;
    const x = OBJECT_RADIUS + rand() * span;
    const kind: Kind = rand() >= 1 - BOMB_CHANCE ? "bomb" : "fruit";
    const color = Math.floor(rand() * FRUIT_COLORS.length);
    objects.push({ id: nextId, x, y: -OBJECT_RADIUS, kind, color });
    nextId += 1;
    spawnIn += spawnGap(score);
  }
  if (lives <= 0) over = true;
  return { ...state, objects, score, lives, over, spawnIn, nextId };
}
