# Implementation Plan: Game Core (shared game context, server adapters, HTTP client)

**Branch**: `002-game-core` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md) (v0.1.0, Draft)

**Input**: Feature specification from `specs/002-game-core/spec.md`

## Summary

A new workspace package `packages/game-core` that every game uses instead of calling the server. Four layers, each testable on its own:

1. **HTTP client** (`createHttpClient`) on the built-in `fetch`: builds URLs, adds `X-Access-Token` to protected requests only, unwraps `{ "data": ... }`, and turns every failure into a value (`{ ok: false, error }`), never a throw.
2. **Validators**: hand-written type guards that turn `unknown` into `GameConfig`, `CurrentUser` or `GameResult`, or into an error naming the field.
3. **Adapters** behind one `GameAdapter` contract: `RemoteAdapter` (HTTP client + validators) and `LocalAdapter` (fixed mock data, no network).
4. **`GameContextProvider` + `useGameContext()`** (React 19): holds `config`, `currentUser`, `result`, `isLoading`, `error` and the operations.

No build step: like `packages/spec-diff`, the package is consumed from TypeScript source. Research: [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript (repo's `typescript` 7.0.2), ESM, erasable syntax only; runs in browsers (games) and Node 24 (tests)

**Primary Dependencies**: `react` 19.3.1 (peer + dev). Dev only: `react-dom` 19.3.1, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `happy-dom` 21.0.4; plus the repo's existing `@repo/typescript-config`, `@repo/eslint-config`, `eslint`, `typescript`, `vitest` (research R1, R5)

**Storage**: N/A (state lives in React state; no caching, out of scope)

**Testing**: Vitest 5.1.0, colocated `*.test.ts`, test names tagged `[002:FR-###]`. Fake `fetch` injected through the HTTP config; context tests run in `happy-dom` with `react-dom/client` + `act` (research R5)

**Target Platform**: evergreen browsers inside the host web/app game center; Node 24 for tests

**Project Type**: library (one workspace package)

**Performance Goals**: none beyond one request per operation; no retries or caching (out of scope)

**Constraints**: repo lint limits `max-lines-per-function` 60 and `max-lines` 400; the shared ESLint config (which this feature may not change) parses with Babel's TypeScript preset, so source uses `createElement` instead of JSX (research R4); the token never appears in a URL, error message, log or tracking data (FR-002, constitution V)

**Scale/Scope**: 3 endpoints, 2 adapters, 1 provider; used by every game in the repo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Spec-First | Spec v0.1.0 (Draft) written from issue #18; every behavior below traces to an FR. The owner approves spec and plan together in the PR | Pass (approval in PR) |
| II. Humans Decide | Spec, plan and tasks are drafts; the 3 assumptions in the spec are for the owner to confirm or change in review | Pass |
| III. Verified Against the Spec | Every FR-001..FR-017 gets at least one test tagged `[002:FR-###]`; tasks put each test before its code and require seeing it fail | Pass (enforced in tasks) |
| IV. Simplicity | New dependencies are only those the issue allows and each is recorded below and in research R5; `@testing-library/react` is **not** added (it needs `@testing-library/dom`, which the issue does not allow, and `act` + `createRoot` do the job). No schema library (R2), no HTTP library (R3). The adapter interface is required by the issue (two real implementations) | Pass, **pending owner approval** (`deps-approved` label) |
| V. No Secrets or Personal Data | Tests use a made-up token constant (`test-token-not-secret`) and assert it is absent from URLs, error messages and tracking calls; fixtures use made-up nicknames | Pass |

**Post-design re-check (after Phase 1)**: unchanged. The design adds the four layers above and nothing else: one interface (`GameAdapter`, demanded by the issue) and no service.

## New dependencies

- react@19.3.1: the context provider and hook are React (issue #18 requires React 19); peer dependency so games and game-core share one React; also a dev dependency for tests. No alternative: the feature is a React API.
- react-dom@19.3.1 (dev): `createRoot` to mount the provider in tests. Tried instead: `react-test-renderer` (deprecated in React 19).
- @types/react@19.3.0 (dev): React ships no TypeScript types; needed for `check-types`.
- @types/react-dom@19.3.0 (dev): types for `react-dom/client` used in tests.
- happy-dom@21.0.4 (dev): DOM for Vitest so `createRoot` can mount. Tried instead: Vitest's `node` environment (no `document`); `jsdom` (larger and slower, same result).

Rejected: `@testing-library/react` (allowed by the issue, but needs the extra peer `@testing-library/dom`; a 20-line `renderGameContext` test helper with `act` covers our hook tests), `zod`/other schema libraries (R2), `axios`/`ky` (R3).

## Project Structure

### Documentation (this feature)

```text
specs/002-game-core/
├── spec.md              # v0.1.0 Draft
├── plan.md              # This file
├── research.md          # R1–R6 decisions
├── data-model.md        # Entities, validation rules, context state transitions
├── quickstart.md        # Validation scenarios
├── contracts/
│   ├── public-api.md    # Exported types, functions, components, error kinds and messages
│   └── server-api.md    # Endpoints, headers, envelope, response shapes
├── checklists/requirements.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/game-core/
├── package.json         # @repo/game-core, "type": "module", private, exports "." → ./src/index.ts;
│                        # scripts: lint, check-types (tsc --noEmit), test (vitest run)
├── tsconfig.json        # extends @repo/typescript-config/base.json; noEmit, allowJs, checkJs,
│                        # allowImportingTsExtensions, erasableSyntaxOnly (as packages/spec-diff)
├── eslint.config.js     # re-exports @repo/eslint-config/base
└── src/
    ├── index.ts                 # public exports only (contracts/public-api.md)
    ├── types.ts                 # GameConfig, CurrentUser, GameResult, Reward, GameCoreError, Outcome, HttpConfig, GameAdapter, TrackingEvent
    ├── http-client.ts           # createHttpClient(config): URL building, token header, envelope, error mapping
    ├── http-client.test.ts      # FR-001..FR-004
    ├── validate.ts              # parseGameConfig, parseCurrentUser, parseGameResult
    ├── validate.test.ts         # FR-008 (field-by-field)
    ├── remote-adapter.ts        # RemoteAdapter
    ├── remote-adapter.test.ts   # FR-005..FR-008, FR-010
    ├── local-adapter.ts         # LocalAdapter + LOCAL_MOCK_DATA
    ├── local-adapter.test.ts    # FR-009, FR-011
    ├── game-context.ts          # GameContextProvider, useGameContext (createElement, no JSX)
    ├── game-context.test.ts     # FR-012..FR-017 (happy-dom)
    └── test-helpers.ts          # fakeFetch(), jsonResponse(), renderGameContext() — tests only
```

Test files are split by topic to stay under the 400-line lint limit: besides those above, `http-client.errors.test.ts`, `validate.errors.test.ts` and `game-context.{result,errors,local,tracking}.test.ts` (see tasks.md).

**Structure Decision**: one new workspace package, `packages/game-core` (named by the issue). `pnpm-workspace.yaml` already includes `packages/*`, and the CI `verify` job runs `lint check-types test` for every package, so no CI change is needed.

## Risks

- **Lockfile change.** New devDependencies change `pnpm-lock.yaml`; the PR needs the `deps-approved` label.
- **No JSX.** The shared ESLint config is not React-aware and may not be changed here; using `createElement` in one small file avoids depending on its JSX parsing. Games (next issue) may need a React-aware lint config; that belongs to the template issue.
- **`max-lines-per-function` 60.** The provider is split into small hooks/helpers (`useRequestState`, `runOperation`) to stay under the limit.

## Complexity Tracking

No constitution violations to justify.
