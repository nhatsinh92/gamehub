// @vitest-environment happy-dom
import type { GameResult } from "@repo/game-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  WIN,
  fakeAdapter,
  flush,
  installFrames,
  playToGround,
  renderApp,
  tap,
} from "./test-helpers.tsx";
import type { Frames } from "./test-helpers.tsx";

let unmount: (() => void) | undefined;
let driver: Frames;
beforeEach(() => {
  driver = installFrames();
});
afterEach(() => {
  unmount?.();
  unmount = undefined;
  vi.unstubAllGlobals();
});

async function round(opts: Parameters<typeof fakeAdapter>[0] = {}) {
  const fake = fakeAdapter(opts);
  const view = renderApp(fake);
  unmount = view.unmount;
  await flush();
  driver.frames(1, 1000 / 60);
  playToGround(view.container, driver);
  await flush();
  return { fake, ...view };
}
const text = (c: HTMLElement, sel: string) =>
  c.querySelector(sel)?.textContent ?? null;

test("[005:FR-017] game over submits the score once", async () => {
  const { fake, container } = await round();
  driver.frames(10, 1000 / 60);
  tap(container.querySelector("canvas.play") as Element);
  driver.frames(10, 1000 / 60);
  await flush();
  expect(fake.calls.submitResult).toEqual([0]);
});

describe("outcome text", () => {
  const lose: GameResult = { ...WIN, isWin: false, reward: undefined, message: "Not this time" };
  const rows: [string, GameResult, string, string][] = [
    ["win with reward", WIN, ".prize", "Golden Ticket"],
    ["no win", lose, ".status", "Not this time"],
    [
      "win without reward",
      { ...WIN, reward: undefined, message: "Won, no reward" },
      ".status",
      "Won, no reward",
    ],
    ["out of turn", { ...lose, status: "OUT_OF_TURN", message: "No turns left" }, ".status", "No turns left"],
    ["maintenance", { ...lose, status: "MAINTENANCE", message: "Back soon" }, ".status", "Back soon"],
    ["error", { ...lose, status: "ERROR", message: "Oops" }, ".status", "Oops"],
  ];
  test.each(rows)("[005:FR-018] %s", async (_name, result, selector, expected) => {
    const { container } = await round({ result });
    expect([
      text(container, selector),
      text(container, ".final-score"),
      text(container, ".best-score"),
    ]).toEqual([expected, "Score: 0", "Best: 0"]);
  });

  test("[005:FR-018] submit error shows the fixed text", async () => {
    const { container } = await round({ submitError: true });
    expect([
      text(container, ".status"),
      text(container, ".final-score"),
      text(container, ".best-score"),
    ]).toEqual(["Something went wrong. Please try again.", "Score: 0", "Best: 0"]);
  });
});

test("[005:FR-018] waiting for the server shows score and best and no button", async () => {
  const { container, fake } = await round({ holdSubmit: true });
  expect([
    text(container, ".final-score"),
    text(container, ".best-score"),
    container.querySelectorAll("button").length,
    container.querySelector(".prize, .status"),
  ]).toEqual(["Score: 0", "Best: 0", 0, null]);
  fake.releaseSubmit();
  await flush();
  expect([
    text(container, ".prize"),
    container.querySelector("button")?.textContent,
  ]).toEqual(["Golden Ticket", "Play again"]);
});
