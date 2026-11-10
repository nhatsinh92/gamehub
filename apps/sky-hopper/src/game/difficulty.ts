import type { GameConfig } from "./config.ts";

export function difficulty(
  _score: number,
  _cfg: GameConfig,
): { speed: number; gap: number } {
  return { speed: 0, gap: 0 };
}
