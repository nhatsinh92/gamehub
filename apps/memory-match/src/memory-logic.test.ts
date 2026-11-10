import { expect, test } from "vitest";
import { buildDeck, cellAt, cellOrigin, flip, hide, isDone, isLocked, newBoard } from "./memory-logic.ts";

test("deck holds each of 8 faces twice", () => {
  const deck = buildDeck(() => 0.3);
  expect([...deck].sort((a, b) => a - b)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]);
});

test("cellAt finds each card and ignores gaps", () => {
  const found = Array.from({ length: 16 }, (_, i) => {
    const o = cellOrigin(i);
    return cellAt(o.x + 5, o.y + 5);
  });
  expect(found).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  expect(cellAt(2, 2)).toEqual(-1);
});

test("match, mismatch and lock", () => {
  const deck = [0, 1, 0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
  let b = flip(newBoard(deck), 0);
  b = flip(b, 1);
  expect(b.open).toEqual([0, 1]);
  expect(b.moves).toEqual(1);
  expect(isLocked(b)).toEqual(true);
  expect(flip(b, 2)).toEqual(b);
  b = hide(b);
  b = flip(flip(b, 0), 2);
  expect(b.matched.slice(0, 4)).toEqual([true, false, true, false]);
  expect(b.open).toEqual([]);
  expect(b.moves).toEqual(2);
  expect(isDone(b)).toEqual(false);
});
