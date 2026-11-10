import { expect, test } from "vitest";
import { GRID, newState, step, tickMs, turn } from "./snake-engine.ts";
import type { State } from "./snake-engine.ts";

const rng = () => 0;
const base = (over: Partial<State> = {}): State => ({
  ...newState(rng),
  prey: { x: 1, y: 1 },
  ...over,
});

test("catching prey grows the snake, scores 1 and respawns prey on a free cell", () => {
  const s = base({ prey: { x: 10, y: 10 } });
  const n = step(s, "right", rng);
  expect(n.snake).toEqual([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ]);
  expect(n.score).toEqual(1);
  expect(n.prey).toEqual({ x: 1, y: 1 });
  expect(n.over).toEqual(false);
});

test("hitting the wall or the body ends the round", () => {
  const wall = base({
    snake: [
      { x: GRID - 2, y: 5 },
      { x: GRID - 3, y: 5 },
    ],
  });
  expect(step(wall, "right", rng).over).toEqual(true);
  const loop = base({
    dir: "up",
    snake: [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
      { x: 6, y: 4 },
      { x: 5, y: 4 },
    ],
  });
  expect(step(loop, "right", rng).over).toEqual(true);
});

test("a turn straight back is ignored; speed rises every 5 points to a cap", () => {
  expect(turn("right", "left")).toEqual("right");
  expect(turn("right", "up")).toEqual("up");
  expect([0, 4, 5, 10, 100].map(tickMs)).toEqual([160, 160, 150, 140, 70]);
});

test("prey steps to a free neighbour every third tick", () => {
  let s = base({ prey: { x: 5, y: 5 } });
  s = step(s, "right", rng);
  s = step(s, "right", rng);
  expect(s.prey).toEqual({ x: 5, y: 5 });
  s = step(s, "right", rng);
  expect(s.prey).toEqual({ x: 5, y: 4 });
});
