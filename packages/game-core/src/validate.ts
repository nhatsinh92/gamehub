import type { CurrentUser, GameConfig, GameResult, Outcome } from "./types.ts";

const STUB: Outcome<never> = {
  ok: false,
  error: { kind: "unknown", message: "stub" },
};

export function parseGameConfig(value: unknown): Outcome<GameConfig> {
  void value;
  return STUB;
}

export function parseCurrentUser(value: unknown): Outcome<CurrentUser> {
  void value;
  return STUB;
}

export function parseGameResult(value: unknown): Outcome<GameResult> {
  void value;
  return STUB;
}
