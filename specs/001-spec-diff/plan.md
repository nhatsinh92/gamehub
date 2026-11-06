# Implementation Plan: Spec Diff Check

**Branch**: `001-spec-diff` | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md) (v1.0.0, Approved)

**Input**: Feature specification from `specs/001-spec-diff/spec.md`

## Summary

A CLI that takes the old and new contents of one spec file and reports both Versions, the FR and SC IDs that were added, removed or changed, and any errors. It fails when the content changed but the Version did not. A pure core (`diffSpecs`) does all the logic on strings; a thin CLI wrapper reads the two files, prints the readable or JSON report, and exits 0 / 1 / 2. Parsing is line-based, with no Markdown parser. The CLI runs straight from TypeScript source with Node 24 and has no build step. Research: [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript (repo's `typescript` 7.0.2), ESM, Node 24 (run from source via built-in type stripping, research R3)

**Primary Dependencies**: none at runtime. Dev: `@repo/typescript-config`, `@repo/eslint-config`, `eslint`, `typescript`, `vitest` (versions already in the lockfile), plus `@types/node` 24.x (new, research R5)

**Storage**: N/A (reads two files, writes nothing; FR-011)

**Testing**: Vitest 5.1.0, colocated `*.test.ts`, test names tagged `[001:FR-###]`

**Target Platform**: Node 24 on developer machines (Windows, macOS, Linux) and CI (`ubuntu-latest`)

**Project Type**: CLI plus a pure library core, in one workspace package

**Performance Goals**: under 1 s for a 200-requirement spec (SC-004); a single pass over two small strings, so no special work is needed

**Constraints**: repo lint limits of `max-lines-per-function` 60 and `max-lines` 400; erasable TypeScript syntax only (no `enum` or `namespace`); stdout is JSON only in `--json` mode (FR-008); no file writes (FR-011)

**Scale/Scope**: one spec pair per run; specs are tens to a few hundred lines

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Spec-First | Spec v1.0.0 is Approved; every behavior in this plan traces to an FR | Pass |
| II. Humans Decide | Plan is a draft. It takes effect only when the owner approves the PR; the open questions below are for the owner | Pass |
| III. Verified Against the Spec | Every FR-001..FR-012 gets at least one test tagged `[001:FR-###]`; tasks will order each test before its code and require seeing it fail | Pass (enforced in tasks) |
| IV. Simplicity | No runtime dependency. One new dev dependency, `@types/node`, is weighed against two no-dependency options in research R5. The new package itself was decided by the owner. No Markdown parser (R1), no `tsx` or build step (R3) | Pass, **pending owner approval of `@types/node`** (`deps-approved` label) |
| V. No Secrets or Personal Data | Test fixtures are small made-up spec strings; errors print only paths and IDs | Pass |

**Post-design re-check (after Phase 1)**: unchanged. The design adds no service, abstraction layer or dependency beyond those above. Two pure modules (`diff.ts`, `format.ts`), one I/O module (`cli.ts`) and one test helper (`fixtures.ts`) is the minimum split that keeps each file under the lint limits and keeps I/O out of the core.

## Project Structure

### Documentation (this feature)

```text
specs/001-spec-diff/
├── spec.md              # Approved spec (v1.0.0), not edited by this plan
├── plan.md              # This file
├── research.md          # R1–R5 decisions
├── data-model.md        # SpecInput, ParsedSpec, DiffResult, decision flow
├── quickstart.md        # End-to-end validation scenarios
├── contracts/
│   └── cli.md           # Invocation, exit codes, error codes, JSON and text output
└── tasks.md             # Created by /speckit-tasks
```

### Source Code (repository root)

```text
packages/spec-diff/
├── package.json         # @repo/spec-diff, "type": "module", private, bin: spec-diff → src/cli.ts;
│                        # scripts: lint, check-types (tsc --noEmit), test (vitest run)
├── tsconfig.json        # extends @repo/typescript-config/base.json; noEmit, allowJs, checkJs
│                        # (as packages/eslint-config), allowImportingTsExtensions, erasableSyntaxOnly, types: ["node"]
├── eslint.config.js     # re-exports @repo/eslint-config/base (same as packages/eslint-config)
└── src/
    ├── diff.ts          # pure: parseSpec(path, text) + diffSpecs(old: SpecInput, new: SpecInput): DiffResult
    ├── diff.test.ts     # FR-002..FR-006, FR-009, FR-010, FR-012 and edge cases, on strings
    ├── format.ts        # pure: formatText(result), formatJson(result)
    ├── format.test.ts   # FR-007 (same content in both forms), contract output shape
    ├── fixtures.ts      # test helper: makeSpec() builds small spec strings for the tests
    ├── cli.ts           # I/O only: parse argv, read files, print, set exit code
    └── cli.test.ts      # FR-001, FR-008, FR-011 and exit codes: spawns `node src/cli.ts` on temp files
```

**Structure Decision**: one new workspace package, `packages/spec-diff` (owner decision). `pnpm-workspace.yaml` already includes `packages/*`, and the CI `verify` job runs `lint check-types test` for every package, so no CI change is needed for the package's own checks. Running the check on PR specs is out of scope (owner decision).

## Resolved Questions (owner, 2026-11-06; spec.md not edited)

1. **The formatter changes more than whitespace.** Prettier rewrites `*text*` to `_text_` and `*` list markers to `-`, which FR-005 counts as content changes. **Decision:** `specs/` will be excluded from Prettier via `.prettierignore`, as a separate tooling change outside this plan. The spec stays as is, and the plan implements FR-005 as written.
2. **More than one `**Version**:` line.** **Decision:** use the first one outside code fences, with no error (research R1).
3. **IDs outside the `- **FR-NNN**:` form** (e.g. `FR-006a`) are not listed as entries. Changes to them are still caught by the whole-file comparison. **Decision:** accepted.

## Risks

- **Lockfile change.** A new package with devDependencies changes `pnpm-lock.yaml`, so the PR needs the `deps-approved` label ([docs/sdd/ci.md](../../docs/sdd/ci.md)).
- **Type stripping under `node_modules`.** Node won't strip types for a `.ts` file whose real path is inside `node_modules`. Workspace links resolve to `packages/`, so this is fine inside the repo; it would break only if the package were published and installed. It is private.

## Complexity Tracking

No constitution violations to justify.
