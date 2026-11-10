// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  fakeAdapter,
  flush,
  installFrames,
  pressSpace,
  renderApp,
  tap,
} from "./test-helpers.tsx";
import type { Frames } from "./test-helpers.tsx";

const MS = 1000 / 60;
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

async function boot(opts: Parameters<typeof fakeAdapter>[0] = {}) {
  const fake = fakeAdapter(opts);
  const view = renderApp(fake);
  unmount = view.unmount;
  await flush();
  driver.frames(1, MS);
  const game = view.container.querySelector(".game") as HTMLElement;
  const canvas = view.container.querySelector("canvas.play") as Element;
  return { fake, ...view, game, canvas };
}

describe("space", () => {
  test("[005:FR-013] Space on the game root starts the round; repeat keydowns are ignored", async () => {
    const { game, container, tracking } = await boot();
    for (let i = 0; i < 5; i++) pressSpace(game, { repeat: true });
    driver.frames(3, MS);
    expect([container.querySelector(".hint")?.textContent, tracking]).toEqual([
      "Tap or press Space to start",
      [{ name: "game_open" }],
    ]);
    pressSpace(game);
    driver.frames(3, MS);
    expect([container.querySelector(".hint"), tracking]).toEqual([
      null,
      [{ name: "game_open" }, { name: "game_start" }],
    ]);
  });

  test("[005:FR-013] a held key gives one flap; a fresh press flaps again", async () => {
    async function framesToOver(onFrame: (i: number, game: HTMLElement) => void) {
      const { game, container, canvas } = await boot();
      tap(canvas);
      let n = 0;
      while (!container.querySelector(".over") && n < 300) {
        onFrame(n, game);
        driver.frames(1, MS);
        n++;
      }
      unmount?.();
      unmount = undefined;
      return n;
    }
    const none = await framesToOver(() => {});
    const held = await framesToOver((_i, game) => {
      pressSpace(game, { repeat: true });
    });
    const fresh = await framesToOver((i, game) => {
      if (i === 10) pressSpace(game);
    });
    expect([held, fresh > none]).toEqual([none, true]);
  });

  test("[005:FR-013] Space keydown default is prevented", async () => {
    const { game } = await boot();
    const first = pressSpace(game);
    const repeat = pressSpace(game, { repeat: true });
    expect([first.defaultPrevented, repeat.defaultPrevented]).toEqual([true, true]);
  });

  test("[005:FR-013] other keys do nothing", async () => {
    const { game, container, tracking } = await boot();
    act_key(game, "KeyA");
    act_key(game, "Enter");
    driver.frames(3, MS);
    expect([container.querySelector(".hint")?.textContent, tracking]).toEqual([
      "Tap or press Space to start",
      [{ name: "game_open" }],
    ]);
  });
});

function act_key(el: Element, code: string): void {
  el.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
}

describe("over", () => {
  test("[005:FR-013] taps while over do not start a round", async () => {
    const { fake, container, canvas, tracking } = await boot({ holdSubmit: true });
    tap(canvas);
    for (let i = 0; i < 300 && !container.querySelector(".over"); i++) {
      driver.frames(1, MS);
    }
    await flush();
    tap(canvas);
    driver.frames(5, MS);
    expect([
      container.querySelectorAll(".over").length,
      fake.calls.submitResult,
      tracking,
    ]).toEqual([
      1,
      [0],
      [
        { name: "game_open" },
        { name: "game_start" },
        { name: "game_over", params: { score: 0 } },
      ],
    ]);
  });
});
