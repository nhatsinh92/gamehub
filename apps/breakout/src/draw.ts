import {
  BALL_R,
  BOARD_H,
  BOARD_W,
  BRICK_H,
  BRICK_TOP,
  BRICK_W,
  PADDLE_H,
  PADDLE_W,
  PADDLE_Y,
} from "./game-logic.ts";
import type { Breakout as GameState } from "./game-logic.ts";

export const ROW_COLORS = ["#e4572e", "#f3a712", "#a8c686", "#29b3a3", "#5b7cfa"];

export function draw(g: CanvasRenderingContext2D, s: GameState): void {
  g.fillStyle = "#1e2233";
  g.fillRect(0, 0, BOARD_W, BOARD_H);
  s.bricks.forEach((row, r) =>
    row.forEach((alive, c) => {
      if (!alive) return;
      g.fillStyle = ROW_COLORS[r] ?? "#fff";
      g.fillRect(c * BRICK_W + 1, BRICK_TOP + r * BRICK_H + 1, BRICK_W - 2, BRICK_H - 2);
    }),
  );
  g.fillStyle = "#f2f2f2";
  g.fillRect(s.paddleX - PADDLE_W / 2, PADDLE_Y, PADDLE_W, PADDLE_H);
  g.beginPath();
  g.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
  g.fillStyle = "#ffd166";
  g.fill();
}
