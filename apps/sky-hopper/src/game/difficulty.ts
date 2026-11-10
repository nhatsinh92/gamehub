import type { GameConfig } from "./config.ts";

export function difficulty(
  score: number,
  cfg: GameConfig,
): { speed: number; gap: number } {
  return {
    speed: Math.min(cfg.speedMax, cfg.speedStart + cfg.speedPerPoint * score),
    gap: Math.max(cfg.gapMin, cfg.gapStart - cfg.gapPerPoint * score),
  };
}
