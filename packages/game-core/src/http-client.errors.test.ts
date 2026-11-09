import { describe, expect, test } from "vitest";
import { createHttpClient } from "./http-client.ts";
import type { HttpConfig, Outcome } from "./types.ts";
import {
  TOKEN,
  failingFetch,
  fakeFetch,
  jsonResponse,
  textResponse,
} from "./test-helpers.ts";

const baseUrl = "https://api.example.test";
const ME = { method: "GET", gameId: "g1", endpoint: "me" } as const;

function validation(got: string): Outcome<unknown> {
  return {
    ok: false,
    error: {
      kind: "validation",
      message: `Invalid response from GET /g1/v1/me: field "data" expected object, got ${got}`,
    },
  };
}

async function ask(
  respond: Parameters<typeof fakeFetch>[0],
): Promise<Outcome<unknown>> {
  const { fetchFunc } = fakeFetch(respond);
  const http = createHttpClient({
    baseUrl,
    getAccessTokenFunc: () => TOKEN,
    fetchFunc,
  });
  return http.request(ME);
}

describe("http client failures", () => {
  test("[002:FR-004] network failure hides the underlying message", async () => {
    const http = createHttpClient({
      baseUrl,
      getAccessTokenFunc: () => TOKEN,
      fetchFunc: failingFetch().fetchFunc,
    });
    expect(await http.request(ME)).toEqual({
      ok: false,
      error: { kind: "network", message: "Network error: GET /g1/v1/me failed" },
    });
  });

  test("[002:FR-004] HTTP 5xx is an http error", async () => {
    expect(await ask(() => jsonResponse(500, { data: {} }))).toEqual({
      ok: false,
      error: {
        kind: "http",
        status: 500,
        message: "HTTP 500: GET /g1/v1/me failed",
      },
    });
  });

  test("[002:FR-004] a non-JSON body is a parse error", async () => {
    expect(await ask(() => textResponse(200, "<html>"))).toEqual({
      ok: false,
      error: { kind: "parse", message: "Invalid JSON: GET /g1/v1/me" },
    });
  });

  test.each([
    ["no data key", { result: 1 }, "missing"],
    ["null data", { data: null }, "null"],
    ["array body", [1], "array"],
  ])("[002:FR-004] envelope check: %s", async (_name, body, got) => {
    expect(await ask(() => jsonResponse(200, body))).toEqual(validation(got));
  });

  test.each<[string, HttpConfig["getAccessTokenFunc"]]>([
    [
      "throws",
      () => {
        throw new Error(TOKEN);
      },
    ],
    ["rejects", () => Promise.reject(new Error(TOKEN))],
    ["empty string", () => ""],
    ["non-string", (() => 42) as unknown as () => string],
  ])("[002:FR-002] token function that %s", async (_name, getAccessTokenFunc) => {
    const { fetchFunc, calls } = fakeFetch(() => jsonResponse(200, { data: {} }));
    const http = createHttpClient({ baseUrl, getAccessTokenFunc, fetchFunc });
    expect(await http.request(ME)).toEqual({
      ok: false,
      error: {
        kind: "token",
        message: "Access token unavailable: GET /g1/v1/me not sent",
      },
    });
    expect(calls).toEqual([]);
  });
});
