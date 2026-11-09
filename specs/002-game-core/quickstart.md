# Quickstart: Game Core validation

**Feature**: [spec.md](spec.md) (v0.1.0) | **Contracts**: [contracts/public-api.md](contracts/public-api.md), [contracts/server-api.md](contracts/server-api.md)

## Prerequisites

- Node 24, pnpm (repo `packageManager`), `pnpm install` at the repo root.

## Run

```bash
pnpm turbo run lint check-types test --filter=@repo/game-core
```

Expected: all three tasks pass; every test name carries a `[002:FR-###]` tag, and every FR-001..FR-017 appears at least once:

```bash
grep -rhoE "\[002:FR-[0-9]{3}\]" packages/game-core/src | sort -u
```

## Scenarios (all with a fake `fetch`, no network)

| # | Scenario | Expected | Spec |
|---|---|---|---|
| 1 | `initGame()` with server `200 {"data":{"theme":"red"}}` | `config` = `{ theme: "red" }`; request `GET {base}/{gameId}/v1/init` without `X-Access-Token`; token function not called | US1, FR-003, FR-005 |
| 2 | `getCurrentUser()` with a valid player | `currentUser` equals the server data; header `X-Access-Token` = token; URL has no token | US1, FR-002, FR-006 |
| 3 | `getCurrentUser()` with HTTP 401 | `error` = `{ kind: "http", status: 401, message: "HTTP 401: GET /<id>/v1/me failed" }`; `currentUser` unchanged | US1, FR-004 |
| 4 | `submitResult(120)` with SUCCESS + reward | body `{"score":120}`; `result` equals server data | US2, FR-007 |
| 5 | `submitResult` with MAINTENANCE / OUT_OF_TURN / ERROR | `result` holds that status; `error` null | US2, FR-015 |
| 6 | `remainingTurns` missing; `isWin` a string; unknown `status`; non-JSON body; HTTP 500; `fetch` rejects | the matching error from the contract table; no partial data stored | US3, FR-004, FR-008 |
| 7 | `LocalAdapter` with a `fetchFunc` that fails the test if called | each operation yields `LOCAL_MOCK_DATA`; 0 fetch calls; token function not called | US4, FR-011 |
| 8 | `sendTracking` with / without / throwing host function | called once with the same event / no-op / no throw and `error` unchanged | US5, FR-017 |
| 9 | `useGameContext()` outside the provider | throws `useGameContext must be used inside GameContextProvider` | FR-012 |

## Minimal usage (for the template issue)

```ts
createElement(GameContextProvider, {
  gameId: "lucky-wheel",
  adapter: import.meta.env.DEV ? LocalAdapter : RemoteAdapter,
  httpConfig: { baseUrl, getAccessTokenFunc: host.getAccessToken },
  sendTrackingFunc: host.track,
}, createElement(Game));
```
