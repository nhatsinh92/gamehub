// @vitest-environment happy-dom
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, test } from "vitest";
import { useGameContext } from "./game-context.ts";
import { RemoteAdapter } from "./remote-adapter.ts";
import {
  TOKEN,
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

function deferred() {
  let resolve!: (r: Response) => void;
  const promise = new Promise<Response>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("GameContextProvider", () => {
  test("[002:FR-012] useGameContext outside the provider throws", () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const Probe = () => {
      useGameContext();
      return null;
    };
    const root = createRoot(document.createElement("div"));
    expect(() => {
      void act(() => {
        root.render(createElement(Probe));
      });
    }).toThrow("useGameContext must be used inside GameContextProvider");
  });

  test("[002:FR-013] [002:FR-014] state follows initGame and getCurrentUser", async () => {
    const gate = deferred();
    let status = 200;
    const { fetchFunc } = fakeFetch((url) => {
      if (url.endsWith("/init")) return gate.promise;
      return jsonResponse(status, { data: USER });
    });
    const ctx = renderGameContext({
      gameId: "g1",
      adapter: RemoteAdapter,
      httpConfig: {
        baseUrl: "https://api.example.test",
        getAccessTokenFunc: () => TOKEN,
        fetchFunc,
      },
    });
    expect(ctx.snapshot()).toEqual(NULLS);
    let pending!: Promise<unknown>;
    await ctx.run((c) => {
      pending = c.initGame();
      return Promise.resolve();
    });
    expect(ctx.snapshot()).toEqual({ ...NULLS, isLoading: true });
    const config = { theme: "red" };
    gate.resolve(jsonResponse(200, { data: config }));
    await ctx.run(() => pending);
    expect(await pending).toEqual(config);
    expect(ctx.snapshot()).toEqual({ ...NULLS, config });

    expect(await ctx.run((c) => c.getCurrentUser())).toEqual(USER);
    expect(ctx.snapshot()).toEqual({ ...NULLS, config, currentUser: USER });

    status = 401;
    expect(await ctx.run((c) => c.getCurrentUser())).toBeNull();
    expect(ctx.snapshot()).toEqual({
      ...NULLS,
      config,
      currentUser: USER,
      error: {
        kind: "http",
        status: 401,
        message: "HTTP 401: GET /g1/v1/me failed",
      },
    });
  });
});
