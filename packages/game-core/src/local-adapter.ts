import type {
  CurrentUser,
  GameAdapter,
  GameConfig,
  GameResult,
  Outcome,
} from "./types.ts";

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

function serve<T>(data: T): Promise<Outcome<T>> {
  return Promise.resolve({ ok: true, data: structuredClone(data) });
}

export const LocalAdapter: GameAdapter = {
  getConfig: () => serve<GameConfig>(LOCAL_MOCK_DATA.config),
  getCurrentUser: () => serve<CurrentUser>(LOCAL_MOCK_DATA.currentUser),
  submitResult: () => serve<GameResult>(LOCAL_MOCK_DATA.result),
};
