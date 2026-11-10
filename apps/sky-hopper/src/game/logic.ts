import type { GameConfig } from "./config.ts";
import { difficulty } from "./difficulty.ts";

export type Phase = "ready" | "playing" | "over";
export interface Pipe {
  readonly x: number;
  readonly gapY: number;
  readonly gap: number;
  readonly scored: boolean;
}
export interface GameState {
  readonly phase: Phase;
  readonly birdY: number;
  readonly velocity: number;
  readonly pipes: readonly Pipe[];
  readonly score: number;
  readonly sinceSpawn: number;
}

const playable = (cfg: GameConfig): number => cfg.height - cfg.groundHeight;

export function createState(cfg: GameConfig): GameState {
  return {
    phase: "ready",
    birdY: playable(cfg) / 2,
    velocity: 0,
    pipes: [],
    score: 0,
    // the first pair spawns on the first playing step
    sinceSpawn: cfg.pipeSpacing,
  };
}

function spawn(cfg: GameConfig, score: number, random: () => number): Pipe {
  const { gap } = difficulty(score, cfg);
  const min = cfg.gapMargin + gap / 2;
  const max = playable(cfg) - cfg.gapMargin - gap / 2;
  return { x: cfg.width, gapY: min + random() * (max - min), gap, scored: false };
}

function hits(birdY: number, pipes: readonly Pipe[], cfg: GameConfig): boolean {
  const top = birdY - cfg.birdHeight / 2;
  const bottom = birdY + cfg.birdHeight / 2;
  if (top <= 0 || bottom >= playable(cfg)) return true;
  const left = cfg.birdX;
  const right = cfg.birdX + cfg.birdWidth;
  return pipes.some(
    (p) =>
      right > p.x &&
      left < p.x + cfg.pipeWidth &&
      (top < p.gapY - p.gap / 2 || bottom > p.gapY + p.gap / 2),
  );
}

function advance(
  state: GameState,
  flap: boolean,
  cfg: GameConfig,
  random: () => number,
): GameState {
  const dt = cfg.stepSeconds;
  const velocity = flap ? cfg.flapVelocity : state.velocity + cfg.gravity * dt;
  const birdY = state.birdY + velocity * dt;
  const moved = difficulty(state.score, cfg).speed * dt;
  let pipes = state.pipes.map((p) => ({ ...p, x: p.x - moved }));
  let sinceSpawn = state.sinceSpawn + moved;
  if (sinceSpawn >= cfg.pipeSpacing) {
    pipes = [...pipes, spawn(cfg, state.score, random)];
    sinceSpawn -= cfg.pipeSpacing;
  }
  pipes = pipes.filter((p) => p.x + cfg.pipeWidth >= 0);
  let score = state.score;
  pipes = pipes.map((p) => {
    if (p.scored || cfg.birdX + cfg.birdWidth <= p.x + cfg.pipeWidth) return p;
    score += 1;
    return { ...p, scored: true };
  });
  const phase = hits(birdY, pipes, cfg) ? "over" : "playing";
  return { phase, birdY, velocity, pipes, score, sinceSpawn };
}

/** One fixed step. Pure: the input state is never changed. */
export function step(
  state: GameState,
  flap: boolean,
  cfg: GameConfig,
  random: () => number,
): GameState {
  if (state.phase === "over") return state;
  if (state.phase === "ready" && !flap) return state;
  return advance(state, flap, cfg, random);
}
