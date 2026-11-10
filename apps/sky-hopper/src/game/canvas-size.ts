import type { GameConfig } from "./config.ts";

/** Bitmap size for the canvas: the logical size times the pixel ratio, capped at 2. */
export function canvasBitmapSize(
  dpr: number,
  cfg: GameConfig,
): { width: number; height: number; scale: number } {
  const scale = Math.min(2, Math.max(1, dpr || 1));
  return {
    width: Math.round(cfg.width * scale),
    height: Math.round(cfg.height * scale),
    scale,
  };
}
