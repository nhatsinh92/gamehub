# scratch-card-example

## What this is

The example scratch-card game, and the template every new game is copied from. Keep it small: whatever is here ends up in every game.

It runs in two ways:

- **Standalone**: a normal dev page that uses `LocalAdapter` (no network).
- **Embedded SDK**: built into one script file that a host page loads with a `<script>` tag; it uses `RemoteAdapter`.

All server calls go through `@repo/game-core`. The game renders in a Shadow DOM, so host page CSS does not change it and its CSS does not change the host page.

## Scripts

Run each with `pnpm --filter scratch-card-example <script>`.

- `dev`: standalone dev page at http://localhost:5173 (`LocalAdapter`, no network).
- `devSdk`: builds the SDK in development mode (watch) and serves a host page at http://localhost:5174 that loads it with a `<script>` tag, against a local mock API.
- `buildSdk`: production build; writes `dist/scratch-card-example-sdk.js`, the only file in `dist/`.
- `lint`: ESLint, no warnings allowed.
- `check-types`: TypeScript, no emit.
- `test`: Vitest, once.

## SDK usage

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

`ScratchCardExampleSDK.destroy()` unmounts the game and empties the container. Calling `init` again replaces the running game. A wrong container or config logs one console error and renders nothing.

## Starting a new game from this template

After copying this folder, change:

1. `name` in `package.json`. The game id, the package name, the SDK global name (`lucky-wheel` gives `LuckyWheelSDK`) and the built file name all follow from it.
2. The gameplay: `src/ScratchCard.tsx`, `src/ScratchCanvas.tsx`, `src/scratch-progress.ts`.
3. `src/styles.ts`: the CSS injected into the Shadow DOM.
4. The tracking events (`game_open`, `game_reveal`, `game_result`).
5. This README, including the names in the examples above.
