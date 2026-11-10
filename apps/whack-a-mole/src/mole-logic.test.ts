import { expect, test } from "vitest";
import {
  ROUND_MS,
  advance,
  createState,
  isOver,
  moleLifetime,
  spawnInterval,
  whack,
} from "./mole-logic.ts";

test("moles spawn faster and live shorter as time passes", () => {
  expect([spawnInterval(0), spawnInterval(20_000)]).toEqual([900, 500]);
  expect([moleLifetime(0), moleLifetime(20_000)]).toEqual([1200, 760]);
});

test("a mole appears at the first spawn time and can be whacked once", () => {
  const s = advance(createState(), 400, () => 0);
  expect(s.moles).toEqual([
    1591.2, null, null, null, null, null, null, null, null,
  ]);
  const w = whack(s, 0);
  expect(w.score).toEqual(1);
  expect(w.moles).toEqual(createState().moles);
  expect(whack(w, 0)).toEqual(w);
});

test("a mole hides again when its time is up", () => {
  const s = advance(createState(), 400, () => 0);
  expect(advance(s, 1591.2, () => 0.99).moles[0]).toEqual(null);
});

test("the round ends at 30 seconds and whacks no longer score", () => {
  const s = advance(createState(), ROUND_MS + 5000, () => 0.5);
  expect(s.elapsed).toEqual(ROUND_MS);
  expect(isOver(s)).toEqual(true);
  expect(whack({ ...s, moles: s.moles.map(() => 99_999) }, 2).score).toEqual(0);
});
