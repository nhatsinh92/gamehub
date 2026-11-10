import { expect, test } from "vitest";
import {
  BOARD_H,
  PADDLE_H,
  ballSpeed,
  bounceAngle,
  initialState,
  step,
} from "./pong.ts";

test("player return scores a point and sends the ball right", () => {
  const s = initialState();
  s.ball = { x: 30, y: 200, vx: -200, vy: 0 };
  s.player = 200;
  const next = step(s, 0.016, 0, 200);
  expect({
    score: next.score,
    over: next.over,
    goingRight: next.ball.vx > 0,
  }).toEqual({ score: 1, over: false, goingRight: true });
});

test("missing the ball ends the round", () => {
  const s = initialState();
  s.ball = { x: 5, y: 380, vx: -200, vy: 0 };
  s.player = 40;
  expect(step(s, 0.5, 0, 40).over).toEqual(true);
});

test("angle and speed rules", () => {
  expect([
    bounceAngle(200, 200),
    bounceAngle(200 + PADDLE_H / 2, 200) > 1,
    ballSpeed(0),
    ballSpeed(5),
    ballSpeed(10000),
  ]).toEqual([0, true, 220, 240, 420]);
});

test("paddle stays on the board", () => {
  const s = initialState();
  const up = step(s, 1, -1, null);
  const down = step(s, 1, 1, null);
  expect([up.player, down.player]).toEqual([
    PADDLE_H / 2,
    BOARD_H - PADDLE_H / 2,
  ]);
});
