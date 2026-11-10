# Implementation Plan: gen-game

**Branch**: `004-gen-game` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md) (v0.1.0, Draft)

**Input**: Feature specification from `specs/004-gen-game/spec.md`

## Summary

A workspace package `packages/gen-game` whose CLI, run as `pnpm gen-game <name>`, copies `apps/scratch-card-example` to `apps/<name>`, skipping build output, caches and installed packages, and replaces both name forms (`scratch-card-example` → `<name>`, `ScratchCardExampleSDK` → `<Pascal>SDK`) in every copied file that holds them. A pure-ish core `generateGame({ templateDir, appsDir, packagesDir, name })` does validation, copy, replacement, the leftover-name check and cleanup on failure, using only `node:fs`/`node:path`; it returns a result object and never exits the process. A thin `cli.ts` resolves the real repository folders, calls the core, prints the message or next steps and sets the exit code. The CLI runs from TypeScript source on Node 24 (built-in type stripping, as `spec-diff` and the template's `devSdk` already do). Research: [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript (repo's `typescript` 7.0.2), ESM, Node 24 run from source (type stripping; erasable syntax only)

**Primary Dependencies**: none at runtime (Node built-ins `node:fs`, `node:path`, `node:url`). Dev: `@repo/eslint-config`, `@repo/typescript-config`, `@types/node` 24.19.2, `eslint` 10.9.1, `typescript` 7.0.2, `vitest` 5.1.0, all the exact versions `packages/spec-diff` already uses

**Storage**: files: reads the template folder, writes one new `apps/<name>` folder

**Testing**: Vitest 5.1.0, colocated `*.test.ts`, test names tagged `[004:FR-###]`; every test writes only to `os.tmpdir()` folders (FR-002, SC-005)

**Target Platform**: Node 24 on developer machines (Windows, macOS, Linux) and CI (`ubuntu-latest`)

**Project Type**: CLI plus a library core, in one workspace package

**Performance Goals**: the template has ~25 small files; a single synchronous pass is well under 1 s, no special work needed

**Constraints**: repo lint limits `max-lines-per-function` 60 and `max-lines` 400; no new dependencies (FR-016); never overwrite (FR-012); template read only (FR-011)

**Scale/Scope**: one game per run; one template

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Spec-First | Spec 004 v0.1.0 (Draft) drives this plan; it becomes Approved when the owner merges the PR. Every behavior below traces to an FR | Pass (pending owner approval) |
| II. Humans Decide | Spec, plan and tasks are AI drafts; nothing takes effect until the owner approves the PR | Pass |
| III. Verified Against the Spec | Every FR-001..FR-016 gets at least one test tagged `[004:FR-###]`, written and seen failing before its code (tasks order red before green). FR-014 has a tagged test of the parts that can run on temporary folders, plus the end-to-end quickstart step (spec Assumption 3) | Pass (enforced in tasks) |
| IV. Simplicity | No new dependency (all dev tools already in the lockfile at the same versions). The new package itself is asked for by the issue. One core function, one name-rule module, one CLI file; no templating engine, no file-list config | Pass |
| V. No Secrets or Personal Data | The generator handles only file paths and game names; fixtures are made-up file contents | Pass |

**Post-design re-check (after Phase 1)**: unchanged. The design adds no service or abstraction beyond the core function the issue asks for.

## New dependencies

None. `packages/gen-game` lists in `devDependencies` only packages already in `pnpm-lock.yaml` at the same exact versions (`@types/node` 24.19.2, `eslint` 10.9.1, `typescript` 7.0.2, `vitest` 5.1.0) plus the workspace configs; the lockfile is updated by `pnpm install`, never by hand.

## Project Structure

### Documentation (this feature)

```text
specs/004-gen-game/
├── spec.md              # Spec (v0.1.0, Draft)
├── plan.md              # This file
├── research.md          # R1–R7 decisions
├── data-model.md        # GameName, GenerateOptions, GenerateResult, flow
├── quickstart.md        # End-to-end validation (incl. FR-014 on the real apps/)
├── contracts/
│   └── cli.md           # Invocation, messages, exit codes, core function signature
├── checklists/
│   └── requirements.md
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
package.json                         # + "gen-game": "node packages/gen-game/src/cli.ts"
packages/gen-game/
├── package.json                     # @repo/gen-game, scripts lint/check-types/test, bin gen-game
├── tsconfig.json                    # same shape as packages/spec-diff
├── eslint.config.js                 # re-exports @repo/eslint-config/base
├── README.md                        # usage and what the generator does
└── src/
    ├── names.ts                     # TEMPLATE_NAME, TEMPLATE_GLOBAL, isKebabCase, toSdkGlobalName
    ├── names.test.ts
    ├── generate.ts                  # generateGame(options): GenerateResult; copy, replace, verify, cleanup
    ├── generate.test.ts             # temp template → temp apps: file list, contents, byte-identity, template unchanged
    ├── generate.errors.test.ts      # rejections, never-overwrite, cleanup on failure
    ├── generate.template.test.ts    # real template (read only) → temp apps: list equals git-tracked files, no leftovers
    ├── cli.ts                       # argv → generateGame → stdout/stderr + exit code; formatNextSteps
    ├── cli.test.ts                  # spawns the CLI for usage and rejection cases (nothing written); formatNextSteps; root script
    ├── deps.test.ts                 # no runtime deps; production files import only Node built-ins (FR-016)
    └── fixtures.ts                  # test helper: temp repo, default fixture template, tree read/list/hash
```

**Structure Decision**: one new workspace package under `packages/`, laid out like `packages/spec-diff` (CLI + core in `src/`, colocated tests, no build step). The root `package.json` gets the `gen-game` script. The template app is not changed.

## Complexity Tracking

No violations.
