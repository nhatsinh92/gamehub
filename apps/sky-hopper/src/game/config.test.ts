import { expect, test } from "vitest";
import { CONFIG } from "./config.ts";

test("[005:FR-006] CONFIG equals the starting values", () => {
  expect(CONFIG).toEqual({
    width: 450,
    height: 700,
    groundHeight: 80,
    gravity: 790,
    flapVelocity: -290,
    birdX: 120,
    birdWidth: 34,
    birdHeight: 24,
    pipeWidth: 70,
    pipeSpacing: 240,
    gapMargin: 60,
    speedStart: 170,
    speedMax: 280,
    speedPerPoint: 5,
    gapStart: 200,
    gapMin: 140,
    gapPerPoint: 3,
    stepSeconds: 1 / 120,
    maxSteps: 12,
  });
});
