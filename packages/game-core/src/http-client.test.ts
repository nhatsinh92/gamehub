import { describe, expect, test } from "vitest";
import { createHttpClient } from "./http-client.ts";
import { TOKEN, fakeFetch, jsonResponse } from "./test-helpers.ts";

const baseUrl = "https://api.example.test/";

describe("http client requests", () => {
  test("[002:FR-001] GET sends the token header and unwraps data", async () => {
    const { fetchFunc, calls } = fakeFetch(() =>
      jsonResponse(200, { data: { a: 1 } }),
    );
    const http = createHttpClient({
      baseUrl,
      getAccessTokenFunc: () => TOKEN,
      fetchFunc,
    });
    const out = await http.request({
      method: "GET",
      gameId: "lucky wheel",
      endpoint: "me",
    });
    expect(calls).toEqual([
      {
        url: "https://api.example.test/lucky%20wheel/v1/me",
        method: "GET",
        headers: { accept: "application/json", "x-access-token": TOKEN },
        body: null,
      },
    ]);
    expect(out).toEqual({ ok: true, data: { a: 1 } });
  });

  test("[002:FR-002] POST sends the token only in X-Access-Token", async () => {
    const expected = [
      {
        url: "https://api.example.test/g1/v1/reward",
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-access-token": TOKEN,
        },
        body: '{"score":5}',
      },
    ];
    for (const getAccessTokenFunc of [
      () => TOKEN,
      () => Promise.resolve(TOKEN),
    ]) {
      const { fetchFunc, calls } = fakeFetch(() =>
        jsonResponse(200, { data: { ok: 1 } }),
      );
      const http = createHttpClient({ baseUrl, getAccessTokenFunc, fetchFunc });
      await http.request({
        method: "POST",
        gameId: "g1",
        endpoint: "reward",
        body: { score: 5 },
      });
      expect(calls).toEqual(expected);
    }
  });

  test("[002:FR-003] public requests carry no token and never ask for it", async () => {
    const { fetchFunc, calls } = fakeFetch(() =>
      jsonResponse(200, { data: { theme: "red" } }),
    );
    let tokenCalls = 0;
    const http = createHttpClient({
      baseUrl,
      getAccessTokenFunc: () => {
        tokenCalls += 1;
        return TOKEN;
      },
      fetchFunc,
    });
    await http.request({
      method: "GET",
      gameId: "g1",
      endpoint: "init",
      isPublic: true,
    });
    expect(calls).toEqual([
      {
        url: "https://api.example.test/g1/v1/init",
        method: "GET",
        headers: { accept: "application/json" },
        body: null,
      },
    ]);
    expect(tokenCalls).toBe(0);
  });

  test("[002:FR-004] HTTP 401 is an error like any other", async () => {
    const { fetchFunc } = fakeFetch(() => jsonResponse(401, { data: {} }));
    const http = createHttpClient({
      baseUrl,
      getAccessTokenFunc: () => TOKEN,
      fetchFunc,
    });
    const out = await http.request({
      method: "GET",
      gameId: "lucky wheel",
      endpoint: "me",
    });
    expect(out).toEqual({
      ok: false,
      error: {
        kind: "http",
        status: 401,
        message: "HTTP 401: GET /lucky%20wheel/v1/me failed",
      },
    });
  });
});
