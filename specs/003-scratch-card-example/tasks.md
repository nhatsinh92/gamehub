# Tasks: Scratch Card Example (the game template every new game is copied from)

**Input**: Design documents from `specs/003-scratch-card-example/`: [plan.md](plan.md), [spec.md](spec.md) (v0.1.0), [research.md](research.md), [data-model.md](data-model.md), [contracts/sdk-api.md](contracts/sdk-api.md), [contracts/app-scripts.md](contracts/app-scripts.md), [quickstart.md](quickstart.md)

**Tests**: Required (constitution III). Order for all logic: a **stub** so tests compile, then the **tests**, seen failing on an assertion (not an import or type error), then the **implementation**. Commit `test(red): …` with the failing tests, then `feat(green): …`. Every test name starts with its tag, e.g. `test("[003:FR-016] submits score 1 once when half the card is scratched", …)`. Map of FR → test file: [quickstart.md › FR-to-test map](quickstart.md#fr-to-test-map).

**Whole-value assertions (CLAUDE.md Rule 2)**: compare whole values with `toEqual`: the whole grid / progress number, the whole list of tracking calls, the whole list of `console.error` calls (`[[message]]`), the whole list of `submitResult` / `resetResult` calls, the whole `Object.keys(...)` list, the whole scripts object, the whole list of README headings, the whole list of fetch URLs. "The token is absent" is proved by comparing the whole list of URLs and of console calls to the exact expected list, never by `not.toContain` alone.

**Stub rule**: stubs return well-typed **wrong** values (`0`, an empty grid, `""`, a component rendering `null`, `init`/`destroy` doing nothing) so every test fails on an assertion.

**Out of scope**: browser end-to-end tests, final art/sound, the generator script, Storybook, build modes other than development and production, a production build of the dev page (spec Assumptions).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US3 from spec.md
- Paths are relative to the repo root; `APP` = `apps/scratch-card-example`.
- Rules for every source file: ESM; relative imports end in `.ts`/`.tsx`; erasable syntax only (no `enum`, `namespace`, parameter properties); JSX only in `.tsx`; functions ≤ 60 lines, files ≤ 400 lines (repo lint); split test files by topic when they grow. Token constant in tests: `const TOKEN = "test-token-not-secret"` (constitution V). No file other than `APP/package.json` (and prose in `APP/README.md`) contains the literal `scratch-card-example` or `ScratchCardExampleSDK`, except tests asserting the derived values.

---

## Phase 1: Setup

**Purpose**: create the `apps/scratch-card-example` workspace app (plan.md › Project Structure).

- [ ] T001 Create `APP/package.json`: `"name": "scratch-card-example"`, `"version": "0.0.0"`, `"private": true`, `"type": "module"`; scripts exactly as contracts/app-scripts.md (`"dev": "vite"`, `"devSdk": "node scripts/dev-sdk.ts"`, `"buildSdk": "vite build"`, `"lint": "eslint . --max-warnings 0"`, `"check-types": "tsc --noEmit"`, `"test": "vitest run"`); `"dependencies": { "@repo/game-core": "workspace:*" }`; devDependencies `"@repo/eslint-config": "workspace:*"`, `"@repo/typescript-config": "workspace:*"`
- [ ] T002 Add dependencies with pnpm, never editing `pnpm-lock.yaml` by hand: `pnpm --filter scratch-card-example add --save-exact react@19.3.1 react-dom@19.3.1` and `pnpm --filter scratch-card-example add -D --save-exact vite@8.3.5 @vitejs/plugin-react@6.3.0 vitest@5.1.0 happy-dom@21.0.4 @types/react@19.3.0 @types/react-dom@19.3.0 @types/node@24.19.2 eslint@10.9.1 typescript@7.0.2`. Do **not** add `@testing-library/react` (research R1, R6). Check that `plan.md › New dependencies` and research.md R1 list exactly these new packages and versions; if a version had to change, update both (with a plan note) to match
- [ ] T003 [P] Create `APP/.gitignore` with exactly the two lines `dist/` and `*.tsbuildinfo` (FR-022)
- [ ] T004 [P] Create `APP/tsconfig.json`: `"extends": "@repo/typescript-config/base.json"`, compilerOptions `"module": "ESNext"`, `"moduleResolution": "Bundler"`, `"jsx": "react-jsx"`, `"noEmit": true`, `"declaration": false`, `"declarationMap": false`, `"allowImportingTsExtensions": true`, `"erasableSyntaxOnly": true`, `"types": ["node"]`; `"include": ["*.ts", "*.js", "src", "scripts"]`
- [ ] T005 [P] Create `APP/eslint.config.js`: spread `config` from `@repo/eslint-config/base`; add an entry for `files: ["**/*.tsx"]` whose `languageOptions.parserOptions.babelOptions` keeps the base config's `presets` and adds `parserOpts: { plugins: ["jsx"] }` (research R4: read the base entry's `babelOptions` rather than retyping it); add `files: ["**/*.test.ts", "**/*.test.tsx"]` with `rules: { "max-lines-per-function": "off" }`
- [ ] T006 [P] Create `APP/index.html`: `<!doctype html>`, `<title>Game (dev)</title>` (no game name, R2), `<div id="app"></div>`, `<script type="module" src="/src/main.tsx"></script>`
- [ ] T007 Run `pnpm install`, then create a one-line `APP/src/placeholder.tsx` exporting `const x = <div />` and run `pnpm --filter scratch-card-example lint` and `check-types`; both pass (proves R4 and the tsconfig). Delete the placeholder

---

## Phase 2: Foundational (names, pure progress module, styles, shared stubs, test helpers)

**Purpose**: everything the stories import. **⚠️** No story work begins until this phase is done.

- [ ] T008 Create stub `APP/src/game-name.ts`: `import pkg from "../package.json" with { type: "json" };` exports `toSdkGlobalName(name: string): string` (stub returns `""`), `PACKAGE_NAME`, `GAME_ID`, `SDK_GLOBAL_NAME` (stubs `""`)
- [ ] T009 [P] Create stub `APP/src/scratch-progress.ts`: `GRID_SIZE = 20`, `BRUSH_RADIUS = 0.08`, `REVEAL_THRESHOLD = 0.5`, type `ScratchGrid = { readonly size: number; readonly cells: readonly boolean[] }`, `createScratchGrid(size?)` (stub `{ size: 0, cells: [] }`), `scratchAt(grid, x, y, radius?)` (stub returns `grid`), `scratchProgress(grid)` (stub `0`)
- [ ] T010 Write `APP/src/game-name.test.ts` (node env) `[003:FR-012]`: `PACKAGE_NAME` equals the `name` read from `APP/package.json` with `node:fs`; `GAME_ID` equals `PACKAGE_NAME`; `SDK_GLOBAL_NAME` equals `toSdkGlobalName(PACKAGE_NAME)` and equals `"ScratchCardExampleSDK"`; `toSdkGlobalName` table: `scratch-card-example` → `ScratchCardExampleSDK`, `lucky-wheel` → `LuckyWheelSDK`, `quiz` → `QuizSDK`, `a--b` → `ABSDK` (data-model › Names). Run; see it fail
- [ ] T011 [P] Write `APP/src/scratch-progress.test.ts` (node env, no DOM) `[003:FR-020]`: `createScratchGrid()` equals `{ size: 20, cells: Array(400).fill(false) }`; `createScratchGrid(2)` equals `{ size: 2, cells: [false,false,false,false] }`; `scratchAt` on a 2×2 grid at `(0.25, 0.25)` radius `0.1` equals `{ size: 2, cells: [true,false,false,false] }` and leaves the input grid unchanged; a point outside `[0,1]` with a small radius marks nothing (whole grid equal); `scratchProgress` of 0, 1, 2 and 4 marked cells of a 2×2 grid equals `0`, `0.25`, `0.5`, `1`; `scratchProgress({ size: 0, cells: [] })` equals `0`. `[003:FR-016]`: `REVEAL_THRESHOLD` equals `0.5` and the reveal rule `scratchProgress(g) >= REVEAL_THRESHOLD` is `[false, false, true, true]` for 0, 1, 2, 4 marked cells. Run; see it fail
- [ ] T012 Implement `APP/src/game-name.ts` per data-model › Names ("split on `-`, drop empty parts, upper-case the first letter of each part, keep the rest, join, append `SDK`"); T010 passes
- [ ] T013 [P] Implement `APP/src/scratch-progress.ts` per data-model › ScratchGrid ("marks every cell whose centre `((col + 0.5) / size, (row + 0.5) / size)` is within `radius` … of `(x, y)`; returns a new grid"; progress "always in [0, 1]"); T011 passes
- [ ] T014 [P] Create `APP/src/styles.ts` exporting `GAME_CSS`: a string starting with `:host { all: initial; display: block;` (research R3) plus simple shapes/colours for `.game`, `.card`, `.cover` (canvas), `.prize`, `.status`, `button`
- [ ] T015 Create component stubs that render `null`: `APP/src/App.tsx` (`App(props: MountOptions)`), `APP/src/ScratchCard.tsx`, `APP/src/ScratchCanvas.tsx` (props `{ width, height, disabled, onScratch(grid: ScratchGrid) }`); and `APP/src/mount-game.tsx` exporting type `MountOptions` (data-model › MountOptions: `{ gameId, adapter, httpConfig, sendTrackingFunc?, width, height }`), `DEFAULT_WIDTH = 360`, `DEFAULT_HEIGHT = 480`, and stub `mountGame(container: Element, options: MountOptions): { unmount(): void }` that renders nothing
- [ ] T016 Create `APP/src/test-helpers.tsx` (tests only): `TOKEN`; `fakeAdapter({ config?, configError?, result?, submitError? })` returning a `GameAdapter` whose calls are recorded (`calls.submitResult: number[]`); `renderApp(options)` using `createRoot` + `act` on a fresh `div` with `globalThis.IS_REACT_ACT_ENVIRONMENT = true`, returning `{ container, tracking: TrackingEvent[], unmount }`; `stubCanvasRect(width, height)` that stubs `HTMLCanvasElement.prototype.getBoundingClientRect`; `scratch(canvas, points: [x, y][])` dispatching `pointerdown`, `pointermove`… , `pointerup` (falls back to `MouseEvent` named `pointer*` when `PointerEvent` is missing, R6); `scratchAll(canvas)` covering the whole card; `flush()` awaiting pending promises inside `act`
- [ ] T017 Run `pnpm --filter scratch-card-example lint check-types test`: only T010/T011 tests ran and pass; commit `test(red)`/`feat(green)` pairs for T010–T013 as they happen

**Checkpoint**: names and progress are proven; the stories can start.

---

## Phase 3: User Story 1 - Player plays a scratch card (Priority: P1) 🎯 MVP

**Goal**: the scratch-card gameplay on top of `useGameContext()` (data-model › Card round state).

**Independent Test**: render `App` with a fake adapter; scratch past half the card; the right outcome text shows; "Play again" shows a fresh card; tracking events are exactly as specified.

### Tests for User Story 1 ⚠️ write first, see them fail

- [ ] T018 [US1] Write `APP/src/ScratchCard.test.tsx` (`// @vitest-environment happy-dom`), each test using `renderApp` with `fakeAdapter`:
  - `[003:FR-014]` while `getConfig` is pending the game root's text equals `"Loading…"` and there is no `canvas`; after it resolves there is exactly one `canvas.cover` and no outcome; when `getConfig` fails (`configError`) the text equals `"Could not load the game. Please try again later."`, no `canvas`, `calls.submitResult` equals `[]`
  - `[003:FR-015]` with `stubCanvasRect(360, 480)`, scratching a short stroke in one corner leaves the card covered and `calls.submitResult` equals `[]` (below threshold)
  - `[003:FR-016]` `scratchAll` then more scratching → `calls.submitResult` equals `[1]` (exactly once)
  - `[003:FR-017]` one test per row of data-model › Outcome text: SUCCESS + win + reward → `.prize` text equals the reward name; SUCCESS + no win, SUCCESS + win without reward, OUT_OF_TURN, MAINTENANCE, ERROR → `.status` text equals `result.message`; `submitError` → `.status` equals `"Something went wrong. Please try again."`
  - `[003:FR-018]` after an outcome and after a submit error, a button with text `"Play again"` exists; clicking it → the outcome element is gone (the context `result` was reset by `resetResult()`), exactly one fresh `canvas.cover` and no `.prize`/`.status`, and a new full scratch submits again (`calls.submitResult` equals `[1, 1]`)
  - `[003:FR-019]` tracking list for open → one round → play again → second round equals exactly `[{ name: "game_open" }, { name: "game_reveal" }, { name: "game_result", params: { status: "SUCCESS", isWin: true } }, { name: "game_reveal" }, { name: "game_result", params: { status: "SUCCESS", isWin: true } }]`
- [ ] T019 [US1] Run `pnpm --filter scratch-card-example test`; every T018 test fails on an assertion; commit `test(red): scratch card gameplay`

### Implementation for User Story 1

- [ ] T020 [US1] Implement `APP/src/ScratchCanvas.tsx`: a `<canvas className="cover">` sized `width × height`; on mount fill grey if `getContext("2d")` is non-null; pointer down/move (while pressed, unless `disabled`) → convert with `getBoundingClientRect()` to 0–1 card coordinates (ignore a zero-size rect), `scratchAt`, erase a circle when a context exists, call `onScratch(newGrid)`; `touch-action: none`
- [ ] T021 [US1] Implement `APP/src/ScratchCard.tsx` per data-model › Card round state: `useEffect` on mount → `sendTracking({ name: "game_open" })` once and `initGame()`; render `"Loading…"` while `isLoading && !config`; load error text when `initGame` returned `null`; on `onScratch` with `scratchProgress(grid) >= REVEAL_THRESHOLD` and not yet revealed → reveal (remove cover), `sendTracking({ name: "game_reveal" })`, `submitResult(1)` once (guard with a ref); when a result arrives → `sendTracking({ name: "game_result", params: { status, isWin } })` once and show the outcome text per data-model › Outcome text; "Play again" → `resetResult()`, new round key (fresh grid and canvas). Split into small helpers to stay under 60 lines per function
- [ ] T022 [US1] Implement `APP/src/App.tsx`: `<GameContextProvider gameId adapter httpConfig sendTrackingFunc>` around `<div className="game" style={{ width, height }}><ScratchCard /></div>`
- [ ] T023 [US1] All T018 tests pass; `lint` and `check-types` pass; commit `feat(green): scratch card gameplay`

**Checkpoint**: gameplay works with any adapter.

---

## Phase 4: User Story 2 - Host page embeds the game with one script (Priority: P1)

**Goal**: `mountGame`, the standalone entry and the SDK (`init`/`destroy`) built as one IIFE file (contracts/sdk-api.md).

**Independent Test**: in happy-dom, `init` renders inside a shadow root, `init` again replaces, bad input logs the exact error, `destroy` empties; the built file defines exactly the one global.

### Tests for User Story 2 ⚠️ write first, see them fail

- [ ] T024 [US2] Create stub `APP/src/sdk.ts` exporting `init(container: string | Element, config: unknown): void` and `destroy(): void` that do nothing, and stub `APP/src/main.tsx` that imports `mountGame`, `LocalAdapter`, `GAME_ID` and does nothing yet; create `APP/vite.config.ts` per plan (react plugin; `build.lib` with `entry: "src/sdk.ts"`, `formats: ["iife"]`, `name: SDK_GLOBAL_NAME`, `fileName: () => \`${GAME_ID}-sdk.js\``; `build.copyPublicDir: false`; `define: { "process.env.NODE_ENV": JSON.stringify(mode) }`; names imported from `./src/game-name.ts`)
- [ ] T025 [P] [US2] Write `APP/src/sdk.test.ts` (happy-dom), `fetch` stubbed with `vi.stubGlobal` answering game-core endpoints with `{ data: … }` (config `{}`, a SUCCESS win result), `console.error`/`log`/`warn`/`info`/`debug` spied, `destroy()` in `afterEach`:
  - `[003:FR-004]` `Object.keys(sdk).sort()` equals `["destroy", "init"]`
  - `[003:FR-005]` `init("#game", cfg)` and `init(element, cfg)` both render one `.game` inside `container.shadowRoot`
  - `[003:FR-006]` the shadow root's children are exactly one `<style>` whose text equals `GAME_CSS` and the game root; `document.head.children.length` and `document.body` children other than the container are unchanged (compare whole lists before/after); `GAME_CSS` starts with `:host { all: initial; display: block;`
  - `[003:FR-007]` `init` twice on the same container → no throw, `shadowRoot.querySelectorAll(".game").length` equals `1`; `init` on a second container → first container empty, second has the game
  - `[003:FR-008]` table test: for each case in contracts/sdk-api.md › Console error messages (missing selector `#nope`, invalid selector `"##"`, `42` as container, `config` `null`, each missing/invalid field incl. `width: 0` and `height: -1`, and an element whose `attachShadow` is made to throw with `vi.spyOn(el, "attachShadow").mockImplementation(() => { throw new Error("NotSupportedError"); })`, so the case does not depend on happy-dom's element rules), `init` does not throw, nothing is rendered, and `console.error.mock.calls` equals `[["[ScratchCardExampleSDK] init: <exact message>"]]` (prefix built from `SDK_GLOBAL_NAME`)
  - `[003:FR-009]` after `destroy()`, `container.childNodes.length` and `container.shadowRoot.childNodes.length` both equal `0`; `destroy()` again and `destroy()` before any `init` do not throw and log nothing
  - `[003:FR-010]` `.game` style `width`/`height` equal `"200px"`/`"300px"` when given, `"360px"`/`"480px"` by default
  - `[003:FR-011]` host `sendTrackingFunc` calls equal `[[{ name: "game_open" }]]` after mount
  - `[003:FR-003]` + `[003:FR-024]` full embedded round (`stubCanvasRect`, `scratchAll`): the list of fetched URLs equals exactly `["https://api.test/<GAME_ID>/v1/init", "https://api.test/<GAME_ID>/v1/reward"]`, the reward request header `x-access-token` equals `TOKEN`, and every console spy's `mock.calls` equals `[]`
- [ ] T026 [P] [US2] Write `APP/src/standalone.test.tsx` (happy-dom) `[003:FR-001]` + `[003:FR-003]`: `globalThis.fetch` replaced by a spy; `mountGame(div, { gameId: GAME_ID, adapter: LocalAdapter, httpConfig: { baseUrl: "", getAccessTokenFunc: () => "" }, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })`, `scratchAll` → `.prize` text equals `LOCAL_MOCK_DATA.result.reward.name`; fetch spy calls equal `[]`
- [ ] T027 [P] [US2] Write `APP/src/sdk-build.test.ts` (node env, 60 s timeout) `[003:FR-002]` + `[003:FR-013]` + `[003:FR-004]`: `build({ configFile: <APP>/vite.config.ts, root: <APP>, build: { outDir: <mkdtemp>, emptyOutDir: true }, logLevel: "silent" })`; `readdirSync(outDir)` equals `[\`${GAME_ID}-sdk.js\`]`; `vm.runInNewContext(code, sandbox)` with `sandbox = {}` → `Object.keys(sandbox)` equals `[SDK_GLOBAL_NAME]` and `Object.keys(sandbox[SDK_GLOBAL_NAME]).sort()` equals `["destroy", "init"]`, both `typeof` `"function"`; remove the temp dir in `afterAll`
- [ ] T028 [US2] Run tests; T025–T027 fail on assertions; commit `test(red): sdk and run modes`

### Implementation for User Story 2

- [ ] T029 [US2] Implement `APP/src/mount-game.tsx` per research R8: reuse `container.shadowRoot` or `attachShadow({ mode: "open" })`; empty it; append `<style>` with `GAME_CSS` and a host `div`; `createRoot(host).render(<App {...options} />)`; `unmount()` unmounts the root and removes every shadow-root node and every container child
- [ ] T030 [US2] Implement `APP/src/sdk.ts` per contracts/sdk-api.md and research R8: module state `current`; `validateConfig` (data-model › SdkConfig rules: "non-empty" strings, "function", "finite and > 0 if present; default 360/480") and `resolveContainer` (selector via `document.querySelector` in `try`, else `instanceof Element`) returning the exact messages; on error `console.error(\`[${SDK_GLOBAL_NAME}] init: ${message}\`)` and return; else `destroy()` then `mountGame` with `RemoteAdapter` and `httpConfig { baseUrl, getAccessTokenFunc }`; catch an `attachShadow` failure as `container cannot host a shadow root`. Never log the config or the token
- [ ] T031 [US2] Implement `APP/src/main.tsx`: `mountGame(document.getElementById("app"), { gameId: GAME_ID, adapter: LocalAdapter, httpConfig: { baseUrl: "", getAccessTokenFunc: () => "" }, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })`; set `document.title` to `GAME_ID`
- [ ] T032 [US2] Implement `APP/scripts/dev-sdk.ts` per research R7: Vite `build({ configFile, mode: "development", build: { watch: {} } })`; Vite dev server (`configFile: false`, port 5174) with a plugin that serves `/` as the host page (generated from `SDK_GLOBAL_NAME` and `` `${GAME_ID}-sdk.js` ``; includes loud host styles for `*`, `button`, `h1` to show isolation), `/dist/*` from `APP/dist`, and `GET /mock-api/<GAME_ID>/v1/init` → `{ data: {} }`, `GET …/me` → a fixed user, `POST …/reward` → a fixed SUCCESS win; host page token `"dev-token-not-secret"`; nothing logs the token
- [ ] T033 [US2] T025–T027 pass; run `pnpm --filter scratch-card-example buildSdk` (one file in `APP/dist/`) and start `dev` and `devSdk` once each to confirm they serve (quickstart › Manual scenarios 1–2, stopped after the first successful response); `lint` and `check-types` pass; commit `feat(green): sdk and run modes`

**Checkpoint**: both run modes and the SDK contract work.

---

## Phase 5: User Story 3 - Developer copies, runs and renames the template (Priority: P2)

**Goal**: every script works, nothing generated is committed, the README explains the template.

**Independent Test**: `repo-hygiene.test.ts` passes; all six scripts run.

### Tests for User Story 3 ⚠️ write first, see them fail

- [ ] T034 [US3] Create a stub `APP/README.md` containing only `# placeholder`
- [ ] T035 [US3] Write `APP/src/repo-hygiene.test.ts` (node env):
  - `[003:FR-021]` `pkg.scripts` equals exactly the object in contracts/app-scripts.md; for each script, its first word (`vite`, `node`, `eslint`, `tsc`, `vitest`) maps to a package present in `devDependencies` (`vite`, built-in, `eslint`, `typescript`, `vitest`) — the resulting list of missing tools equals `[]`
  - `[003:FR-022]` `git check-ignore apps/scratch-card-example/dist/x.js apps/scratch-card-example/x.tsbuildinfo` (via `node:child_process` `execFileSync`, cwd repo root) outputs exactly those two paths; `git ls-files apps/scratch-card-example` filtered to paths under `dist/` or ending `.tsbuildinfo` equals `[]`; `APP/.gitignore` lines equal `["dist/", "*.tsbuildinfo"]`
  - `[003:FR-023]` the list of `## ` headings in `APP/README.md` equals `["What this is", "Scripts", "SDK usage", "Starting a new game from this template"]`; the six script names that appear in backticks in the Scripts section equal the six script keys
  - `[003:FR-012]` no file on disk under `APP/` (walked with `node:fs`, skipping `node_modules/` and `dist/`) except `package.json`, `README.md` and `*.test.ts(x)` contains `scratch-card-example` or `ScratchCardExampleSDK` (the list of offending files equals `[]`)
- [ ] T036 [US3] Run; FR-023 fails on the stub README (others may already pass because setup created them; note that in the commit message); commit `test(red): template hygiene`

### Implementation for User Story 3

- [ ] T037 [US3] Write `APP/README.md` per contracts/app-scripts.md › README sections (what it is; each script with its command and what it does; the SDK snippet; what a copy changes: `package.json` `name`, gameplay files, `styles.ts`, tracking events, the README)
- [ ] T038 [US3] T035 passes; commit `feat(green): template README`

**Checkpoint**: the template is ready to be copied.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T039 Search the app for any `console.` call that could print config or token values; there are only the SDK's `console.error` messages from contracts/sdk-api.md (FR-024)
- [ ] T040 Run `pnpm turbo run lint check-types test buildSdk --continue` at the repo root; all pass; `git status` shows no `dist/` or `*.tsbuildinfo` (SC-001, SC-006)
- [ ] T041 Run quickstart.md › Manual scenario 3 (rename dry run) with `buildSdk`, confirm `LuckyWheelTestSDK`, then revert `package.json` (SC-002, SC-003)
- [ ] T042 Confirm every FR-001..FR-024 has at least one test tagged `[003:FR-###]` (`grep -o "\[003:FR-[0-9]*\]" -r APP/src | sort -u` lists all 24)

---

## Dependencies & Execution Order

- **Setup (T001–T007)** → **Foundational (T008–T017)** → stories.
- **US1 (T018–T023)** depends only on Foundational.
- **US2 (T024–T033)** depends on Foundational and on `App` from US1 (T022) for rendering; its SDK tests also exercise the US1 gameplay in the full embedded round (T025 last bullet).
- **US3 (T034–T038)** depends on Setup (package.json, .gitignore) and on US2 scripts existing (T032) for FR-021.
- **Polish (T039–T042)** after all stories.

Within each story: stub → tests → see red → implement → green.

## Parallel Examples

- Setup: T003, T004, T005, T006 together after T001.
- Foundational: T009 with T008; T011 with T010; T013 and T014 with T012.
- US2: T025, T026, T027 together after T024.

## Implementation Strategy

1. Setup + Foundational: names and progress proven.
2. US1 (MVP): gameplay with a fake adapter.
3. US2: run modes and SDK, verified by the build test.
4. US3: hygiene and README.
5. Polish: whole-repo gates as CI runs them.
