import { describe, expect, test } from "vitest";
import { createHttpClient } from "./http-client.ts";
import { LOCAL_MOCK_DATA, LocalAdapter } from "./local-adapter.ts";
import { forbiddenFetch } from "./test-helpers.ts";
import {
  parseCurrentUser,
  parseGameConfig,
  parseGameResult,
} from "./validate.ts";

const CONFIG = { mode: "local" };
const USER = {
  nickname: "Local Player",
  totalTurns: 10,
  remainingTurns: 10,
  bestScore: 0,
  currentRank: null,
};
const RESULT = {
  status: "SUCCESS",
  isWin: true,
  reward: { id: "local-reward", name: "Demo reward", code: "DEMO-CODE" },
  remainingTurns: 9,
  message: "Local mode: result not saved",
};

function setup() {
  const forbidden = forbiddenFetch();
  let tokenCalls = 0;
  const http = createHttpClient({
    baseUrl: "https://api.example.test",
    getAccessTokenFunc: () => {
      tokenCalls += 1;
      return "unused";
    },
    fetchFunc: forbidden.fetchFunc,
  });
  return { env: { gameId: "g1", http }, forbidden, tokenCalls: () => tokenCalls };
}

describe("LocalAdapter", () => {
  test("[002:FR-011] serves fixed mock data with no network and no token", async () => {
    const s = setup();
    expect(await LocalAdapter.getConfig(s.env)).toEqual({
      ok: true,
      data: CONFIG,
    });
    expect(await LocalAdapter.getCurrentUser(s.env)).toEqual({
      ok: true,
      data: USER,
    });
    expect(await LocalAdapter.submitResult(s.env, 1)).toEqual({
      ok: true,
      data: RESULT,
    });
    expect(await LocalAdapter.submitResult(s.env, 999)).toEqual({
      ok: true,
      data: RESULT,
    });
    expect(s.forbidden.calls).toEqual([]);
    expect(s.tokenCalls()).toBe(0);
  });

  test("[002:FR-011] mock values are valid and mutation-safe", async () => {
    expect(LOCAL_MOCK_DATA).toEqual({ config: CONFIG, currentUser: USER, result: RESULT });
    expect(parseGameConfig(LOCAL_MOCK_DATA.config)).toEqual({ ok: true, data: CONFIG });
    expect(parseCurrentUser(LOCAL_MOCK_DATA.currentUser)).toEqual({ ok: true, data: USER });
    expect(parseGameResult(LOCAL_MOCK_DATA.result)).toEqual({ ok: true, data: RESULT });
    const out = await LocalAdapter.getConfig(setup().env);
    if (out.ok) out.data["mode"] = "changed";
    expect(LOCAL_MOCK_DATA.config).toEqual(CONFIG);
  });
});
