import { expect, test } from "vitest";
import { createGame, fire, step } from "./game-logic.ts";

test("a head hit scores 3, starts bullet-time and removes the enemy", () => {
  const game = {
    ...createGame(),
    enemies: [{ slot: 2, age: 0, shooter: true, limit: 2 }],
  };
  expect(fire(game, { slot: 2, part: "head" })).toEqual({
    ...game,
    score: 3,
    reload: 0.6,
    bulletTime: 0.7,
    enemies: [],
  });
});

test("a shooter that stays visible too long costs the last life and ends the round", () => {
  const game = {
    ...createGame(),
    spawnIn: 99,
    lives: 1,
    enemies: [{ slot: 0, age: 1.95, shooter: true, limit: 2 }],
  };
  expect(step(game, 0.1, () => 0.5)).toEqual({
    ...game,
    lives: 0,
    over: true,
    hurt: 1,
    spawnIn: 98.9,
    enemies: [],
  });
});
