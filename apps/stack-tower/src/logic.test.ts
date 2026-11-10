import { expect, test } from "vitest";
import { W, createState, drop, speedFor, tick } from "./logic.ts";

const playing = () => drop(createState());

test("a drop that overhangs keeps only the overlap and scores 1", () => {
  const s = { ...playing(), slider: { x: 130, w: 200 } };
  const next = drop(s);
  expect(next.top).toEqual({ x: 130, w: 150 });
  expect(next.score).toEqual(1);
  expect(next.phase).toEqual("playing");
  expect(next.falling).toEqual([{ x: 280, w: 50, level: 1, age: 0 }]);
});

test("a near-perfect drop keeps the full width", () => {
  const s = { ...playing(), slider: { x: 83, w: 200 } };
  const next = drop(s);
  expect(next.top).toEqual({ x: 80, w: 200 });
  expect(next.falling).toEqual([]);
});

test("a drop that misses ends the round", () => {
  const s = {
    ...playing(),
    top: { x: 0, w: 50 },
    slider: { x: 100, w: 50 },
  };
  const next = drop(s);
  expect(next.phase).toEqual("over");
  expect(next.score).toEqual(0);
});

test("the slider bounces off the right edge", () => {
  const s = { ...playing(), slider: { x: 155, w: 200 } };
  const next = tick(s, 100);
  expect(next.dir).toEqual(-1);
  expect(next.slider).toEqual({ x: W - 200 - 9, w: 200 });
});

test("speed rises every 5 blocks up to a cap", () => {
  expect([speedFor(0), speedFor(4), speedFor(5), speedFor(10), speedFor(1000)]).toEqual([
    140, 140, 155, 170, 320,
  ]);
});
