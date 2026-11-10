import { expect, test } from "vitest";
import {
  SHIP_Y,
  START_STATE,
  WORLD_W,
  hasGap,
  scoreOf,
  step,
} from "./game.ts";
import type { Rock } from "./game.ts";

const rock = (x: number, y: number, r = 20): Rock => ({
  x,
  y,
  r,
  vx: 0,
  vy: 0,
  shape: [1],
});

test("the ship stays inside the board", () => {
  const left = step(START_STATE, 10, -1, () => 0.5);
  const right = step(START_STATE, 10, 1, () => 0.5);
  expect([left.shipX, right.shipX]).toEqual([11, WORLD_W - 11]);
});

test("a rock touching the ship ends the round and the score is whole seconds", () => {
  const state = {
    ...START_STATE,
    time: 12.9,
    spawnIn: 5,
    rocks: [rock(START_STATE.shipX, SHIP_Y)],
  };
  const next = step(state, 0.1, 0, () => 0.5);
  expect({ over: next.over, score: scoreOf(next) }).toEqual({
    over: true,
    score: 13,
  });
});

test("a rock far from the ship does not end the round", () => {
  const state = { ...START_STATE, spawnIn: 5, rocks: [rock(20, SHIP_Y)] };
  expect(step(state, 0.01, 0, () => 0.5).over).toEqual(false);
});

test("rocks that would close every gap are refused", () => {
  const wall = [rock(40, 0, 40), rock(120, 0, 40), rock(200, 0, 40)];
  expect([hasGap(wall, rock(280, 0, 40)), hasGap([], rock(160, 0, 26))]).toEqual([
    false,
    true,
  ]);
});
