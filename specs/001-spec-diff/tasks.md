# Tasks: Spec Diff Check

**Input**: Design documents from `specs/001-spec-diff/`: [plan.md](plan.md), [spec.md](spec.md) (v1.0.0), [research.md](research.md), [data-model.md](data-model.md), [contracts/cli.md](contracts/cli.md), [quickstart.md](quickstart.md)

**Tests**: Required (constitution III). Every logic task follows the same order: a **stub** so the test compiles (Phase 2), then **tests** that fail on behavior (wrong values), not on import or type errors, then the **implementation**. Every test name starts with its tag, e.g. `test("[001:FR-004] lists an ID only in new as added", …)`.

**Whole-value assertions**: every test compares the **whole** value with `toEqual`: the full `entries` map, the full `DiffResult`, the full output string or the full JSON object. A test never checks only that something is absent ("`FR-006a` is not an entry"), because that already passes on a stub that returns empty values. This is what makes T014, T023 and T031 achievable: every new test fails before its code exists.

**Out of scope**: wiring the check into CI, and any `.prettierignore` change (both owner decisions).

**Organization**: grouped by user story. Within each story, all of the story's tests are written first, then seen failing, then implemented.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1, US2 or US3 from spec.md
- All paths are relative to the repo root. Commands run from the repo root.
- Rules every source file follows: ESM; relative imports end in `.ts`; erasable syntax only (no `enum`, `namespace` or parameter properties, research R3); functions ≤ 60 lines and files ≤ 400 lines (repo lint). If a test file nears 400 lines, split it by topic (e.g. `diff.errors.test.ts`).

---

## Phase 1: Setup

**Purpose**: create the `packages/spec-diff` workspace package (plan.md › Project Structure).

- [X] T001 Create `packages/spec-diff/package.json`: `"name": "@repo/spec-diff"`, `"version": "0.0.0"`, `"type": "module"`, `"private": true`, `"bin": { "spec-diff": "./src/cli.ts" }`, scripts `"lint": "eslint . --max-warnings 0"`, `"check-types": "tsc --noEmit"`, `"test": "vitest run"`; devDependencies `"@repo/eslint-config": "workspace:*"`, `"@repo/typescript-config": "workspace:*"`, `"eslint": "10.9.1"`, `"typescript": "7.0.2"`, `"vitest": "5.1.0"` (the versions already in `packages/eslint-config/package.json`), and `"@types/node"` pinned to an exact 24.x version published at least two weeks ago (research R5; the only new dependency)
- [X] T002 [P] Create `packages/spec-diff/tsconfig.json`: `"extends": "@repo/typescript-config/base.json"`, compilerOptions `"noEmit": true`, `"allowJs": true`, `"checkJs": true` (same as `packages/eslint-config/tsconfig.json`, so `eslint.config.js` is an input and `tsc` doesn't fail with "No inputs were found" before `src/` exists), `"allowImportingTsExtensions": true`, `"erasableSyntaxOnly": true`, `"types": ["node"]`, `"include": ["*.js", "src"]`
- [X] T003 [P] Create `packages/spec-diff/eslint.config.js` containing only `export { config as default } from "@repo/eslint-config/base";`
- [X] T004 Run `pnpm install` (updates `pnpm-lock.yaml`; the PR will need the `deps-approved` label), then `pnpm --filter @repo/spec-diff lint` and `pnpm --filter @repo/spec-diff check-types`, and confirm both pass. If TypeScript 7.0.2 rejects `erasableSyntaxOnly` or `allowImportingTsExtensions`, stop and report to the owner (plan risk); don't switch to a build step on your own

---

## Phase 2: Foundational (stubs and fixtures)

**Purpose**: give every test something to import, so that the tests fail on behavior. Stubs return well-typed **wrong** values; they never throw.

**⚠️ CRITICAL**: no story work begins until this phase is done.

- [X] T005 Create `packages/spec-diff/src/diff.ts` with the types from data-model.md, exported: `SpecInput = { path: string; text: string } | { path: string; readError: string }` ("Exactly one of `text` / `readError` is set"); `SpecError = { code: "unreadable-file" | "missing-version" | "invalid-version" | "duplicate-id" | "version-not-bumped"; file: string; message: string }` (message "starts with the path"); `IdChanges = { added: string[]; removed: string[]; changed: string[] }`; `ParsedSpec = { version: string | null; versionLine: number | null; entries: Map<string, string>; errors: SpecError[]; body: string }`; `DiffResult = { result: "pass" | "rule-violation" | "input-error"; files: { old: string; new: string }; versions: { old: string | null; new: string | null }; contentChanged: boolean | null; fr: IdChanges; sc: IdChanges; errors: SpecError[] }`. Add stubs `export function parseSpec(path: string, text: string): ParsedSpec` (the path is passed in so error messages can start with it, FR-006) returning `{ version: null, versionLine: null, entries: new Map(), errors: [], body: "" }` and `export function diffSpecs(oldSpec: SpecInput, newSpec: SpecInput): DiffResult` returning `result: "input-error"`, the two paths, null versions, `contentChanged: null`, empty lists and no errors
- [X] T006 [P] Create `packages/spec-diff/src/format.ts` with stubs `export function formatText(r: DiffResult): string` and `export function formatJson(r: DiffResult): string`, both returning `""`
- [X] T007 [P] Create `packages/spec-diff/src/cli.ts`: first line `#!/usr/bin/env node`, a stub that writes nothing and sets `process.exitCode = 2`
- [X] T008 [P] Create `packages/spec-diff/src/fixtures.ts`, a test helper: `export function makeSpec(opts: { version?: string | null; fr?: Record<string, string>; sc?: Record<string, string>; extra?: string }): string`. Keys of `fr`/`sc` are full IDs (`{ "FR-001": "text" }`), written in insertion order. A `Record` can't hold a duplicate ID, so tests that need one (T020, T022) add the second bullet through `extra`. It builds a minimal spec in the template's shape: a title; a `**Version**: x.y.z` line (left out when `version` is `null`; default `1.0.0`); `### Functional Requirements` followed by `- **FR-NNN**: text` bullets; `### Measurable Outcomes` followed by `- **SC-NNN**: text` bullets; and `extra` appended at the end. It contains no real names or secrets (constitution V)
- [X] T009 Run `pnpm --filter @repo/spec-diff lint` and `pnpm --filter @repo/spec-diff check-types`; both pass

**Checkpoint**: stubs compile; story work can start.

---

## Phase 3: User Story 1 - Reviewer sees what changed in a spec (Priority: P1) 🎯 MVP

**Goal**: `node packages/spec-diff/src/cli.ts <old> <new>` prints both Versions and the added, removed and changed FR and SC IDs, and exits 0.

**Independent test**: two fixture specs that differ by one added FR, one removed SC and one reworded FR, plus a version bump. The readable report lists exactly those three IDs and shows `1.0.0 -> 1.1.0`.

### Tests for User Story 1 (write first, see them fail)

- [X] T010 [P] [US1] In `packages/spec-diff/src/diff.test.ts`, write `parseSpec` tests (research R1). Call it as `parseSpec("a.md", text)`. `[001:FR-002]`: reads `1.2.3` from `**Version**: 1.2.3`; with two Version lines (`1.0.0`, then `2.0.0`) the version is `1.0.0`; with a fenced `**Version**: 9.9.9` before a real `**Version**: 1.0.0` the version is `1.0.0`. `[001:FR-003]`, each comparing the whole `entries` map: `FR-001` and `SC-001` with their normalized texts; an entry with indented continuation lines has the joined text; entries end at a blank line, at the next `- `/`* ` bullet and at a `#` heading (the text after them isn't part of the entry); a spec with `FR-001` plus a fenced (` ``` ` and `~~~`) `FR-002` gives exactly `{ FR-001 }`; a spec with `FR-001`, `FR-006a` and indented `  - **FR-007**:` gives exactly `{ FR-001 }` (owner decision, plan Resolved Questions 3); CRLF and LF versions of the same spec give equal maps
- [X] T011 [P] [US1] In `packages/spec-diff/src/diff.test.ts`, write `diffSpecs` tests, using `makeSpec` for both sides. Each test compares the whole `DiffResult`. `[001:FR-004]`: an ID only in new is `added`, only in old is `removed`, in both with different text is `changed`; FR and SC are reported separately; lists are sorted by number (`FR-002` before `FR-010`); reordering entries with the same text gives `pass` with empty lists; a renumbered entry (FR-004 → FR-005, same text) gives FR-004 removed and FR-005 added; two generated specs with 200 FR and 200 SC entries each, with a known set of added, removed and changed IDs, give exactly those lists (large-input correctness; the timing bound is the separate T011b test). `[001:FR-005]`: re-wrapping an entry or changing its spacing gives `contentChanged: false` and empty lists; the same spec with CRLF line endings in one file and LF in the other gives `contentChanged: false` (spec Assumptions); changing only the Version line (`1.0.0` → `1.0.1`) gives `"pass"`, `contentChanged: false` and empty lists (moved here from US2 so it fails on the stub). `[001:FR-009]`: identical files give `result: "pass"`, `contentChanged: false`, all lists empty; a change plus a version bump gives `"pass"`. `[001:FR-010]`: `1.2.0 → 1.1.0` with a change gives `"pass"` and no error
- [X] T011b [P] [US1] In `packages/spec-diff/src/diff.test.ts`, write the `[001:SC-004]` timing test, kept separate from the ID-list test in T011: build two generated specs with 200 FR and 200 SC entries each, call `diffSpecs` once untimed (warm-up), then time one call with `performance.now()`. Assert with `toEqual` that the result equals the same expected `DiffResult` as the 200-entry FR-004 test in T011 (one shared generator and expected value in the test file; the stub returns `"input-error"`, so the test fails on it), and that elapsed is `< 1000` ms. 1000 ms is the SC-004 bound; the expected time is a few milliseconds, so there is about 100× headroom and the test shouldn't flake in CI
- [X] T012 [P] [US1] In `packages/spec-diff/src/format.test.ts`, write `formatText` tests against contracts/cli.md › Human-readable output. `[001:FR-007]` (readable form): the exact lines `old.md -> new.md`, `Version: 1.0.0 -> 1.1.0`, `Content changed: yes`, `FR added: FR-004`, `FR removed: none`, `FR changed: FR-002`, the three `SC …` lines and `Result: pass`, in that order; lists are joined with `, `; identical files print `Content changed: no` and `none` on every list line
- [X] T013 [P] [US1] In `packages/spec-diff/src/cli.test.ts`, write CLI tests that spawn `process.execPath` with `packages/spec-diff/src/cli.ts` (resolve the path from `import.meta.dirname`) on files in a fresh `fs.mkdtempSync(os.tmpdir())` directory. `[001:FR-001]`: with two paths it prints the readable report to stdout and exits 0; with one or three paths it prints a usage line to stderr, nothing to stdout, and exits 2. `[001:FR-011]`: one successful run (exit 0, stdout equal to the expected report) after which both input files are byte-for-byte the same and the temp directory lists the same files. The exit-code and stdout assertions make it fail on the stub, which writes nothing (also covers SC-005)
- [X] T014 [US1] Run `pnpm --filter @repo/spec-diff test`. Confirm every test from T010–T013 (including T011b) fails on an assertion (wrong value or exit code), not on an import, type or syntax error. Record the failing count in the PR description. Also list which spec.md acceptance scenarios and edge cases the T011/T011b cases cover

### Implementation for User Story 1

- [X] T015 [US1] Implement `parseSpec(path, text)` in `packages/spec-diff/src/diff.ts` per research R1: turn `\r\n`/`\r` into `\n`; track ` ``` `/`~~~` fences; Version `^\*\*Version\*\*:\s*(\S+)\s*$`, first match wins, `versionLine` set; entry start `^- \*\*(FR|SC)-(\d+)\*\*:`; the entry runs until a blank line, `- `/`* `/`#` at column 0, or the end of the file; normalize text with "every run of whitespace, line breaks included, becomes one space, and leading/trailing whitespace is dropped"; `body` = normalized text without `versionLine`. Duplicate and version errors come in US2; for now keep the first entry for a repeated ID
- [X] T016 [US1] Implement `diffSpecs` in `packages/spec-diff/src/diff.ts` for readable inputs: parse both sides; `contentChanged = old.body !== new.body`; build `fr`/`sc` `IdChanges` sorted "by prefix, then by the number as an integer"; `result: "pass"`. Never compare version order or bump level (FR-010). Make T010, T011 and T011b pass
- [X] T017 [P] [US1] Implement `formatText` in `packages/spec-diff/src/format.ts` per contracts/cli.md (success path). Make T012 pass
- [X] T018 [US1] Implement `packages/spec-diff/src/cli.ts`: argv = `process.argv.slice(2)`; if not exactly two paths, write `usage: spec-diff [--json] <old-spec> <new-spec>` to stderr and exit 2; read each file with `fs.readFileSync(path, "utf8")`; on a read failure build `{ path, readError: err.code }` instead of throwing; `diffSpecs` → `formatText` → stdout; `process.exitCode = 0` for `pass`, `2` otherwise (US2 adds `1`). Wrap the whole run in one `try/catch` that writes `internal error: <message>` to stderr and exits 2 (research R4). The file does nothing but I/O. Make T013 pass
- [X] T019 [US1] Run `pnpm --filter @repo/spec-diff lint check-types test`; everything passes

**Checkpoint**: the MVP works. A reviewer can run the check locally (quickstart scenarios 1, 3 and 4).

---

## Phase 4: User Story 2 - CI fails a spec change that skipped the version bump (Priority: P2)

**Goal**: a content change without a version bump exits 1; input problems exit 2, all of them reported in one run.

**Independent test**: two fixtures with different FR-002 text and the same `1.0.0` exit 1 with the `version-not-bumped` error; with `1.0.1` they exit 0.

### Tests for User Story 2 (write first, see them fail)

- [X] T020 [P] [US2] In `packages/spec-diff/src/diff.test.ts` (split into `diff.errors.test.ts` if near 400 lines), write tests. `[001:FR-005]`: changed FR text with equal versions gives `result: "rule-violation"` and one error `{ code: "version-not-bumped", file: <new path>, message: "<new path>: content changed but Version is still 1.0.0" }`; a change only in `extra` (outside FR/SC) also gives `rule-violation` (the Version-line-only case moved to T011). `[001:FR-006]`: a `readError` side gives `unreadable-file` with message `<path>: cannot read file (ENOENT)`; no Version line gives `missing-version`; `**Version**: 1.0` gives `invalid-version` and `versions.<side>: null`; two `FR-003` bullets give one `duplicate-id` error, `<path>: FR-003 is defined 2 times`; every message starts with its path; an input error plus a content change without a bump gives `"input-error"` only (precedence). `[001:FR-012]`: errors in both files are all returned, old-file errors before new-file errors, and within one file the `unreadable-file` or Version error first, then `duplicate-id` errors sorted by ID; with any input error, `contentChanged` is `null`, all lists are empty, and there is no `version-not-bumped` error
- [X] T021 [P] [US2] In `packages/spec-diff/src/format.test.ts`, write `[001:FR-006]` tests for `formatText` on errors, each comparing the whole output string: a rule-violation result prints the full report with `error: <message>` just before `Result: rule-violation`; an input-error result with a missing old version prints exactly the files line, `Version: ? -> 1.0.0`, one `error:` line per error and `Result: input-error` (no `Content changed` or list lines)
- [X] T022 [P] [US2] In `packages/spec-diff/src/cli.test.ts`, write tests that each compare the exit code and the whole stdout with an expected report written literally in the test (temp paths filled in). `[001:FR-005]`: a content change without a bump → exit 1 and the full rule-violation report. `[001:FR-006]`: a missing old path → exit 2 and the full input-error report, whose only error line is `error: <old path>: cannot read file (ENOENT)`. `[001:FR-012]`: a new file with no Version line and a duplicate ID → exit 2 and the full report with both error lines, `missing-version` first, then `duplicate-id`
- [X] T023 [US2] Run `pnpm --filter @repo/spec-diff test`. Confirm every new test from T020–T022 fails on an assertion, and that the US1 tests still pass. Confirm SC-001 here, before any US2 code: at least 10 old/new `diffSpecs` cases across T011, T011b and T020, together covering every acceptance scenario and edge case in spec.md. Add any missing cases now, so they too are seen failing first

### Implementation for User Story 2

- [X] T024 [US2] Extend `parseSpec` in `packages/spec-diff/src/diff.ts`: no Version line → `missing-version` (`<path>: no "**Version**: x.y.z" line`); value not matching `^\d+\.\d+\.\d+$` → `invalid-version` (`<path>: Version "<value>" is not in x.y.z form`) with `version` null; "An ID seen more than once → one `duplicate-id` error per ID, giving the count". Messages start with the `path` argument of `parseSpec(path, text)`. Order within a file: the Version error first, then `duplicate-id` errors sorted by ID
- [X] T025 [US2] Extend `diffSpecs` in `packages/spec-diff/src/diff.ts` with the decision flow from data-model.md: collect `unreadable-file` and parse errors from both sides (old first); any input error → `"input-error"`, `contentChanged: null`, empty lists; otherwise, if `contentChanged` and the versions are equal → add `version-not-bumped` and return `"rule-violation"`. Make T020 pass
- [X] T026 [P] [US2] Extend `formatText` in `packages/spec-diff/src/format.ts` for errors, `?` versions and the shorter `input-error` report. Make T021 pass
- [X] T027 [US2] In `packages/spec-diff/src/cli.ts`, map `result` to the exit code: `pass` → 0, `rule-violation` → 1, `input-error` → 2 (contracts/cli.md › Exit codes). Make T022 pass
- [X] T028 [US2] Run `pnpm --filter @repo/spec-diff lint check-types test`; everything passes

**Checkpoint**: US1 and US2 both work (quickstart scenarios 2, 5 and 6).

---

## Phase 5: User Story 3 - An automated step reads the result (Priority: P3)

**Goal**: `--json` prints exactly one JSON document with the same content as the readable report.

**Independent test**: one input pair run in both forms; the JSON parses and carries the same versions, IDs and errors.

### Tests for User Story 3 (write first, see them fail)

- [X] T029 [P] [US3] In `packages/spec-diff/src/format.test.ts`, write `[001:FR-007]` tests for `formatJson` against contracts/cli.md › Machine-readable output: `JSON.parse(out)` equals (`toEqual`) the full expected object `{ schemaVersion: 1, result, files, versions, contentChanged, fr, sc, errors }` written literally in the test (key order has no meaning, contracts/cli.md); a separate assertion checks that `out` ends with exactly one `\n` (ends with `"\n"`, not with `"\n\n"`). Also a same-content test: for a pass, a rule-violation and an input-error result, every version, ID and error message in the JSON also appears in `formatText` output (SC-003)
- [X] T030 [P] [US3] In `packages/spec-diff/src/cli.test.ts`, write `[001:FR-008]`: with `--json` first, last or between the paths, `JSON.parse(stdout)` equals (`toEqual`) the full expected object written literally in the test, and the exit code matches `result`; any extra text on stdout makes `JSON.parse` throw, which fails the test; `--json` with one path → stdout empty, usage on stderr, exit 2; an unknown flag with one path, `--yaml <path>` → stdout empty, usage on stderr, exit 2 (two arguments, so the US1 code reads `--yaml` as a path and prints a report; that is what makes the test fail before T033)
- [X] T031 [US3] Run `pnpm --filter @repo/spec-diff test`. Confirm the T029–T030 tests fail on an assertion and all earlier tests still pass

### Implementation for User Story 3

- [X] T032 [P] [US3] Implement `formatJson` in `packages/spec-diff/src/format.ts`: `JSON.stringify({ schemaVersion: 1, ...fields from the contract }, null, 2) + "\n"`. Make T029 pass
- [X] T033 [US3] In `packages/spec-diff/src/cli.ts`, take `--json` from any position; any other argument starting with `-` is a usage error (exit 2, nothing on stdout); with `--json`, print `formatJson` instead of `formatText`. Make T030 pass
- [X] T034 [US3] Run `pnpm --filter @repo/spec-diff lint check-types test`; everything passes

**Checkpoint**: all three stories work (quickstart scenario 7).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T035 [P] Re-check SC-001 (counted in T023): at least 10 old/new `diffSpecs` cases in `packages/spec-diff/src/diff*.test.ts`, covering every acceptance scenario and edge case in spec.md. Add no tests here; if a gap is found, stop and report it to the owner, because a test added after the code can't be seen failing on a stub (CLAUDE.md Rule 2)
- [X] T036 Check tag coverage: `grep -rhoE "\[001:FR-[0-9]{3}\]" packages/spec-diff/src | sort -u` prints all of FR-001 to FR-012, and every `test(`/`it(` name in `packages/spec-diff/src/*.test.ts` starts with a `[001:` tag
- [X] T037 Run quickstart.md › Manual scenarios 1–8 against the real spec (copies go in a temp directory, not the repo). Check each exit code with `$LASTEXITCODE` (PowerShell) or `echo $?` (bash), and confirm `git status` shows no files created or changed by the tool
- [X] T038 Run the full repo gate `pnpm turbo run lint check-types test --continue` (the same command as the CI `verify` job); everything passes

---

## Dependencies & Execution Order

- **Setup (T001–T004)** → **Foundational (T005–T009)** → stories.
- **US1 (T010–T019)** depends only on Foundational. **US2 (T020–T028)** extends the same three files, so it starts after US1's implementation (T015–T018). **US3 (T029–T034)** depends only on the `DiffResult` shape and the CLI from US1; it can run after US1, before or after US2. If it runs before US2, T029's rule-violation and input-error cases are built by hand rather than with `diffSpecs`.
- **Inside each story**: tests → seen failing (T014 / T023 / T031) → implementation → green run.
- **Polish (T035–T038)** after all stories. The SC-004 timing test is T011b in US1, so it is written test-first like the others.

## Parallel Opportunities

- T002, T003 together; T006, T007, T008 together (after T005).
- US1 tests: T010+T011+T011b (`diff.test.ts`) can go to one agent while T012 (`format.test.ts`) and T013 (`cli.test.ts`) go to others. T017 (`format.ts`) runs alongside T015–T016 (`diff.ts`).
- US2 tests T020, T021, T022 in parallel (three files); T026 alongside T024–T025.
- US3: T029 and T030 in parallel; T032 alongside the start of T033.

## Implementation Strategy

1. **MVP**: Setup, Foundational, then US1. Stop and check quickstart scenarios 1, 3 and 4. A reviewer can already use the tool.
2. **US2**: adds the version-bump rule and the input errors, i.e. what CI needs. Wiring it into CI is a separate tooling change.
3. **US3**: adds `--json` for the later AI step.
4. **Polish**: SC-001 case count, tag coverage, quickstart, full repo gate.

Commit after each green run (T019, T028, T034, T038) so every commit passes lint, types and tests.
