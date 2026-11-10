# Quickstart: validating the Scratch Card Example template

**Feature**: [spec.md](spec.md) (v0.1.0) | Contracts: [sdk-api.md](contracts/sdk-api.md), [app-scripts.md](contracts/app-scripts.md)

## Prerequisites

- Node 24, pnpm (version from root `package.json` `packageManager`)
- `pnpm install` at the repo root

## Automated checks

```sh
pnpm turbo run lint check-types test buildSdk --filter scratch-card-example
pnpm turbo run lint check-types test --continue   # whole repo, as CI
```

Expected: all pass; `apps/scratch-card-example/dist/` holds only `scratch-card-example-sdk.js`; `git status` shows nothing new (build output is ignored).

## Manual scenarios

1. **Standalone** (`pnpm --filter scratch-card-example dev`, open `http://localhost:5173`): loading text, then a grey card. Scratch with the mouse; past about half the card it clears and shows "Demo reward" (local mock data). "Play again" shows a fresh card. DevTools Network: no request to a game API.
2. **Embedded** (`pnpm --filter scratch-card-example devSdk`, open `http://localhost:5174`): the host page has its own loud styles (e.g. red serif `*`, bordered `button`); the game inside looks the same as standalone; the host's own heading keeps its style. Network: requests to `/mock-api/scratch-card-example/v1/init` and `/reward`; the token is in the `X-Access-Token` header only, never in a URL. Console: no token.
3. **Rename** (dry run): change `name` in `apps/scratch-card-example/package.json` to `lucky-wheel-test`, run `buildSdk`: `dist/lucky-wheel-test-sdk.js` defines `LuckyWheelTestSDK`. Revert.

## FR-to-test map

| FR | Test file | What the test asserts |
|---|---|---|
| FR-001 | `standalone.test.tsx` | standalone mount with `LocalAdapter` reaches the local reward outcome |
| FR-002 | `sdk-build.test.ts` | the build writes exactly one file |
| FR-003 | `standalone.test.tsx`, `sdk.test.ts` | standalone: `fetch` never called; SDK: every request URL is a game-core endpoint |
| FR-004 | `sdk-build.test.ts`, `sdk.test.ts` | global keys `[SDK_GLOBAL_NAME]`; object keys `["destroy", "init"]` |
| FR-005 | `sdk.test.ts` | selector and `Element` both work; config fields passed through |
| FR-006 | `sdk.test.ts` | game DOM + one `<style>` inside shadow root; nothing added to head/body; CSS starts with `:host` reset |
| FR-007 | `sdk.test.ts` | second `init` → one game root, no throw |
| FR-008 | `sdk.test.ts` | each bad container/config → exact console message, nothing rendered, no throw |
| FR-009 | `sdk.test.ts` | container and shadow root empty after `destroy`; `destroy` twice is a no-op |
| FR-010 | `sdk.test.ts` | given and default sizes on the game root |
| FR-011 | `sdk.test.ts` | host tracking function receives the events |
| FR-012 | `game-name.test.ts` | names equal values derived from `package.json`; `toSdkGlobalName` examples |
| FR-013 | `sdk-build.test.ts` | built global name equals `SDK_GLOBAL_NAME` |
| FR-014 | `ScratchCard.test.tsx` | loading → card; load error → error state, no card |
| FR-015 | `ScratchCard.test.tsx` | pointer events on the canvas increase progress |
| FR-016 | `scratch-progress.test.ts`, `ScratchCard.test.tsx` | threshold `>= 0.5`; `submitResult` called once with `1` |
| FR-017 | `ScratchCard.test.tsx` | text per outcome table, incl. submit error |
| FR-018 | `ScratchCard.test.tsx` | "Play again" → `resetResult`, fresh covered card |
| FR-019 | `ScratchCard.test.tsx` | exact ordered list of tracking events for one round and a replay |
| FR-020 | `scratch-progress.test.ts` | grid, `scratchAt`, `scratchProgress` in the node environment |
| FR-021 | `repo-hygiene.test.ts` | scripts object equals the contract; each script's tool is a dependency |
| FR-022 | `repo-hygiene.test.ts` | `git check-ignore` / `git ls-files` results |
| FR-023 | `repo-hygiene.test.ts` | README `##` headings equal the contract list; all six script names present |
| FR-024 | `sdk.test.ts` | full embedded round: token absent from every URL and every console call |
