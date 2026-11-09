import type {
  CurrentUser,
  GameAdapter,
  GameConfig,
  GameResult,
  Outcome,
} from "./types.ts";

const STUB: Outcome<never> = {
  ok: false,
  error: { kind: "unknown", message: "stub" },
};

export const LOCAL_MOCK_DATA: {
  readonly config: GameConfig;
  readonly currentUser: CurrentUser;
  readonly result: GameResult;
} = Object.freeze({
  config: Object.freeze({ mode: "local" }),
  currentUser: Object.freeze({
    nickname: "Local Player",
    totalTurns: 10,
    remainingTurns: 10,
    bestScore: 0,
    currentRank: null,
  }),
  result: Object.freeze({
    status: "SUCCESS" as const,
    isWin: true,
    reward: Object.freeze({
      id: "local-reward",
      name: "Demo reward",
      code: "DEMO-CODE",
    }),
    remainingTurns: 9,
    message: "Local mode: result not saved",
  }),
});

export const LocalAdapter: GameAdapter = {
  getConfig: () => Promise.resolve(STUB),
  getCurrentUser: () => Promise.resolve(STUB),
  submitResult: () => Promise.resolve(STUB),
};
