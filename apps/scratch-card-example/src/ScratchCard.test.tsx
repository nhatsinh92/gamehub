// @vitest-environment happy-dom
import type { GameResult } from "@repo/game-core";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  WIN,
  fakeAdapter,
  flush,
  renderApp,
  scratch,
  scratchAll,
  stubCanvasRect,
} from "./test-helpers.tsx";

let unmount: (() => void) | undefined;
beforeEach(() => stubCanvasRect(360, 480));
afterEach(() => {
  unmount?.();
  unmount = undefined;
});

async function start(opts: Parameters<typeof fakeAdapter>[0] = {}) {
  const fake = fakeAdapter(opts);
  const view = renderApp(fake);
  unmount = view.unmount;
  await flush();
  return { fake, ...view };
}

const canvas = (c: HTMLElement): Element => {
  const found = c.querySelector("canvas.cover");
  expect(found === null).toEqual(false);
  return found as Element;
};
const text = (c: HTMLElement, sel: string) =>
  c.querySelector(sel)?.textContent ?? null;
const playAgain = (c: HTMLElement) =>
  [...c.querySelectorAll("button")].find(
    (b) => b.textContent === "Play again",
  ) as HTMLButtonElement | undefined;

describe("loading", () => {
  test("[003:FR-014] loading text, then one cover canvas", async () => {
    const fake = fakeAdapter({ holdConfig: true });
    const view = renderApp(fake);
    unmount = view.unmount;
    await flush();
    expect(text(view.container, ".game")).toEqual("Loading…");
    expect(view.container.querySelectorAll("canvas").length).toEqual(0);
    fake.releaseConfig();
    await flush();
    expect(view.container.querySelectorAll("canvas.cover").length).toEqual(1);
    expect(view.container.querySelector(".prize, .status")).toEqual(null);
  });

  test("[003:FR-014] load error shows a message and no card", async () => {
    const { fake, container } = await start({ configError: true });
    expect(text(container, ".game")).toEqual(
      "Could not load the game. Please try again later.",
    );
    expect(container.querySelectorAll("canvas").length).toEqual(0);
    expect(fake.calls.submitResult).toEqual([]);
  });
});

describe("scratching", () => {
  test("[003:FR-015] a short stroke stays below the threshold", async () => {
    const { fake, container } = await start();
    scratch(canvas(container), [
      [10, 10],
      [30, 30],
    ]);
    await flush();
    expect(container.querySelectorAll("canvas.cover").length).toEqual(1);
    expect(fake.calls.submitResult).toEqual([]);
  });

  test("[003:FR-016] submits score 1 exactly once past half", async () => {
    const { fake, container } = await start();
    scratchAll(canvas(container));
    await flush();
    scratchAll(container.querySelector("canvas.cover") ?? container);
    await flush();
    expect(fake.calls.submitResult).toEqual([1]);
  });
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
    [
      "out of turn",
      { ...lose, status: "OUT_OF_TURN", message: "No turns left" },
      ".status",
      "No turns left",
    ],
    [
      "maintenance",
      { ...lose, status: "MAINTENANCE", message: "Back soon" },
      ".status",
      "Back soon",
    ],
    ["error", { ...lose, status: "ERROR", message: "Oops" }, ".status", "Oops"],
  ];
  test.each(rows)(
    "[003:FR-017] %s",
    async (_name, result, selector, expected) => {
      const { container } = await start({ result });
      scratchAll(canvas(container));
      await flush();
      expect(text(container, selector)).toEqual(expected);
    },
  );

  test("[003:FR-017] submit error shows the fixed text", async () => {
    const { container } = await start({ submitError: true });
    scratchAll(canvas(container));
    await flush();
    expect(text(container, ".status")).toEqual(
      "Something went wrong. Please try again.",
    );
  });
});

describe("play again", () => {
  test("[003:FR-018] after an outcome, a fresh card can submit again", async () => {
    const { fake, container } = await start();
    scratchAll(canvas(container));
    await flush();
    expect(text(container, ".prize")).toEqual("Golden Ticket");
    act(() => playAgain(container)?.click());
    await flush();
    expect(container.querySelector(".prize, .status")).toEqual(null);
    expect(container.querySelectorAll("canvas.cover").length).toEqual(1);
    scratchAll(canvas(container));
    await flush();
    expect(fake.calls.submitResult).toEqual([1, 1]);
  });

  test("[003:FR-018] after a submit error the button exists and works", async () => {
    const { container } = await start({ submitError: true });
    scratchAll(canvas(container));
    await flush();
    expect(playAgain(container)?.textContent).toEqual("Play again");
    act(() => playAgain(container)?.click());
    await flush();
    expect(container.querySelector(".status")).toEqual(null);
    expect(container.querySelectorAll("canvas.cover").length).toEqual(1);
  });
});

describe("tracking", () => {
  test("[003:FR-019] events for a round and a replay", async () => {
    const { container, tracking } = await start();
    scratchAll(canvas(container));
    await flush();
    act(() => playAgain(container)?.click());
    await flush();
    scratchAll(canvas(container));
    await flush();
    expect(tracking).toEqual([
      { name: "game_open" },
      { name: "game_reveal" },
      { name: "game_result", params: { status: "SUCCESS", isWin: true } },
      { name: "game_reveal" },
      { name: "game_result", params: { status: "SUCCESS", isWin: true } },
    ]);
  });
});
