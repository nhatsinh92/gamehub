import type { GameConfig } from "./config.ts";

export interface Clock {
  readonly last: number | null;
  readonly leftover: number;
}
export const START_CLOCK: Clock = { last: null, leftover: 0 };

export function advanceClock(
  clock: Clock,
  _now: number,
  _cfg: GameConfig,
): { clock: Clock; steps: number } {
  return { clock, steps: 0 };
}

export function pauseClock(clock: Clock): Clock {
  return clock;
}
