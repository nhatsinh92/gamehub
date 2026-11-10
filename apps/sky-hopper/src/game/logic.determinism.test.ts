import { expect, test } from "vitest";
import { CONFIG } from "./config.ts";
import { createRandom } from "./random.ts";
import { createState, step } from "./logic.ts";
import type { GameState } from "./logic.ts";

function run(seed: number, cfg = CONFIG, steps = 600): GameState[] {
  const random = createRandom(seed);
  const states: GameState[] = [];
  let state = createState(cfg);
  for (let i = 0; i < steps; i++) {
    state = step(state, i % 40 === 0, cfg, random);
    states.push(state);
  }
  return states;
}

test("[005:FR-005] same seed and flap script give identical state lists", () => {
  const a = run(7);
  const b = run(7);
  expect(a.length).toEqual(600);
  expect(a[10]?.phase).toEqual("playing");
  expect(b).toEqual(a);
});

test("[005:FR-005] another seed gives different gap positions", () => {
  const still = { ...CONFIG, gravity: 0 };
  const firstGap = (seed: number): number | undefined =>
    run(seed, still, 200).at(-1)?.pipes[0]?.gapY;
  expect([firstGap(1), firstGap(2)]).toEqual([
    160 + 300 * createRandom(1)(),
    160 + 300 * createRandom(2)(),
  ]);
});
