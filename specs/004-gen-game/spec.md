# Feature Specification: gen-game (create a new game from the scratch-card-example template)

**Feature Branch**: `004-gen-game`

**Created**: 2026-11-10

**Status**: Draft

**Version**: 0.1.0

**Input**: User description: GitHub issue #28 "gen-game: create a new game from the scratch-card-example template". Every new game starts as a copy of `apps/scratch-card-example`. Copying by hand is where names go wrong (a package renamed but the README or a test still says the old name) and where build files get copied along. A generator makes every new game start the same way, and proves it: a game it creates passes every repo check before anyone writes gameplay.

## User Scenarios & Testing *(mandatory)*

Actors:

- **Game developer**: starts a new game from the repository root with one command and a game name, then installs and runs it.
- **Repository checks**: the lint, type-check, test and SDK build tasks every game must pass.

### User Story 1 - Developer creates a new game with one command (Priority: P1)

From the repository root the developer runs `pnpm gen-game lucky-wheel`. A new folder `apps/lucky-wheel` appears holding a copy of the template's source files (no build output, caches or installed packages). Every place that held the template's name now holds the new name: the package name is `lucky-wheel`, the README talks about `lucky-wheel` and `LuckyWheelSDK`, and the template's tests that assert the names assert the new ones. The command prints the next steps: `pnpm install`, then `pnpm --filter lucky-wheel dev`.

**Why this priority**: This is the whole feature: a correct, uniformly named starting point for every new game.

**Independent Test**: Run the generator core on a temporary copy of the template into a temporary apps folder with the name `lucky-wheel`; confirm the exact list of created files equals the template's source files, that `package.json` `name` is `lucky-wheel`, that no created file contains `scratch-card-example` or `ScratchCardExampleSDK`, that files without the template name are byte-identical to the template, and that the printed next steps are exactly the two commands.

**Acceptance Scenarios**:

1. **Given** a valid unused kebab-case name `lucky-wheel`, **When** the generator runs, **Then** `apps/lucky-wheel` is created with the same relative file list as the template minus `node_modules/`, `dist/`, `.turbo/` and `*.tsbuildinfo`.
2. **Given** the generator has run with `lucky-wheel`, **Then** `package.json` has `name` `lucky-wheel`, and every occurrence of `scratch-card-example` is replaced with `lucky-wheel` and every occurrence of `ScratchCardExampleSDK` with `LuckyWheelSDK`.
3. **Given** the generator has run, **Then** no file in `apps/lucky-wheel` contains `scratch-card-example` or `ScratchCardExampleSDK`, and every file that did not contain either name in the template is byte-identical to its template file.
4. **Given** the generator succeeded, **Then** it prints the next steps `pnpm install` and `pnpm --filter lucky-wheel dev`, and exits with code 0.
5. **Given** the generator has run, **Then** every template file is unchanged (same file list and same contents as before the run).

---

### User Story 2 - The new game passes every repository check without edits (Priority: P1)

After generating `lucky-wheel` and running `pnpm install`, the developer runs `pnpm turbo run lint check-types test buildSdk --filter=lucky-wheel`. All tasks pass with no manual edit, including the copied template tests (still tagged `[003:FR-###]`), which now check that the new game meets the template contract under its new name. The built SDK file defines `window.LuckyWheelSDK`.

**Why this priority**: The issue's promise is that a generated game is correct before anyone writes gameplay; a generator whose output fails checks would just move the manual fixing elsewhere.

**Independent Test**: Generate a game into the real `apps/` folder, install, run the command above, confirm every task passes and the built SDK file defines the `LuckyWheelSDK` global, then remove the generated folder.

**Acceptance Scenarios**:

1. **Given** a freshly generated and installed game, **When** lint, type-check, test and SDK build run for it, **Then** all pass with no edit to any file.
2. **Given** the SDK build of the generated game, **Then** loading the built file defines `window.<Pascal>SDK` (`window.LuckyWheelSDK` for `lucky-wheel`).
3. **Given** the generated game's test files, **Then** each copied test keeps its `[003:FR-###]` tag unchanged.

---

### User Story 3 - Wrong input is rejected and nothing is left behind (Priority: P2)

The developer mistypes the name, reuses the template's name or a name already taken, or the copy fails half-way. The generator prints a clear message saying what is wrong and exits with code 1. It never overwrites an existing folder, and never leaves a partial game folder behind.

**Why this priority**: Protects existing work and keeps `apps/` clean; the happy path delivers value without it, but a careless overwrite would destroy a game.

**Independent Test**: Run the generator core on temporary folders with each invalid input and with an injected failure during copying; confirm the message, exit code 1, and that the apps folder's content is the same as before.

**Acceptance Scenarios**:

1. **Given** a name that is not kebab-case (e.g. `LuckyWheel`, `lucky_wheel`, `-lucky`, `lucky-`, `lucky--wheel`, `1lucky`, empty), **When** the generator runs, **Then** it prints a message saying the name must be kebab-case, exits with 1 and writes nothing.
2. **Given** the name `scratch-card-example`, **When** the generator runs, **Then** it prints a message saying the template name cannot be used, exits with 1 and writes nothing.
3. **Given** a name already used by a folder in `apps/` or `packages/` (e.g. `game-core`), **When** the generator runs, **Then** it prints a message naming the existing folder, exits with 1 and writes nothing; an existing `apps/<name>` is never modified.
4. **Given** a failure while writing the new game (e.g. a file cannot be written), **When** the generator stops, **Then** the partial `apps/<name>` folder is removed, an error message is printed and the exit code is 1.
5. **Given** no name or more than one argument, **When** the generator runs, **Then** it prints a usage message, exits with 1 and writes nothing.

### Edge Cases

- The template folder has local build output, caches or installed packages (`dist/`, `.turbo/`, `node_modules/`, `*.tsbuildinfo`) from earlier runs: they are skipped at any depth and never copied.
- The template's `.gitignore` (a dot-file) is copied like any other source file.
- A name in `packages/` but not in `apps/` (e.g. `spec-diff`, `gen-game`): rejected, because workspace package names must stay unique.
- A file holds the template name more than once or inside a longer string (e.g. `scratch-card-example-sdk.js`, `apps/scratch-card-example`): every occurrence is replaced (`lucky-wheel-sdk.js`, `apps/lucky-wheel`).
- A single-word name (`quiz`): the global is `QuizSDK`. A name with digits (`wheel-2`): the global is `Wheel2SDK`.
- The template's name-rule test table holds `scratch-card-example` → `ScratchCardExampleSDK` as one row; after replacement that row holds the new name and its global, which the rule still maps correctly, so the copied test passes.
- The generator is run twice with the same name: the second run is rejected as an existing folder and changes nothing.

## Requirements *(mandatory)*

### Functional Requirements

**Command**

- **FR-001**: The repository MUST provide a workspace package `packages/gen-game` with a command-line entry, run from the repository root as `pnpm gen-game <name>` through a `gen-game` script in the root `package.json`.
- **FR-002**: The generation logic MUST be a function that takes the template folder, the target apps folder, the workspace packages folder and the name, so it can run on temporary folders; the command-line entry MUST only call it with the real repository folders and turn its result into output and an exit code.

**Input validation**

- **FR-003**: The generator MUST accept exactly one argument, the game name; no name or extra arguments MUST print a usage message and exit with code 1.
- **FR-004**: The name MUST be kebab-case: one or more lowercase words of letters and digits joined by single hyphens, starting with a letter (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`); any other name MUST be rejected with a message saying it must be kebab-case.
- **FR-005**: The name `scratch-card-example` MUST be rejected with a message saying the template name cannot be used.
- **FR-006**: A name already used by a folder in `apps/` or `packages/` MUST be rejected with a message naming that folder.
- **FR-007**: Every rejection (FR-003 to FR-006) MUST exit with code 1 and write nothing.

**Output**

- **FR-008**: On success the generator MUST create `apps/<name>` holding every file of the template at the same relative path, except anything inside a `node_modules/`, `dist/` or `.turbo/` folder (at any depth) and any `*.tsbuildinfo` file.
- **FR-009**: In every copied file the generator MUST replace every occurrence of `ScratchCardExampleSDK` with `<Pascal>SDK` and every occurrence of `scratch-card-example` with `<name>`, where `<Pascal>` is the name's words capitalised and joined (`lucky-wheel` → `LuckyWheel`), the same rule the template uses for its SDK global; files that hold neither form MUST be copied byte-for-byte.
- **FR-010**: After generation no file in `apps/<name>` MUST contain `scratch-card-example` or `ScratchCardExampleSDK`; the generator MUST check this and fail (FR-012) if it does not hold.
- **FR-011**: The generator MUST NOT change any file in the template folder.

**Safety**

- **FR-012**: The generator MUST never overwrite: if `apps/<name>` exists nothing is written. If anything fails after `apps/<name>` was created, the generator MUST remove that folder, print an error message and exit with code 1.

**Next steps**

- **FR-013**: On success the generator MUST print the created folder and the next steps, in order: `pnpm install`, then `pnpm --filter <name> dev`, and exit with code 0.

**Generated game**

- **FR-014**: A game created by the generator, after `pnpm install`, MUST pass `pnpm turbo run lint check-types test buildSdk --filter=<name>` with no manual edit, and its built SDK file MUST define `window.<Pascal>SDK`.
- **FR-015**: The copied template tests MUST keep their `[003:FR-###]` tags unchanged.

**Dependencies**

- **FR-016**: The generator MUST use only the runtime's built-in modules; it MUST add no new runtime or development dependency beyond those the repository's packages already use.

### Key Entities

- **Game name**: the kebab-case name the developer gives; becomes the folder name, package name and game id. Its Pascal form plus `SDK` is the SDK global name.
- **Template**: the `apps/scratch-card-example` folder; read only.
- **Generated game**: the new `apps/<name>` folder: the template's source files with both name forms replaced.
- **Generation result**: success (created folder, next steps) or failure (message); maps to exit code 0 or 1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer creates a new game with 1 command and 0 manual file edits; the new game passes all 4 repository checks (lint, type-check, test, SDK build) on the first run.
- **SC-002**: 0 files in a generated game contain either template name form, and 0 build, cache or installed-package files are copied.
- **SC-003**: 100% of invalid inputs listed in User Story 3 are rejected with exit code 1 and leave the apps folder exactly as it was.
- **SC-004**: Running the generator leaves 100% of template files unchanged.
- **SC-005**: Every functional requirement is covered by at least one test tagged `[004:FR-###]`; the generator's tests never write to the real `apps/` folder.

## Assumptions

1. **Replace in every copied file, verify none left**: the issue says the names are replaced "in exactly the files that hold it" (today `package.json`, `README.md` and the name-asserting tests, as the template's own one-name-source rule guarantees). The generator therefore replaces both forms in every copied file that holds them and copies all other files byte-for-byte, rather than keeping a hard-coded file list that could drift from the template. Chosen because it meets the issue's wording for today's template and stays correct if the template's tests change.
2. **Kebab-case and argument rules**: kebab-case means lowercase letters and digits in words joined by single hyphens, starting with a letter (so the SDK global is a valid identifier); no argument or more than one argument prints usage and exits 1. Chosen because the issue gives only `lucky-wheel` as an example and requires exit code 1 for invalid input.
3. **End-to-end check of a generated game**: because the generator's automated tests run only on temporary folders (issue note), the "passes every repository check" promise (FR-014) is verified by generating a game into the real `apps/` folder, installing, running the full check command and the SDK global check, then removing the folder; this is a documented verification step (quickstart), not a test that writes into `apps/`. Chosen because a temporary folder outside the workspace has no installed packages and no repository around it for the template's repository-hygiene tests.

Other defaults:

- Out of scope (issue #28): creating a spec for the new game, writing gameplay, art or sound, and Storybook entries for the new game.
- No new dependencies (issue #28): Node built-ins only; the package's own lint, type-check and test tooling reuses the versions other workspace packages already use.
- Relies on the template (spec 003) keeping its one-name-source rule: the names live only in `package.json`, `README.md` and tests.

## Changelog

- 0.1.0 (2026-11-10): initial draft from issue #28.
