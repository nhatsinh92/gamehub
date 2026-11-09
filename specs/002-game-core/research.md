# Research: Game Core

**Feature**: [spec.md](spec.md) (v0.1.0) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-09

Each topic lists the options and a decision. Constitution IV: every new dependency is weighed against a no-dependency option.

## R1. React version and how game-core depends on it

**Options**

| Option | Pros | Cons |
|---|---|---|
| A. `react` as `peerDependencies` (`^19.0.0`) + exact dev dependency `19.3.1` | Games and game-core share one React instance (two copies break hooks/context); tests pin an exact version | Each game must install React itself (it does anyway) |
| B. `react` as a plain dependency | Simpler install | Risk of two React copies in a game; context from one copy is invisible to the other |

**Decision: A.** Added with `pnpm add --save-peer react@19.3.1` (writes peer and dev entries). `react-dom` is used only by tests, so it is dev only.

## R2. Validating server responses

**Options**

| Option | Dependency | Pros | Cons |
|---|---|---|---|
| A. Hand-written type guards (`parseCurrentUser(value, where)` etc.) | None | 3 small shapes, ~100 lines; full control over the error message (field path + expected type, FR-008); drops unknown fields by building a new object | Must be kept in sync with the types by hand (tests cover each field) |
| B. Schema library (`zod`, `valibot`) | New runtime dependency | Declarative | Not on the issue's allowed list; message format would follow the library, not FR-008 |

**Decision: A.** Rules are in [data-model.md](data-model.md#validation-rules); messages in [contracts/public-api.md](contracts/public-api.md#error-messages).

## R3. HTTP

**Decision: built-in `fetch`** (required by the issue). The HTTP config takes an optional `fetchFunc` (default `globalThis.fetch`) so tests inject a fake without touching globals. No `axios`/`ky`: not allowed, and retries/interceptors are out of scope.

- URL: `baseUrl` with trailing `/` removed + `/` + `encodeURIComponent(gameId)` + `/v1/` + endpoint (`init`, `me`, `reward`).
- Body is read with `response.text()` then `JSON.parse` in a `try`, so a non-JSON body is a `parse` error, not a throw.
- Error messages never include the response body or the underlying exception message (either could echo the token); they name only method, path and status.

## R4. JSX or `createElement`

The shared ESLint config (`packages/eslint-config/base.js`, which this feature must not change) parses `.ts`/`.tsx` with `@babel/eslint-parser` + `@babel/preset-typescript` and has no React rules.

**Options**: A. `.tsx` with JSX (needs `jsx` compiler option and relies on Babel enabling JSX for `.tsx`); B. `.ts` with `createElement(GameContext.Provider, { value }, children)` in the one place a component is rendered.

**Decision: B.** One `createElement` call; no new compiler or lint settings. Tests also use `createElement`.

## R5. Testing React state without a server

**Options**

| Option | Dependencies | Pros | Cons |
|---|---|---|---|
| A. `react-dom/client` `createRoot` + `act` from `react`, in `happy-dom` | `react-dom`, `happy-dom` (+ types) | All on the allowed list; a ~20-line helper renders the provider with a probe component that copies the context value out | Hand-written helper |
| B. `@testing-library/react` `renderHook` | A + `@testing-library/react` + its required peer `@testing-library/dom` | Familiar API | `@testing-library/dom` is not on the issue's allowed list; adds two packages for one helper |
| C. `jsdom` instead of `happy-dom` | `jsdom` | Most complete DOM | Larger and slower; we only need `document` for `createRoot` |

**Decision: A with `happy-dom`.** Context test files start with `// @vitest-environment happy-dom` (no Vitest config file needed) and set `globalThis.IS_REACT_ACT_ENVIRONMENT = true`. Pure modules (HTTP client, validators, adapters) run in the default `node` environment.

Fake `fetch`: `fakeFetch(handler)` records each call (`url`, `method`, `headers`, `body`) and returns what the handler gives; `jsonResponse(status, body)` builds a `Response`. No network, no mock-server library (issue Notes).

## R6. Error model

**Options**: A. operations return `Outcome<T> = { ok: true, data } | { ok: false, error }` and never throw; B. throw typed errors and catch in the provider.

**Decision: A** for the HTTP client and both adapters (FR-004 "errors, not crashes" holds at every layer and is directly testable). The provider still wraps each adapter call in `try/catch` so a custom adapter that throws becomes an `unknown` error instead of a crash. Error kinds: `network`, `http`, `parse`, `validation`, `token`, `input`, `unknown` ([contracts/public-api.md](contracts/public-api.md#gamecoreerror)).

## Dependency record (issue #18 Notes, constitution IV)

All are on the issue's allowed list; each is pinned to an exact version and must be approved with the `deps-approved` label. Same list as [plan.md](plan.md#new-dependencies).

| Package | Version | Kind | Why | Tried instead |
|---|---|---|---|---|
| `react` | 19.3.1 | peer (`^19.0.0`) + dev | Provider and hook are React 19 (R1) | none possible: the feature is a React API |
| `react-dom` | 19.3.1 | dev | `createRoot` to mount the provider in tests (R5) | `react-test-renderer` (deprecated in React 19) |
| `@types/react` | 19.3.0 | dev | React ships no types; `check-types` needs them | none |
| `@types/react-dom` | 19.3.0 | dev | types for `react-dom/client` in tests | none |
| `happy-dom` | 21.0.4 | dev | DOM environment for Vitest (R5) | Vitest `node` env (no DOM); `jsdom` (heavier) |

Not added: `@testing-library/react` (needs the extra peer `@testing-library/dom`, not allowed; R5 option A covers the need).
