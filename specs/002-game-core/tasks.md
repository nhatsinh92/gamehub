# Tasks: Game Core (shared game context, server adapters, HTTP client)

**Input**: Design documents from `specs/002-game-core/`: [plan.md](plan.md), [spec.md](spec.md) (v0.1.0), [research.md](research.md), [data-model.md](data-model.md), [contracts/public-api.md](contracts/public-api.md), [contracts/server-api.md](contracts/server-api.md), [quickstart.md](quickstart.md)

**Tests**: Required (constitution III). Order for all logic: a **stub** so tests compile (Phase 2), then the story's **tests**, seen failing on an assertion (not an import or type error), then the **implementation**. Every test name starts with its tag, e.g. `test("[002:FR-002] sends the token only in X-Access-Token", …)`.

**Whole-value assertions (CLAUDE.md Rule 2)**: every test compares the **whole** value with `toEqual`: the full `Outcome`, the full recorded fetch call (`{ url, method, headers, body }`), the full context snapshot (`{ config, currentUser, result, isLoading, error }`) or the full list of tracking calls. "The token is absent" is proved by comparing the whole recorded call / message / tracking list to the exact expected value, never by `not.toContain` alone.

**Stub rule**: stubs return well-typed **wrong** values (`{ ok: false, error: { kind: "unknown", message: "stub" } }`, `null`); the two void operations `resetResult` and `sendTracking` throw `new Error("not implemented")` so their "does nothing" tests fail on the stub too.

**Out of scope**: token refresh, retries, caching, request cancellation, the game template, any UI (spec Assumptions).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US5 from spec.md
- Paths are relative to the repo root; commands run from the repo root.
- Rules for every source file: ESM; relative imports end in `.ts`; erasable syntax only (no `enum`, `namespace`, parameter properties); no JSX, use `createElement` (research R4); functions ≤ 60 lines, files ≤ 400 lines (repo lint): split test files by topic when they grow. Token constant in tests: `const TOKEN = "test-token-not-secret"` (constitution V).

---

## Phase 1: Setup

**Purpose**: create the `packages/game-core` workspace package (plan.md › Project Structure).

- [X] T001 Create `packages/game-core/package.json`: `"name": "@repo/game-core"`, `"version": "0.0.0"`, `"type": "module"`, `"private": true`, `"exports": { ".": "./src/index.ts" }`, scripts `"lint": "eslint . --max-warnings 0"`, `"check-types": "tsc --noEmit"`, `"test": "vitest run"`; devDependencies `"@repo/eslint-config": "workspace:*"`, `"@repo/typescript-config": "workspace:*"`, `"eslint": "10.9.1"`, `"typescript": "7.0.2"`, `"vitest": "5.1.0"` (versions already used by `packages/spec-diff`)
- [X] T002 [P] Create `packages/game-core/tsconfig.json`: `"extends": "@repo/typescript-config/base.json"`, compilerOptions `"noEmit": true`, `"allowJs": true`, `"checkJs": true`, `"allowImportingTsExtensions": true`, `"erasableSyntaxOnly": true`, `"types": []`; `"include": ["*.js", "src"]`
- [X] T003 [P] Create `packages/game-core/eslint.config.js` containing only `export { config as default } from "@repo/eslint-config/base";`
- [X] T004 Add dependencies with pnpm, never editing `pnpm-lock.yaml` by hand: `pnpm --filter @repo/game-core add --save-peer react@19.3.1` (then set the peer range to `^19.0.0` in package.json, keeping dev `19.3.1`), and `pnpm --filter @repo/game-core add -D --save-exact react-dom@19.3.1 @types/react@19.3.0 @types/react-dom@19.3.0 happy-dom@21.0.4`. Do **not** add `@testing-library/react` (research R5). Check that `plan.md › New dependencies` lists exactly these packages and versions; if a version had to change, update plan.md and research.md to match
- [X] T005 Run `pnpm install`, then `pnpm --filter @repo/game-core lint` and `pnpm --filter @repo/game-core check-types`; both pass

---

## Phase 2: Foundational (types, stubs, test helpers)

**Purpose**: give every test something to import so tests fail on behavior.

**⚠️ CRITICAL**: no story work begins until this phase is done.

- [X] T006 Create `packages/game-core/src/types.ts` with every type from contracts/public-api.md › Types, exactly as written there (`GameConfig`, `CurrentUser`, `ResultStatus`, `Reward`, `GameResult`, `TrackingEvent`, `ErrorKind`, `GameCoreError`, `Outcome<T>`, `HttpConfig`, `RequestOptions`, `HttpClient`, `AdapterEnv`, `GameAdapter`) plus `GameContextValue` and `GameContextProviderProps`
- [X] T007 [P] Create stub `packages/game-core/src/http-client.ts`: `export function createHttpClient(config: HttpConfig): HttpClient` whose `request` resolves the stub error Outcome without calling fetch
- [X] T008 [P] Create stub `packages/game-core/src/validate.ts`: `parseGameConfig(value: unknown): Outcome<GameConfig>`, `parseCurrentUser(value: unknown): Outcome<CurrentUser>`, `parseGameResult(value: unknown): Outcome<GameResult>`, each returning the stub error Outcome
- [X] T009 [P] Create stub `packages/game-core/src/remote-adapter.ts` (`export const RemoteAdapter: GameAdapter`) and `packages/game-core/src/local-adapter.ts` (`export const LocalAdapter: GameAdapter`, `export const LOCAL_MOCK_DATA` with the exact values from contracts/public-api.md › LOCAL_MOCK_DATA, frozen), each operation resolving the stub error Outcome
- [X] T010 [P] Create stub `packages/game-core/src/game-context.ts`: `GameContextProvider(props)` returns `createElement(GameContext.Provider, { value }, props.children)` where `value` has all state `null`/`false`, the three async operations resolve `null`, and `resetResult`/`sendTracking` throw `new Error("not implemented")`; `useGameContext()` returns `useContext(GameContext)` cast to `GameContextValue` (no missing-provider check yet)
- [X] T011 [P] Create `packages/game-core/src/index.ts` exporting exactly the public API of contracts/public-api.md (types, `createHttpClient`, `RemoteAdapter`, `LocalAdapter`, `LOCAL_MOCK_DATA`, `GameContextProvider`, `useGameContext`) and nothing from `validate.ts` or `test-helpers.ts`
- [X] T012 [P] Create `packages/game-core/src/test-helpers.ts` (tests only, research R5): `fakeFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>)` returning `{ fetchFunc: typeof fetch, calls: { url: string; method: string; headers: Record<string, string>; body: string | null }[] }` (headers copied into a plain object with lower-case keys); `jsonResponse(status: number, body: unknown): Response`; `textResponse(status: number, text: string): Response`; `failingFetch()` whose fetch rejects with `new TypeError("Failed to fetch " + TOKEN)` (so tests prove the underlying message is not copied); `forbiddenFetch()` that records a call and throws if called; `renderGameContext(props)` that mounts `GameContextProvider` with a probe component into a `happy-dom` container via `createRoot` inside `act`, and returns `{ current(): GameContextValue, snapshot(): { config, currentUser, result, isLoading, error }, run<T>(fn: (ctx) => Promise<T>): Promise<T> /* wraps in act */, unmount() }`; it sets `globalThis.IS_REACT_ACT_ENVIRONMENT = true`
- [X] T013 Run `pnpm --filter @repo/game-core lint check-types`; both pass

**Checkpoint**: stubs compile; story work can start.

---

## Phase 3: User Story 1 - Game loads its config and the player's state (Priority: P1) 🎯 MVP

**Goal**: `initGame()` and `getCurrentUser()` load and expose validated data through the remote adapter, with the token only where it belongs.

**Independent test**: quickstart scenarios 1–3.

### Tests for User Story 1 (write first, see them fail)

- [X] T014 [P] [US1] In `packages/game-core/src/http-client.test.ts` (node environment), with `fakeFetch` and `baseUrl: "https://api.example.test/"`: `[002:FR-001]` a GET to `{ gameId: "lucky wheel", endpoint: "me" }` records exactly `{ url: "https://api.example.test/lucky%20wheel/v1/me", method: "GET", headers: { accept: "application/json", "x-access-token": TOKEN }, body: null }` (trailing slash removed, game ID encoded) and resolves `{ ok: true, data: <the data> }` for `jsonResponse(200, { data: { a: 1 } })`; `[002:FR-002]` a POST `reward` with body `{ score: 5 }` records exactly `{ url: ".../v1/reward", method: "POST", headers: { accept, "content-type": "application/json", "x-access-token": TOKEN }, body: "{\"score\":5}" }`, and an async `getAccessTokenFunc` gives the same record; `[002:FR-003]` an `isPublic` GET `init` records headers exactly `{ accept: "application/json" }` and the token function's call count is `0`; `[002:FR-004]` `jsonResponse(401, { data: {} })` on `me` resolves exactly `{ ok: false, error: { kind: "http", status: 401, message: "HTTP 401: GET /lucky%20wheel/v1/me failed" } }`
- [X] T015 [P] [US1] In `packages/game-core/src/validate.test.ts`: `[002:FR-008]` `parseGameConfig({ theme: "red" })` → `{ ok: true, data: { theme: "red" } }`; `parseCurrentUser` of a valid player with an extra field `email` → `{ ok: true, data }` where `data` equals exactly the five fields (extra dropped); `currentRank: null` is accepted (spec Assumption 3)
- [X] T016 [P] [US1] In `packages/game-core/src/remote-adapter.test.ts`: `[002:FR-005]` `RemoteAdapter.getConfig({ gameId: "g1", http })` with a real `createHttpClient` and `fakeFetch` records exactly one call `{ url: "https://api.example.test/g1/v1/init", method: "GET", headers: { accept: "application/json" }, body: null }` and resolves `{ ok: true, data: { theme: "red" } }`; `[002:FR-006]` `getCurrentUser` records one `GET .../g1/v1/me` with the token header and resolves the whole player object; `[002:FR-010]` a server player missing `nickname` resolves exactly `{ ok: false, error: { kind: "validation", message: "Invalid response from GET /g1/v1/me: field \"data.nickname\" expected string, got missing" } }`
- [X] T017 [P] [US1] In `packages/game-core/src/game-context.test.ts` (first line `// @vitest-environment happy-dom`), using `renderGameContext` with `RemoteAdapter` and `fakeFetch`: `[002:FR-012]` `useGameContext()` rendered without a provider throws exactly `useGameContext must be used inside GameContextProvider`; `[002:FR-013]` `[002:FR-014]` one test (so it fails on the stub, whose initial state already matches): the initial snapshot is exactly `{ config: null, currentUser: null, result: null, isLoading: false, error: null }`; then, with a fetch that waits on a deferred promise, the snapshot after calling `initGame()` and before resolving is `{ …nulls, isLoading: true, error: null }`, and after resolving `{ config: { theme: "red" }, currentUser: null, result: null, isLoading: false, error: null }` and `initGame()` resolved to `{ theme: "red" }`; `getCurrentUser()` then gives the full snapshot with the player; HTTP 401 on `me` after a successful load gives `{ config, currentUser: <previous player>, result: null, isLoading: false, error: { kind: "http", status: 401, message: "HTTP 401: GET /g1/v1/me failed" } }` and resolves `null`
- [X] T018 [US1] Run `pnpm --filter @repo/game-core test`; confirm every T014–T017 test fails on an assertion, not on an import/type error. Note the failing count for the PR description

### Implementation for User Story 1

- [X] T019 [US1] Implement `createHttpClient` in `packages/game-core/src/http-client.ts` per contracts/server-api.md: URL = `baseUrl` without trailing `/` + `/` + `encodeURIComponent(gameId)` + `/v1/` + endpoint; headers `Accept`, `Content-Type` for POST, `X-Access-Token` for non-public; body `JSON.stringify(body)`; non-2xx → `http` error `HTTP <status>: <op> failed`; read `response.text()` and `JSON.parse`; return the `data` value. Use `config.fetchFunc ?? globalThis.fetch`. (US3 completes the remaining error paths.) Make T014 pass
- [X] T020 [US1] Implement `parseGameConfig` ("a plain object (`typeof === \"object\"`, not `null`, not an array)", returned as the same object) and `parseCurrentUser` in `packages/game-core/src/validate.ts`: fields in order `nickname` string, `totalTurns` "integer ≥ 0", `remainingTurns` "integer ≥ 0", `bestScore` "finite number", `currentRank` "integer ≥ 1, or `null`"; build a new object with only those five fields; error message `field "data.<field>" expected <expected>, got <actual>` per contracts/public-api.md › Error messages. Make T015 pass
- [X] T021 [US1] Implement `RemoteAdapter.getConfig` (`isPublic: true`, endpoint `init`) and `getCurrentUser` (endpoint `me`) in `packages/game-core/src/remote-adapter.ts`: call `env.http.request`, pass a failed Outcome through unchanged, validate `data`, and prefix validation messages with `Invalid response from <op>: `. Make T016 pass
- [X] T022 [US1] Implement `GameContextProvider` and `useGameContext` in `packages/game-core/src/game-context.ts` per data-model.md › Context state: one `HttpClient` per `httpConfig` (`useMemo`); a pending-request counter for `isLoading`; a shared `runOperation(name, call, store)` helper that increments the counter, awaits the adapter in `try/catch`, stores data and clears `error` on success, sets `error` and keeps data on failure, decrements the counter, and resolves data or `null`; `initGame`, `getCurrentUser`; `useGameContext` throws `Error("useGameContext must be used inside GameContextProvider")` when the context is `undefined`. Keep functions ≤ 60 lines (split into `useRequestState` etc.). Make T017 pass
- [X] T023 [US1] Run `pnpm --filter @repo/game-core lint check-types test`; everything passes

**Checkpoint**: MVP: a game can load config and player state.

---

## Phase 4: User Story 2 - Game submits a round result (Priority: P1)

**Goal**: `submitResult(score)` sends `{ score }` and exposes exactly the server's result for every status; `resetResult()` clears it.

**Independent test**: quickstart scenarios 4–5.

### Tests for User Story 2 (write first, see them fail)

- [X] T024 [P] [US2] In `packages/game-core/src/validate.test.ts`: `[002:FR-008]` `parseGameResult` of a SUCCESS result with reward and an extra field → `{ ok: true, data }` with exactly `status`, `isWin`, `reward: { id, name, code }`, `remainingTurns`, `message`; with `reward: null` and with `reward` absent → the whole object **without** a `reward` key (`toEqual` plus `Object.keys(data)` equal to `["status", "isWin", "remainingTurns", "message"]`)
- [X] T025 [P] [US2] In `packages/game-core/src/remote-adapter.test.ts`: `[002:FR-007]` `RemoteAdapter.submitResult(env, 120)` records exactly `{ url: ".../g1/v1/reward", method: "POST", headers: { accept, "content-type": "application/json", "x-access-token": TOKEN }, body: "{\"score\":120}" }` and resolves the whole SUCCESS result
- [X] T026 [P] [US2] In `packages/game-core/src/game-context.result.test.ts` (happy-dom): `[002:FR-007]` `submitResult(120)` resolves and stores the whole SUCCESS result (snapshot compared whole); `submitResult(NaN)` and `submitResult(Infinity)` resolve `null`, record 0 fetch calls and give `error: { kind: "input", message: "Invalid score: expected a finite number" }`; `[002:FR-015]` for each of `ERROR`, `OUT_OF_TURN`, `MAINTENANCE` (a `test.each`) the snapshot is `{ …, result: <exact server result>, isLoading: false, error: null }`; `[002:FR-016]` after a stored result, `resetResult()` gives a snapshot with `result: null` and every other field unchanged
- [X] T027 [US2] Run the tests; confirm T024–T026 fail on assertions

### Implementation for User Story 2

- [X] T028 [US2] Implement `parseGameResult` in `packages/game-core/src/validate.ts`: `status` "one of SUCCESS, ERROR, OUT_OF_TURN, MAINTENANCE", `isWin` boolean, `reward` "object or null" (absent/`null` → key omitted; present → `id`, `name`, `code` strings, paths `data.reward.<field>`), `remainingTurns` "integer ≥ 0", `message` string; new object with only these fields. Make T024 pass
- [X] T029 [US2] Implement `RemoteAdapter.submitResult` (POST `reward`, body `{ score }`) in `packages/game-core/src/remote-adapter.ts`. Make T025 pass
- [X] T030 [US2] Implement `submitResult` (finite-score check before `runOperation`, no request on failure) and `resetResult` in `packages/game-core/src/game-context.ts`; never change turns, reward or `isWin` (FR-015). Make T026 pass
- [X] T031 [US2] Run `pnpm --filter @repo/game-core lint check-types test`; everything passes

---

## Phase 5: User Story 3 - Malformed or failed responses never reach the game (Priority: P1)

**Goal**: every failure kind becomes the exact error from contracts/public-api.md › Error messages; no throw, no partial data, no token in any message.

**Independent test**: quickstart scenario 6.

### Tests for User Story 3 (write first, see them fail)

- [X] T032 [P] [US3] In `packages/game-core/src/http-client.errors.test.ts`: `[002:FR-004]` each case compares the whole Outcome: `failingFetch()` → `{ ok: false, error: { kind: "network", message: "Network error: GET /g1/v1/me failed" } }` (proves the rejected error's text, which contains TOKEN, is not copied); `jsonResponse(500, …)` → `http` with `status: 500`; `textResponse(200, "<html>")` → `{ kind: "parse", message: "Invalid JSON: GET /g1/v1/me" }`; `jsonResponse(200, { result: 1 })`, `jsonResponse(200, { data: null })` and `jsonResponse(200, [1])` → `{ kind: "validation", message: "Invalid response from GET /g1/v1/me: field \"data\" expected object, got missing" }` / `got null` / `got array`; `[002:FR-002]` a token function that throws, one that rejects, one returning `""` and one returning `42` each give `{ ok: false, error: { kind: "token", message: "Access token unavailable: GET /g1/v1/me not sent" } }` and `calls` equal to `[]`
- [X] T033 [P] [US3] In `packages/game-core/src/validate.errors.test.ts`: `[002:FR-008]` a `test.each` table, each row comparing the whole Outcome, covering at least: every `CurrentUser` field missing; `nickname: 5` (`got number`); `totalTurns: -1`, `totalTurns: 1.5`, `remainingTurns: "3"` (`got string`); `bestScore: Infinity`; `currentRank: 0`, `currentRank: "1"`; every `GameResult` field missing (except `reward`); `status: "WIN"` (`expected one of SUCCESS, ERROR, OUT_OF_TURN, MAINTENANCE, got string`); `isWin: "true"`; `reward: "x"` (`expected object or null, got string`); `reward: { id: "r", name: "n" }` (`field "data.reward.code" expected string, got missing`); `remainingTurns: null` (`got null`); config `null`, `[]`, `"x"`; and two wrong fields at once giving only the first in table order (data-model.md › Validation rules 1)
- [X] T034 [P] [US3] In `packages/game-core/src/game-context.errors.test.ts` (happy-dom): `[002:FR-014]` after a successful `initGame` and `getCurrentUser`, a `getCurrentUser` answered with `remainingTurns` missing gives the whole snapshot with the **previous** player and the validation error, and resolves `null`; a following successful `getCurrentUser` clears `error` to `null`; an adapter whose `getConfig` throws gives `error: { kind: "unknown", message: "Adapter failed: initGame" }` and no uncaught exception; two operations started together (deferred fetches) keep `isLoading: true` until both have settled (snapshots after the first and after the second resolve compared whole); `[002:FR-004]` `failingFetch` on each of the three operations gives the matching `network` error and `isLoading: false`
- [X] T035 [US3] Run the tests; confirm T032–T034 fail on assertions

### Implementation for User Story 3

- [X] T036 [US3] Complete `packages/game-core/src/http-client.ts`: `try/catch` around `fetch` (→ `network`, fixed message only); token step (`await` in `try`, reject non-string/empty → `token`, before any fetch); `JSON.parse` in `try` (→ `parse`); envelope check: plain object with `data` not `null`/`undefined`, `<actual>` per contract. Never include the body, the exception text or the base URL in a message. Make T032 pass
- [X] T037 [US3] Complete the field checks and `<actual>` naming (`missing`, `null`, `array`, `typeof`) in `packages/game-core/src/validate.ts`. Make T033 pass
- [X] T038 [US3] Complete `runOperation` in `packages/game-core/src/game-context.ts` (`unknown` error on throw, counter-based `isLoading`). Make T034 pass
- [X] T039 [US3] Run `pnpm --filter @repo/game-core lint check-types test`; everything passes

---

## Phase 6: User Story 4 - Standalone mock data (Priority: P2)

**Goal**: `LocalAdapter` serves `LOCAL_MOCK_DATA` with no network and no token.

**Independent test**: quickstart scenario 7.

### Tests for User Story 4 (write first, see them fail)

- [X] T040 [P] [US4] In `packages/game-core/src/local-adapter.test.ts`: `[002:FR-011]` with `http = createHttpClient({ baseUrl, getAccessTokenFunc: spy, fetchFunc: forbiddenFetch() })`, `getConfig`, `getCurrentUser` and `submitResult(env, 1)` / `submitResult(env, 999)` resolve exactly `{ ok: true, data: LOCAL_MOCK_DATA.<field> }` (and equal the literal values from contracts/public-api.md, written out in the test), the forbidden fetch's calls are `[]`, the token spy's call count is `0`; each mock value passes `parseGameConfig` / `parseCurrentUser` / `parseGameResult` with `{ ok: true, data: <same value> }`; mutating a returned object does not change `LOCAL_MOCK_DATA`
- [X] T041 [P] [US4] In `packages/game-core/src/game-context.local.test.ts` (happy-dom): `[002:FR-009]` the same sequence `initGame` → `getCurrentUser` → `submitResult(50)` run once with `LocalAdapter` and once with `RemoteAdapter` + a `fakeFetch` serving `LOCAL_MOCK_DATA` gives, in **both** runs, a final snapshot equal to the explicit expected value `{ config: { mode: "local" }, currentUser: <LOCAL_MOCK_DATA.currentUser written out>, result: <LOCAL_MOCK_DATA.result written out>, isLoading: false, error: null }`, with game code (the test's probe) unchanged between the two. Do not only compare the two runs with each other: on the stub both are equal (null data + stub error), so that check would pass on the stub
- [X] T042 [US4] Run the tests; confirm T040–T041 fail on assertions

### Implementation for User Story 4

- [X] T043 [US4] Implement `LocalAdapter` in `packages/game-core/src/local-adapter.ts`: each operation resolves `{ ok: true, data: structuredClone(LOCAL_MOCK_DATA.<field>) }`, ignores `env` and the score. Make T040–T041 pass
- [X] T044 [US4] Run `pnpm --filter @repo/game-core lint check-types test`; everything passes

---

## Phase 7: User Story 5 - Tracking events (Priority: P3)

**Goal**: `sendTracking(event)` forwards to the host function or does nothing; failures never reach the game.

**Independent test**: quickstart scenario 8.

### Tests for User Story 5 (write first, see them fail)

- [X] T045 [P] [US5] In `packages/game-core/src/game-context.tracking.test.ts` (happy-dom): `[002:FR-017]` with a recording `sendTrackingFunc`, `sendTracking({ name: "round_end", params: { score: 3 } })` returns `undefined` and the recorded calls equal exactly `[[{ name: "round_end", params: { score: 3 } }]]` (same object identity, `toBe`), and the stringified calls do not include TOKEN (compare the whole recorded list); without `sendTrackingFunc`, `sendTracking(event)` returns `undefined` and the snapshot afterwards equals the snapshot before; a host function that throws and one that returns a rejected promise each leave `sendTracking` returning `undefined`, the snapshot unchanged (including `error`) and no unhandled rejection (Vitest fails the run on one)
- [X] T046 [US5] Run the tests; confirm T045 fails on assertions (the stub throws)

### Implementation for User Story 5

- [X] T047 [US5] Implement `sendTracking` in `packages/game-core/src/game-context.ts`: if `sendTrackingFunc` is set, call it with the event unchanged inside `try/catch`; if it returns a promise-like, attach `.catch(() => {})`; never touch state. Make T045 pass
- [X] T048 [US5] Run `pnpm --filter @repo/game-core lint check-types test`; everything passes

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T049 Check FR coverage: `grep -rhoE "\[002:FR-[0-9]{3}\]" packages/game-core/src | sort -u` lists FR-001..FR-017 with none missing; add a tagged test for any gap (seen failing first by temporarily breaking the code it covers)
- [X] T050 [P] Review `packages/game-core/src/index.ts`: it exports exactly the names in contracts/public-api.md (runtime: `GameContextProvider`, `LOCAL_MOCK_DATA`, `LocalAdapter`, `RemoteAdapter`, `createHttpClient`, `useGameContext`, plus the types) and nothing from `validate.ts` or `test-helpers.ts`. A review step, not a new test: a test of the export list would already pass on the Phase 2 stubs (CLAUDE.md Rule 2)
- [X] T051 [P] Confirm no source or test file logs anything (`console.` appears nowhere in `packages/game-core/src`) and no fixture holds a real-looking token or personal data (constitution V)
- [X] T052 Run `pnpm turbo run lint check-types test --continue` at the repo root; everything passes. Walk through quickstart.md scenarios 1–9 and confirm each maps to a passing test

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. Phase 2 blocks all stories.
- US1 (Phase 3) first: it builds the HTTP client, validators, remote adapter and provider core that US2 and US3 extend.
- US2 and US3 both depend on US1 and touch the same files (`validate.ts`, `game-context.ts`), so run them one after the other: US2 then US3.
- US4 depends only on Phase 2 for `local-adapter.test.ts`, but its context test (T041) needs US1–US2's provider; run after US2.
- US5 depends on US1's provider (T022).
- Polish last.

## Parallel Opportunities

- Phase 1: T002, T003 together.
- Phase 2: T007–T012 together after T006.
- Within each story, all test tasks marked [P] are in different files and can be written together (e.g. US1: T014, T015, T016, T017).
- US4's T040 (pure adapter test) can be written any time after Phase 2.

## Implementation Strategy

1. **MVP**: Phases 1–3 (US1): a game loads config and player state through the remote adapter. Stop and validate with quickstart 1–3.
2. Add US2 (results) and US3 (failure safety); together with US1 these are the P1 set the template issue needs.
3. Add US4 (local mock) and US5 (tracking).
4. Commit sequence per story: `test(red): …` with the story's failing tests, then `feat(green): …`.
