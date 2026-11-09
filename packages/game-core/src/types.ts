import type { ReactNode } from "react";

export type GameConfig = Record<string, unknown>;

export interface CurrentUser {
  nickname: string;
  totalTurns: number;
  remainingTurns: number;
  bestScore: number;
  currentRank: number | null;
}

export type ResultStatus = "SUCCESS" | "ERROR" | "OUT_OF_TURN" | "MAINTENANCE";

export interface Reward {
  id: string;
  name: string;
  code: string;
}

export interface GameResult {
  status: ResultStatus;
  isWin: boolean;
  reward?: Reward;
  remainingTurns: number;
  message: string;
}

export interface TrackingEvent {
  name: string;
  params?: Record<string, unknown>;
}

export type ErrorKind =
  "network" | "http" | "parse" | "validation" | "token" | "input" | "unknown";

export interface GameCoreError {
  kind: ErrorKind;
  message: string;
  status?: number;
}

export type Outcome<T> =
  { ok: true; data: T } | { ok: false; error: GameCoreError };

export interface HttpConfig {
  baseUrl: string;
  getAccessTokenFunc: () => string | Promise<string>;
  fetchFunc?: typeof fetch;
}

export interface RequestOptions {
  method: "GET" | "POST";
  gameId: string;
  endpoint: "init" | "me" | "reward";
  body?: unknown;
  isPublic?: boolean;
}

export interface HttpClient {
  request(options: RequestOptions): Promise<Outcome<unknown>>;
}

export interface AdapterEnv {
  gameId: string;
  http: HttpClient;
}

export interface GameAdapter {
  getConfig(env: AdapterEnv): Promise<Outcome<GameConfig>>;
  getCurrentUser(env: AdapterEnv): Promise<Outcome<CurrentUser>>;
  submitResult(env: AdapterEnv, score: number): Promise<Outcome<GameResult>>;
}

export interface GameContextValue {
  config: GameConfig | null;
  currentUser: CurrentUser | null;
  result: GameResult | null;
  isLoading: boolean;
  error: GameCoreError | null;
  initGame(): Promise<GameConfig | null>;
  getCurrentUser(): Promise<CurrentUser | null>;
  submitResult(score: number): Promise<GameResult | null>;
  resetResult(): void;
  sendTracking(event: TrackingEvent): void;
}

export interface GameContextProviderProps {
  gameId: string;
  adapter: GameAdapter;
  httpConfig: HttpConfig;
  sendTrackingFunc?: (event: TrackingEvent) => void | Promise<void>;
  children?: ReactNode;
}
