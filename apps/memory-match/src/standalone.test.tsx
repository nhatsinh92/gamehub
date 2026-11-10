// @vitest-environment happy-dom
import { LOCAL_MOCK_DATA, LocalAdapter } from "@repo/game-core";
import { act } from "react";
import { expect, test, vi } from "vitest";
import { GAME_ID } from "./game-name.ts";
import { BOARD_SIZE } from "./memory-logic.ts";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, mountGame } from "./mount-game.tsx";
import { flush, playAll, stubCanvasRect } from "./test-helpers.tsx";

test("[003:FR-001] [003:FR-003] standalone mode uses LocalAdapter and no network", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  vi.spyOn(Math, "random").mockReturnValue(0);
  stubCanvasRect(BOARD_SIZE, BOARD_SIZE);
  const div = document.createElement("div");
  document.body.appendChild(div);
  let handle: { unmount(): void } | undefined;
  act(() => {
    handle = mountGame(div, {
      gameId: GAME_ID,
      adapter: LocalAdapter,
      httpConfig: { baseUrl: "", getAccessTokenFunc: () => "" },
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    });
  });
  await flush();
  playAll(div.shadowRoot?.querySelector("canvas.board") ?? div);
  await flush();
  expect(div.shadowRoot?.querySelector(".status")?.textContent).toEqual(
    "Score: 8 moves",
  );
  expect(LOCAL_MOCK_DATA.result.status).toEqual("SUCCESS");
  expect(fetchSpy.mock.calls).toEqual([]);
  handle?.unmount();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
