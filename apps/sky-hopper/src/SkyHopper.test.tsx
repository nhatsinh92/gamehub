// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
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

const text = (c: HTMLElement, sel: string) =>
  c.querySelector(sel)?.textContent ?? null;

describe("screens", () => {
  test("[005:FR-021] loading text, then the ready screen", async () => {
    const fake = fakeAdapter({ holdConfig: true });
    const view = renderApp(fake);
    unmount = view.unmount;
    await flush();
    expect([text(view.container, ".status"), view.container.querySelectorAll("canvas").length]).toEqual([
      "Loading…",
      0,
    ]);
    fake.releaseConfig();
    await flush();
    expect([
      text(view.container, ".hint"),
      text(view.container, ".score"),
      view.container.querySelectorAll("canvas.play").length,
      view.container.querySelector(".status"),
    ]).toEqual(["Tap or press Space to start", "0", 1, null]);
  });

  test("[005:FR-021] load error shows the template text and taps do nothing", async () => {
    const fake = fakeAdapter({ configError: true });
    const view = renderApp(fake);
    unmount = view.unmount;
    await flush();
    expect([
      text(view.container, ".game"),
      view.container.querySelectorAll("canvas").length,
    ]).toEqual(["Could not load the game. Please try again later.", 0]);
    tap(view.container);
    driver.frames(5, 1000 / 60);
    expect(fake.calls.submitResult).toEqual([]);
  });
});

describe("round", () => {
  test("[005:FR-007] tap starts playing; frames move the game; the ground ends the round", async () => {
    const fake = fakeAdapter();
    const view = renderApp(fake);
    unmount = view.unmount;
    await flush();
    driver.frames(1, 1000 / 60);
    const canvas = view.container.querySelector("canvas.play") as Element;
    tap(canvas);
    driver.frames(3, 1000 / 60);
    expect([text(view.container, ".hint"), view.container.querySelector(".over")]).toEqual([null, null]);
    playToGround(view.container, driver);
    await flush();
    expect(text(view.container, ".final-score")).toEqual("Score: 0");
  });
});
