import { expect, test } from "vitest";
import { bestScore } from "./best-score.ts";

const rows: [number, number, number][] = [
  [0, 0, 0],
  [3, 0, 3],
  [3, 5, 5],
];

test.each(rows)("[005:FR-018] [005:FR-019] best of %i and %i is %i", (prev, score, best) => {
  expect(bestScore(prev, score)).toEqual(best);
});
