// Pure game rules; no DOM. Units are canvas pixels and seconds.
export const BOARD_W = 320;
export const BOARD_H = 400;
export const ROWS = 5;
export const COLS = 8;
export const BRICK_W = BOARD_W / COLS;
export const BRICK_H = 18;
export const BRICK_TOP = 48;
export const PADDLE_W = 64;
export const PADDLE_H = 10;
export const PADDLE_Y = BOARD_H - 32;
export const PADDLE_SPEED = 320;
export const BALL_R = 6;
export const START_SPEED = 220;
export const SPEED_STEP = 20;
export const MAX_SPEED = 380;
export const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180;
export const LAUNCH_ANGLE = (15 * Math.PI) / 180;

export interface Breakout {
  paddleX: number; // centre
  ballX: number;
  ballY: number;
  vx: number;
  vy: number;
  launched: boolean;
  bricks: boolean[][]; // [row][col], true = standing
  score: number;
  broken: number;
  speed: number;
  over: boolean;
}

export function freshBricks(): boolean[][] {
  return Array.from({ length: ROWS }, () => Array<boolean>(COLS).fill(true));
}

export function newGame(): Breakout {
  return {
    paddleX: BOARD_W / 2,
    ballX: BOARD_W / 2,
    ballY: PADDLE_Y - BALL_R,
    vx: 0,
    vy: 0,
    launched: false,
    bricks: freshBricks(),
    score: 0,
    broken: 0,
    speed: START_SPEED,
    over: false,
  };
}

/** Row 0 is the top row and scores most. */
export function brickPoints(row: number): number {
  return ROWS - row;
}

function clampPaddle(x: number): number {
  return Math.min(BOARD_W - PADDLE_W / 2, Math.max(PADDLE_W / 2, x));
}

export function setPaddle(s: Breakout, x: number): void {
  s.paddleX = clampPaddle(x);
  if (!s.launched) s.ballX = s.paddleX;
}

export function launch(s: Breakout): void {
  if (s.launched || s.over) return;
  s.launched = true;
  s.vx = s.speed * Math.sin(LAUNCH_ANGLE);
  s.vy = -s.speed * Math.cos(LAUNCH_ANGLE);
}

function setSpeed(s: Breakout, speed: number): void {
  const k = speed / s.speed;
  s.vx *= k;
  s.vy *= k;
  s.speed = speed;
}

function hitBrick(s: Breakout, prevX: number): void {
  const col = Math.floor(s.ballX / BRICK_W);
  const row = Math.floor((s.ballY - BRICK_TOP) / BRICK_H);
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  if (!s.bricks[row]?.[col]) return;
  (s.bricks[row] as boolean[])[col] = false;
  s.score += brickPoints(row);
  s.broken += 1;
  if (Math.floor(prevX / BRICK_W) === col) s.vy = -s.vy;
  else s.vx = -s.vx;
  if (s.broken % 10 === 0) setSpeed(s, Math.min(MAX_SPEED, s.speed + SPEED_STEP));
  if (s.bricks.every((r) => r.every((b) => !b))) s.bricks = freshBricks();
}

function stepBall(s: Breakout, dt: number): void {
  const prevX = s.ballX;
  const prevY = s.ballY;
  s.ballX += s.vx * dt;
  s.ballY += s.vy * dt;
  if (s.ballX < BALL_R) {
    s.ballX = BALL_R;
    s.vx = Math.abs(s.vx);
  } else if (s.ballX > BOARD_W - BALL_R) {
    s.ballX = BOARD_W - BALL_R;
    s.vx = -Math.abs(s.vx);
  }
  if (s.ballY < BALL_R) {
    s.ballY = BALL_R;
    s.vy = Math.abs(s.vy);
  }
  const hitsPaddle =
    s.vy > 0 &&
    prevY + BALL_R <= PADDLE_Y &&
    s.ballY + BALL_R >= PADDLE_Y &&
    Math.abs(s.ballX - s.paddleX) <= PADDLE_W / 2 + BALL_R;
  if (hitsPaddle) {
    const offset = Math.max(-1, Math.min(1, (s.ballX - s.paddleX) / (PADDLE_W / 2)));
    const angle = offset * MAX_BOUNCE_ANGLE;
    s.vx = s.speed * Math.sin(angle);
    s.vy = -s.speed * Math.cos(angle);
    s.ballY = PADDLE_Y - BALL_R;
    return;
  }
  hitBrick(s, prevX);
  if (s.ballY - BALL_R > BOARD_H) s.over = true;
}

/** Advances the game by dt seconds; dir is -1, 0 or 1 (held keys). */
export function step(s: Breakout, dt: number, dir: number): void {
  if (s.over) return;
  const capped = Math.min(dt, 0.05);
  setPaddle(s, s.paddleX + dir * PADDLE_SPEED * capped);
  if (!s.launched) return;
  // small substeps keep the ball from skipping through bricks
  const n = Math.ceil(capped / 0.004);
  for (let i = 0; i < n && !s.over; i++) stepBall(s, capped / n);
}
