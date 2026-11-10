# Feature Specification: Storybook sandbox for playing the games

**Feature Branch**: `006-storybook-sandbox`

**Created**: 2026-11-10

**Status**: Draft

**Version**: 0.1.1

**Input**: User description: GitHub issue #35. A Storybook that serves as a sandbox for trying out the games in `apps/`. Each game is embedded in a story so a developer can play it in the browser without a host page or a backend. Two stories for now (`scratch-card-example`, `sky-hopper`), each rendering the game inside the shared game context with the local (offline) adapter and its mock data from `@repo/game-core`.

## User Scenarios & Testing *(mandatory)*

Actors:

- **Game developer**: builds or tunes a game and wants to play it quickly.
- **Reviewer**: checks a game in a PR without setting up a host page or server.

### User Story 1 - Play a game from its story (Priority: P1)

A developer starts the sandbox and sees a list of games. They open the story of a game (`scratch-card-example` or `sky-hopper`), the game appears ready to play, and they play it with the mouse, finger or keyboard exactly as in the standalone game. Results are handled by the offline adapter and mock data, so no server is needed.

**Why this priority**: This is the whole feature; it is the reason the sandbox exists.

**Independent Test**: Start the sandbox, open each game's story and play a round. Automated: render each story and assert the game's root element is present.

**Acceptance Scenarios**:

1. **Given** the sandbox is running, **When** the developer opens the `scratch-card-example` story, **Then** the game's root element is shown and the game reacts to input.
2. **Given** the sandbox is running, **When** the developer opens the `sky-hopper` story, **Then** the game's root element is shown and the game reacts to input.
3. **Given** no backend and no built SDK bundle exist, **When** either story is opened, **Then** it still renders and plays.

---

### User Story 2 - Build the sandbox as a static site (Priority: P2)

A developer or CI builds the whole repo; the sandbox builds as a static site without errors, together with every other workspace.

**Why this priority**: Keeps the sandbox from breaking the repo-wide build and CI.

**Independent Test**: Run the repo-wide build and see it succeed, with a static sandbox output produced.

**Acceptance Scenarios**:

1. **Given** a clean checkout with dependencies installed, **When** the repo-wide build runs, **Then** it succeeds and the static sandbox is produced.
2. **Given** the sandbox workspace, **When** lint, type-check and tests run, **Then** they pass like in the other workspaces.

---

### User Story 3 - Add a story for a new game (Priority: P3)

A developer who creates a new game adds one story file for it and finds it in the sandbox. The sandbox configuration is not touched. The README explains how to run the sandbox and how to add such a story.

**Why this priority**: Makes the sandbox keep working as games are added.

**Independent Test**: Add a story file for a game and see it listed without any configuration change.

**Acceptance Scenarios**:

1. **Given** a new story file next to the others, **When** the sandbox starts, **Then** the new story is listed with no configuration change.
2. **Given** the README, **When** a developer follows the note, **Then** they can run the sandbox and add a story.

---

### Edge Cases

- A game's root element must be found by the story test even though the game renders inside the story frame rather than a host page.
- A new game that is not yet registered in the workspace: its story is the developer's job; the sandbox never fails because of a game without a story.
- Games must not change behavior: opening a story must not alter or depend on the game's production bundle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repo MUST contain a new workspace app `apps/storybook` that serves the sandbox.
- **FR-002**: The sandbox MUST have one story for `scratch-card-example` and one for `sky-hopper`.
- **FR-003**: Each story MUST render its game's `App` inside the shared game context with the local adapter and its mock data from `@repo/game-core`, needing no backend and no built SDK bundle.
- **FR-004**: The workspace MUST provide a `dev` script (sandbox dev server) and a `build` script (static build), picked up by the root `dev` and `build` commands.
- **FR-005**: The workspace MUST provide `lint`, `check-types` and `test` scripts following the other workspaces, and the existing CI checks MUST stay green.
- **FR-006**: A test MUST render each story and assert that the game's root element is present.
- **FR-007**: Stories MUST be discovered by a file pattern, so adding a game needs only a new story file and no change to the sandbox configuration.
- **FR-008**: The README MUST explain how to run the sandbox and how to add a story for a new game.
- **FR-009**: New dependencies MUST be limited to the Storybook packages (the Storybook core, its React + Vite framework and the addons of the default setup), declared only in `apps/storybook`, with exact versions. Games and shared packages MUST get no new dependencies and no behavior change.

### Key Entities

- **Story**: one file per game that places the game in the sandbox with the offline adapter and mock data.
- **Sandbox**: the Storybook app that lists stories and serves them for play or as a static build.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 2 of 2 existing games are playable from their story, without a backend or a built bundle.
- **SC-002**: The repo-wide build finishes with 0 errors and produces the static sandbox.
- **SC-003**: Lint, type-check and test pass with 0 failures and 0 warnings in the sandbox workspace and in all existing workspaces.
- **SC-004**: Adding a story for a new game touches 1 file (the story) and 0 configuration files.
- **SC-005**: A developer new to the repo can start the sandbox from the README in one command after install.

## Assumptions

1. The sandbox imports each game's `App` directly from the game's source (as a workspace dependency), not from its production bundle.
2. Stories are discovered by a glob over the sandbox's own story files; story files, not the games' folders, hold the wiring.
3. "Game reacts to input" is verified by playing in the browser; the automated test only asserts the root element is present, as the issue states.

Out of scope (issue #35): controls for the game config, the current user or forced win/lose outcomes; the production SDK bundle and Shadow DOM embedding; deploying the static sandbox; stories for the `gen-game` template or a story generator; any change to game behavior.

## Changelog

- 0.1.1 (2026-11-10): note that `pnpm-workspace.yaml` gets `allowBuilds: esbuild: false` (Storybook pulls in esbuild; pnpm 12 fails the install on unreviewed build scripts).
- 0.1.0 (2026-11-10): initial draft from issue #35.
