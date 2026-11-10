import type { GameConfig } from "./config.ts";

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

export function createState(_cfg: GameConfig): GameState {
  return {
    phase: "ready",
    birdY: 0,
    velocity: 0,
    pipes: [],
    score: 0,
    sinceSpawn: 0,
  };
}

export function step(
  state: GameState,
  _flap: boolean,
  _cfg: GameConfig,
  _random: () => number,
): GameState {
  return state;
}
