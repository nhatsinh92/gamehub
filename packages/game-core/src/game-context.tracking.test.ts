// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { RemoteAdapter } from "./remote-adapter.ts";
import type { TrackingEvent } from "./types.ts";
import { TOKEN, fakeFetch, jsonResponse, renderGameContext } from "./test-helpers.ts";

const NULLS = {
  config: null,
  currentUser: null,
  result: null,
  isLoading: false,
  error: null,
};
const EVENT: TrackingEvent = { name: "round_end", params: { score: 3 } };

function setup(sendTrackingFunc?: (e: TrackingEvent) => void | Promise<void>) {
  const { fetchFunc } = fakeFetch(() => jsonResponse(200, {}));
  return renderGameContext({
    gameId: "g1",
    adapter: RemoteAdapter,
    httpConfig: {
      baseUrl: "https://api.example.test",
      getAccessTokenFunc: () => TOKEN,
      fetchFunc,
    },
    ...(sendTrackingFunc ? { sendTrackingFunc } : {}),
  });
}

describe("sendTracking", () => {
  test("[002:FR-017] forwards the event unchanged to the host", () => {
    const calls: TrackingEvent[][] = [];
    const ctx = setup((...args) => {
      calls.push(args);
    });
    expect(ctx.current().sendTracking(EVENT)).toBeUndefined();
    expect(calls).toEqual([[{ name: "round_end", params: { score: 3 } }]]);
    expect(calls[0]?.[0]).toBe(EVENT);
    expect(JSON.stringify(calls)).not.toContain(TOKEN);
    expect(ctx.snapshot()).toEqual(NULLS);
  });

  test("[002:FR-017] does nothing without a host function", () => {
    const ctx = setup();
    expect(ctx.current().sendTracking(EVENT)).toBeUndefined();
    expect(ctx.snapshot()).toEqual(NULLS);
  });

  test.each([
    [
      "throws",
      () => {
        throw new Error("host down");
      },
    ],
    ["rejects", () => Promise.reject(new Error("host down"))],
  ])("[002:FR-017] a host function that %s is swallowed", async (_n, fn) => {
    const ctx = setup(fn);
    expect(ctx.current().sendTracking(EVENT)).toBeUndefined();
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.snapshot()).toEqual(NULLS);
  });
});
