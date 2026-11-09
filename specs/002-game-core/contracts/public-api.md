# Contract: `@repo/game-core` public API

**Feature**: [../spec.md](../spec.md) (v0.1.0)

Everything below is exported from `packages/game-core/src/index.ts`; nothing else is public. Types are in [../data-model.md](../data-model.md).

## Types

```ts
type GameConfig = Record<string, unknown>;
interface CurrentUser { nickname: string; totalTurns: number; remainingTurns: number; bestScore: number; currentRank: number | null }
type ResultStatus = "SUCCESS" | "ERROR" | "OUT_OF_TURN" | "MAINTENANCE";
interface Reward { id: string; name: string; code: string }
interface GameResult { status: ResultStatus; isWin: boolean; reward?: Reward; remainingTurns: number; message: string }
interface TrackingEvent { name: string; params?: Record<string, unknown> }
type ErrorKind = "network" | "http" | "parse" | "validation" | "token" | "input" | "unknown";
interface GameCoreError { kind: ErrorKind; message: string; status?: number }
type Outcome<T> = { ok: true; data: T } | { ok: false; error: GameCoreError };

interface HttpConfig {
  baseUrl: string;
  getAccessTokenFunc: () => string | Promise<string>;
  fetchFunc?: typeof fetch; // default: globalThis.fetch
}

interface RequestOptions { method: "GET" | "POST"; gameId: string; endpoint: "init" | "me" | "reward"; body?: unknown; isPublic?: boolean }
interface HttpClient { request(options: RequestOptions): Promise<Outcome<unknown>> } // resolves to the unwrapped `data`

interface AdapterEnv { gameId: string; http: HttpClient }
interface GameAdapter {
  getConfig(env: AdapterEnv): Promise<Outcome<GameConfig>>;
  getCurrentUser(env: AdapterEnv): Promise<Outcome<CurrentUser>>;
  submitResult(env: AdapterEnv, score: number): Promise<Outcome<GameResult>>;
}
```

## Functions and values

| Export | Signature | FR |
|---|---|---|
| `createHttpClient` | `(config: HttpConfig) => HttpClient` | FR-001..FR-004 |
| `RemoteAdapter` | `GameAdapter` | FR-005..FR-008, FR-010 |
| `LocalAdapter` | `GameAdapter` | FR-011 |
| `LOCAL_MOCK_DATA` | `{ config: GameConfig; currentUser: CurrentUser; result: GameResult }` (frozen) | FR-011 |
| `GameContextProvider` | component, props below | FR-012..FR-017 |
| `useGameContext` | `() => GameContextValue`; throws `Error("useGameContext must be used inside GameContextProvider")` outside the provider | FR-012 |

### `LOCAL_MOCK_DATA` (exact values)

```ts
{
  config: { mode: "local" },
  currentUser: { nickname: "Local Player", totalTurns: 10, remainingTurns: 10, bestScore: 0, currentRank: null },
  result: {
    status: "SUCCESS", isWin: true,
    reward: { id: "local-reward", name: "Demo reward", code: "DEMO-CODE" },
    remainingTurns: 9, message: "Local mode: result not saved",
  },
}
```

`LocalAdapter` resolves `{ ok: true, data: <copy of the value above> }` for each operation (the same for every score), never calls `env.http`, and never asks for the token.

### `GameContextProvider` props

```ts
interface GameContextProviderProps {
  gameId: string;
  adapter: GameAdapter;
  httpConfig: HttpConfig;
  sendTrackingFunc?: (event: TrackingEvent) => void | Promise<void>;
  children?: React.ReactNode;
}
```

The provider creates one `HttpClient` from `httpConfig` and passes `{ gameId, http }` to the adapter.

### `GameContextValue`

```ts
interface GameContextValue {
  config: GameConfig | null;
  currentUser: CurrentUser | null;
  result: GameResult | null;
  isLoading: boolean;
  error: GameCoreError | null;
  initGame(): Promise<GameConfig | null>;          // never rejects; null on failure
  getCurrentUser(): Promise<CurrentUser | null>;   // never rejects; null on failure
  submitResult(score: number): Promise<GameResult | null>; // never rejects; null on failure
  resetResult(): void;
  sendTracking(event: TrackingEvent): void;        // never throws; sync throws and async rejections of the host function are swallowed
}
```

State transitions: [../data-model.md](../data-model.md#context-state-fr-013-fr-014).

## Error messages

`<op>` is `<METHOD> /<encoded gameId>/v1/<endpoint>`, e.g. `GET /lucky-wheel/v1/me`. Messages never contain the token, the base URL, the response body or an underlying exception message.

| Kind | When | `message` | `status` |
|---|---|---|---|
| `token` | token function throws/rejects, or returns a non-string or empty string; request not sent | `Access token unavailable: <op> not sent` | — |
| `network` | `fetch` rejects | `Network error: <op> failed` | — |
| `http` | status outside 200–299 | `HTTP <status>: <op> failed` | the status |
| `parse` | body is not valid JSON | `Invalid JSON: <op>` | — |
| `validation` | envelope or field check fails | `Invalid response from <op>: field "<path>" expected <expected>, got <actual>` | — |
| `input` | `submitResult` score not finite; no request | `Invalid score: expected a finite number` | — |
| `unknown` | an adapter throws instead of returning an Outcome | `Adapter failed: <operation name>` (`initGame`, `getCurrentUser`, `submitResult`) | — |

`<path>`: `data`, `data.<field>`, or `data.reward.<field>`.

`<expected>` per field: `object` (`data`, config), `string`, `boolean`, `integer >= 0`, `finite number`, `integer >= 1 or null` (`currentRank`), `one of SUCCESS, ERROR, OUT_OF_TURN, MAINTENANCE` (`status`), `object or null` (`reward`).

`<actual>`: `missing` (absent or `undefined`), `null`, `array`, or the `typeof` of the value (`string`, `number`, `boolean`, `object`); for `status`, a string outside the four values gives `string`.

Validator functions (internal) return `{ ok: false, error }` with `field "<path>" expected <expected>, got <actual>`; the remote adapter prefixes `Invalid response from <op>: `.
