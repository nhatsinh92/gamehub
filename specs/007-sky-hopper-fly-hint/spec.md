# Feature Specification: Sky Hopper ready-screen hint says how to fly

**Feature Branch**: `007-sky-hopper-fly-hint`

**Created**: 2026-11-10

**Status**: Draft

**Version**: 0.1.0

**Input**: User description: GitHub issue #43. In `sky-hopper`, the hint on the ready screen reads "Tap or press Space to start". Players do not learn that the same input makes the bird fly up during the round. Change the hint to "Tap or press Space to fly". Only the ready-screen hint text changes; no other behavior or layout. Update the UI contract in `specs/005-sky-hopper/contracts/game-ui.md` and the tests that assert the hint.

## User Scenarios & Testing *(mandatory)*

Actors:

- **Player**: opens Sky Hopper and wants to know what to do.

### User Story 1 - Ready-screen hint teaches the flying input (Priority: P1)

A player opens the game and sees the ready screen. The hint tells them that the same tap or Space press that starts the round also makes the bird fly.

**Why this priority**: It is the whole feature.

**Independent Test**: Render the game to the ready state and read the hint text; it equals "Tap or press Space to fly".

**Acceptance Scenarios**:

1. **Given** the game has loaded and shows the ready screen, **When** the player reads the hint, **Then** it reads exactly "Tap or press Space to fly".
2. **Given** the ready screen, **When** the player taps or presses Space, **Then** the round starts exactly as before and the hint is no longer shown.
3. **Given** a finished round, **When** the player chooses "Play again", **Then** the ready screen shows the same new hint.

### Edge Cases

- Loading and load-error screens show no hint and stay unchanged.
- Playing and game-over screens show no ready hint and stay unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The ready screen MUST show the hint "Tap or press Space to fly" (replacing "Tap or press Space to start") every time it is shown, including after "Play again".
- **FR-002**: Nothing else MAY change: the hint's position and styling, the score display, the input handling, the round flow and all other screens behave as before.
- **FR-003**: The UI contract `specs/005-sky-hopper/contracts/game-ui.md` and every test that asserts the ready hint MUST state the new text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The old hint text "Tap or press Space to start" appears nowhere in the game's UI, its UI contract or its tests.
- **SC-002**: All existing Sky Hopper tests pass with only the hint text in their expectations changed.

## Assumptions

- The hint is a single string used on the ready screen only.
- The earlier spec `005-sky-hopper` stays as written except for the UI contract file named in the issue; its historical task text is not rewritten.

## Changelog

- 0.1.0 (2026-11-10): Draft from issue #43.
