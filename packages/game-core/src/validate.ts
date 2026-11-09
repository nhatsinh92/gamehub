import type {
  CurrentUser,
  GameConfig,
  GameResult,
  Outcome,
  Reward,
} from "./types.ts";

type Rec = Record<string, unknown>;
type Check = (value: unknown) => boolean;

const STATUSES = ["SUCCESS", "ERROR", "OUT_OF_TURN", "MAINTENANCE"];

function actualOf(value: unknown): string {
  if (value === undefined) return "missing";
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function fail(path: string, expected: string, value: unknown): Outcome<never> {
  return {
    ok: false,
    error: {
      kind: "validation",
      message: `field "${path}" expected ${expected}, got ${actualOf(value)}`,
    },
  };
}

const isString: Check = (v) => typeof v === "string";
const isBoolean: Check = (v) => typeof v === "boolean";
const isFinite_: Check = (v) => typeof v === "number" && Number.isFinite(v);
const isCount: Check = (v) => Number.isInteger(v) && (v as number) >= 0;
const isRank: Check = (v) =>
  v === null || (Number.isInteger(v) && (v as number) >= 1);
const isStatus: Check = (v) => typeof v === "string" && STATUSES.includes(v);

function isPlainObject(value: unknown): value is Rec {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type Spec = [field: string, expected: string, check: Check];

/** First failing field (in table order) or null. */
function firstError(obj: Rec, prefix: string, specs: Spec[]) {
  for (const [field, expected, check] of specs) {
    if (!check(obj[field]))
      return fail(`${prefix}.${field}`, expected, obj[field]);
  }
  return null;
}

export function parseGameConfig(value: unknown): Outcome<GameConfig> {
  if (!isPlainObject(value)) return fail("data", "object", value);
  return { ok: true, data: value };
}

const USER_SPECS: Spec[] = [
  ["nickname", "string", isString],
  ["totalTurns", "integer >= 0", isCount],
  ["remainingTurns", "integer >= 0", isCount],
  ["bestScore", "finite number", isFinite_],
  ["currentRank", "integer >= 1 or null", isRank],
];

export function parseCurrentUser(value: unknown): Outcome<CurrentUser> {
  if (!isPlainObject(value)) return fail("data", "object", value);
  const error = firstError(value, "data", USER_SPECS);
  if (error) return error;
  return {
    ok: true,
    data: {
      nickname: value["nickname"] as string,
      totalTurns: value["totalTurns"] as number,
      remainingTurns: value["remainingTurns"] as number,
      bestScore: value["bestScore"] as number,
      currentRank: value["currentRank"] as number | null,
    },
  };
}

const REWARD_SPECS: Spec[] = [
  ["id", "string", isString],
  ["name", "string", isString],
  ["code", "string", isString],
];

function parseReward(value: unknown): Outcome<Reward | null> {
  if (value === undefined || value === null) return { ok: true, data: null };
  if (!isPlainObject(value))
    return fail("data.reward", "object or null", value);
  const error = firstError(value, "data.reward", REWARD_SPECS);
  if (error) return error;
  return {
    ok: true,
    data: {
      id: value["id"] as string,
      name: value["name"] as string,
      code: value["code"] as string,
    },
  };
}

export function parseGameResult(value: unknown): Outcome<GameResult> {
  if (!isPlainObject(value)) return fail("data", "object", value);
  const statusError = firstError(value, "data", [
    ["status", `one of ${STATUSES.join(", ")}`, isStatus],
    ["isWin", "boolean", isBoolean],
  ]);
  if (statusError) return statusError;
  const reward = parseReward(value["reward"]);
  if (!reward.ok) return reward;
  const tailError = firstError(value, "data", [
    ["remainingTurns", "integer >= 0", isCount],
    ["message", "string", isString],
  ]);
  if (tailError) return tailError;
  const data: GameResult = {
    status: value["status"] as GameResult["status"],
    isWin: value["isWin"] as boolean,
    remainingTurns: value["remainingTurns"] as number,
    message: value["message"] as string,
  };
  if (reward.data) data.reward = reward.data;
  return { ok: true, data };
}
