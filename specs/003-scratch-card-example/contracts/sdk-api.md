# Contract: Embedded SDK (`window.<SDK_GLOBAL_NAME>`)

**Feature**: [../spec.md](../spec.md) (v0.1.0) | Types: [../data-model.md](../data-model.md)

For this template `<SDK_GLOBAL_NAME>` is `ScratchCardExampleSDK` and the file is `scratch-card-example-sdk.js`; both come from the name source (FR-012).

## Loading

```html
<div id="game"></div>
<script src="https://cdn.example/scratch-card-example-sdk.js"></script>
<script>
  ScratchCardExampleSDK.init("#game", {
    gameId: "scratch-card-example",
    baseUrl: "https://api.example",
    getAccessTokenFunc: () => host.getToken(),
    sendTrackingFunc: (event) => host.track(event), // optional
    width: 360, // optional, CSS px
    height: 480, // optional, CSS px
  });
</script>
```

- The file is one classic script (IIFE); loading it adds exactly one global, `<SDK_GLOBAL_NAME>`, whose own keys are exactly `destroy` and `init` (FR-004, FR-013).
- Server calls use `RemoteAdapter` from `@repo/game-core` with `{ baseUrl, getAccessTokenFunc }` (FR-002, FR-003); endpoints in `specs/002-game-core/contracts/server-api.md`.

## `init(container, config): void`

| Case | Behaviour |
|---|---|
| valid container + valid config | Renders the game in the container's shadow root (open), with one `<style>` holding the game CSS, sized `width × height` (default 360 × 480) (FR-006, FR-010) |
| a game is already running (same or other container) | The running game is destroyed first, then the new one renders; exactly one game root exists; nothing thrown (FR-007) |
| container is a selector matching nothing, an invalid selector, or not an `Element` | `console.error` once, nothing rendered, nothing thrown (FR-008) |
| config not an object, or a field breaks a rule in data-model `SdkConfig` | `console.error` once, nothing rendered, nothing thrown (FR-008) |

Returns `undefined` in every case.

### Console error messages (exact)

Prefix `[<SDK_GLOBAL_NAME>] init: `, then one of:

- `container "<selector>" not found`
- `invalid container selector "<selector>"`
- `container must be a CSS selector or an Element`
- `container cannot host a shadow root` (when `attachShadow` throws)
- `config must be an object`
- `config.<field> is required and must be <rule>` for `gameId`, `baseUrl` (`a non-empty string`), `getAccessTokenFunc` (`a function`)
- `config.<field> must be <rule>` for `sendTrackingFunc` (`a function`), `width`, `height` (`a positive number`)

Messages never contain a config value other than the selector the host passed, and never the token.

## `destroy(): void`

- Unmounts the React root, removes every node from the shadow root and every child of the container; the container then has `childNodes.length === 0` and `shadowRoot.childNodes.length === 0` (FR-009).
- No game running (never started, or already destroyed): does nothing, throws nothing.

## Tracking (FR-011, FR-019)

Events go to `config.sendTrackingFunc` through the game context's `sendTracking`:

- `{ name: "game_open" }`
- `{ name: "game_reveal" }`
- `{ name: "game_result", params: { status, isWin } }`

## Isolation (FR-006)

- All game DOM is inside the shadow root; nothing is added to `document.head` or `document.body` by the game.
- The game CSS starts with `:host { all: initial; display: block; … }` so inherited host styles do not reach the game; its selectors cannot match host elements.
