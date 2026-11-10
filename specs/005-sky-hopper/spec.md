# Feature Specification: sky-hopper (first real game made with gen-game: a one-tap flapper)

**Feature Branch**: `005-sky-hopper`

**Created**: 2026-11-10

**Status**: Draft

**Version**: 0.1.0

**Input**: User description: GitHub issue #30. The first game made with `pnpm gen-game`. It proves the whole path, from template to playable embedded game, and becomes the example of a real game (not a template) that later games follow. Gameplay: a bird falls under gravity and flaps up on each tap or Space press, through pairs of pipes that scroll from right to left with a random vertical gap; one point per pair passed; game over on hitting a pipe, the ground or the top edge; difficulty grows with the score within limits; the result is submitted to the server and shown the way the template does. The game advances in fixed time steps, its logic is pure and seeded, it pauses while hidden, and it draws on a canvas with the device pixel ratio capped at 2. The issue names the game after an existing commercial game; this spec uses the original name `sky-hopper` instead (Assumption 1).

## User Scenarios & Testing *(mandatory)*

Actors:

- **Player**: opens the game standalone or embedded in a host page, plays rounds with taps or the Space key.
- **Host page**: embeds the game through its SDK global (`SkyHopperSDK`), supplies the token and receives tracking events.
- **Game developer**: creates the game with `pnpm gen-game` and later uses it as the example for new games; tunes the starting values after playtests.

### User Story 1 - Player plays a round from ready to game over (Priority: P1)

The game loads and shows the **ready** screen: the bird hovers in the play area and a prompt says to tap to start. The player taps (or presses Space): the round starts in **playing** and the bird gets its first flap. The bird falls under gravity; each new tap or Space press makes it flap up, and holding the key or finger down gives only one flap. Pipe pairs scroll in from the right, each with a gap at a random height. Each pair the bird passes adds one point to the score shown on screen. When the bird hits a pipe, the ground or the top edge, the round is **over**.

**Why this priority**: This is the game; without it nothing else has value.

**Independent Test**: Drive the pure game logic with a fixed seed and a scripted list of flap inputs per step; confirm the exact state (phase, bird position and velocity, pipes, score) after given steps, that a pipe pair scores once, and that each collision type ends the round. Render the game in a test page, tap the play area, and confirm the phase changes ready → playing → over.

**Acceptance Scenarios**:

1. **Given** the game has loaded, **When** it is shown, **Then** it is in **ready**, the bird does not fall, no pipe moves and the score is 0.
2. **Given** **ready**, **When** the player taps the play area or presses Space, **Then** the phase becomes **playing** and the bird's vertical velocity is the flap velocity (−290 px/s).
3. **Given** **playing**, **When** no input happens for one fixed step, **Then** the bird's vertical velocity grows by gravity × step (790 px/s² × step) and its height changes by the new velocity × step.
4. **Given** **playing**, **When** the player presses and holds Space (or keeps a finger down) across many steps, **Then** exactly one flap is applied; a second flap needs a release and a new press.
5. **Given** **playing**, **When** the bird's front passes a pipe pair's back edge, **Then** the score rises by exactly 1, and that pair never scores again.
6. **Given** **playing**, **When** the bird touches a pipe, the ground or the top edge of the play area, **Then** the phase becomes **over** and the bird and pipes stop.
7. **Given** two runs with the same seed and the same inputs at the same steps, **Then** both produce the same state at every step; a different seed gives different gap positions.

---

### User Story 2 - Round result is submitted and shown; player plays again (Priority: P1)

When the round is over, the game submits the score to the server once and shows the server's outcome the same way the template does: the reward name on a win with a reward, otherwise the server's message (no win, OUT_OF_TURN, MAINTENANCE, ERROR), or a fixed error text if the submit itself failed. It also shows the round's score and the player's best score. "Play again" clears the result and returns to **ready** with a fresh round.

**Why this priority**: The game exists to run campaigns; a round that does not reach the server delivers no business value.

**Independent Test**: Render the game with a fake adapter returning each outcome; play a round to game over through the game's step driver; confirm `submitResult` was called once with the score, the exact outcome text, score and best score shown, and that "Play again" calls `resetResult` and shows **ready** again.

**Acceptance Scenarios**:

1. **Given** a round ends with score 3, **Then** `submitResult(3)` is called exactly once for that round.
2. **Given** the server answers SUCCESS with a win and a reward, **Then** the reward name is shown; **given** any other answer (no win, win without reward, OUT_OF_TURN, MAINTENANCE, ERROR), **Then** the server's message is shown; **given** the submit failed, **Then** "Something went wrong. Please try again." is shown.
3. **Given** the over screen, **Then** it shows the round's score and the best score of all rounds since the game was mounted (best = highest score so far, including this round).
4. **Given** the over screen, **When** the player presses "Play again", **Then** `resetResult()` is called, the phase is **ready**, the score is 0, there are no pipes, and the best score is kept.
5. **Given** the game is still waiting for the server answer, **Then** the over screen shows the score and best score and no "Play again" button yet; taps and Space do not start a new round.

---

### User Story 3 - Same game on every screen, no jump after a pause (Priority: P1)

The player on a 60 Hz phone and the player on a 120 Hz screen see the same game at the same speed: the simulation advances in fixed time steps whatever the display rate. When the tab or app is hidden, the game pauses; when it comes back, it continues from where it was without advancing by the time it was away. The canvas looks sharp on high-density screens but never draws at more than 2× the logical size.

**Why this priority**: Without fixed steps the game is easier or harder depending on the device, which makes campaign results unfair; a jump after a pause kills the player with no chance to react.

**Independent Test**: Feed the frame-time accumulator the same total time as 60 frames of 1/60 s and as 120 frames of 1/120 s; confirm the same number of steps and the same resulting state. Feed a 30 s gap after a hidden period; confirm no step is taken for the hidden time. Compute the canvas size for device pixel ratios 1, 2 and 3; confirm the bitmap uses ratios 1, 2 and 2.

**Acceptance Scenarios**:

1. **Given** the same seed and inputs, **When** 1 s of frames is fed at 60 Hz and at 120 Hz, **Then** both runs take the same number of fixed steps and reach the same state.
2. **Given** **playing**, **When** the page becomes hidden, **Then** the game stops advancing; **When** it becomes visible again, **Then** the first frame after return advances 0 steps and play continues from the state it had when hidden.
3. **Given** a single very long frame (e.g. the device stalled for 2 s while visible), **Then** the game advances by at most the catch-up limit, never by the whole stall.
4. **Given** a device pixel ratio of 3, **Then** the canvas bitmap is 900×1400 (450×700 × 2); with ratio 1 it is 450×700; with ratio 1.5 it is 675×1050.

---

### User Story 4 - Difficulty grows with the score, within limits (Priority: P2)

As the score rises, pipes move faster and gaps get smaller, so good players are challenged; but speed never exceeds its maximum and the gap never shrinks below its minimum, so the game stays possible.

**Why this priority**: The game is playable without it, but it makes runs end and keeps campaign scores spread out.

**Independent Test**: Call the difficulty function for scores 0, 1, 10 and 1000; confirm the exact speed and gap values, and that they stay within [170, 280] px/s and [140, 200] px.

**Acceptance Scenarios**:

1. **Given** score 0, **Then** pipe speed is 170 px/s and the gap is 200 px.
2. **Given** a higher score, **Then** speed is never lower and gap never larger than for a lower score.
3. **Given** any score (including 1000), **Then** speed ≤ 280 px/s and gap ≥ 140 px.

---

### User Story 5 - Developer uses the game as the example of a real game (Priority: P2)

The game was created with `pnpm gen-game sky-hopper` and keeps the template's contract code and tests (SDK, names, repository hygiene); only the scratch-card gameplay and its tests were replaced. It passes every repository check, builds an SDK file that defines `window.SkyHopperSDK`, and keeps all tunable values in one config object.

**Why this priority**: The issue's second goal is to prove the gen-game path and give later games an example; it depends on Story 1 existing.

**Independent Test**: Run `pnpm turbo run lint check-types test buildSdk --filter=sky-hopper`; confirm all pass, the built file defines `SkyHopperSDK`, the template contract tests still hold their `[003:FR-###]` tags, and no scratch-card gameplay file remains.

**Acceptance Scenarios**:

1. **Given** the repository, **Then** `apps/sky-hopper` exists with package name `sky-hopper`, and none of `ScratchCard.tsx`, `ScratchCanvas.tsx`, `ScratchCard.test.tsx`, `scratch-progress.ts`, `scratch-progress.test.ts` remain in it.
2. **Given** the game, **When** lint, type-check, test and SDK build run for it, **Then** all pass and the built SDK defines `window.SkyHopperSDK`.
3. **Given** the game's tests, **Then** the copied template contract tests keep their `[003:FR-###]` tags, and the new gameplay tests are tagged `[005:FR-###]`.

### Edge Cases

- A tap or Space press while **over** and before the outcome is shown, or a held key at the moment a round ends: does nothing (no new round, no flap carried into the next round).
- A key held down from the over screen through "Play again": the first flap of the next round needs a new press.
- Space when the game does not have focus: the host page keeps its own Space behaviour; tapping or clicking the play area gives the game focus. Other keys are ignored.
- The bird passes a pair and hits the next pipe in the same step: the point counts, then the round ends with that score.
- The bird touches the top edge on a flap: round over (the top edge is deadly, it is not a ceiling to slide along).
- Score 0 round (the player never passes a pipe): `submitResult(0)` is still called once.
- Pipes that have left the left edge are removed; the number of pipes on screen stays bounded.
- Difficulty changes during a round apply to pipes spawned after the change; the gap of a pair already on screen never changes.
- A gap is always fully inside the playable height (between the top edge and the ground, with a margin).
- The game is destroyed (`SkyHopperSDK.destroy()`) mid-round: the frame loop and visibility listener stop; nothing runs after destroy.
- The game loads with a config error: the template's load error text is shown and no round can start.

## Requirements *(mandatory)*

### Functional Requirements

**Creation and template contract**

- **FR-001**: The game MUST live in `apps/sky-hopper`, created by `pnpm gen-game sky-hopper` (not by hand), with package name `sky-hopper`, game id `sky-hopper` and SDK global `SkyHopperSDK`.
- **FR-002**: The template's contract code and tests (SDK init/destroy, Shadow DOM, adapters, names, repository hygiene, SDK build) MUST be kept with their `[003:FR-###]` tags; a copied template test MAY be changed only where it depends on the scratch-card UI. The README MUST keep the four headings the template's README test checks, describe this game under "What this is", and under "Starting a new game from this template" say to run `pnpm gen-game <name>` and point to this game as the example of a real game.
- **FR-003**: The scratch-card gameplay files (`ScratchCard.tsx`, `ScratchCanvas.tsx`, `scratch-progress.ts`, `styles.ts` content) and their tests MUST be replaced by this game; no scratch-card gameplay code or test MUST remain.

**Game logic (pure and deterministic)**

- **FR-004**: The game logic MUST be pure functions with no DOM, timers or global state: a step function takes the current state, whether a new flap press happened, the config and the random source, and returns the next state without changing its inputs.
- **FR-005**: The logic MUST take a seeded random source; the same seed and the same inputs at the same steps MUST give the same state at every step.
- **FR-006**: All tunable values MUST be in one config object; its starting values are: play area 450×700 logical px, gravity 790 px/s², flap velocity −290 px/s, pipe speed 170 px/s rising to at most 280 px/s, gap 200 px shrinking to at least 140 px, plus the values in Assumption 3.
- **FR-007**: The game MUST have the phases **ready**, **playing** and **over**. In **ready** nothing moves and the score is 0; a flap press in **ready** MUST start **playing** and apply a flap. In **over** nothing moves and flap presses MUST be ignored.
- **FR-008**: In **playing**, each step MUST set the bird's vertical velocity to the flap velocity if a flap press happened, otherwise add gravity × step to it, then move the bird by that velocity.
- **FR-009**: Pipe pairs MUST spawn at the right edge at a fixed horizontal spacing, scroll left at the current pipe speed, and be removed once fully past the left edge. Each pair's gap centre MUST be drawn from the random source, uniformly within the range that keeps the whole gap inside the playable height with the configured margin.
- **FR-010**: The score MUST rise by 1 when the bird's front passes a pair's back edge; each pair MUST score at most once.
- **FR-011**: The round MUST end (phase **over**) when the bird's box overlaps a pipe, touches the ground, or touches the top edge of the play area.
- **FR-012**: Pipe speed and gap MUST be functions of the score: speed never decreases and gap never increases as the score rises, speed MUST be 170 px/s and gap 200 px at score 0, and they MUST never pass 280 px/s and 140 px. A pair keeps the gap it spawned with.

**Input**

- **FR-013**: A flap press MUST be a pointer press on the play area or a Space key press while the game has focus; holding a key or pointer MUST NOT repeat (key auto-repeat ignored, one flap per press). Space handled by the game MUST NOT scroll the host page.

**Time and display**

- **FR-014**: The simulation MUST advance in fixed time steps from the elapsed frame time, independent of the display refresh rate; at most a fixed catch-up limit of steps is taken per frame, and leftover time below one step carries to the next frame.
- **FR-015**: When the page becomes hidden the game MUST stop advancing; when it becomes visible again it MUST NOT advance for the time it was hidden.
- **FR-016**: The game MUST draw on a canvas that keeps the 450×700 aspect, with the bitmap sized at the logical size × min(device pixel ratio, 2).

**Round end, result and replay**

- **FR-017**: When a round ends, the game MUST call `submitResult(score)` exactly once for that round.
- **FR-018**: The over screen MUST show the server outcome the same way the template does (reward name on a SUCCESS win with a reward, otherwise the server's message; the fixed text "Something went wrong. Please try again." if the submit failed), plus the round's score and the best score since the game was mounted.
- **FR-019**: "Play again" MUST appear once the outcome is shown, MUST call `resetResult()` and return to **ready** with score 0 and no pipes, keeping the best score.
- **FR-020**: The game MUST send the tracking events `game_open` (once when the game opens), `game_start` (each time a round starts) and `game_over` with `params: { score }` (each time a round ends), and no other events.
- **FR-021**: Loading and load-error screens MUST behave as in the template (loading text until the config arrives; load error text and no round if it fails).

**Dependencies**

- **FR-022**: The game MUST add no new runtime or development dependency beyond those the template already uses.

### Key Entities

- **Game config**: the one object of tunable values (play area, gravity, flap velocity, speed and gap limits and their per-point steps, pipe width and spacing, bird size and position, ground height, gap margin, step length, catch-up limit).
- **Game state**: phase (ready, playing, over), bird (height, vertical velocity), pipes (horizontal position, gap centre, gap size, scored or not), score, distance since the last spawn.
- **Random source**: a seeded generator of numbers in [0, 1); same seed, same sequence.
- **Round result**: the score submitted and the server's outcome (or a submit failure).
- **Best score**: the highest score since the game was mounted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player goes from the ready screen to a running round with 1 tap or 1 Space press, and from the over screen back to ready with 1 press of "Play again".
- **SC-002**: The same seed and inputs give 100% identical game states on every run, and the same game at 60 Hz and at 120 Hz.
- **SC-003**: After a hidden period of any length, the game advances by 0 steps for the hidden time.
- **SC-004**: 100% of rounds submit their score exactly once and show one of the outcome texts.
- **SC-005**: For every score, pipe speed stays within 170–280 px/s and the gap within 140–200 px.
- **SC-006**: The game passes all 4 repository checks (lint, type-check, test, SDK build) and every functional requirement is covered by at least one test tagged `[005:FR-###]`.

## Assumptions

1. **Name `sky-hopper`**: the issue names the game (and its folder, package and SDK global) after an existing commercial game. Building a game in that genre is fine, but reusing another game's title is not, so this spec uses the original name `sky-hopper` (`apps/sky-hopper`, `SkyHopperSDK`) with the same gameplay and simple shapes. The owner can pick another original name in review; only FR-001 and the names in examples change.
2. **Best score is kept in memory only**: "the player's best score" is the highest score since the game was mounted; it is not saved across reloads or sent anywhere. Chosen because the issue names no storage, leaderboards are out of scope, and an embedded game should not write to the host page's storage.
3. **Values not given by the issue** (all in the config object, to be tuned by playtest): fixed step 1/120 s, at most 12 steps per frame (0.1 s); difficulty steps +5 px/s speed and −3 px gap per point (maximum speed at 22 points, minimum gap at 20); pipe width 70 px, horizontal spacing between pairs 240 px, gap margin 60 px from the top edge and from the ground; ground height 80 px; bird a 34×24 px box at x = 120 px, starting at the middle of the playable height; the game's random seed comes from the current time in play and is passed explicitly in tests. Chosen as common values for this genre that fit a 450×700 area.

Other defaults:

- Out of scope (issue #30): sound, sprite art and animations (simple shapes and colours only), leaderboards and sharing, a Storybook entry, and browser end-to-end tests.
- The SDK, Shadow DOM, adapters and outcome handling come from the template (spec 003) and `@repo/game-core` (spec 002) unchanged; this game uses them as they are.

## Changelog

- 0.1.0 (2026-11-10): initial draft from issue #30.
