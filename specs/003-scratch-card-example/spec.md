# Feature Specification: Scratch Card Example (the game template every new game is copied from)

**Feature Branch**: `003-scratch-card-example`

**Created**: 2026-11-10

**Status**: Implemented

**Version**: 1.0.0

**Input**: User description: GitHub issue #25 "scratch-card-example: the game template every new game is copied from". Every new game will start as a copy of this app (a generator script comes in a later issue), so whatever is in the template ends up in every game. The template must be small, correct, pass all repository checks on its own, and show the one right way for a game to use the shared game core package.

## User Scenarios & Testing *(mandatory)*

Actors:

- **Game developer**: copies the template to start a new game, runs it locally, renames it and replaces the gameplay.
- **Host page**: the web/app game center page that loads the game's single script file and starts the game inside one of its elements, supplying the server address, a function returning the player's access token and, optionally, a tracking function and a size.
- **Player**: plays the scratch card.

### User Story 1 - Player plays a scratch card (Priority: P1)

The player opens the game. It loads its config from the server (showing a loading state meanwhile), then shows a card covered by a scratchable layer. The player scratches with mouse, finger or pen. When at least half of the card is scratched, the rest of the layer is cleared, the game submits the round result and shows the server's outcome: the reward name for a win, otherwise the server's message (no win, out of turns, maintenance or error). A "Play again" button clears the outcome and shows a fresh, fully covered card.

**Why this priority**: This is the example gameplay that shows every future game how to call the shared game core: load, submit, show the outcome, reset, track.

**Independent Test**: Run the game in standalone mode (local, no network). Scratch past half of the card; confirm the reward name from the local data appears, then press "Play again" and confirm a fully covered card is shown. With a fake game context, confirm each server outcome shows the right text.

**Acceptance Scenarios**:

1. **Given** the game is opened, **When** config loading is in progress, **Then** a loading state is shown and no card is shown.
2. **Given** config loading succeeded, **When** loading ends, **Then** a fully covered card is shown.
3. **Given** a covered card, **When** the player has scratched less than 50% of it, **Then** the card is not revealed and no result is submitted.
4. **Given** a covered card, **When** the scratched share reaches 50% or more, **Then** the card is revealed and the result is submitted exactly once with score 1.
5. **Given** a submitted result with status SUCCESS and a win, **When** the outcome is shown, **Then** the reward name is shown.
6. **Given** a submitted result with status SUCCESS and no win, or status OUT_OF_TURN, MAINTENANCE or ERROR, **When** the outcome is shown, **Then** the server's message is shown.
7. **Given** an outcome is shown, **When** the player presses "Play again", **Then** the outcome is cleared and a fresh, fully covered card is shown.
8. **Given** the game is opened and played, **Then** the tracking events `game_open` (once when the game opens), `game_reveal` (once per card when it is revealed) and `game_result` (once per submitted result) are sent.

---

### User Story 2 - Host page embeds the game with one script (Priority: P1)

A host page loads the game's single script file with a script tag. The script defines one global object (`window.ScratchCardExampleSDK`). The host calls `init(container, config)` with a CSS selector or an element and a config holding the game id, the server address, the access-token function and optional tracking function, width and height. The game renders inside an isolated area attached to that container, talking to the real server. The host calls `destroy()` to remove it.

**Why this priority**: Embedding in the host app is how marketing uses every game; the contract must be the same for all copies of the template.

**Independent Test**: In a test page, define a host style that would change text colour and size, call `init` with a selector, confirm the game renders inside the container's isolated area, unaffected by the host style, and that the host page's own elements are not restyled by the game. Call `init` again on the same container and confirm exactly one game is present and nothing threw. Call `destroy()` and confirm the container is empty.

**Acceptance Scenarios**:

1. **Given** the script is loaded, **Then** exactly one new global object, named by the single name source (FR-012), exists with `init` and `destroy` functions.
2. **Given** a container selector or element that exists, **When** `init` is called with a valid config, **Then** the game renders inside an isolated area attached to that container, with its own styles inside that area, and uses the real server through the given address and token function.
3. **Given** the host page has styles targeting common elements (e.g. `button`, `div`, `*`), **When** the game is shown, **Then** the game's appearance is not changed by them, and the game's styles do not change any host element outside the container.
4. **Given** a game is running in a container, **When** `init` is called again on the same container, **Then** the running game is replaced by a new one, only one game is present, and no error is thrown.
5. **Given** a selector that matches no element (or an invalid container value), **When** `init` is called, **Then** a clear console error naming the problem is printed, nothing is rendered, and no error is thrown to the host.
6. **Given** a running game, **When** `destroy()` is called, **Then** the game is unmounted and the container has no children left (and no attached isolated area content).
7. **Given** a `width` and/or `height` in the config, **When** the game is shown, **Then** the game area has that size in CSS pixels.
8. **Given** a `sendTrackingFunc` in the config, **When** the game sends tracking events, **Then** the host's function receives them.

---

### User Story 3 - Developer copies, runs and renames the template (Priority: P2)

A developer copies the template folder to start a new game. They read the README to learn what the template is, how to run each script and what to change. They run the standalone dev page, the embedded test page (which loads the built script exactly like a host page), build the SDK file, and run lint, type checks and tests; all work. To rename the game they change one place, and the game id, package name and SDK global name follow everywhere, including in the built file.

**Why this priority**: The template's value is multiplied by every copy; stale scripts, names or committed build files would spread to every game.

**Independent Test**: In a clean checkout run every script; confirm each succeeds. Build the SDK and confirm the global name in the built file equals the name defined in the single source. Confirm no build output or cache file is tracked by git and that these are ignored.

**Acceptance Scenarios**:

1. **Given** a clean checkout with dependencies installed, **When** each of `dev`, `devSdk`, `buildSdk`, `lint`, `check-types` and `test` is run, **Then** each works and none refers to a tool the app does not use.
2. **Given** the SDK is built, **Then** the output is one script file whose defined global name equals the name from the single name source.
3. **Given** the repository, **Then** no `dist/` or `*.tsbuildinfo` file of the app is tracked, and both are git-ignored.
4. **Given** the README, **Then** it describes what the template is, how to run each script, and what a new game changes after copying it.

---

### Edge Cases

- Config loading fails (network, HTTP or validation error): the game shows a clear error state instead of the card and does not crash; no result is submitted.
- Submitting the result fails with an error (not a server status): the game shows an error message and the "Play again" button.
- The player keeps scratching after the 50% threshold: the result is still submitted only once per card.
- Scratching outside the card area or with zero-size card: progress stays within 0–100% and never produces an invalid number.
- `init` is called with a missing required config field (`gameId`, `baseUrl` or `getAccessTokenFunc`): a clear console error, nothing rendered, nothing thrown.
- `destroy()` is called when no game is running, or twice: nothing happens and nothing is thrown.
- `init` is called on a different container while a game is running: the previous game is destroyed first (see Assumptions).
- The access-token function throws or returns nothing: handled by the game core as a token error; the game shows its error state; the token is never logged.

## Requirements *(mandatory)*

### Functional Requirements

**Run modes**

- **FR-001**: The app MUST run standalone as a local dev page that uses the local (no network) server adapter of the shared game core.
- **FR-002**: The app MUST build into exactly one script file for embedding, which uses the remote server adapter of the shared game core with the host-provided server address and token function.
- **FR-003**: All server calls MUST go through the shared game core; the app MUST NOT call the network directly.

**SDK contract**

- **FR-004**: Loading the built script MUST define exactly one global object, named by the single name source (FR-012), with functions `init(container, config)` and `destroy()`.
- **FR-005**: `init` MUST accept a container given as a CSS selector string or an element, and a config with required `gameId`, `baseUrl`, `getAccessTokenFunc` and optional `sendTrackingFunc`, `width`, `height`.
- **FR-006**: The game MUST render inside an isolated (shadow) area attached to the container, with all its styles injected into that area, so host styles do not change the game and game styles do not change the host page.
- **FR-007**: Calling `init` again on the same container MUST replace the running game with a new one without throwing; at most one game runs at a time.
- **FR-008**: An unknown or invalid container, or a config missing a required field, MUST produce a clear console error naming the problem, render nothing and not throw.
- **FR-009**: `destroy()` MUST unmount the game and leave the container empty; calling it with no game running MUST do nothing and not throw.
- **FR-010**: When `width`/`height` are given, the game area MUST use them as its size in CSS pixels; otherwise it MUST use the template's default size.
- **FR-011**: When `sendTrackingFunc` is given, tracking events MUST be delivered to it.

**Single name source**

- **FR-012**: The game id (`scratch-card-example`), the package name and the SDK global name (`ScratchCardExampleSDK`) MUST be defined in one place and read from there by app code and build config, so a copy is renamed by changing only that place.
- **FR-013**: The global name defined in the built SDK file MUST equal the global name from the single name source.

**Gameplay**

- **FR-014**: On start the game MUST call `initGame()` once, show a loading state while it runs, then show the card; if loading fails it MUST show an error state instead of the card.
- **FR-015**: The player MUST be able to scratch the card's cover layer with pointer input (mouse, touch, pen).
- **FR-016**: When the scratched share of the cover reaches 50% or more, the game MUST reveal the card and call `submitResult(1)` exactly once for that card.
- **FR-017**: After a result, the game MUST show the reward name when the status is SUCCESS and it is a win, and the server's message otherwise (no win, OUT_OF_TURN, MAINTENANCE, ERROR); if submitting fails with an error, it MUST show an error message.
- **FR-018**: After an outcome or a submit error, a "Play again" button MUST call `resetResult()` and show a fresh, fully covered card.
- **FR-019**: The game MUST send tracking event `game_open` once when it opens, `game_reveal` once per revealed card and `game_result` once per received result (with the result's status and win flag as parameters).
- **FR-020**: The scratch-progress calculation (scratched share of the cover, 0–1) MUST be a pure function that is tested without a DOM.

**Scripts, repository hygiene and docs**

- **FR-021**: The app MUST provide scripts `dev`, `devSdk` (a local page that loads the SDK the way a host does), `buildSdk`, `lint`, `check-types` and `test`; each MUST work and none MAY refer to a tool the app does not use.
- **FR-022**: Build output and cache files (`dist/`, `*.tsbuildinfo`) MUST be git-ignored and not committed.
- **FR-023**: The app's README MUST describe what the template is, how to run each script, and what a new game changes after copying it.
- **FR-024**: The access token MUST never be logged or put in a URL by the app.

### Key Entities

- **SDK config**: what the host passes to `init`: game id, server address, token function, optional tracking function, width, height.
- **Name source**: the one place holding the game id, package name and SDK global name.
- **Card round**: one covered card from fresh to revealed; holds scratch progress (0–1), whether it is revealed, whether its result was submitted, and the outcome shown.
- **Outcome**: what the player sees after a round: a reward name, a server message, or an error message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six app scripts succeed in a clean checkout, and the repository-wide lint, type and test checks pass with the app included (0 failures).
- **SC-002**: In the built SDK file, the defined global name equals the single-source name in 100% of builds, verified by an automated check.
- **SC-003**: Renaming the game requires editing exactly one value for the game id, package name and global name together (see Assumptions).
- **SC-004**: A player can go from opening the game to seeing the outcome with a single scratch session, and replay with one press of "Play again".
- **SC-005**: Host page styles change 0 visual properties of the game, and the game changes 0 styles of host elements outside the container, verified by an automated test.
- **SC-006**: 0 build output or cache files of the app are tracked by git.
- **SC-007**: The access token appears in 0 log lines and 0 URLs during an automated run of the embedded game.

## Assumptions

1. **The one place is the package manifest name**: the package manager can only read the package name from the app's package manifest, so that `name` field (`scratch-card-example`) is the single source. The game id equals it, and the SDK global name is derived from it by one shared rule (PascalCase + `SDK` → `ScratchCardExampleSDK`); app code and build config both read the name through that rule. A renamed copy changes only that field. Chosen because the manifest cannot import code, so any other source would need a second copy of the package name.
2. **One game per page**: the SDK runs at most one game at a time; `init` on any container (same or different) first destroys the running game, and `destroy()` takes no argument (as the issue states). Chosen because the issue's `destroy()` has no container parameter.
3. **Start and outcome details**: the game calls only `initGame()` on start (not `getCurrentUser()`); "Play again" is shown after every outcome, including OUT_OF_TURN and MAINTENANCE, and the server decides on the next submit. The default game size is 360 × 480 CSS pixels. Reaching 50% clears the whole cover.

Other defaults:

- Out of scope (issue #25): browser end-to-end tests, final art and sound (simple shapes and colours), the generator script, Storybook, build modes other than development and production, and a standalone production build of the dev page.
- Allowed new dependencies (issue #25): `vite`, `@vitejs/plugin-react`, and `@testing-library/react` for component tests; the test setup matches the shared game core (Vitest + happy-dom).
- Relies on the shared game core package (spec 002) for the game context, the local and remote adapters and HTTP client, including token handling.

## Changelog

- 1.0.0 (2026-11-10): approved by the owner by merging the PR; Status → Implemented (issue #25).
- 0.1.0 (2026-11-10): initial draft from issue #25.
