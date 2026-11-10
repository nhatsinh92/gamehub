import { expect, test } from "vitest";
import {
  BASE_SPEED,
  GRAVITY,
  JUMP_VELOCITY,
  MAX_SPEED,
  WORLD_WIDTH,
  createState,
  speedFor,
  step,
} from "./runner.ts";
import type { RunnerState } from "./runner.ts";

const mid = () => 0.5;

test("speed rises every 100 points up to a cap", () => {
  expect([0, 99, 100, 250, 1000, 100000].map(speedFor)).toEqual([
    BASE_SPEED,
    BASE_SPEED,
    BASE_SPEED + 0.5,
    BASE_SPEED + 1,
    MAX_SPEED,
    MAX_SPEED,
  ]);
});

test("a jump only starts on the ground, then gravity lands it", () => {
  let s: RunnerState = createState();
  s = step(s, true, mid);
  expect(s.height).toEqual(JUMP_VELOCITY);
  const airborne = step(s, true, mid);
  expect(airborne.height).toEqual(JUMP_VELOCITY + (JUMP_VELOCITY - GRAVITY));
  expect(airborne.velocity).toEqual(JUMP_VELOCITY - 2 * GRAVITY);
  for (let i = 0; i < 100 && s.height > 0; i++) s = step(s, false, mid);
  expect([s.height, s.velocity, s.over]).toEqual([0, 0, false]);
});

test("an obstacle spawns off-screen on the right", () => {
  let s = createState();
  while (s.obstacles.length === 0) s = step(s, true, mid);
  expect(s.obstacles).toEqual([{ x: WORLD_WIDTH, blocks: 2 }]);
});

test("touching an obstacle ends the round and freezes the state", () => {
  let s = createState();
  for (let i = 0; i < 500 && !s.over; i++) s = step(s, false, mid);
  expect(s.over).toEqual(true);
  expect(step(s, true, mid)).toBe(s);
});

test("jumping at the right time clears obstacles for a long run", () => {
  let s = createState();
  for (let i = 0; i < 3000 && !s.over; i++) {
    const next = s.obstacles.find((o) => o.x > 40);
    const jump = next !== undefined && next.x - 40 < 60 + s.distance / 100;
    s = step(s, jump, mid);
  }
  expect(s.over).toEqual(false);
});
