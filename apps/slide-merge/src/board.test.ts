import { expect, test } from "vitest";
import { isOver, slide, spawn } from "./board.ts";

test("slide merges each pair once per move and scores the merged value", () => {
  const board = [2, 2, 2, 2, 4, 4, 8, 0, 0, 0, 0, 0, 2, 0, 2, 4];
  expect(slide(board, "left")).toEqual({
    board: [4, 4, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0],
    gained: 4 + 4 + 8 + 4,
    moved: true,
  });
});

test("a move that changes nothing is not a move", () => {
  const board = [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  expect(slide(board, "up")).toEqual({ board, gained: 0, moved: false });
});

test("spawn fills a free cell with 2 or 4", () => {
  const board = [2, 4, 8, 16, 2, 4, 8, 16, 2, 4, 8, 16, 2, 4, 8, 0];
  expect(spawn(board, () => 0.95)).toEqual([...board.slice(0, 15), 4]);
});

test("game is over only when full with no equal neighbours", () => {
  const stuck = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  expect(isOver(stuck)).toEqual(true);
  expect(isOver([...stuck.slice(0, 15), 4])).toEqual(false);
});
