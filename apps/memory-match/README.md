# memory-match

## What this is

A memory card-matching game (spike). Sixteen face-down cards sit on a 4x4 canvas grid holding 8 pairs of coloured shapes. Tap or click to flip two at a time; a match stays face up, a mismatch flips back after one second (input is ignored meanwhile). The score is the number of moves (fewer is better), with a timer for elapsed seconds. When every pair is found the moves are sent as the score and a Play again button appears.

It runs in two ways:

- **Standalone**: a normal dev page that uses `LocalAdapter` (no network).
- **Embedded SDK**: built into one script file that a host page loads with a `<script>` tag; it uses `RemoteAdapter`.

All server calls go through `@repo/game-core`. The game renders in a Shadow DOM, so host page CSS does not change it and its CSS does not change the host page.

## Scripts

Run each with `pnpm --filter memory-match <script>`.

- `dev`: standalone dev page at http://localhost:5173 (`LocalAdapter`, no network).
- `devSdk`: builds the SDK in development mode (watch) and serves a host page at http://localhost:5174 that loads it with a `<script>` tag, against a local mock API.
- `buildSdk`: production build; writes `dist/memory-match-sdk.js`, the only file in `dist/`.
- `lint`: ESLint, no warnings allowed.
- `check-types`: TypeScript, no emit.
- `test`: Vitest, once.

## SDK usage

```html
<div id="game"></div>
<script src="https://cdn.example/memory-match-sdk.js"></script>
<script>
  MemoryMatchSDK.init("#game", {
    gameId: "memory-match",
    baseUrl: "https://api.example",
    getAccessTokenFunc: () => host.getToken(),
    sendTrackingFunc: (event) => host.track(event), // optional
    width: 360, // optional, CSS px
    height: 480, // optional, CSS px
  });
</script>
```

`MemoryMatchSDK.destroy()` unmounts the game and empties the container. Calling `init` again replaces the running game. A wrong container or config logs one console error and renders nothing.

## Starting a new game from this template

After copying this folder, change:

1. `name` in `package.json`. The game id, the package name, the SDK global name (`lucky-wheel` gives `LuckyWheelSDK`) and the built file name all follow from it.
2. The gameplay: `src/ScratchCard.tsx`, `src/ScratchCanvas.tsx`, `src/scratch-progress.ts`.
3. `src/styles.ts`: the CSS injected into the Shadow DOM.
4. The tracking events (`game_open`, `game_reveal`, `game_result`).
5. This README, including the names in the examples above.
