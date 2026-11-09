// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { LOCAL_MOCK_DATA, LocalAdapter } from "./local-adapter.ts";
import { RemoteAdapter } from "./remote-adapter.ts";
import type { GameAdapter } from "./types.ts";
import {
  TOKEN,
  fakeFetch,
  jsonResponse,
  renderGameContext,
} from "./test-helpers.ts";

const EXPECTED = {
  config: { mode: "local" },
  currentUser: {
    nickname: "Local Player",
    totalTurns: 10,
    remainingTurns: 10,
    bestScore: 0,
    currentRank: null,
  },
  result: {
    status: "SUCCESS",
    isWin: true,
    reward: { id: "local-reward", name: "Demo reward", code: "DEMO-CODE" },
    remainingTurns: 9,
    message: "Local mode: result not saved",
  },
  isLoading: false,
  error: null,
};

async function play(adapter: GameAdapter) {
  const { fetchFunc } = fakeFetch((url) => {
    const data = url.endsWith("/init")
      ? LOCAL_MOCK_DATA.config
      : url.endsWith("/me")
        ? LOCAL_MOCK_DATA.currentUser
        : LOCAL_MOCK_DATA.result;
    return jsonResponse(200, { data });
  });
  const ctx = renderGameContext({
    gameId: "g1",
    adapter,
    httpConfig: {
      baseUrl: "https://api.example.test",
      getAccessTokenFunc: () => TOKEN,
      fetchFunc,
    },
  });
  await ctx.run((c) => c.initGame());
  await ctx.run((c) => c.getCurrentUser());
  await ctx.run((c) => c.submitResult(50));
  return ctx.snapshot();
}

describe("adapters are interchangeable", () => {
  test("[002:FR-009] the same game code works with local and remote adapters", async () => {
    expect(await play(LocalAdapter)).toEqual(EXPECTED);
    expect(await play(RemoteAdapter)).toEqual(EXPECTED);
  });
});
