// Pure game rules: no three.js, no DOM. The scene only draws this state.

export type SlotKind = "window" | "roof" | "street";
export interface Slot {
  kind: SlotKind;
  x: number;
  /** feet of the enemy */
  y: number;
  z: number;
}

export const SLOTS: readonly Slot[] = [
  { kind: "window", x: -4.4, y: 3.6, z: -8 },
  { kind: "window", x: -4.4, y: 6.6, z: -16 },
  { kind: "window", x: -4.4, y: 4.1, z: -24 },
  { kind: "window", x: 4.4, y: 5.6, z: -10 },
  { kind: "window", x: 4.4, y: 3.1, z: -18 },
  { kind: "window", x: 4.4, y: 7.6, z: -26 },
  { kind: "roof", x: -3.6, y: 11.6, z: -14 },
  { kind: "roof", x: 3.4, y: 11.2, z: -22 },
  { kind: "street", x: -1.6, y: 0, z: -20 },
  { kind: "street", x: 2.2, y: 0, z: -13 },
];

export const MAX_LIVES = 3;
export const HEAD_SCORE = 3;
export const BODY_SCORE = 1;
export const RELOAD_SECONDS = 0.6;
export const BULLET_TIME_SECONDS = 0.7;
export const BULLET_TIME_SCALE = 0.3;
export const MAX_FRAME_SECONDS = 0.1;
const MAX_VISIBLE = 3;

export interface Enemy {
  slot: number;
  /** seconds it has been visible (game time) */
  age: number;
  /** a shooter shoots back at `limit`; a ducker just leaves */
  shooter: boolean;
  limit: number;
}

export interface Game {
  score: number;
  lives: number;
  over: boolean;
  /** seconds of reload left */
  reload: number;
  /** real seconds of bullet-time left */
  bulletTime: number;
  /** counts up each time the player loses a life */
  hurt: number;
  spawnIn: number;
  enemies: Enemy[];
}

export type Rng = () => number;
export type Hit = { slot: number; part: "head" | "body" } | null;

export function createGame(): Game {
  return {
    score: 0,
    lives: MAX_LIVES,
    over: false,
    reload: 0,
    bulletTime: 0,
    hurt: 0,
    spawnIn: 1,
    enemies: [],
  };
}

export function timeScale(game: Game): number {
  return game.bulletTime > 0 ? BULLET_TIME_SCALE : 1;
}

function spawnDelay(score: number, rng: Rng): number {
  const base = Math.max(0.6, 1.6 - score * 0.03);
  return base * (0.7 + rng() * 0.6);
}

function spawn(game: Game, rng: Rng): Enemy | null {
  const taken = new Set(game.enemies.map((e) => e.slot));
  const start = Math.floor(rng() * SLOTS.length);
  for (let i = 0; i < SLOTS.length; i++) {
    const slot = (start + i) % SLOTS.length;
    if (!taken.has(slot)) {
      const shooter = rng() < 0.7;
      const limit = Math.max(1.1, 2.4 - game.score * 0.03) + rng() * 0.6;
      return { slot, age: 0, shooter, limit: shooter ? limit : limit * 0.7 };
    }
  }
  return null;
}

/** Advances by `realDt` real seconds. Enemies and spawns run in game time (slowed by bullet-time). */
export function step(game: Game, realDt: number, rng: Rng): Game {
  if (game.over) return game;
  const real = Math.min(realDt, MAX_FRAME_SECONDS);
  const dt = real * timeScale(game);
  let lives = game.lives;
  let hurt = game.hurt;
  const enemies: Enemy[] = [];
  for (const e of game.enemies) {
    const age = e.age + dt;
    if (age < e.limit) enemies.push({ ...e, age });
    else if (e.shooter) {
      lives -= 1;
      hurt += 1;
    }
  }
  let spawnIn = game.spawnIn - dt;
  const next: Game = {
    ...game,
    lives,
    hurt,
    over: lives <= 0,
    reload: Math.max(0, game.reload - real),
    bulletTime: Math.max(0, game.bulletTime - real),
    spawnIn,
    enemies,
  };
  if (spawnIn <= 0 && enemies.length < MAX_VISIBLE && !next.over) {
    const enemy = spawn(next, rng);
    if (enemy) next.enemies = [...enemies, enemy];
    spawnIn = spawnDelay(game.score, rng);
    next.spawnIn = spawnIn;
  }
  return next;
}

/** One shot. `hit` is what the camera ray found. Ignored while reloading or after game over. */
export function fire(game: Game, hit: Hit): Game {
  if (game.over || game.reload > 0) return game;
  const shot = { ...game, reload: RELOAD_SECONDS };
  if (!hit) return shot;
  const head = hit.part === "head";
  return {
    ...shot,
    score: game.score + (head ? HEAD_SCORE : BODY_SCORE),
    bulletTime: head ? BULLET_TIME_SECONDS : game.bulletTime,
    enemies: game.enemies.filter((e) => e.slot !== hit.slot),
  };
}
