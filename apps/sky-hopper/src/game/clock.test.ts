import { expect, test } from "vitest";
import { advanceClock, pauseClock, START_CLOCK } from "./clock.ts";
import type { Clock } from "./clock.ts";
import { CONFIG } from "./config.ts";

function feed(frames: number, ms: number): { steps: number; clock: Clock } {
  let clock = advanceClock(START_CLOCK, 5000, CONFIG).clock;
  let steps = 0;
  for (let i = 1; i <= frames; i++) {
    const r = advanceClock(clock, 5000 + i * ms, CONFIG);
    clock = r.clock;
    steps += r.steps;
  }
  return { steps, clock };
}

test("[005:FR-014] first frame takes 0 steps", () => {
  expect(advanceClock(START_CLOCK, 5000, CONFIG)).toEqual({
    clock: { last: 5000, leftover: 0 },
    steps: 0,
  });
});

test("[005:FR-014] 60 frames at 60 Hz and 120 frames at 120 Hz both take 120 steps", () => {
  const a = feed(60, 1000 / 60);
  const b = feed(120, 1000 / 120);
  expect([a.steps, b.steps]).toEqual([120, 120]);
  expect([a.clock.leftover.toFixed(9), b.clock.leftover.toFixed(9)]).toEqual([
    "0.000000000",
    "0.000000000",
  ]);
});

test("[005:FR-014] leftover carries to the next frame", () => {
  const first = advanceClock(START_CLOCK, 1000, CONFIG).clock;
  expect(advanceClock(first, 1013, CONFIG)).toEqual({
    clock: { last: 1013, leftover: 0.013 - 1 / 120 },
    steps: 1,
  });
});

test("[005:FR-014] a 2000 ms frame takes 12 steps", () => {
  const first = advanceClock(START_CLOCK, 1000, CONFIG).clock;
  const r = advanceClock(first, 3000, CONFIG);
  expect([r.steps, r.clock.last]).toEqual([12, 3000]);
});

test("[005:FR-015] pauseClock resets last and leftover; a frame 30 s later takes 0 steps", () => {
  const running: Clock = { last: 1000, leftover: 0.004 };
  const paused = pauseClock(running);
  expect(paused).toEqual(START_CLOCK);
  expect(advanceClock(paused, 31000, CONFIG)).toEqual({
    clock: { last: 31000, leftover: 0 },
    steps: 0,
  });
});
