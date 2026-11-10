import { expect, test } from "vitest";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clampBasket,
  initialState,
  levelOf,
  step,
} from "./catch-logic.ts";
import type { CatchState, Falling } from "./catch-logic.ts";

const base = (): CatchState => ({ ...initialState(), spawnIn: 99 });
const at = (x: number, y: number, kind: Falling["kind"]): Falling => ({
  id: 1,
  x,
  y,
  kind,
  color: 0,
});

test("a fruit in the basket scores 1 and disappears", () => {
  const s = { ...base(), objects: [at(BOARD_WIDTH / 2, BOARD_HEIGHT - 40, "fruit")] };
  expect(step(s, 0.1, () => 0)).toEqual({
    ...s,
    objects: [],
    score: 1,
    spawnIn: 98.9,
  });
});

test("a bomb in the basket ends the round", () => {
  const s = { ...base(), objects: [at(BOARD_WIDTH / 2, BOARD_HEIGHT - 40, "bomb")] };
  expect(step(s, 0.1, () => 0)).toEqual({
    ...s,
    objects: [],
    over: true,
    spawnIn: 98.9,
  });
});

test("a missed fruit costs a life; the last miss ends the round", () => {
  const s = { ...base(), objects: [at(10, BOARD_HEIGHT + 5, "fruit")] };
  expect(step(s, 0.1, () => 0)).toEqual({
    ...s,
    objects: [],
    lives: 2,
    spawnIn: 98.9,
  });
  const last = { ...s, lives: 1 };
  expect(step(last, 0.1, () => 0)).toEqual({
    ...last,
    objects: [],
    lives: 0,
    over: true,
    spawnIn: 98.9,
  });
});

test("a missed bomb costs nothing", () => {
  const s = { ...base(), objects: [at(10, BOARD_HEIGHT + 5, "bomb")] };
  expect(step(s, 0.1, () => 0)).toEqual({ ...s, objects: [], spawnIn: 98.9 });
});

test("spawns a fruit at the left edge when random is 0", () => {
  const s = { ...base(), spawnIn: 0 };
  expect(step(s, 0.1, () => 0)).toEqual({
    ...s,
    objects: [{ id: 1, x: 12, y: -12, kind: "fruit", color: 0 }],
    nextId: 2,
    spawnIn: -0.1 + 1.1,
  });
});

test("difficulty rises every 10 points up to a cap", () => {
  expect([levelOf(9), levelOf(10), levelOf(25), levelOf(1000)]).toEqual([
    0, 1, 2, 8,
  ]);
});

test("basket stays inside the board", () => {
  expect([clampBasket(-50), clampBasket(500), clampBasket(100)]).toEqual([
    32,
    BOARD_WIDTH - 32,
    100,
  ]);
});
