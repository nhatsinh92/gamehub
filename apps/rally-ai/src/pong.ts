export const BOARD_W = 320;
export const BOARD_H = 400;
export const PADDLE_W = 10;
export const PADDLE_H = 64;
export const PADDLE_MARGIN = 12;
export const BALL_R = 7;
export const BASE_SPEED = 220;
export const MAX_SPEED = 420;
export const SPEEDUP_EVERY = 5;
export const SPEEDUP_STEP = 20;
export const PLAYER_SPEED = 320;
export const AI_SPEED = 170;
export const AI_DELAY = 0.12;
const MAX_ANGLE = Math.PI / 3;

export interface PongState {
  ball: { x: number; y: number; vx: number; vy: number };
  player: number; // paddle centre y
  ai: number; // paddle centre y
  aiTarget: number;
  aiTimer: number;
  score: number;
  over: boolean;
}

export function ballSpeed(score: number): number {
  return Math.min(
    MAX_SPEED,
    BASE_SPEED + Math.floor(score / SPEEDUP_EVERY) * SPEEDUP_STEP,
  );
}

/** Serve from the centre toward the player. */
export function serve(score: number, angle = 0): PongState["ball"] {
  const s = ballSpeed(score);
  return {
    x: BOARD_W / 2,
    y: BOARD_H / 2,
    vx: -s * Math.cos(angle),
    vy: s * Math.sin(angle),
  };
}

export function initialState(): PongState {
  return {
    ball: serve(0, 0.3),
    player: BOARD_H / 2,
    ai: BOARD_H / 2,
    aiTarget: BOARD_H / 2,
    aiTimer: 0,
    score: 0,
    over: false,
  };
}

export function clampPaddle(y: number): number {
  return Math.min(BOARD_H - PADDLE_H / 2, Math.max(PADDLE_H / 2, y));
}

/** Bounce angle from where the ball hit the paddle: centre straight, edges steep. */
export function bounceAngle(ballY: number, paddleY: number): number {
  const off = Math.max(-1, Math.min(1, (ballY - paddleY) / (PADDLE_H / 2)));
  return off * MAX_ANGLE;
}

/** The AI re-aims after a small delay and moves at a limited speed. */
function moveAi(s: PongState, dt: number): void {
  s.aiTimer -= dt;
  if (s.aiTimer <= 0) {
    s.aiTimer = AI_DELAY;
    s.aiTarget = s.ball.y;
  }
  const move = Math.max(
    -AI_SPEED * dt,
    Math.min(AI_SPEED * dt, s.aiTarget - s.ai),
  );
  s.ai = clampPaddle(s.ai + move);
}

/** dir: -1/0/1 keyboard input; dragTo: pointer target for the player paddle centre. */
export function step(
  prev: PongState,
  dt: number,
  dir: number,
  dragTo: number | null,
): PongState {
  if (prev.over) return prev;
  const s: PongState = { ...prev, ball: { ...prev.ball } };
  s.player = clampPaddle(
    dragTo === null ? s.player + dir * PLAYER_SPEED * dt : dragTo,
  );

  moveAi(s, dt);
  moveBall(s.ball, dt);
  return hitPaddles(s);
}

function moveBall(b: PongState["ball"], dt: number): void {
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  if (b.y < BALL_R) {
    b.y = BALL_R;
    b.vy = Math.abs(b.vy);
  } else if (b.y > BOARD_H - BALL_R) {
    b.y = BOARD_H - BALL_R;
    b.vy = -Math.abs(b.vy);
  }
}

function hitPaddles(s: PongState): PongState {
  const b = s.ball;
  const playerFace = PADDLE_MARGIN + PADDLE_W;
  const aiFace = BOARD_W - PADDLE_MARGIN - PADDLE_W;
  if (b.vx < 0 && b.x - BALL_R <= playerFace) {
    if (Math.abs(b.y - s.player) <= PADDLE_H / 2 + BALL_R) {
      s.score += 1;
      const a = bounceAngle(b.y, s.player);
      const sp = ballSpeed(s.score);
      s.ball = {
        x: playerFace + BALL_R,
        y: b.y,
        vx: sp * Math.cos(a),
        vy: sp * Math.sin(a),
      };
    } else if (b.x + BALL_R < 0) {
      s.over = true;
    }
  } else if (b.vx > 0 && b.x + BALL_R >= aiFace) {
    if (Math.abs(b.y - s.ai) <= PADDLE_H / 2 + BALL_R) {
      const a = bounceAngle(b.y, s.ai);
      const sp = ballSpeed(s.score);
      s.ball = {
        x: aiFace - BALL_R,
        y: b.y,
        vx: -sp * Math.cos(a),
        vy: sp * Math.sin(a),
      };
    } else if (b.x - BALL_R > BOARD_W) {
      s.ball = serve(s.score, 0.3);
    }
  }
  return s;
}
