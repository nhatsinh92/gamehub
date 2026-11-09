// @vitest-environment happy-dom
import { describe, expect, test } from "vitest";
import { RemoteAdapter } from "./remote-adapter.ts";
import {
  TOKEN,
  fakeFetch,
  jsonResponse,
  renderGameContext,
} from "./test-helpers.ts";

const NULLS = {
  config: null,
  currentUser: null,
  result: null,
  isLoading: false,
  error: null,
};

const SUCCESS = {
  status: "SUCCESS",
  isWin: true,
  reward: { id: "r1", name: "Voucher", code: "ABC123" },
  remainingTurns: 2,
  message: "You won!",
};

function setup(data: unknown) {
  const { fetchFunc, calls } = fakeFetch(() => jsonResponse(200, { data }));
  const ctx = renderGameContext({
    gameId: "g1",
    adapter: RemoteAdapter,
    httpConfig: {
      baseUrl: "https://api.example.test",
      getAccessTokenFunc: () => TOKEN,
      fetchFunc,
    },
  });
  return { ctx, calls };
}

describe("submitResult", () => {
  test("[002:FR-007] stores the whole server result", async () => {
    const { ctx } = setup(SUCCESS);
    expect(await ctx.run((c) => c.submitResult(120))).toEqual(SUCCESS);
    expect(ctx.snapshot()).toEqual({ ...NULLS, result: SUCCESS });
  });

  test.each([NaN, Infinity])(
    "[002:FR-007] score %s is rejected without a request",
    async (score) => {
      const { ctx, calls } = setup(SUCCESS);
      expect(await ctx.run((c) => c.submitResult(score))).toBeNull();
      expect(calls).toEqual([]);
      expect(ctx.snapshot()).toEqual({
        ...NULLS,
        error: {
          kind: "input",
          message: "Invalid score: expected a finite number",
        },
      });
    },
  );

  test.each([
    [{ status: "ERROR", isWin: false, remainingTurns: 3, message: "Oops" }],
    [
      {
        status: "OUT_OF_TURN",
        isWin: false,
        remainingTurns: 0,
        message: "No turns",
      },
    ],
    [
      {
        status: "MAINTENANCE",
        isWin: false,
        remainingTurns: 3,
        message: "Maintenance",
      },
    ],
  ])("[002:FR-015] shows the server result as is: %j", async (result) => {
    const { ctx } = setup(result);
    await ctx.run((c) => c.submitResult(10));
    expect(ctx.snapshot()).toEqual({ ...NULLS, result });
  });

  test("[002:FR-016] resetResult clears only the result", async () => {
    const { ctx } = setup(SUCCESS);
    await ctx.run((c) => c.submitResult(10));
    await ctx.run(() => {
      ctx.current().resetResult();
      return Promise.resolve();
    });
    expect(ctx.snapshot()).toEqual(NULLS);
  });
});
