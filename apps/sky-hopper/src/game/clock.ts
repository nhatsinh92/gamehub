import type { GameConfig } from "./config.ts";

export interface Clock {
  readonly last: number | null;
  readonly leftover: number;
}
export const START_CLOCK: Clock = { last: null, leftover: 0 };

/** Turns a frame timestamp (ms) into whole fixed steps; the rest carries over. */
export function advanceClock(
  clock: Clock,
  now: number,
  cfg: GameConfig,
): { clock: Clock; steps: number } {
  if (clock.last === null) return { clock: { last: now, leftover: 0 }, steps: 0 };
  const frame = Math.min((now - clock.last) / 1000, cfg.maxSteps * cfg.stepSeconds);
  const elapsed = frame + clock.leftover;
  const steps = Math.floor(elapsed / cfg.stepSeconds + 1e-9);
  const leftover = Math.max(0, elapsed - steps * cfg.stepSeconds);
  return { clock: { last: now, leftover }, steps };
}

/** Forget the last frame time, so the next frame counts no elapsed time. */
export function pauseClock(_clock: Clock): Clock {
  return START_CLOCK;
}
