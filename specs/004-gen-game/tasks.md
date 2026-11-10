# Tasks: gen-game

**Input**: Design documents from `specs/004-gen-game/`: [plan.md](plan.md), [spec.md](spec.md) (v0.1.0), [research.md](research.md), [data-model.md](data-model.md), [contracts/cli.md](contracts/cli.md), [quickstart.md](quickstart.md)

**Tests**: Required (constitution III). Order for everything tested: a **stub** (or the unchanged starting state) so tests compile, then the **tests**, seen failing on an assertion (not an import or type error), then the **implementation**. Commit `test(red): …` with the failing tests, then `feat(green): …`. Every test name starts with its tag, e.g. `test("[004:FR-009] replaces both name forms", …)`.

**Whole-value assertions (CLAUDE.md Rule 2)**: compare whole values with `toEqual`: the whole sorted list of created relative paths, the whole content of each created file (as a `Record<path, string>`), the whole `GenerateResult` object, the whole `{ status, stdout, stderr }` of a CLI run, the whole sorted listing of a folder before and after a rejection. "Nothing written" is proved by comparing the whole listing to the exact listing before the run, never by `not.toContain` alone.

**Stub rule**: stubs return well-typed **wrong** values: `isKebabCase` → `false`, `toSdkGlobalName` → `""`, `generateGame` → `{ ok: false, error: "write-failed", message: "" }` without touching the file system, `findNameLeftovers` → `[]`, `formatNextSteps` → `""`, `cli.ts` entry → exit 0 with no output. Stubs import nothing from Node. Every test then fails on an assertion.

**Temporary folders only (FR-002, SC-005)**: every test that writes creates its folders under `fs.mkdtempSync(path.join(os.tmpdir(), "gen-game-"))` and removes them in `afterEach`; no test writes under the real `apps/` or `packages/`. Reading the real template (T013) and running the CLI on inputs it rejects before any write (T019) are allowed.

**Out of scope**: a spec for the new game, gameplay/art/sound, Storybook entries (spec Assumptions); no change to `apps/scratch-card-example` (FR-011).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US3 from spec.md
- Paths are relative to the repo root; `PKG` = `packages/gen-game`.
- Rules for every source file: ESM; relative imports end in `.ts`; erasable syntax only (no `enum`, `namespace`, parameter properties); functions ≤ 60 lines, files ≤ 400 lines (repo lint), so tests are split by topic into files and grouped in small `describe` blocks; production files import only Node built-ins (FR-016): `generate.ts` exactly `node:fs` and `node:path`, `cli.ts` exactly `node:url` (plus local `.ts` modules); tests may also use `node:os`, `node:child_process`, `node:crypto`.

---

## Phase 1: Setup

**Purpose**: create the `packages/gen-game` workspace package (plan.md › Project Structure). The root `gen-game` script is added later (T016), after its test.

- [X] T001 Create `PKG/package.json`: `"name": "@repo/gen-game"`, `"version": "0.0.0"`, `"type": "module"`, `"private": true`, `"bin": { "gen-game": "./src/cli.ts" }`, scripts `"lint": "eslint . --max-warnings 0"`, `"check-types": "tsc --noEmit"`, `"test": "vitest run"`; devDependencies exactly as `packages/spec-diff/package.json`: `"@repo/eslint-config": "workspace:*"`, `"@repo/typescript-config": "workspace:*"`, `"@types/node": "24.19.2"`, `"eslint": "10.9.1"`, `"typescript": "7.0.2"`, `"vitest": "5.1.0"`. No `dependencies` key (FR-016, plan › New dependencies: none)
- [X] T002 [P] Create `PKG/tsconfig.json` identical to `packages/spec-diff/tsconfig.json` and `PKG/eslint.config.js` containing `export { config as default } from "@repo/eslint-config/base";`
- [X] T003 Run `pnpm install` (updates `pnpm-lock.yaml` with the new importer only; never edit it by hand). Check with `git diff pnpm-lock.yaml` that no new package version was added (only the `packages/gen-game` importer); if one was, fix the versions in T001 to match the lockfile

---

## Phase 2: Foundational (stubs, fixtures, name rules)

**Purpose**: the modules every story imports. **⚠️** No story work begins until this phase is done.

- [X] T004 Create stub `PKG/src/names.ts`: exports `TEMPLATE_NAME = "scratch-card-example"`, `TEMPLATE_GLOBAL = "ScratchCardExampleSDK"`, `isKebabCase(name: string): boolean` (stub `false`), `toSdkGlobalName(name: string): string` (stub `""`)
- [X] T005 Create stub `PKG/src/generate.ts` with the types from data-model.md (`GenerateOptions { templateDir: string; appsDir: string; packagesDir: string; name: string }`, `GenerateError = "not-kebab-case" | "template-name" | "name-taken" | "write-failed" | "names-left"`, `GenerateResult = { ok: true; targetDir: string; files: string[] } | { ok: false; error: GenerateError; message: string }`), `generateGame(options: GenerateOptions): GenerateResult` (stub `{ ok: false, error: "write-failed", message: "" }`) and `findNameLeftovers(dir: string): string[]` (stub `[]`)
- [X] T006 Create stub `PKG/src/cli.ts` (shebang `#!/usr/bin/env node`) exporting `formatNextSteps(name: string): string` (stub `""`); its entry code (run only when `process.argv[1]` is this file) does nothing (exit 0)
- [X] T007 Create test helper `PKG/src/fixtures.ts` (not a test file): `makeTempRepo()` creates `<tmp>/apps/scratch-card-example` and `<tmp>/packages/game-core/` and returns `{ root, templateDir, appsDir, packagesDir, cleanup }`; `writeTree(dir, files: Record<string, string | Buffer>)` writes the files (creating parent folders); `readTree(dir): Record<string, string>` returns every file under `dir` keyed by `/`-separated relative path (sorted keys); `listTree(dir): string[]` returns the sorted relative paths of all files; `hashTree(dir): Record<string, string>` returns sha256 per file. Default fixture template (`DEFAULT_TEMPLATE`): `package.json` = `{"name":"scratch-card-example","private":true}\n`, `README.md` = `# scratch-card-example\n\nUse ScratchCardExampleSDK.init; file scratch-card-example-sdk.js; apps/scratch-card-example\n`, `src/game-name.test.ts` = `expect(SDK).toEqual("ScratchCardExampleSDK"); // [003:FR-012] scratch-card-example\n`, `src/main.ts` = `export const x = 1;\n`, `.gitignore` = `dist/\n*.tsbuildinfo\n`, `assets/blob.bin` = bytes `[0,255,1,254]`, plus skipped paths `node_modules/a/index.js`, `dist/x.js`, `src/.turbo/log.txt`, `src/dist/y.js`, `tsconfig.tsbuildinfo`
- [X] T008 Write tests `PKG/src/names.test.ts`: `[004:FR-004]` the list of `isKebabCase` results over `["lucky-wheel","quiz","wheel-2","a1-b2","LuckyWheel","lucky_wheel","-lucky","lucky-","lucky--wheel","1lucky","","lucky wheel"]` equals `[true,true,true,true,false,false,false,false,false,false,false,false]`; `[004:FR-009]` the list of `toSdkGlobalName` results over `["scratch-card-example","lucky-wheel","quiz","wheel-2"]` equals `["ScratchCardExampleSDK","LuckyWheelSDK","QuizSDK","Wheel2SDK"]` (research R3). Run `pnpm --filter @repo/gen-game test`; see both fail on assertions
- [X] T009 Implement `PKG/src/names.ts`: `isKebabCase` uses exactly `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`; `toSdkGlobalName` splits on `-`, drops empty parts, capitalises the first letter of each part, joins and appends `SDK`. T008 passes

**Checkpoint**: name rules done and tested.

---

## Phase 3: User Story 1 - Developer creates a new game with one command (Priority: P1) 🎯 MVP

**Goal**: `generateGame` copies the template with both name forms replaced; `pnpm gen-game <name>` prints the next steps.

**Independent Test**: run the core on the fixture template into a temporary apps folder with `lucky-wheel`; compare the whole created tree and the whole result.

### Tests for User Story 1 (write first, see them fail)

- [X] T010 [P] [US1] Write tests in `PKG/src/generate.test.ts` using `makeTempRepo()` and `DEFAULT_TEMPLATE`:
  - `[004:FR-002]` `[004:FR-008]` the result equals `{ ok: true, targetDir: <appsDir>/lucky-wheel, files: [".gitignore","README.md","assets/blob.bin","package.json","src/game-name.test.ts","src/main.ts"] }` and `listTree(<appsDir>/lucky-wheel)` equals the same list (skipped: `node_modules/`, `dist/`, `.turbo/` at any depth, `*.tsbuildinfo`)
  - `[004:FR-009]` `readTree(<appsDir>/lucky-wheel)` without `assets/blob.bin` equals the whole expected record: `package.json` = `{"name":"lucky-wheel","private":true}\n`, `README.md` = `# lucky-wheel\n\nUse LuckyWheelSDK.init; file lucky-wheel-sdk.js; apps/lucky-wheel\n`, `src/game-name.test.ts` = `expect(SDK).toEqual("LuckyWheelSDK"); // [003:FR-012] lucky-wheel\n`, `src/main.ts` and `.gitignore` unchanged
  - `[004:FR-009]` files holding neither form are byte-identical: `readFileSync` of template and copy of `assets/blob.bin` are equal buffers (`toEqual`)
  - `[004:FR-010]` the list of created files whose text contains `scratch-card-example` or `ScratchCardExampleSDK` equals `[]`, for names `lucky-wheel` and `quiz` (each in its own temp repo)
  - `[004:FR-011]` `hashTree(templateDir)` (including skipped paths) before the run equals the one after
  - `[004:FR-015]` the list of `[003:FR-###]` tags (`/\[003:FR-\d{3}\]/g`) in the copied `src/game-name.test.ts` equals the list in the template file
- [X] T011 [P] [US1] Write tests in `PKG/src/cli.test.ts`, `describe("next steps")`: `[004:FR-013]` `formatNextSteps("lucky-wheel")` equals exactly `"Created apps/lucky-wheel\n\nNext steps:\n  pnpm install\n  pnpm --filter lucky-wheel dev\n"` (contracts/cli.md); `describe("root script")`: `[004:FR-001]` the root `package.json` `scripts["gen-game"]` equals `"node packages/gen-game/src/cli.ts"` (fails: the script is not added yet)
- [X] T012 [P] [US1] Write tests in `PKG/src/deps.test.ts`: `[004:FR-016]` `PKG/package.json` parsed has `dependencies` equal to `undefined` and `devDependencies` equal to the exact record from T001; the sorted list of non-relative import specifiers in `PKG/src/generate.ts` equals `["node:fs","node:path"]` and in `PKG/src/cli.ts` equals `["node:url"]` (read the files, match `from "<spec>"`; the stubs import nothing, so it fails)
- [X] T013 [P] [US1] Write tests in `PKG/src/generate.template.test.ts` (research R6a), running `generateGame` with `templateDir` = the real `apps/scratch-card-example` (resolved from `import.meta.url`), `appsDir` and `packagesDir` = empty temporary folders, name `lucky-wheel`:
  - `[004:FR-008]` `result.files` equals the template's git-tracked files (`git ls-files` with `cwd` = the template folder, sorted)
  - `[004:FR-009]` the created `package.json` parsed equals the template's parsed `package.json` with `name: "lucky-wheel"`
  - `[004:FR-010]` the list of created files containing either name form equals `[]`
  - `[004:FR-014]` the created `vite.config.ts`, `src/game-name.ts` and `src/sdk.ts` are byte-identical to the template's (the SDK global and file name are derived from `package.json` `name`, so the built file defines `window.LuckyWheelSDK`), and the created `src/game-name.test.ts` equals the template's text with `ScratchCardExampleSDK` → `LuckyWheelSDK` and `scratch-card-example` → `lucky-wheel`
  - `[004:FR-015]` the sorted list of `[003:FR-###]` tags across all created `*.test.ts(x)` files equals the list across the template's test files
- [X] T014 [US1] Run `pnpm --filter @repo/gen-game test`; see T010–T013 fail on assertions (not on import or type errors)

### Implementation for User Story 1

- [X] T015 [US1] Implement the success path of `generateGame` and `findNameLeftovers` in `PKG/src/generate.ts` (data-model.md › Flow, research R1, R4, R5), importing only `node:fs` and `node:path`: walk `templateDir` recursively, skipping directories named `node_modules`, `dist`, `.turbo` and files ending in `.tsbuildinfo`; create the target with non-recursive `mkdirSync(join(appsDir, name))`; for each file read a `Buffer`; if it includes `TEMPLATE_GLOBAL` or `TEMPLATE_NAME`, decode as UTF-8, `replaceAll(TEMPLATE_GLOBAL, toSdkGlobalName(name))` then `replaceAll(TEMPLATE_NAME, name)` and write the string, else write the same buffer; `findNameLeftovers(dir)` returns the sorted `/`-separated relative paths of files containing either form. Return `files` sorted and `/`-separated. Never write inside `templateDir`. Split walk / copy / scan helpers so each function is ≤ 60 lines
- [X] T016 [US1] Implement the success output in `PKG/src/cli.ts`, importing only `node:url`: `formatNextSteps(name)` returns exactly the text in contracts/cli.md; when run as entry with one argument it computes `root = fileURLToPath(new URL("../../../", import.meta.url))`, calls `generateGame({ templateDir: root + "apps/scratch-card-example", appsDir: root + "apps", packagesDir: root + "packages", name })` and on success writes `formatNextSteps(name)` to stdout with `process.exitCode = 0`. Add `"gen-game": "node packages/gen-game/src/cli.ts"` to the root `package.json` `scripts` (FR-001, research R7), keeping the other scripts unchanged. T010–T013 pass

**Checkpoint**: US1 works on temporary folders and from the CLI (try `pnpm gen-game demo-x`, inspect, then `rm -rf apps/demo-x`).

---

## Phase 4: User Story 2 - The new game passes every repository check without edits (Priority: P1)

**Goal**: prove FR-014 end to end (research R6b). Its automated part is T013; no new production code is expected. If a check fails, fix the generator, never the template (FR-011).

**Independent Test**: quickstart.md § 3.

- [X] T017 [US2] Run quickstart.md § 3 on the real repository: `pnpm gen-game lucky-wheel`, `pnpm install`, `pnpm turbo run lint check-types test buildSdk --filter=lucky-wheel`; all tasks pass with no edit, and the copied `[003:FR-013]` test confirms `apps/lucky-wheel/dist/lucky-wheel-sdk.js` defines exactly the `LuckyWheelSDK` global. Record the summary of the output for the PR description. Then `rm -rf apps/lucky-wheel`, `pnpm install`, and confirm `git status --porcelain` lists no `apps/lucky-wheel` and `pnpm-lock.yaml` has no `apps/lucky-wheel` importer

**Checkpoint**: a generated game is green on every repository check.

---

## Phase 5: User Story 3 - Wrong input is rejected and nothing is left behind (Priority: P2)

**Goal**: validation, never-overwrite and cleanup.

**Independent Test**: run the core on temporary folders with each invalid input and an injected failure; compare the whole result and the whole listing.

### Tests for User Story 3 (write first, see them fail)

- [X] T018 [P] [US3] Write tests in `PKG/src/generate.errors.test.ts` using `makeTempRepo()`; for each rejection compare the whole `GenerateResult` and assert `listTree(root)` after equals `listTree(root)` before:
  - `[004:FR-004]` `[004:FR-007]` each of `LuckyWheel`, `lucky_wheel`, `-lucky`, `lucky--wheel`, `1lucky`, `""` → `{ ok: false, error: "not-kebab-case", message: "\"<name>\" is not kebab-case (e.g. lucky-wheel)" }`
  - `[004:FR-005]` `[004:FR-007]` `scratch-card-example` → `{ ok: false, error: "template-name", message: "\"scratch-card-example\" is the template name; choose another name" }`
  - `[004:FR-006]` `[004:FR-007]` `game-core` (exists in `packagesDir`) → `{ ok: false, error: "name-taken", message: "\"game-core\" is already used by packages/game-core" }`
  - `[004:FR-006]` `[004:FR-012]` an existing `apps/lucky-wheel` holding `keep.txt` = `"mine"` → `{ ok: false, error: "name-taken", message: "\"lucky-wheel\" is already used by apps/lucky-wheel" }`, and `readTree(<appsDir>/lucky-wheel)` equals `{ "keep.txt": "mine" }`
  - `[004:FR-012]` half-way failure (research R4): add a dangling symlink `src/zz-broken.ts` → `<tmp>/missing` to the template (`test.skipIf(process.platform === "win32")`); `{ ok: r.ok, error: r.error, prefix: r.message.startsWith("could not create apps/lucky-wheel: ") }` equals `{ ok: false, error: "write-failed", prefix: true }` and `existsSync(<appsDir>/lucky-wheel)` equals `false`
  - `[004:FR-010]` leftover-name scan (replace-all leaves no name in practice, so the scan is tested directly): on a temp folder holding `a.txt` = `"x scratch-card-example"`, `sub/b.txt` = `"ScratchCardExampleSDK"`, `c.txt` = `"clean"`, `findNameLeftovers` returns `["a.txt","sub/b.txt"]`
- [X] T019 [P] [US3] Write tests in `PKG/src/cli.test.ts`, `describe("rejections")`, spawning `process.execPath` with `[<PKG>/src/cli.ts, ...args]` (`spawnSync`, `encoding: "utf8"`, `cwd` = repo root) and comparing the whole `{ status, stdout, stderr }`: `[004:FR-003]` `[]` and `["a","b"]` → `{ status: 1, stdout: "", stderr: "gen-game: usage: pnpm gen-game <name>\n" }`; `[004:FR-004]` `["LuckyWheel"]` → `{ status: 1, stdout: "", stderr: "gen-game: \"LuckyWheel\" is not kebab-case (e.g. lucky-wheel)\n" }`; `[004:FR-005]` `["scratch-card-example"]` → stderr `gen-game: "scratch-card-example" is the template name; choose another name\n`; `[004:FR-006]` `["game-core"]` → stderr `gen-game: "game-core" is already used by packages/game-core\n`; `[004:FR-007]` the sorted `readdirSync` of the real `apps/` and `packages/` folders are equal before and after all runs
- [X] T020 [US3] Run `pnpm --filter @repo/gen-game test`; see T018–T019 fail on assertions

### Implementation for User Story 3

- [X] T021 [US3] Implement validation and safety in `PKG/src/generate.ts`, in this order before any write: not kebab-case → `not-kebab-case`; equals `TEMPLATE_NAME` → `template-name`; `existsSync(appsDir/name)` → `name-taken` naming `apps/<name>`; `existsSync(packagesDir/name)` → `name-taken` naming `packages/<name>`; `mkdirSync` throwing `EEXIST` → `name-taken` naming `apps/<name>`. Wrap copy + scan in `try`; on any throw `rmSync(target, { recursive: true, force: true })` and return `write-failed` with message `could not create apps/<name>: <error message>`; if `findNameLeftovers(target)` is non-empty, remove the target and return `names-left` with message `template names left in <files joined by ", ">`. Remove the target only when this run created it
- [X] T022 [US3] Implement argument handling and failure output in `PKG/src/cli.ts` (contracts/cli.md): `process.argv.slice(2).length !== 1` → stderr `gen-game: usage: pnpm gen-game <name>\n`, exit 1; a failed result → stderr `gen-game: <message>` plus, for `write-failed` and `names-left`, the suffix `; nothing was left behind`, then `\n`, exit 1; any unexpected throw → stderr `gen-game: internal error: <message>\n`, exit 1. T018–T019 pass

**Checkpoint**: all stories pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T023 [P] Write `PKG/README.md`: what the generator does, `pnpm gen-game <name>`, the name rule, what is skipped and replaced, never-overwrite and cleanup, next steps (link `specs/004-gen-game/contracts/cli.md`)
- [X] T024 [P] Check FR coverage: `grep -rhoE "\[004:FR-[0-9]{3}\]" packages/gen-game/src | sort -u` lists all 16 of FR-001..FR-016
- [X] T025 Run `pnpm turbo run lint check-types test --continue` from the repository root; fix until it passes
- [X] T026 Confirm `git status` shows no change under `apps/scratch-card-example` (FR-011) and no `apps/lucky-wheel`; commit

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 (Phase 3) → US2 (Phase 4, needs the US1 generator) → US3 (Phase 5; its tests need only Phase 2 and may be written in parallel with US1, but T021 and T015 edit the same file, so T015 first) → Phase 6.
- Within each story: stub → tests (seen failing) → implementation.

### Parallel opportunities

- T002 with T001; T010, T011, T012, T013 together; T018 with T019; T023 with T024.

```text
# US1 tests together
T010 PKG/src/generate.test.ts
T011 PKG/src/cli.test.ts (next steps, root script)
T012 PKG/src/deps.test.ts
T013 PKG/src/generate.template.test.ts
```

## Implementation Strategy

- **MVP**: Phases 1–3 (US1): a working generator on temporary folders and from the CLI.
- Then US2 (end-to-end proof on the real repository, then cleanup), then US3 (rejections and cleanup), then Polish.
- Commits: `test(red): …` after T014 and T020 (with the failing tests), `feat(green): …` after T016 and T022, final commit after T026.
