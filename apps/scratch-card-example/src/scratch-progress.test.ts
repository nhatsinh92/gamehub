import { describe, expect, test } from "vitest";
import {
  REVEAL_THRESHOLD,
  createScratchGrid,
  scratchAt,
  scratchProgress,
} from "./scratch-progress.ts";

const grid2 = (cells: boolean[]) => ({ size: 2, cells });
const marked = (n: number) =>
  grid2([0, 1, 2, 3].map((i) => i < n));

describe("scratch grid", () => {
  test("[003:FR-020] createScratchGrid builds an empty grid", () => {
    expect(createScratchGrid()).toEqual({
      size: 20,
      cells: Array(400).fill(false),
    });
    expect(createScratchGrid(2)).toEqual({
      size: 2,
      cells: [false, false, false, false],
    });
  });

  test("[003:FR-020] scratchAt marks cells near the point, input unchanged", () => {
    const input = createScratchGrid(2);
    const out = scratchAt(input, 0.25, 0.25, 0.1);
    expect(out).toEqual({ size: 2, cells: [true, false, false, false] });
    expect(input).toEqual({ size: 2, cells: [false, false, false, false] });
  });

  test("[003:FR-020] a point outside the card marks nothing", () => {
    expect(scratchAt(createScratchGrid(2), -1, -1, 0.1)).toEqual({
      size: 2,
      cells: [false, false, false, false],
    });
    expect(scratchAt(createScratchGrid(2), 2, 0.5, 0.1)).toEqual({
      size: 2,
      cells: [false, false, false, false],
    });
  });

  test("[003:FR-020] scratchProgress is the marked share", () => {
    expect([0, 1, 2, 4].map((n) => scratchProgress(marked(n)))).toEqual([
      0, 0.25, 0.5, 1,
    ]);
    expect(scratchProgress({ size: 0, cells: [] })).toEqual(0);
  });

  test("[003:FR-016] reveal rule uses threshold 0.5 with >=", () => {
    expect(REVEAL_THRESHOLD).toEqual(0.5);
    expect(
      [0, 1, 2, 4].map((n) => scratchProgress(marked(n)) >= REVEAL_THRESHOLD),
    ).toEqual([false, false, true, true]);
  });
});
