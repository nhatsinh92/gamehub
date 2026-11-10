import type { GameConfig } from "./config.ts";
import type { GameState } from "./logic.ts";

/** Simple shapes and colours only. `scale` is bitmap pixels per logical pixel. */
export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cfg: GameConfig,
  scale: number,
): void {
  const ground = cfg.height - cfg.groundHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = "#8ed0f5";
  ctx.fillRect(0, 0, cfg.width, cfg.height);
  ctx.fillStyle = "#3f9b3f";
  for (const p of state.pipes) {
    const top = p.gapY - p.gap / 2;
    const bottom = p.gapY + p.gap / 2;
    ctx.fillRect(p.x, 0, cfg.pipeWidth, top);
    ctx.fillRect(p.x, bottom, cfg.pipeWidth, ground - bottom);
  }
  ctx.fillStyle = "#c9a45c";
  ctx.fillRect(0, ground, cfg.width, cfg.groundHeight);
  ctx.fillStyle = "#f2c230";
  ctx.fillRect(
    cfg.birdX,
    state.birdY - cfg.birdHeight / 2,
    cfg.birdWidth,
    cfg.birdHeight,
  );
}
