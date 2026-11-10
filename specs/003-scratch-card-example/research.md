# Research: Scratch Card Example (game template)

**Feature**: [spec.md](spec.md) (v0.1.0) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-10

Each topic lists the options and a decision. Constitution IV: every new dependency is weighed against a no-dependency option.

## R1. Dependencies

Issue #25 allows `vite`, `@vitejs/plugin-react` and `@testing-library/react`, and asks for the same test setup as `packages/game-core` (Vitest + happy-dom).

| Package | Version | Kind | Decision | Why / what was tried instead |
|---|---|---|---|---|
| `vite` | 8.3.5 | dev | **Add** | Dev server (`dev`, `devSdk`) and single-file library build (`buildSdk`). Same version Vitest 5.1.0 already pulls in, so the lockfile gains no second copy. `tsc` alone cannot bundle React into one script file. |
| `@vitejs/plugin-react` | 6.3.0 | dev | **Add** | Automatic JSX runtime + React Fast Refresh in `dev`; peer `vite ^8`. Optional peers (`@rolldown/plugin-babel`, `babel-plugin-react-compiler`) not installed. Vite's built-in JSX transform alone builds fine but gives no Fast Refresh. |
| `@testing-library/react` | — | dev | **Do not add** | Needs the peer `@testing-library/dom` (not on the allowed list). `createRoot` + `act` from React, as in `packages/game-core`, covers the component tests (R6). |
| `react`, `react-dom` | 19.3.1 | runtime | reuse | React 19 required; bundled into the SDK file. |
| `@types/react`, `@types/react-dom` | 19.3.0 | dev | reuse | Types for `check-types`. |
| `@types/node` | 24.19.2 | dev | reuse | Types for `vite.config.ts`, `scripts/dev-sdk.ts` and tests that use `node:fs`, `node:vm`, `node:child_process` (as `packages/spec-diff`). |
| `vitest`, `happy-dom`, `eslint`, `typescript` | repo versions | dev | reuse | Same setup as `packages/game-core`. |

Install: `pnpm --filter scratch-card-example add <pkg>@<exact>` (`-D` for dev), never editing `pnpm-lock.yaml` by hand.

## R2. One name source

**Options**

| Option | Pros | Cons |
|---|---|---|
| A. `package.json` `name` is the source; `src/game-name.ts` imports it (`with { type: "json" }`) and derives the game id and global name | Truly one value; the package manager needs the name in `package.json` anyway | Global name derived by a rule, so the rule must be tested |
| B. A `game.config.ts` with all three names | Explicit | `package.json` `name` is a second copy that can drift |
| C. Generate `package.json` name from a config | One value | Needs a generator step (next issue's job) |

**Decision: A.** `PACKAGE_NAME = pkg.name`, `GAME_ID = PACKAGE_NAME`, `SDK_GLOBAL_NAME = toSdkGlobalName(PACKAGE_NAME)`, where `toSdkGlobalName` splits on `-`, capitalises each part and appends `SDK` (`scratch-card-example` → `ScratchCardExampleSDK`). `vite.config.ts`, `scripts/dev-sdk.ts`, `sdk.ts` and `main.tsx` import from `src/game-name.ts`. JSON import attributes work in Node 24, Vite and TypeScript (`module: ESNext`). No other file (including `index.html`) contains the game name, except prose in `README.md` (which the README tells a copier to update).

## R3. Single-file SDK build and styles

- **Build**: Vite library mode, `formats: ["iife"]`, `name: SDK_GLOBAL_NAME`, entry `src/sdk.ts` (named exports `init`, `destroy`), `fileName: () => \`${GAME_ID}-sdk.js\``, `copyPublicDir: false`. The IIFE output is `var <SDK_GLOBAL_NAME> = (function(exports){…})({})`, so a classic `<script>` defines exactly one global. `define: { "process.env.NODE_ENV": JSON.stringify(mode) }` because library mode does not replace it and React reads it.
- **Styles options**: A. `.css` file imported with `?inline` (Vite-specific; Vitest replaces CSS with empty strings by default, so tests cannot see it); B. a `.css` file emitted next to the script (breaks "one script file"); C. **a TS module `styles.ts` exporting `GAME_CSS`**.
- **Decision: C.** `mountGame` appends `<style>` with `GAME_CSS` to the shadow root. `GAME_CSS` starts with `:host { all: initial; display: block; … }` so inherited host properties (font, colour) do not reach the game; selectors inside a shadow root cannot match host elements, so the game cannot restyle the host.

## R4. JSX and the shared lint config

The shared config (`packages/eslint-config/base.js`, may not change) parses `.ts`/`.tsx` with `@babel/eslint-parser` + `@babel/preset-typescript` (Babel 8). Checked on this runner: that combination rejects JSX in a `.tsx` file; adding `parserOpts: { plugins: ["jsx"] }` (built into Babel's parser, no new package) parses it.

**Options**: A. `createElement` everywhere (as game-core); B. JSX in `.tsx` with an app-level override.

**Decision: B.** The template is what every game copies; JSX is the normal way to write React components. The app's `eslint.config.js` spreads the base config and adds, for `**/*.tsx`, the same `babelOptions` plus `parserOpts.plugins: ["jsx"]`. `tsconfig.json` sets `"jsx": "react-jsx"`.

## R5. Scratching and progress

**Options**: A. Read canvas pixels (`getImageData`) and count transparent ones (needs a real canvas; happy-dom has none; slow on large canvases); B. **a logical grid**: the cover is a `GRID_SIZE × GRID_SIZE` (20 × 20) grid of booleans; each pointer point marks the cells within the brush radius; progress = marked / total.

**Decision: B.** `scratch-progress.ts` (pure, no DOM):

- `createScratchGrid(size = GRID_SIZE): ScratchGrid`
- `scratchAt(grid, x, y, radius = BRUSH_RADIUS): ScratchGrid` (x, y in 0–1 card coordinates; points outside are clamped out; returns a new grid, input unchanged)
- `scratchProgress(grid): number` in 0–1 (0 for an empty grid)
- `REVEAL_THRESHOLD = 0.5`, compared with `>=`

`ScratchCanvas` converts pointer coordinates with the canvas's `getBoundingClientRect()` (a zero-size rect is ignored), draws the erase stroke when a 2D context exists, and reports the new grid. Tests stub `getBoundingClientRect` on the canvas.

## R6. Component and SDK tests

Same as game-core R5: `react-dom/client` `createRoot` + `act`, `globalThis.IS_REACT_ACT_ENVIRONMENT = true`, `// @vitest-environment happy-dom` per DOM test file; no Vitest config file. Outcomes are driven by a fake `GameAdapter` (`fakeAdapter({ config, result })`), so no network. SDK tests use `RemoteAdapter` for real with `fetch` stubbed by `vi.stubGlobal` and `console` spied, to assert the token never appears in a URL or console output (FR-024). Pointer events are dispatched with `new PointerEvent(...)` (or `MouseEvent` with the pointer type names if happy-dom lacks `PointerEvent`).

The build test (`sdk-build.test.ts`) calls Vite's `build({ configFile, build: { outDir: <tmp>, emptyOutDir: true }, logLevel: "silent" })`, asserts the output folder holds exactly one file, runs it with `vm.runInNewContext(code, sandbox)` and asserts `Object.keys(sandbox)` equals `[SDK_GLOBAL_NAME]` and that it exposes exactly `destroy` and `init` functions.

## R7. `devSdk` without extra packages

**Options**: A. `concurrently "vite build --watch" "vite preview"` (new dependency); B. a static host HTML file (would hard-code the global name and file name, a second name source); C. **`scripts/dev-sdk.ts` run with `node`** using Vite's JS API.

**Decision: C.** The script:

1. starts `build({ configFile: vite.config.ts, mode: "development", build: { watch: {} } })` (writes `dist/<GAME_ID>-sdk.js` and rebuilds on change);
2. starts a Vite dev server (`configFile: false`, port 5174) with one small plugin that serves `/` as a host page generated from `SDK_GLOBAL_NAME` and the file name (a `<div id="game">`, `<script src="/dist/<file>">`, then `window[SDK_GLOBAL_NAME].init("#game", { gameId, baseUrl: "/mock-api", getAccessTokenFunc: () => "dev-token-not-secret" })`), serves `/dist/*` from the build folder, and answers the three game-core endpoints under `/mock-api/<GAME_ID>/v1/` with fixed `{ data: … }` responses (config, user, a win result).

Node 24 runs the `.ts` file directly (type stripping); the script only imports `vite`, `node:*` and `../src/game-name.ts`.

## R8. SDK lifecycle

- One running game per page (spec Assumption 2): module state `current: { container, unmount } | null`.
- `init`: validate config (required `gameId`, `baseUrl` non-empty strings; `getAccessTokenFunc` function; optional `sendTrackingFunc` function, `width`/`height` positive finite numbers) → resolve container (string → `document.querySelector`, catching invalid selectors; else must be an `Element`) → `destroy()` the running game → `mountGame`. Any failure: `console.error("[<SDK_GLOBAL_NAME>] init: <reason>")`, return without rendering, never throw. Messages name the field or selector, never the config values of the token function.
- Shadow root: reuse `container.shadowRoot` if present (a second `attachShadow` throws), else `attachShadow({ mode: "open" })`; elements that cannot host a shadow root give the console error.
- `destroy`: `root.unmount()`, remove every node from the shadow root, remove any light-DOM children of the container, set `current = null`. No game running → no-op.
- Default size 360 × 480 CSS px (spec Assumption 3), applied to the game's root element.
