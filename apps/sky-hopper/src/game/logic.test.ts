import { expect, test } from "vitest";
import { CONFIG } from "./config.ts";
import { createState, step } from "./logic.ts";
import type { GameState } from "./logic.ts";

const half = (): number => 0.5;
const DT = 1 / 120;

const playing: GameState = {
  phase: "playing",
  birdY: 300,
  velocity: 0,
  pipes: [],
  score: 0,
  sinceSpawn: 0,
};

test("[005:FR-007] createState is ready", () => {
  expect(createState(CONFIG)).toEqual({
    phase: "ready",
    birdY: 310,
    velocity: 0,
    pipes: [],
    score: 0,
    sinceSpawn: 240,
  });
});

test("[005:FR-007] ready without flap is unchanged", () => {
  const start = createState(CONFIG);
  let calls = 0;
  const next = step(start, false, CONFIG, () => {
    calls++;
    return 0.5;
  });
  expect([next, calls]).toEqual([start, 0]);
});

test("[005:FR-007] [005:FR-008] flap in ready starts playing with flap velocity", () => {
  const next = step(createState(CONFIG), true, CONFIG, half);
  expect(next).toEqual({
    phase: "playing",
    velocity: -290,
    birdY: 310 + -290 * DT,
    pipes: [{ x: 450, gap: 200, scored: false, gapY: 160 + 300 * 0.5 }],
    score: 0,
    sinceSpawn: 240 + 170 * DT - 240,
  });
});

test("[005:FR-008] one step without flap adds gravity·dt then moves", () => {
  const velocity = 790 * DT;
  expect(step(playing, false, CONFIG, half)).toEqual({
    ...playing,
    velocity,
    birdY: 300 + velocity * DT,
    sinceSpawn: 170 * DT,
  });
});

test("[005:FR-008] flap in playing sets velocity to -290", () => {
  const moving = { ...playing, velocity: 400 };
  expect(step(moving, true, CONFIG, half)).toEqual({
    ...playing,
    velocity: -290,
    birdY: 300 + -290 * DT,
    sinceSpawn: 170 * DT,
  });
});

test("[005:FR-007] over ignores flaps and does not move", () => {
  const over: GameState = { ...playing, phase: "over", velocity: 50, score: 4 };
  expect(step(over, true, CONFIG, half)).toEqual(over);
  expect(step(over, false, CONFIG, half)).toEqual(over);
});

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test("[005:FR-004] step does not mutate its input", () => {
  const input: GameState = {
    ...playing,
    sinceSpawn: 239.9,
    pipes: [{ x: 300, gapY: 310, gap: 200, scored: false }],
  };
  const copy = structuredClone(input);
  deepFreeze(input);
  const next = step(input, true, CONFIG, half);
  expect(input).toEqual(copy);
  expect(next.pipes.length).toEqual(2);
});
