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

const STATUSES = "one of SUCCESS, ERROR, OUT_OF_TURN, MAINTENANCE";

function fail(path: string, expected: string, got: string) {
  return {
    ok: false,
    error: {
      kind: "validation",
      message: `field "${path}" expected ${expected}, got ${got}`,
    },
  };
}

function without(obj: Record<string, unknown>, key: string) {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

describe("current user validation", () => {
  test.each([
    ["nickname", "string"],
    ["totalTurns", "integer >= 0"],
    ["remainingTurns", "integer >= 0"],
    ["bestScore", "finite number"],
    ["currentRank", "integer >= 1 or null"],
  ])("[002:FR-008] missing %s", (field, expected) => {
    expect(parseCurrentUser(without(USER, field))).toEqual(
      fail(`data.${field}`, expected, "missing"),
    );
  });

  test.each([
    [{ nickname: 5 }, fail("data.nickname", "string", "number")],
    [{ totalTurns: -1 }, fail("data.totalTurns", "integer >= 0", "number")],
    [{ totalTurns: 1.5 }, fail("data.totalTurns", "integer >= 0", "number")],
    [
      { remainingTurns: "3" },
      fail("data.remainingTurns", "integer >= 0", "string"),
    ],
    [
      { bestScore: Infinity },
      fail("data.bestScore", "finite number", "number"),
    ],
    [
      { currentRank: 0 },
      fail("data.currentRank", "integer >= 1 or null", "number"),
    ],
    [
      { currentRank: "1" },
      fail("data.currentRank", "integer >= 1 or null", "string"),
    ],
    [
      { nickname: 5, totalTurns: "x" },
      fail("data.nickname", "string", "number"),
    ],
  ])("[002:FR-008] wrong field %j", (patch, expected) => {
    expect(parseCurrentUser({ ...USER, ...patch })).toEqual(expected);
  });
});

describe("game result validation", () => {
  test.each([
    ["status", STATUSES],
    ["isWin", "boolean"],
    ["remainingTurns", "integer >= 0"],
    ["message", "string"],
  ])("[002:FR-008] missing %s", (field, expected) => {
    expect(parseGameResult(without(RESULT, field))).toEqual(
      fail(`data.${field}`, expected, "missing"),
    );
  });

  test.each([
    [{ status: "WIN" }, fail("data.status", STATUSES, "string")],
    [{ isWin: "true" }, fail("data.isWin", "boolean", "string")],
    [{ reward: "x" }, fail("data.reward", "object or null", "string")],
    [
      { reward: { id: "r", name: "n" } },
      fail("data.reward.code", "string", "missing"),
    ],
    [
      { remainingTurns: null },
      fail("data.remainingTurns", "integer >= 0", "null"),
    ],
  ])("[002:FR-008] wrong field %j", (patch, expected) => {
    expect(parseGameResult({ ...RESULT, ...patch })).toEqual(expected);
  });
});

describe("config validation", () => {
  test.each([
    [null, "null"],
    [[], "array"],
    ["x", "string"],
    [undefined, "missing"],
  ])("[002:FR-008] config %j is rejected", (value, got) => {
    expect(parseGameConfig(value)).toEqual(fail("data", "object", got));
  });
});
