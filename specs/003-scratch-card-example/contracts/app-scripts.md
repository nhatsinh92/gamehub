# Contract: App scripts, files and docs

**Feature**: [../spec.md](../spec.md) (v0.1.0)

## `package.json` scripts (FR-021, exact)

```json
{
  "dev": "vite",
  "devSdk": "node scripts/dev-sdk.ts",
  "buildSdk": "vite build",
  "lint": "eslint . --max-warnings 0",
  "check-types": "tsc --noEmit",
  "test": "vitest run"
}
```

| Script | Does | Tool (must be a dependency) |
|---|---|---|
| `dev` | Standalone dev page at `http://localhost:5173` with `LocalAdapter` (no network) | `vite` |
| `devSdk` | Development build of the SDK in watch mode + host page at `http://localhost:5174` that loads the built file with `<script src>` and calls `init`, against a local mock API | `node` (runtime), `vite` |
| `buildSdk` | Production build: `dist/<GAME_ID>-sdk.js`, the only file in `dist/` | `vite` |
| `lint` | ESLint, 0 warnings | `eslint` |
| `check-types` | TypeScript, no emit | `typescript` |
| `test` | Vitest, once | `vitest` |

No script, config or file refers to a tool the app does not depend on (e.g. no `next`, `storybook`, `playwright`, `jest`).

## Other `package.json` fields

- `"name": "scratch-card-example"`: the single name source (FR-012).
- `"private": true`, `"type": "module"`, `"version": "0.0.0"`.
- `dependencies`: `@repo/game-core` (`workspace:*`), `react`, `react-dom`. `devDependencies`: see plan Technical Context.

## Git-ignored, never committed (FR-022)

`apps/scratch-card-example/.gitignore`:

```text
dist/
*.tsbuildinfo
```

`git check-ignore` reports both `apps/scratch-card-example/dist/x.js` and `apps/scratch-card-example/x.tsbuildinfo` as ignored; `git ls-files apps/scratch-card-example` lists no path under `dist/` and none ending in `.tsbuildinfo`.

## README sections (FR-023)

`apps/scratch-card-example/README.md` has these `##` headings, in order:

1. `## What this is` — the example scratch-card game and the template every new game is copied from; standalone vs embedded modes; uses `@repo/game-core` for all server calls.
2. `## Scripts` — one line for each of the six scripts above (each script name appears in backticks).
3. `## SDK usage` — the host snippet from [sdk-api.md](sdk-api.md#loading).
4. `## Starting a new game from this template` — what a copy changes: the `name` in `package.json` (game id, package name and SDK global name follow), the gameplay components (`ScratchCard.tsx`, `ScratchCanvas.tsx`, `scratch-progress.ts`), `styles.ts`, the tracking events, and this README.
