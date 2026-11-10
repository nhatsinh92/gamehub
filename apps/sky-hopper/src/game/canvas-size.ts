import type { GameConfig } from "./config.ts";

export function canvasBitmapSize(
  _dpr: number,
  _cfg: GameConfig,
): { width: number; height: number; scale: number } {
  return { width: 0, height: 0, scale: 0 };
}
