# Implementation Plan: Sky Hopper ready-screen hint says how to fly

**Branch**: `007-sky-hopper-fly-hint` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-sky-hopper-fly-hint/spec.md`

## Summary

Replace one string: the ready-screen hint "Tap or press Space to start" becomes "Tap or press Space to fly" in `apps/sky-hopper/src/SkyHopper.tsx`. Update the UI contract `specs/005-sky-hopper/contracts/game-ui.md` and the tests that assert the hint. No other behavior or layout changes.

## Technical Context

**Language/Version**: TypeScript, React (as in `apps/sky-hopper`)

**Primary Dependencies**: none added

**Storage**: N/A

**Testing**: Vitest + Testing Library (existing Sky Hopper tests)

**Target Platform**: Browser (HTML5 game)

**Project Type**: web game app in a pnpm/turbo monorepo

**Performance Goals**: N/A (text change)

**Constraints**: Only the hint text changes; no layout or behavior change

**Scale/Scope**: 1 source line, 1 contract line, 4 test assertions

## Constitution Check

- I. Spec-First: spec 007 exists (Draft, versioned, with Changelog). Pass.
- II. Humans Decide: owner approves in the PR. Pass.
- III. Verified: FR-001..FR-003 each get a tagged test (`[007:FR-00N]`); tests are seen failing first. Pass.
- IV. Simplicity: no new dependency, service or abstraction. Pass.
- V. No Secrets: none involved. Pass.

Re-checked after design: no change.

## Project Structure

### Documentation (this feature)

```text
specs/007-sky-hopper-fly-hint/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── game-ui.md      # delta against 005 contract
└── tasks.md
```

### Source Code (repository root)

```text
apps/sky-hopper/src/
├── SkyHopper.tsx               # hint string (line 12)
├── SkyHopper.test.tsx          # asserts ready hint
├── SkyHopper.input.test.tsx    # asserts ready hint (2 places)
└── SkyHopper.replay.test.tsx   # asserts ready hint after Play again
specs/005-sky-hopper/contracts/game-ui.md   # ready row of the state table
```

**Structure Decision**: edit existing files only; no new source files.

## Complexity Tracking

No violations.
