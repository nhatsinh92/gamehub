# Data Model: Game Core

**Feature**: [spec.md](spec.md) (v0.1.0) | **Plan**: [plan.md](plan.md)

## Entities

### GameConfig (FR-005)

`Record<string, unknown>`: any JSON object (not `null`, not an array). Contents belong to the game and are passed through as-is (spec Assumption 1).

### CurrentUser (FR-006)

| Field | Type | Rule |
|---|---|---|
| `nickname` | string | any string |
| `totalTurns` | number | integer ≥ 0 |
| `remainingTurns` | number | integer ≥ 0 |
| `bestScore` | number | finite number |
| `currentRank` | number \| null | integer ≥ 1, or `null` (spec Assumption 3) |

### GameResult (FR-007)

| Field | Type | Rule |
|---|---|---|
| `status` | `"SUCCESS" \| "ERROR" \| "OUT_OF_TURN" \| "MAINTENANCE"` | exactly one of the four |
| `isWin` | boolean | |
| `reward` | Reward | optional: absent or `null` from the server → property omitted in the result |
| `remainingTurns` | number | integer ≥ 0 |
| `message` | string | any string, may be empty |

### Reward

| Field | Type |
|---|---|
| `id` | string |
| `name` | string |
| `code` | string |

### TrackingEvent (FR-017)

`{ name: string; params?: Record<string, unknown> }`. Passed to the host unchanged (same object); game-core adds nothing.

### GameCoreError

`{ kind: "network" | "http" | "parse" | "validation" | "token" | "input" | "unknown"; message: string; status?: number }`. `status` is set only for `kind: "http"`. Exact messages: [contracts/public-api.md](contracts/public-api.md#error-messages).

### Outcome\<T\>

`{ ok: true; data: T } | { ok: false; error: GameCoreError }`: what the HTTP client and adapters return; they never throw.

## Validation rules

Applied by `parseGameConfig`, `parseCurrentUser`, `parseGameResult` to the value inside the `data` envelope (FR-008):

1. Check fields in the table order above; the first failing field produces the error (one message per response).
2. A field is **missing** when the key is absent or the value is `undefined`. `null` counts as present-but-wrong-type, except for `currentRank` and `reward` where it is allowed.
3. The field path in messages is `data.<field>` (nested: `data.reward.code`).
4. The result is a **new** object containing only the fields listed above; unknown fields are dropped, so a partial or extended object never reaches the game.
5. `GameConfig` is checked only for being a plain object (`typeof === "object"`, not `null`, not an array) and is returned as the same object.

## Context state (FR-013, FR-014)

State held by `GameContextProvider`:

| Field | Initial | Set by |
|---|---|---|
| `config` | `null` | `initGame` success |
| `currentUser` | `null` | `getCurrentUser` success |
| `result` | `null` | `submitResult` success; `resetResult` → `null` |
| `isLoading` | `false` | `true` while ≥ 1 of `initGame`/`getCurrentUser`/`submitResult` is in flight (counter) |
| `error` | `null` | operation failure → the error; operation success → `null` |

Transitions for each of `initGame`, `getCurrentUser`, `submitResult(score)`:

```text
call ──► (submitResult only) score not finite? ──yes──► error = input error, no request, resolve null
  │
  ▼
pending += 1 (isLoading = true)
  │
  ▼
adapter call ──► ok      ──► store data, error = null, resolve data
             ──► not ok  ──► error = outcome.error, data unchanged, resolve null
             ──► throws  ──► error = { kind: "unknown", ... }, data unchanged, resolve null
  │
  ▼
pending -= 1 (isLoading = pending > 0)
```

`resetResult()` sets `result = null` only. `sendTracking(event)` changes no state.
