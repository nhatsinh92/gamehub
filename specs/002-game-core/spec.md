# Feature Specification: Game Core (shared game context, server adapters, HTTP client)

**Feature Branch**: `002-game-core`

**Created**: 2026-11-09

**Status**: Implemented

**Version**: 1.0.0

**Input**: User description: GitHub issue #18 "game-core: shared game context, server adapters and HTTP client for all games". Every game needs to load its config and the player's state, submit a round result, and send tracking events to the host app. A shared, tested package does this once so games never call the server directly and never trust a malformed server response.

## User Scenarios & Testing *(mandatory)*

Actors:

- **Game developer**: writes a game on top of the shared package (through the template, a later issue).
- **Host app**: the web/app game center that embeds a game and supplies the server address, the player's access token and a tracking function.
- **Player**: plays the game; sees only what the server returned.

### User Story 1 - Game loads its config and the player's state (Priority: P1)

A game, embedded in the host app, asks the shared game context to load the game config and then the current player's state (nickname, total turns, remaining turns, best score, current rank). The game shows them, or shows an error if loading failed.

**Why this priority**: No game can start without its config and the player's turns. This is the minimum every game needs.

**Independent Test**: Give the context a fake server that answers the config and player-state requests with valid data. Call "init game" then "get current user"; confirm the exposed config and player state equal the server data exactly, and that loading is reported while the requests run.

**Acceptance Scenarios**:

1. **Given** a server returning a valid config, **When** the game calls "init game", **Then** the context exposes that config, loading is true while the request runs and false afterwards, and no error is set.
2. **Given** a server returning a valid player state, **When** the game calls "get current user", **Then** the context exposes exactly that nickname, total turns, remaining turns, best score and current rank.
3. **Given** the config request, **When** it is sent, **Then** it carries no access token; **Given** the player-state request, **When** it is sent, **Then** it carries the token in the access-token header only.
4. **Given** a server answering the player-state request with HTTP 401, **When** the game calls "get current user", **Then** the context exposes an error stating the request was unauthorized and the player state is unchanged.

---

### User Story 2 - Game submits a round result and shows the server's verdict (Priority: P1)

After a round, the game submits the score. The server decides the outcome (success, error, out of turns, maintenance), whether the player won, any reward, and the remaining turns. The game shows exactly that.

**Why this priority**: Turns and rewards are the business value of a campaign; the server owns them and the client must faithfully show them.

**Independent Test**: Give the context a fake server that answers the result submission with each status in turn; confirm the exposed result equals the server's result exactly, and that "reset result" clears it.

**Acceptance Scenarios**:

1. **Given** a server answering with status SUCCESS, a win and a reward, **When** the game submits score 120, **Then** the server receives exactly `{ score: 120 }` and the context exposes the result with that status, win flag, reward (id, name, code), remaining turns and message.
2. **Given** a server answering with status OUT_OF_TURN, ERROR or MAINTENANCE, **When** the game submits a score, **Then** the context exposes that result as-is (not as an error), so the game can show the server's message.
3. **Given** an exposed result, **When** the game calls "reset result", **Then** the result is cleared.
4. **Given** a result without a reward, **When** it is received, **Then** the exposed result has no reward and is otherwise complete.

---

### User Story 3 - Malformed or failed server responses never reach the game (Priority: P1)

Whenever the server is unreachable, answers with an error status, sends something that is not JSON, or sends data with a missing or wrong-typed field, the game receives a clear error instead of partial data or a crash.

**Why this priority**: Trusting a wrong server response could show the player a wrong reward or turn count. This is the safety guarantee of the package.

**Independent Test**: For each failure kind (network failure, HTTP 5xx, HTTP 401, non-JSON body, missing envelope, missing field, wrong-typed field), call each operation against a fake server and confirm an error with a clear message is exposed and the previous data is untouched.

**Acceptance Scenarios**:

1. **Given** a player-state response missing `remainingTurns`, **When** it is received, **Then** the context exposes an error naming the missing field and does not expose any part of that response.
2. **Given** a result response whose `isWin` is a string, **When** it is received, **Then** the context exposes an error naming the field and its expected type.
3. **Given** the network fails, or the server answers HTTP 500, or the body is not JSON, **When** any operation runs, **Then** the operation ends with an error (no uncaught exception) and loading returns to false.

---

### User Story 4 - Developer runs a game standalone with mock data (Priority: P2)

A game developer runs a game locally or in a demo with no server. They pick the local adapter instead of the remote one; the game gets fixed, valid config, player state and results with no network access.

**Why this priority**: Speeds up development and demos, but games can ship without it.

**Independent Test**: Use the context with the local adapter and a fetch that fails the test if called; run all three operations and confirm each returns the documented fixed data.

**Acceptance Scenarios**:

1. **Given** the local adapter, **When** the game calls "init game", "get current user" and "submit result", **Then** each exposes the adapter's fixed data and no network request is made.
2. **Given** the local adapter and the remote adapter, **When** a game is written against the shared adapter contract, **Then** switching between them needs no change in game code.

---

### User Story 5 - Game sends tracking events to the host app (Priority: P3)

The game reports events (e.g. "game started", "round ended") through the context. If the host app supplied a tracking function, the event is passed to it; otherwise nothing happens.

**Why this priority**: Useful for marketing analytics, not needed to play.

**Independent Test**: Provide a recording tracking function; send an event and confirm the function received exactly that event once. Remove the function and confirm sending does nothing and does not fail.

**Acceptance Scenarios**:

1. **Given** a host tracking function, **When** the game sends an event, **Then** the function is called once with exactly that event.
2. **Given** no host tracking function, **When** the game sends an event, **Then** nothing happens and no error is raised.
3. **Given** a host tracking function that throws, **When** the game sends an event, **Then** the game is not interrupted and the context's error is not changed.

### Edge Cases

- The access token cannot be obtained (the host's token function fails or returns an empty value): the protected request is not sent and the operation ends with an error.
- Errors, error messages and tracking data never contain the access token; the token never appears in a URL.
- The server answers HTTP 401: treated like any other failed request (an error), with no token refresh or retry.
- The server answers HTTP 2xx with a body that is valid JSON but not wrapped in `{ "data": ... }`, or `data` is null: an error.
- Extra, unknown fields in a response are ignored and not passed to the game.
- The score to submit is not a finite number (NaN, Infinity): the submission is rejected with an error and no request is sent.
- The base URL ends with a slash, or the game ID contains characters that are special in a URL: the request URL is still well-formed.
- A game uses the context outside the provider: it gets a clear error saying the provider is missing.
- A new operation succeeds after an earlier one failed: the error is cleared.
- Several operations run at once: loading stays true until all of them have finished.

## Requirements *(mandatory)*

### Functional Requirements

**HTTP client**

- **FR-001**: The HTTP client MUST be configured with the server base URL and a token function supplied by the host app, and MUST build each request URL from the base URL, the game ID and the endpoint path.
- **FR-002**: For protected requests, the HTTP client MUST send the access token only in the `X-Access-Token` request header; the token MUST NOT appear in a URL, an error message, a log or tracking data.
- **FR-003**: Requests marked public (the game config) MUST be sent without the access token and without calling the token function.
- **FR-004**: The HTTP client MUST turn every failure into an error result, never an uncaught exception: network failure, any non-2xx status (including 401 and 5xx, with the status code in the message), a body that is not JSON, a missing `{ "data": ... }` envelope, and a failure to obtain the token.

**Server API**

- **FR-005**: The package MUST load the game config with `GET /{gameId}/v1/init` as a public request.
- **FR-006**: The package MUST load the player state with `GET /{gameId}/v1/me`: nickname, total turns, remaining turns, best score and current rank.
- **FR-007**: The package MUST submit a round result with `POST /{gameId}/v1/reward` and the JSON body `{ "score": <score> }`, and MUST read back: status (one of `SUCCESS`, `ERROR`, `OUT_OF_TURN`, `MAINTENANCE`), win flag, optional reward (id, name, code), remaining turns and message. A non-finite score MUST be rejected with an error before any request.
- **FR-008**: Every server response MUST be validated against the expected shape before use. A missing field or a field of the wrong type (including a status outside the four allowed values) MUST become an error whose message names the field and the expected type; no part of an invalid response may reach the game. Fields not in the expected shape MUST be dropped.

**Adapters**

- **FR-009**: The package MUST define one adapter contract with three operations: get config, get current user, submit result.
- **FR-010**: The remote adapter MUST implement the contract by calling the server API (FR-005 to FR-008) through the HTTP client.
- **FR-011**: The local adapter MUST implement the contract with fixed, documented mock data that passes the same validation as server data, and MUST make no network request and never ask for the token.

**Game context**

- **FR-012**: The package MUST provide a game context provider that takes a game ID, an adapter, the HTTP configuration and an optional tracking function, and a hook through which games read it. Using the hook outside the provider MUST raise a clear error.
- **FR-013**: The context MUST expose `config`, `currentUser`, `result`, `isLoading` and `error`, and the operations `initGame()`, `getCurrentUser()`, `submitResult(score)`, `resetResult()` and `sendTracking(event)`.
- **FR-014**: `initGame`, `getCurrentUser` and `submitResult` MUST set `isLoading` to true while their request runs and back to false when every running request has finished; on success they MUST store the validated data and clear `error`; on failure they MUST set `error` and leave the previously stored data unchanged.
- **FR-015**: A result with status `ERROR`, `OUT_OF_TURN` or `MAINTENANCE` received as a valid response MUST be exposed as the `result`, exactly as the server returned it, not as an `error`. The client MUST NOT change turns, rewards or the win flag itself.
- **FR-016**: `resetResult()` MUST clear the stored result.
- **FR-017**: `sendTracking(event)` MUST pass the event unchanged to the host's tracking function when one is given, and do nothing otherwise. The package MUST NOT add the token to tracking data. A failure in the host's tracking function MUST NOT interrupt the game or change `error`.

### Key Entities

- **Game config**: game-specific settings returned by the server for a game ID. Treated as an object whose contents belong to the game.
- **Player state (current user)**: nickname (text), total turns (whole number ≥ 0), remaining turns (whole number ≥ 0), best score (number), current rank (whole number ≥ 1, or none when the player is not ranked yet).
- **Round result**: status (`SUCCESS`, `ERROR`, `OUT_OF_TURN`, `MAINTENANCE`), win flag (yes/no), optional reward, remaining turns (whole number ≥ 0), message (text).
- **Reward**: id, name and code (all text).
- **Tracking event**: data the game wants to report to the host app; opaque to the package.
- **Adapter**: a source of config, player state and results: remote (server) or local (mock).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A game can load its config and player state and submit a result without writing any server call of its own: 0 direct server calls in game code.
- **SC-002**: 100% of the listed failure kinds (network failure, HTTP 401, HTTP 5xx, non-JSON body, missing envelope, missing field, wrong-typed field, invalid status) end in a clear error, with 0 crashes and 0 partial objects reaching the game.
- **SC-003**: In 100% of requests, the access token appears only in the access-token header of protected requests, and never in a URL, an error message or tracking data.
- **SC-004**: A game switches between server data and mock data by changing only the adapter it passes, with 0 other code changes, and mock mode makes 0 network requests.
- **SC-005**: For every result status the server can return, the player sees exactly the server's status, win flag, reward, remaining turns and message.

## Assumptions

Chosen without asking (no human answers questions in this run):

1. **Config shape is game-specific**: the issue does not list config fields, so the package only checks that the config is a JSON object (not null, not an array) and passes its contents to the game as-is. A game that needs stricter checks validates its own fields.
2. **Non-SUCCESS statuses are results, not errors**: `ERROR`, `OUT_OF_TURN` and `MAINTENANCE` arrive in a valid HTTP 2xx response and are shown to the player through `result` (FR-015); only transport, HTTP-status and validation failures become `error`. For MAINTENANCE the server does not consume the turn; the client simply shows the remaining turns the server returns.
3. **Current rank may be absent**: a player who has not played yet has no rank, so `currentRank` is either a whole number ≥ 1 or null; any other value is a validation error.

Other defaults:

- `initGame()` loads only the config; `getCurrentUser()` loads only the player state. The game decides when to call each.
- The host's token function may be synchronous or asynchronous.
- Error messages are for developers and logs, in English; the game decides what to show the player.
- Token refresh, retries, response caching, request cancellation, the game template and any UI are out of scope (issue #18).
- Tests use a fake fetch; no network and no mock-server library.

## Changelog

- 1.0.0 (2026-11-10): approved by the owner; Status → Implemented (all 52 tasks done in packages/game-core, PR #22).
- 0.1.0 (2026-11-09): initial draft from issue #18.
