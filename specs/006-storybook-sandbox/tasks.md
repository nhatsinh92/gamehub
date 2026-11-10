# Tasks: Storybook sandbox for playing the games

**Input**: `/specs/006-storybook-sandbox/` (plan.md, spec.md, research.md, data-model.md, contracts/story-contract.md)

**Tests**: Required (constitution Principle III). Tag each test `[006:FR-###]`; write it first and see it fail on the stub (CLAUDE.md Rule 2). Tests assert whole values.

## Phase 1: Setup

- [ ] T001 Create `apps/storybook/package.json` (name `storybook`, private, type module; scripts `dev` = `storybook dev -p 6006`, `build` = `storybook build -o dist`, `lint`, `check-types`, `test` as in `apps/sky-hopper/package.json`) and add `storybook@10.6.6` and `@storybook/react-vite@10.6.6` with `pnpm add --filter storybook <pkg>@<exact version>`; reuse the games' exact versions for react, react-dom, vite, vitest, happy-dom, typescript, eslint and `@repo/*` workspace packages. If the `storybook` name clashes with the dependency, use `@repo/storybook` (see research.md).
- [ ] T002 [P] Create `apps/storybook/tsconfig.json`, `apps/storybook/eslint.config.js` and `apps/storybook/vite.config.ts` (vitest, happy-dom) modelled on `apps/sky-hopper`; tsconfig `include` covers `.storybook`, `src` and the games' `src` imported by relative path.
- [ ] T003 Create `apps/storybook/.storybook/main.ts` (stories glob `../src/stories/*.stories.tsx`, framework `@storybook/react-vite`, no addons beyond the defaults) and `apps/storybook/.storybook/preview.ts`.

## Phase 2: User Story 1 - Play a game from its story (P1) 🎯 MVP

**Goal**: both games render and play from their stories with `LocalAdapter`, no backend.

**Independent test**: `pnpm --filter storybook test`.

- [ ] T004 [US1] Write failing test `apps/storybook/src/stories/stories.test.tsx`: for each story module (found with `import.meta.glob("./*.stories.tsx", { eager: true })`) render `Default` under happy-dom, wait for effects, and assert that the game's root element is present, using the exact selector found in the game's `App.tsx` / `SkyHopper.tsx` (`[006:FR-002]` `[006:FR-003]` `[006:FR-006]`). Also assert that the list of story files equals `["scratch-card-example", "sky-hopper"]` and that `fetch` was never called.
- [ ] T005 [P] [US1] Create `apps/storybook/src/stories/scratch-card-example.stories.tsx` per `contracts/story-contract.md`, importing `App` and `GAME_CSS` by relative path from `apps/scratch-card-example/src`, game id from its `game-name.ts`.
- [ ] T006 [P] [US1] Create `apps/storybook/src/stories/sky-hopper.stories.tsx` per the same contract from `apps/sky-hopper/src`.
- [ ] T007 [US1] Run `pnpm --filter storybook dev` briefly (smoke), confirm both stories render, and fix imports until T004 passes.

## Phase 3: User Story 2 - Static build and CI (P2)

**Goal**: repo-wide build, lint, check-types and test stay green.

- [ ] T008 [US2] Write failing test `apps/storybook/src/stories/sandbox-files.test.ts` (`[006:FR-001]` `[006:FR-004]` `[006:FR-005]` `[006:FR-009]`): read `apps/storybook/package.json` and assert the full `scripts` object, that the only `storybook`-family dependencies are `storybook` and `@storybook/react-vite` with exact versions (no `^`/`~`), and that `apps/sky-hopper/package.json`, `apps/scratch-card-example/package.json` and `packages/game-core/package.json` contain no `storybook` dependency.
- [ ] T009 [US2] Run `pnpm build` from the root and fix until the static Storybook is produced in `apps/storybook/dist`; confirm the turbo `build` outputs (`dist/**`) cover it without editing `turbo.json`.
- [ ] T010 [US2] Run `pnpm turbo run lint check-types test --continue` and fix until it passes for all workspaces.

## Phase 4: User Story 3 - Add a story for a new game (P3)

**Goal**: a new story file needs no config change; README explains it.

- [ ] T011 [US3] Extend `sandbox-files.test.ts` (`[006:FR-007]` `[006:FR-008]`): assert `.storybook/main.ts` contains the `stories` glob `../src/stories/*.stories.tsx` and no per-game path, and that the root `README.md` contains the sections "Storybook" with the run command and the add-a-story steps. See it fail.
- [ ] T012 [US3] Update the root `README.md`: replace "`apps/`: games and apps (none yet)" by the real list, add `apps/storybook`, and add a "Storybook" section with `pnpm --filter storybook dev`, `pnpm build`, and the steps to add `apps/storybook/src/stories/<game>.stories.tsx` (copy an existing story, change the imports).

## Phase 5: Polish

- [ ] T013 Confirm no file outside `apps/storybook`, `README.md`, `pnpm-lock.yaml` and `specs/006-storybook-sandbox/` changed (`git diff --stat`), and that `.github/`, `prompts/`, `CLAUDE.md` are untouched.

## Dependencies

T001 → T002, T003 → T004 → T005, T006 → T007 → T008 → T009 → T010; T011 → T012 after T007. US1 is the MVP.

## Parallel

T002 with T003 after T001; T005 with T006.
