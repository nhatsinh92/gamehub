# Contract: Server API used by RemoteAdapter

**Feature**: [../spec.md](../spec.md) (v0.1.0)

`{base}` is `HttpConfig.baseUrl` with trailing `/` removed; `{gameId}` is `encodeURIComponent(gameId)`.

| Operation | Method + URL | Token | Request body | `data` shape |
|---|---|---|---|---|
| get config (FR-005) | `GET {base}/{gameId}/v1/init` | none (public; token function not called) | none | `GameConfig` |
| get current user (FR-006) | `GET {base}/{gameId}/v1/me` | `X-Access-Token: <token>` | none | `CurrentUser` |
| submit result (FR-007) | `POST {base}/{gameId}/v1/reward` | `X-Access-Token: <token>` | `{"score":<number>}` (exactly, `JSON.stringify({ score })`) | `GameResult` |

## Request headers

- All requests: `Accept: application/json`.
- POST: `Content-Type: application/json`.
- Protected requests: `X-Access-Token` set to the value returned by `getAccessTokenFunc()` (sync or async). No other header, query parameter or body field carries the token (FR-002).

## Response handling (in this order, FR-004)

1. `fetch` rejects → `network` error.
2. Status not 2xx (incl. 401, 5xx) → `http` error with `status`; body not read.
3. Body text is not valid JSON → `parse` error.
4. Parsed value is not a plain object with a `data` key whose value is not `null`/`undefined` → `validation` error, field `data`.
5. `data` validated per [../data-model.md](../data-model.md#validation-rules) → `validation` error or the clean object.

## Example responses

```json
{ "data": { "nickname": "Player One", "totalTurns": 5, "remainingTurns": 3, "bestScore": 120, "currentRank": 7 } }
```

```json
{ "data": { "status": "SUCCESS", "isWin": true, "reward": { "id": "r1", "name": "Voucher", "code": "ABC123" }, "remainingTurns": 2, "message": "You won!" } }
```

```json
{ "data": { "status": "MAINTENANCE", "isWin": false, "remainingTurns": 3, "message": "Game is under maintenance" } }
```
