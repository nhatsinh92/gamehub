import { expect, test } from "vitest";
import { CONFIG } from "./config.ts";
import { step } from "./logic.ts";
import type { GameState, Pipe } from "./logic.ts";

const DT = 1 / 120;
const MOVE = 170 * DT;
// no gravity and no velocity: the bird stays where it is
const still = { ...CONFIG, gravity: 0 };
const half = (): number => 0.5;
const base: GameState = {
  phase: "playing",
  birdY: 310,
  velocity: 0,
  pipes: [],
  score: 0,
  sinceSpawn: 0,
};
const pipe = (over: Partial<Pipe> = {}): Pipe => ({
  x: 300,
  gapY: 310,
  gap: 200,
  scored: false,
  ...over,
});
const round2 = (v: number): number => Math.round(v * 100) / 100;

test("[005:FR-009] a pair spawns every 240 px scrolled", () => {
  let state = base;
  const seen: [number, number[]][] = [];
  for (let n = 1; n <= 339; n++) {
    state = step(state, false, still, half);
    if ([169, 170, 338, 339].includes(n)) {
      seen.push([n, state.pipes.map((p) => round2(p.x))]);
    }
  }
  expect(seen).toEqual([
    [169, []],
    [170, [450]],
    [338, [round2(450 - 168 * MOVE)]],
    [339, [round2(450 - 169 * MOVE), 450]],
  ]);
});

test("[005:FR-009] gap centre maps random 0 and 1 to the range ends", () => {
  const start: GameState = { ...base, sinceSpawn: 239.9 };
  const low = step(start, false, still, () => 0);
  const high = step(start, false, still, () => 0.999);
  expect([low.pipes[0]?.gapY, high.pipes[0]?.gapY]).toEqual([
    160,
    160 + 300 * 0.999,
  ]);
});

test("[005:FR-009] pipes past the left edge are removed", () => {
  const start: GameState = {
    ...base,
    pipes: [pipe({ x: -70, scored: true }), pipe({ x: -60, scored: true })],
  };
  expect(step(start, false, still, half)).toEqual({
    ...base,
    sinceSpawn: MOVE,
    pipes: [pipe({ x: -60 - MOVE, scored: true })],
  });
});

test("[005:FR-010] score rises by 1 when the bird front passes the back edge, once per pair", () => {
  const start: GameState = { ...base, pipes: [pipe({ x: 84.5 })] };
  const one = step(start, false, still, half);
  const two = step(one, false, still, half);
  expect([one, two]).toEqual([
    {
      ...base,
      score: 1,
      sinceSpawn: MOVE,
      pipes: [pipe({ x: 84.5 - MOVE, scored: true })],
    },
    {
      ...base,
      score: 1,
      // the point raised the speed to 175 px/s
      sinceSpawn: MOVE + 175 * DT,
      pipes: [pipe({ x: 84.5 - MOVE - 175 * DT, scored: true })],
    },
  ]);
});

test("[005:FR-010] [005:FR-011] pass and hit in the same step keeps the point and ends", () => {
  const start: GameState = { ...base, pipes: [pipe({ x: 84.5, gapY: 100 })] };
  expect(step(start, false, still, half)).toEqual({
    ...base,
    phase: "over",
    score: 1,
    sinceSpawn: MOVE,
    pipes: [pipe({ x: 84.5 - MOVE, gapY: 100, scored: true })],
  });
});

test("[005:FR-012] a pair keeps its spawn gap after the score rises; new pairs use the new gap; all pipes scroll at the current speed", () => {
  const start: GameState = {
    ...base,
    score: 10,
    sinceSpawn: 239.5,
    pipes: [pipe({ x: 300, gap: 200 })],
  };
  const speed = 220 * DT;
  expect(step(start, false, still, half)).toEqual({
    ...base,
    score: 10,
    sinceSpawn: 239.5 + speed - 240,
    pipes: [
      pipe({ x: 300 - speed, gap: 200 }),
      pipe({ x: 450, gap: 170, gapY: 145 + 330 * 0.5 }),
    ],
  });
});
