import { expect, test } from "vitest";
import { canvasBitmapSize } from "./canvas-size.ts";
import { CONFIG } from "./config.ts";

const rows: [number, { width: number; height: number; scale: number }][] = [
  [0.5, { width: 450, height: 700, scale: 1 }],
  [1, { width: 450, height: 700, scale: 1 }],
  [1.5, { width: 675, height: 1050, scale: 1.5 }],
  [2, { width: 900, height: 1400, scale: 2 }],
  [3, { width: 900, height: 1400, scale: 2 }],
  [Number.NaN, { width: 450, height: 700, scale: 1 }],
  [0, { width: 450, height: 700, scale: 1 }],
];

test.each(rows)("[005:FR-016] device pixel ratio %f", (dpr, expected) => {
  expect(canvasBitmapSize(dpr, CONFIG)).toEqual(expected);
});
