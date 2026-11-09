import { describe, expect, test } from "vitest";
import { createHttpClient } from "./http-client.ts";
import { RemoteAdapter } from "./remote-adapter.ts";
import { TOKEN, fakeFetch, jsonResponse } from "./test-helpers.ts";

const USER = {
  nickname: "Player One",
  totalTurns: 5,
  remainingTurns: 3,
  bestScore: 120,
  currentRank: 7,
};

const RESULT = {
  status: "SUCCESS",
  isWin: true,
  reward: { id: "r1", name: "Voucher", code: "ABC123" },
  remainingTurns: 2,
  message: "You won!",
};

function env(data: unknown) {
  const { fetchFunc, calls } = fakeFetch(() => jsonResponse(200, { data }));
  const http = createHttpClient({
    baseUrl: "https://api.example.test",
    getAccessTokenFunc: () => TOKEN,
    fetchFunc,
  });
  return { env: { gameId: "g1", http }, calls };
}

describe("RemoteAdapter", () => {
  test("[002:FR-005] getConfig calls the public init endpoint", async () => {
    const { env: e, calls } = env({ theme: "red" });
    expect(await RemoteAdapter.getConfig(e)).toEqual({
      ok: true,
      data: { theme: "red" },
    });
    expect(calls).toEqual([
      {
        url: "https://api.example.test/g1/v1/init",
        method: "GET",
        headers: { accept: "application/json" },
        body: null,
      },
    ]);
  });

  test("[002:FR-006] getCurrentUser calls me with the token", async () => {
    const { env: e, calls } = env(USER);
    expect(await RemoteAdapter.getCurrentUser(e)).toEqual({
      ok: true,
      data: USER,
    });
    expect(calls).toEqual([
      {
        url: "https://api.example.test/g1/v1/me",
        method: "GET",
        headers: { accept: "application/json", "x-access-token": TOKEN },
        body: null,
      },
    ]);
  });

  test("[002:FR-010] a player missing nickname is a validation error", async () => {
    const { nickname: _n, ...partial } = USER;
    const { env: e } = env(partial);
    expect(await RemoteAdapter.getCurrentUser(e)).toEqual({
      ok: false,
      error: {
        kind: "validation",
        message:
          'Invalid response from GET /g1/v1/me: field "data.nickname" expected string, got missing',
      },
    });
  });

  test("[002:FR-007] submitResult posts the score to reward", async () => {
    const { env: e, calls } = env(RESULT);
    expect(await RemoteAdapter.submitResult(e, 120)).toEqual({
      ok: true,
      data: RESULT,
    });
    expect(calls).toEqual([
      {
        url: "https://api.example.test/g1/v1/reward",
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-access-token": TOKEN,
        },
        body: '{"score":120}',
      },
    ]);
  });
});
