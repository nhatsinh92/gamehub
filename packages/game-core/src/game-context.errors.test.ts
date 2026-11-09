// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { RemoteAdapter } from "./remote-adapter.ts";
import type { GameAdapter } from "./types.ts";
import {
  TOKEN,
  failingFetch,
  fakeFetch,
  jsonResponse,
  renderGameContext,
} from "./test-helpers.ts";

const USER = {
  nickname: "Player One",
  totalTurns: 5,
  remainingTurns: 3,
  bestScore: 120,
  currentRank: 7,
};
const NULLS = {
  config: null,
  currentUser: null,
  result: null,
  isLoading: false,
  error: null,
};

function httpConfig(fetchFunc: typeof fetch) {
  return {
    baseUrl: "https://api.example.test",
    getAccessTokenFunc: () => TOKEN,
    fetchFunc,
  };
}

describe("context failures", () => {
  test("[002:FR-014] invalid data keeps the previous player, then recovers", async () => {
    let body: unknown = { data: USER };
    const { fetchFunc } = fakeFetch(() => jsonResponse(200, body));
    const ctx = renderGameContext({
      gameId: "g1",
      adapter: RemoteAdapter,
      httpConfig: httpConfig(fetchFunc),
    });
    await ctx.run((c) => c.getCurrentUser());
    body = { data: { ...USER, remainingTurns: undefined } };
    expect(await ctx.run((c) => c.getCurrentUser())).toBeNull();
    expect(ctx.snapshot()).toEqual({
      ...NULLS,
      currentUser: USER,
      error: {
        kind: "validation",
        message:
          'Invalid response from GET /g1/v1/me: field "data.remainingTurns" expected integer >= 0, got missing',
      },
    });
    body = { data: USER };
    await ctx.run((c) => c.getCurrentUser());
    expect(ctx.snapshot()).toEqual({ ...NULLS, currentUser: USER });
  });

  test("[002:FR-014] an adapter that throws becomes an unknown error", async () => {
    const adapter: GameAdapter = {
      ...RemoteAdapter,
      getConfig: () => {
        throw new Error("boom");
      },
    };
    const ctx = renderGameContext({
      gameId: "g1",
      adapter,
      httpConfig: httpConfig(fakeFetch(() => jsonResponse(200, {})).fetchFunc),
    });
    expect(await ctx.run((c) => c.initGame())).toBeNull();
    expect(ctx.snapshot()).toEqual({
      ...NULLS,
      error: { kind: "unknown", message: "Adapter failed: initGame" },
    });
  });

  test("[002:FR-014] isLoading stays true until all operations settle", async () => {
    const gates: ((r: Response) => void)[] = [];
    const { fetchFunc } = fakeFetch(
      () => new Promise<Response>((r) => gates.push(r)),
    );
    const ctx = renderGameContext({
      gameId: "g1",
      adapter: RemoteAdapter,
      httpConfig: httpConfig(fetchFunc),
    });
    let both!: Promise<unknown>;
    await ctx.run((c) => {
      both = Promise.all([c.initGame(), c.getCurrentUser()]);
      return Promise.resolve();
    });
    expect(ctx.snapshot()).toEqual({ ...NULLS, isLoading: true });
    await ctx.run(async () => {
      gates[0]?.(jsonResponse(200, { data: { theme: "red" } }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(ctx.snapshot()).toEqual({
      ...NULLS,
      config: { theme: "red" },
      isLoading: true,
    });
    await ctx.run(() => {
      gates[1]?.(jsonResponse(200, { data: USER }));
      return both;
    });
    expect(ctx.snapshot()).toEqual({
      ...NULLS,
      config: { theme: "red" },
      currentUser: USER,
    });
  });

  test.each([
    ["initGame", "GET /g1/v1/init"],
    ["getCurrentUser", "GET /g1/v1/me"],
    ["submitResult", "POST /g1/v1/reward"],
  ] as const)("[002:FR-004] network failure in %s", async (name, op) => {
    const ctx = renderGameContext({
      gameId: "g1",
      adapter: RemoteAdapter,
      httpConfig: httpConfig(failingFetch().fetchFunc),
    });
    const out = await ctx.run(
      (c): Promise<unknown> =>
        name === "submitResult" ? c.submitResult(1) : c[name](),
    );
    expect(out).toBeNull();
    expect(ctx.snapshot()).toEqual({
      ...NULLS,
      error: { kind: "network", message: `Network error: ${op} failed` },
    });
  });
});
