// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  fakeAdapter,
  flush,
  installFrames,
  renderApp,
  setHidden,
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
  setHidden(false);
  vi.unstubAllGlobals();
});

async function start() {
  const view = renderApp(fakeAdapter());
  unmount = view.unmount;
  await flush();
  driver.frames(1, 1000 / 60);
  return view;
}

/** milliseconds from the tap until the over screen shows */
async function msToOver(ms: number): Promise<number> {
  const view = await start();
  tap(view.container.querySelector("canvas.play") as Element);
  let elapsed = 0;
  while (!view.container.querySelector(".over") && elapsed < 5000) {
    driver.frames(1, ms);
    elapsed += ms;
  }
  view.unmount();
  unmount = undefined;
  return elapsed;
}

test("[005:FR-014] the same round at 60 Hz and at 120 Hz ends within one frame", async () => {
  const at60 = await msToOver(1000 / 60);
  const at120 = await msToOver(1000 / 120);
  expect(at60 < 5000 && at120 < 5000).toEqual(true);
  expect(Math.abs(at60 - at120) <= 1000 / 60).toEqual(true);
});

test("[005:FR-015] hidden mid-round, 30 s later visible: no advance", async () => {
  const view = await start();
  tap(view.container.querySelector("canvas.play") as Element);
  driver.frames(10, 1000 / 60);
  setHidden(true);
  expect(driver.pending()).toEqual(0);
  setHidden(false);
  driver.frames(1, 30000);
  expect(view.container.querySelector(".over")).toEqual(null);
  let n = 0;
  while (!view.container.querySelector(".over") && n < 300) {
    driver.frames(1, 1000 / 60);
    n++;
  }
  expect([n > 0, n < 300]).toEqual([true, true]);
});

test("[005:FR-016] canvas width and height are 900x1400 at devicePixelRatio 3", async () => {
  vi.stubGlobal("devicePixelRatio", 3);
  const view = await start();
  const canvas = view.container.querySelector("canvas.play");
  expect([canvas?.getAttribute("width"), canvas?.getAttribute("height")]).toEqual([
    "900",
    "1400",
  ]);
});

test("[005:FR-015] destroy mid-round leaves no queued frame and no visibility effect", async () => {
  const view = await start();
  tap(view.container.querySelector("canvas.play") as Element);
  driver.frames(5, 1000 / 60);
  view.unmount();
  unmount = undefined;
  setHidden(true);
  setHidden(false);
  expect(driver.pending()).toEqual(0);
});
