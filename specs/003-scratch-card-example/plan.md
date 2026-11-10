# Implementation Plan: Scratch Card Example (the game template every new game is copied from)

**Branch**: `003-scratch-card-example` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md) (v0.1.0, Draft)

**Input**: Feature specification from `specs/003-scratch-card-example/spec.md`

## Summary

A new workspace app `apps/scratch-card-example` (Vite 8, React 19, TypeScript) that is both the example scratch-card game and the template every new game is copied from. All server calls go through `@repo/game-core`.

1. **One name source**: the `name` field of the app's `package.json`. `src/game-name.ts` reads it and derives `GAME_ID`, `PACKAGE_NAME` and `SDK_GLOBAL_NAME` (`ScratchCardExampleSDK`) with one pure rule; `vite.config.ts`, `scripts/dev-sdk.ts` and app code import from there (research R2).
2. **One mount function** `mountGame(container, options)` renders the game into a Shadow DOM on the container and injects the game's CSS (a TS string constant) into it. The standalone dev page (`src/main.tsx`, `LocalAdapter`) and the SDK (`src/sdk.ts`, `RemoteAdapter`) both use it.
3. **SDK**: `src/sdk.ts` exports `init` and `destroy`; Vite library mode builds it as one IIFE file whose global name is `SDK_GLOBAL_NAME` (research R3).
4. **Gameplay**: `ScratchCard` component with `useGameContext()`: `initGame()` on mount → loading → covered canvas; pointer scratching marks cells in a grid; the pure `scratchProgress` module computes the share; at ≥ 0.5 the card is revealed and `submitResult(1)` is called once; outcome shown; "Play again" calls `resetResult()` (research R5).
5. **Scripts**: `dev` (Vite dev server), `devSdk` (`node scripts/dev-sdk.ts`: development build in watch mode + a local host page that loads the built file with a `<script>` tag + a tiny mock server API), `buildSdk` (`vite build`), `lint`, `check-types`, `test`.

Research: [research.md](research.md). Contracts: [contracts/sdk-api.md](contracts/sdk-api.md), [contracts/app-scripts.md](contracts/app-scripts.md).

## Technical Context

**Language/Version**: TypeScript (repo's `typescript` 7.0.2), ESM, `.ts` + `.tsx` with the automatic JSX runtime; browsers (game) and Node 24 (tests, `scripts/dev-sdk.ts` via Node type stripping)

**Primary Dependencies**: runtime: `@repo/game-core` (workspace), `react` 19.3.1, `react-dom` 19.3.1. Dev: `vite` 8.3.5, `@vitejs/plugin-react` 6.3.0 (new to the repo, see below); `vitest` 5.1.0, `happy-dom` 21.0.4, `@types/react` 19.3.0, `@types/react-dom` 19.3.0, `@types/node` 24.19.2, `eslint` 10.9.1, `typescript` 7.0.2, `@repo/eslint-config`, `@repo/typescript-config` (same versions as the rest of the repo)

**Storage**: N/A

**Testing**: Vitest 5.1.0, colocated `*.test.ts(x)`, test names tagged `[003:FR-###]`. Pure modules in the default `node` environment; component and SDK tests in `happy-dom` (`// @vitest-environment happy-dom`) with `react-dom/client` `createRoot` + `act` (same setup as `packages/game-core`, research R6). A fake `GameAdapter` drives outcomes; SDK tests stub `fetch` with `vi.stubGlobal`. The build test runs Vite's `build()` into a temp folder and evaluates the file in `node:vm`.

**Target Platform**: evergreen browsers (mouse, touch, pen via Pointer Events) inside the host page; Node 24 for tests and dev scripts

**Project Type**: web app (one workspace app, built as an embeddable single-file SDK)

**Performance Goals**: scratching stays smooth (progress update is O(cells under the brush); 20 × 20 grid)

**Constraints**: shared lint limits `max-lines-per-function` 60 and `max-lines` 400 (components stay small); the shared ESLint config (may not change) does not parse JSX, so the app's own `eslint.config.js` adds Babel's built-in `jsx` parser plugin for `.tsx` (research R4); no new runtime dependency beyond React; the access token is never logged or put in a URL (FR-024, constitution V)

**Scale/Scope**: 1 app, ~10 source modules, 1 SDK file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Spec-First | Spec v0.1.0 (Draft) from issue #25; every module below traces to an FR. Owner approves spec and plan in the PR | Pass (approval in PR) |
| II. Humans Decide | Spec, plan, tasks are drafts; the 3 spec Assumptions are for the owner to confirm | Pass |
| III. Verified Against the Spec | Every FR-001..FR-024 has at least one test tagged `[003:FR-###]` (mapping in [quickstart.md](quickstart.md#fr-to-test-map)); tasks put each test before its code and require seeing it fail | Pass (enforced in tasks) |
| IV. Simplicity | Only the two dependencies the issue allows are new (`vite`, `@vitejs/plugin-react`), recorded below and in research R1. `@testing-library/react` is **not** added (R6). No CSS tooling (CSS is a TS string, R3), no dev-server/concurrency packages (`scripts/dev-sdk.ts` uses Vite's JS API, R7), no mock-server library. One abstraction: `mountGame`, shared by the two run modes required by the issue | Pass, **pending owner approval** (`deps-approved` label) |
| V. No Secrets or Personal Data | Tests and the dev host page use a made-up token (`test-token-not-secret`, `dev-token-not-secret`) and assert it is absent from URLs and console output; the SDK's console errors never print the config | Pass |

**Post-design re-check (after Phase 1)**: unchanged; no service, no extra package, one helper (`mountGame`).

## New dependencies

- vite@8.3.5 (dev): dev server for `dev`/`devSdk` and the single-file library build for `buildSdk` (issue #25 requires Vite). Already in the lockfile as Vitest's peer at this exact version, so no new copy. Tried instead: `tsc` alone (cannot bundle React into one script file).
- @vitejs/plugin-react@6.3.0 (dev): automatic JSX runtime and React Fast Refresh in `dev` (allowed by issue #25). Its peers `@rolldown/plugin-babel` and `babel-plugin-react-compiler` are optional and not installed. Tried instead: Vite's built-in JSX transform alone (works for the build, but no Fast Refresh and needs hand-set `oxc.jsx` options in every copied game).

Existing repo dependencies reused at the same versions (not new): `react`, `react-dom`, `@types/react`, `@types/react-dom`, `@types/node`, `happy-dom`, `vitest`, `eslint`, `typescript`.

Rejected: `@testing-library/react` (allowed, but needs the extra peer `@testing-library/dom`; `createRoot` + `act` is what `packages/game-core` already uses), `concurrently`/`npm-run-all` (R7), any CSS-in-JS or PostCSS tooling (R3).

## Project Structure

### Documentation (this feature)

```text
specs/003-scratch-card-example/
├── spec.md              # v0.1.0 Draft
├── plan.md              # This file
├── research.md          # R1–R8 decisions
├── data-model.md        # SDK config, names, card round state machine, outcome
├── quickstart.md        # Validation scenarios + FR-to-test map
├── contracts/
│   ├── sdk-api.md       # window.<SDK_GLOBAL_NAME>: init/destroy, config, errors, tracking events
│   └── app-scripts.md   # package.json scripts, files, git-ignore, README sections
├── checklists/requirements.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
apps/scratch-card-example/
├── package.json            # "name": "scratch-card-example" ← THE single name source; "type": "module", private
│                           # scripts: dev, devSdk, buildSdk, lint, check-types, test (contracts/app-scripts.md)
├── .gitignore              # dist/, *.tsbuildinfo
├── README.md               # what the template is, each script, what a new game changes
├── index.html              # standalone dev page: <div id="app">, <script type="module" src="/src/main.tsx">
├── vite.config.ts          # react plugin; build.lib: entry src/sdk.ts, formats ["iife"], name SDK_GLOBAL_NAME,
│                           # fileName `${GAME_ID}-sdk.js`; define process.env.NODE_ENV; copyPublicDir false
├── tsconfig.json           # extends base; module ESNext, moduleResolution Bundler, jsx react-jsx, noEmit,
│                           # allowImportingTsExtensions, types ["node"]
├── eslint.config.js        # base config + .tsx override adding Babel parser plugin "jsx" (R4); tests: max-lines-per-function off
├── scripts/
│   └── dev-sdk.ts          # devSdk: vite build --mode development --watch + host page server + mock API (R7)
└── src/
    ├── game-name.ts            # PACKAGE_NAME, GAME_ID, SDK_GLOBAL_NAME, toSdkGlobalName() (reads ../package.json)
    ├── game-name.test.ts       # FR-012
    ├── scratch-progress.ts     # pure: createScratchGrid, scratchAt, scratchProgress, REVEAL_THRESHOLD
    ├── scratch-progress.test.ts# FR-020, FR-016 (threshold), edge cases (node env, no DOM)
    ├── styles.ts               # GAME_CSS string (:host reset + game styles)
    ├── mount-game.tsx          # mountGame(container, options) → { unmount }: shadow root, <style>, React root
    ├── sdk.ts                  # init(container, config), destroy(); config validation; console errors
    ├── sdk.test.ts             # FR-004..FR-011, FR-024 (happy-dom)
    ├── sdk-build.test.ts       # FR-002, FR-013 (Vite build into temp dir + node:vm)
    ├── main.tsx                # standalone: mountGame(#app, LocalAdapter)
    ├── App.tsx                 # GameContextProvider + ScratchCard
    ├── ScratchCard.tsx         # gameplay (loading, card, outcome, play again, tracking)
    ├── ScratchCanvas.tsx       # canvas cover + pointer handling → scratchAt
    ├── ScratchCard.test.tsx    # FR-014..FR-019 (happy-dom, fake adapter)
    ├── standalone.test.tsx     # FR-001, FR-003 (LocalAdapter, fetch never called)
    ├── repo-hygiene.test.ts    # FR-021, FR-022, FR-023 (package.json scripts, git check-ignore/ls-files, README)
    └── test-helpers.tsx        # fakeAdapter(), renderApp(), scratchFully(), TOKEN — tests only
```

**Structure Decision**: one new workspace app under `apps/` (already in `pnpm-workspace.yaml`). `turbo.json` already defines `buildSdk` with `dist/**` outputs, and the CI `verify` job runs `lint check-types test buildSdk`, so no CI or turbo change is needed. No change to `packages/game-core`.

## Risks

- **JSX lint**: the shared ESLint config cannot parse JSX; the app override (R4) must be kept by every copy. Verified on this runner: Babel with `@babel/preset-typescript` + `parserOpts.plugins: ["jsx"]` parses `.tsx` JSX.
- **Canvas in happy-dom**: `getContext("2d")` may return `null`; drawing is skipped when there is no context, and progress comes from the grid, not pixels (R5), so tests do not need a canvas implementation.
- **Build test time**: running a real Vite build in a test takes seconds; it gets a 60 s timeout.
- **Lockfile change**: needs the `deps-approved` label.

## Complexity Tracking

No constitution violations to justify.
