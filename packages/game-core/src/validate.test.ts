import { describe, expect, test } from "vitest";
import {
  parseCurrentUser,
  parseGameConfig,
  parseGameResult,
} from "./validate.ts";

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

describe("validators accept valid data", () => {
  test("[002:FR-008] game config is any plain object, same object", () => {
    const config = { theme: "red" };
    const out = parseGameConfig(config);
    expect(out).toEqual({ ok: true, data: { theme: "red" } });
    expect(out.ok && out.data).toBe(config);
  });

  test("[002:FR-008] current user drops extra fields", () => {
    expect(parseCurrentUser({ ...USER, email: "x@example.test" })).toEqual({
      ok: true,
      data: USER,
    });
  });

  test("[002:FR-008] a null rank is accepted", () => {
    expect(parseCurrentUser({ ...USER, currentRank: null })).toEqual({
      ok: true,
      data: { ...USER, currentRank: null },
    });
  });

  test("[002:FR-008] game result drops extra fields and keeps the reward", () => {
    expect(parseGameResult({ ...RESULT, extra: 1 })).toEqual({
      ok: true,
      data: RESULT,
    });
  });

  test.each([
    ["null reward", { ...RESULT, reward: null }],
    ["absent reward", { ...RESULT, reward: undefined }],
  ])("[002:FR-008] %s omits the reward key", (_name, input) => {
    const out = parseGameResult(input);
    const { reward: _reward, ...rest } = RESULT;
    expect(out).toEqual({ ok: true, data: rest });
    expect(out.ok && Object.keys(out.data)).toEqual([
      "status",
      "isWin",
      "remainingTurns",
      "message",
    ]);
  });
});
