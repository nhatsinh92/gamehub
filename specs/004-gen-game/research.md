# Research: gen-game

## R1. Which files get the names replaced

- **Decision**: replace both forms in every copied file whose bytes contain either form; copy all other files byte-for-byte (`Buffer` in, same `Buffer` out). Replace `ScratchCardExampleSDK` first, then `scratch-card-example` (the forms do not overlap, the order only keeps it obvious).
- **Rationale**: the template's one-name-source rule (spec 003 FR-012, enforced by its `repo-hygiene.test.ts`) already guarantees the names appear only in `package.json`, `README.md` and tests, so "every file that holds it" is "exactly the files that hold it" (spec Assumption 1). A hard-coded list would drift when the template's tests change.
- **Alternatives considered**: a fixed list (`package.json`, `README.md`, `src/game-name.test.ts`, `src/repo-hygiene.test.ts`): rejected, drift-prone and misses any new test. Editing `package.json` as JSON: rejected, the plain replacement keeps its formatting and gives the same `name`.

## R2. Kebab-case rule

- **Decision**: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`.
- **Rationale**: lowercase words joined by single hyphens; starting with a letter keeps `<Pascal>SDK` a valid JavaScript identifier and the folder a valid npm package name. Rejects `LuckyWheel`, `lucky_wheel`, `-lucky`, `lucky-`, `lucky--wheel`, `1lucky`, empty.
- **Alternatives considered**: allowing a leading digit: rejected, `1LuckySDK` is not an identifier.

## R3. SDK global name rule

- **Decision**: `names.ts` holds its own `toSdkGlobalName` (split on `-`, capitalise each word, join, add `SDK`), with a test whose table equals the template's `game-name.test.ts` table rows for kebab-case names (`scratch-card-example`, `lucky-wheel`, `quiz`) plus `wheel-2` → `Wheel2SDK`.
- **Rationale**: the rule is 5 lines; importing it from inside `apps/scratch-card-example/src` would couple a package to an app's internals and to its JSON import of `package.json`.
- **Alternatives considered**: relative import from the template: rejected (cross-package import of private source).

## R4. Never overwrite and clean up

- **Decision**: validate first (name, template name, existing folder in `apps/` or `packages/`). Then create `apps/<name>` with a non-recursive `mkdirSync` (fails with `EEXIST` if it appeared meanwhile, so an existing folder is never touched). From that point, any thrown error (read, write, leftover-name check) triggers `rmSync(target, { recursive: true, force: true })` and a failure result. The folder is removed only if this run created it.
- **Rationale**: simplest way to meet FR-012 without a staging folder and rename, which can fail across devices on Windows.
- **Failure injection in tests**: the temporary template gets a dangling symbolic link (`fs.symlinkSync` to a missing path); reading it throws `ENOENT` after other files were written, so the test sees a real half-way failure without mocking `fs`. On Windows without symlink rights the test is skipped (CI runs Linux).

## R5. Skipped paths

- **Decision**: skip any directory named `node_modules`, `dist` or `.turbo` at any depth, and any file ending in `.tsbuildinfo`. Everything else, including dot-files such as `.gitignore`, is copied.
- **Rationale**: the issue's list; matches the template's `.gitignore` and its hygiene test walk.

## R6. Proving FR-014 (generated game passes every check)

- **Decision**: two layers. (a) `generate.template.test.ts` runs the core on the **real** template (read only) into a temporary apps folder and asserts the created file list equals the template's git-tracked files, `package.json` equals the template's with only `name` changed, and no file holds either name. (b) The quickstart's end-to-end step generates `lucky-wheel` into the real `apps/`, runs `pnpm install` and `pnpm turbo run lint check-types test buildSdk --filter=lucky-wheel` (the copied `sdk-build.test.ts` asserts the built file defines exactly the `LuckyWheelSDK` global), then removes the folder and re-runs `pnpm install` to restore the lockfile. The implement phase runs (b) and reports the outcome in the PR.
- **Rationale**: the issue forbids tests that write to the real `apps/`; a temporary folder outside the workspace has no installed packages and no git repository, which the copied hygiene tests need.
- **Alternatives considered**: a Vitest test that writes into `apps/` and runs `pnpm install`: rejected (forbidden by the issue, slow, modifies the lockfile).

## R7. CLI and root script

- **Decision**: root script `"gen-game": "node packages/gen-game/src/cli.ts"` (pnpm appends the user's arguments and runs it from the root). `cli.ts` finds the repository root from its own location (`../../..` of `src/cli.ts`), not from the current directory.
- **Rationale**: same no-build approach as `spec-diff`; `pnpm --filter @repo/gen-game` would change the working directory to the package.
