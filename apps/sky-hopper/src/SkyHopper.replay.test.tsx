// @vitest-environment happy-dom
import { act } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  fakeAdapter,
  flush,
  installFrames,
  playToGround,
  renderApp,
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

async function start(opts: Parameters<typeof fakeAdapter>[0] = {}) {
  const fake = fakeAdapter(opts);
  const view = renderApp(fake);
  unmount = view.unmount;
  await flush();
  driver.frames(1, 1000 / 60);
  return { fake, ...view };
}
const text = (c: HTMLElement, sel: string) =>
  c.querySelector(sel)?.textContent ?? null;
const clickAgain = (c: HTMLElement): void => {
  act(() => c.querySelector("button")?.click());
};

test("[005:FR-019][007:FR-001] Play again calls resetResult and returns to ready; a second round submits again", async () => {
  const { fake, container } = await start();
  playToGround(container, driver);
  await flush();
  expect(text(container, ".prize")).toEqual("Golden Ticket");
  clickAgain(container);
  await flush();
  expect([
    text(container, ".hint"),
    text(container, ".score"),
    container.querySelector(".over"),
    container.querySelector(".prize, .status"),
  ]).toEqual(["Tap or press Space to fly", "0", null, null]);
  playToGround(container, driver);
  await flush();
  expect(fake.calls.submitResult).toEqual([0, 0]);
});

test("[005:FR-019] best score is kept across rounds", async () => {
  const { container } = await start();
  playToGround(container, driver);
  await flush();
  clickAgain(container);
  await flush();
  playToGround(container, driver);
  await flush();
  expect([text(container, ".final-score"), text(container, ".best-score")]).toEqual([
    "Score: 0",
    "Best: 0",
  ]);
});

test("[005:FR-020] tracking for a round and a replay", async () => {
  const { container, tracking } = await start();
  playToGround(container, driver);
  await flush();
  clickAgain(container);
  await flush();
  playToGround(container, driver);
  await flush();
  expect(tracking).toEqual([
    { name: "game_open" },
    { name: "game_start" },
    { name: "game_over", params: { score: 0 } },
    { name: "game_start" },
    { name: "game_over", params: { score: 0 } },
  ]);
});
