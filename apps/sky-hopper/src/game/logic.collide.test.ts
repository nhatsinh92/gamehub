import { expect, test } from "vitest";
import { CONFIG } from "./config.ts";
import { step } from "./logic.ts";
import type { GameState, Phase, Pipe } from "./logic.ts";

const MOVE = 170 / 120;
const still = { ...CONFIG, gravity: 0 };
const pipe = (x: number, gapY: number, gap = 200): Pipe => ({
  x,
  gapY,
  gap,
  scored: false,
});

// bird box is 34 x 24 at x 120..154; ground starts at y 620
const cases: [string, number, Pipe[], Phase][] = [
  ["top edge touches", 12, [], "over"],
  ["just below the top edge", 12.5, [], "playing"],
  ["ground touches", 608, [], "over"],
  ["just above the ground", 607.5, [], "playing"],
  ["pipe above the gap", 310, [pipe(100, 100)], "over"],
  ["pipe below the gap", 310, [pipe(100, 520)], "over"],
  ["inside the gap", 310, [pipe(100, 310)], "playing"],
  ["half out of the gap", 355, [pipe(100, 310, 100)], "over"],
  ["pipe ahead of the bird", 310, [pipe(300, 100)], "playing"],
];

test.each(cases)("[005:FR-011] %s", (_name, birdY, pipes, phase) => {
  const start: GameState = {
    phase: "playing",
    birdY,
    velocity: 0,
    pipes,
    score: 0,
    sinceSpawn: 0,
  };
  expect(step(start, false, still, () => 0.5)).toEqual({
    ...start,
    phase,
    sinceSpawn: MOVE,
    pipes: pipes.map((p) => ({ ...p, x: p.x - MOVE })),
  });
});
