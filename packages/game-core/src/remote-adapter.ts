import type { GameAdapter, Outcome } from "./types.ts";

const STUB: Outcome<never> = {
  ok: false,
  error: { kind: "unknown", message: "stub" },
};

export const RemoteAdapter: GameAdapter = {
  getConfig: () => Promise.resolve(STUB),
  getCurrentUser: () => Promise.resolve(STUB),
  submitResult: () => Promise.resolve(STUB),
};
