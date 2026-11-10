# Implementation Plan: Storybook sandbox for playing the games

**Branch**: `006-storybook-sandbox` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-storybook-sandbox/spec.md`

## Summary

Add the workspace app `apps/storybook` (Storybook 10 with the React + Vite framework). One story file per game imports the game's `App` by relative path from `apps/<game>/src`, injects the game's `GAME_CSS` (the games style themselves through a Shadow DOM style tag, which `App` alone does not include) and renders `App` with `LocalAdapter`. Stories are found by the glob `src/stories/*.stories.tsx`, so a new game needs only a new story file. A Vitest test renders each story with happy-dom and asserts the game's root element.

## Technical Context

**Language/Version**: TypeScript 7.0.2, React 19.3.1 (as the games)

**Primary Dependencies**: `storybook@10.6.6`, `@storybook/react-vite@10.6.6` (exact; no addons beyond what these ship with), plus the existing `@repo/game-core`, `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `vitest`, `happy-dom`

**Storage**: N/A

**Testing**: Vitest + happy-dom; each story's component is rendered with `createRoot` inside `act`

**Target Platform**: developer browser (dev server) and a static site

**Project Type**: web app (Storybook workspace)

**Performance Goals**: N/A

**Constraints**: no backend, no SDK bundle; no change to games or shared packages; `build` output goes to `dist/` (turbo `outputs`)

**Scale/Scope**: 2 stories now; 1 file per future game

## Constitution Check

- I Spec-First: spec 006 drives the work. Pass.
- II Humans Decide: the owner approves in the PR. Pass.
- III Verified: every FR gets a test tagged `[006:FR-###]`; config facts (scripts, glob, README, dependencies) are checked by a file-checking test like the other apps do. Pass.
- IV Simplicity: only `storybook` and `@storybook/react-vite` are new, listed below for the `deps-approved` label. No new abstraction. Pass.
- V No secrets: none involved. Pass.

Post-design re-check: unchanged, pass.

## New dependencies

- storybook@10.6.6: the Storybook core CLI and runtime; the standard library and existing dependencies cannot serve a game sandbox. Only in `apps/storybook`.
- @storybook/react-vite@10.6.6: the React + Vite framework for Storybook, reusing the Vite toolchain the games already use. Only in `apps/storybook`.

## Project Structure

### Documentation (this feature)

```text
specs/006-storybook-sandbox/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/story-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/storybook/
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vite.config.ts          # vitest config
├── .storybook/
│   ├── main.ts             # stories glob, framework react-vite
│   └── preview.ts
└── src/stories/
    ├── scratch-card-example.stories.tsx
    ├── sky-hopper.stories.tsx
    ├── stories.test.tsx    # renders each story, asserts root element
    └── sandbox-files.test.ts   # scripts, glob, README, dependency checks
README.md                   # Storybook run / add-a-story note
```

**Structure Decision**: a new app next to the games; games stay untouched and are imported by relative path (`../../../sky-hopper/src/App.tsx`) because they are private apps with no package entry point.

## Complexity Tracking

No violations.
