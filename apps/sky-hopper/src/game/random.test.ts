import { expect, test } from "vitest";
import { createRandom } from "./random.ts";

const take = (seed: number, n: number): number[] => {
  const random = createRandom(seed);
  return Array.from({ length: n }, () => random());
};

test("[005:FR-005] same seed gives the same first 5 numbers", () => {
  const expected = [
    0.6270739405881613, 0.002735721180215478, 0.5274470399599522,
    0.9810509674716741, 0.9683778982143849,
  ];
  expect([take(1, 5), take(1, 5)]).toEqual([expected, expected]);
});

test("[005:FR-005] numbers are in [0, 1)", () => {
  const outside = take(42, 1000).filter((v) => v < 0 || v >= 1);
  expect(outside).toEqual([]);
});

test("[005:FR-005] a different seed gives a different sequence", () => {
  expect(take(2, 5)).not.toEqual(take(1, 5));
  expect(take(2, 5).length).toEqual(5);
  expect(new Set(take(2, 5)).size).toEqual(5);
});
