import { expect, test } from "vitest";
import { CONFIG } from "./config.ts";
import { difficulty } from "./difficulty.ts";

const rows: [number, { speed: number; gap: number }][] = [
  [0, { speed: 170, gap: 200 }],
  [1, { speed: 175, gap: 197 }],
  [10, { speed: 220, gap: 170 }],
  [20, { speed: 270, gap: 140 }],
  [22, { speed: 280, gap: 140 }],
  [1000, { speed: 280, gap: 140 }],
];

test.each(rows)("[005:FR-012] score %i", (score, expected) => {
  expect(difficulty(score, CONFIG)).toEqual(expected);
});

test("[005:FR-012] speed never drops and gap never grows as the score rises", () => {
  const violations: number[] = [];
  for (let s = 1; s <= 100; s++) {
    const prev = difficulty(s - 1, CONFIG);
    const now = difficulty(s, CONFIG);
    if (now.speed < prev.speed || now.gap > prev.gap) violations.push(s);
  }
  expect(violations).toEqual([]);
});
