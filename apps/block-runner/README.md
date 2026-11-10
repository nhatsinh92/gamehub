# block-runner

## What this is

An endless runner (spike). A block character sprints at a fixed spot while green cactus blocks scroll in from the right. Jump with Space or the up arrow, or tap. The score is the distance run; the speed rises every 100 points up to a cap. Touching an obstacle ends the round: the score is sent through the result submission and a Play again button appears.

It runs in two ways:

- **Standalone**: a normal dev page that uses `LocalAdapter` (no network).
- **Embedded SDK**: built into one script file that a host page loads with a `<script>` tag; it uses `RemoteAdapter`.

All server calls go through `@repo/game-core`. The game renders in a Shadow DOM, so host page CSS does not change it and its CSS does not change the host page.

## Scripts

Run each with `pnpm --filter block-runner <script>`.

- `dev`: standalone dev page at http://localhost:5173 (`LocalAdapter`, no network).
- `devSdk`: builds the SDK in development mode (watch) and serves a host page at http://localhost:5174 that loads it with a `<script>` tag, against a local mock API.
- `buildSdk`: production build; writes `dist/block-runner-sdk.js`, the only file in `dist/`.
- `lint`: ESLint, no warnings allowed.
- `check-types`: TypeScript, no emit.
- `test`: Vitest, once.

## SDK usage

```html
<div id="game"></div>
<script src="https://cdn.example/block-runner-sdk.js"></script>
<script>
  BlockRunnerSDK.init("#game", {
    gameId: "block-runner",
    baseUrl: "https://api.example",
    getAccessTokenFunc: () => host.getToken(),
    sendTrackingFunc: (event) => host.track(event), // optional
    width: 360, // optional, CSS px
    height: 480, // optional, CSS px
  });
</script>
```

`BlockRunnerSDK.destroy()` unmounts the game and empties the container. Calling `init` again replaces the running game. A wrong container or config logs one console error and renders nothing.

## Starting a new game from this template

After copying this folder, change:

1. `name` in `package.json`. The game id, the package name, the SDK global name (`lucky-wheel` gives `LuckyWheelSDK`) and the built file name all follow from it.
2. The gameplay: `src/ScratchCard.tsx`, `src/ScratchCanvas.tsx`, `src/scratch-progress.ts`.
3. `src/styles.ts`: the CSS injected into the Shadow DOM.
4. The tracking events (`game_open`, `game_reveal`, `game_result`).
5. This README, including the names in the examples above.
