# cyber-alley-sniper

## What this is

A 3D sniper game in a rainy cyberpunk alley (spike). You look through a scope and shoot enemies that pop up at windows, on rooftops and in the street. A head hit scores 3 and slows time to 30% for 0.7 s (bullet-time); a body hit scores 1. An enemy that stays visible too long shoots back and costs one of your 3 lives. At 0 lives the score is sent through the template's result submission and a Play again button shows.

Controls: drag to aim (touch) or move the mouse after the first click (pointer lock, drag as fallback); click or tap to fire; hold `Z` or the Zoom button for the scope. The render loop pauses while the tab is hidden.

Dependencies (approved on the issue):

- `three`: the 3D renderer, scene, instanced rain and post-processing (bloom, depth of field).
- `@types/three`: TypeScript types for `three`.

Game rules are in `src/game-logic.ts` (no three.js); `src/scene.ts` only draws them.

It runs in two ways:

- **Standalone**: a normal dev page that uses `LocalAdapter` (no network).
- **Embedded SDK**: built into one script file that a host page loads with a `<script>` tag; it uses `RemoteAdapter`.

All server calls go through `@repo/game-core`. The game renders in a Shadow DOM, so host page CSS does not change it and its CSS does not change the host page.

## Scripts

Run each with `pnpm --filter cyber-alley-sniper <script>`.

- `dev`: standalone dev page at http://localhost:5173 (`LocalAdapter`, no network).
- `devSdk`: builds the SDK in development mode (watch) and serves a host page at http://localhost:5174 that loads it with a `<script>` tag, against a local mock API.
- `buildSdk`: production build; writes `dist/cyber-alley-sniper-sdk.js`, the only file in `dist/`.
- `lint`: ESLint, no warnings allowed.
- `check-types`: TypeScript, no emit.
- `test`: Vitest, once.

## SDK usage

```html
<div id="game"></div>
<script src="https://cdn.example/cyber-alley-sniper-sdk.js"></script>
<script>
  CyberAlleySniperSDK.init("#game", {
    gameId: "cyber-alley-sniper",
    baseUrl: "https://api.example",
    getAccessTokenFunc: () => host.getToken(),
    sendTrackingFunc: (event) => host.track(event), // optional
    width: 360, // optional, CSS px
    height: 480, // optional, CSS px
  });
</script>
```

`CyberAlleySniperSDK.destroy()` unmounts the game and empties the container. Calling `init` again replaces the running game. A wrong container or config logs one console error and renders nothing.

## Starting a new game from this template

After copying this folder, change:

1. `name` in `package.json`. The game id, the package name, the SDK global name (`lucky-wheel` gives `LuckyWheelSDK`) and the built file name all follow from it.
2. The gameplay: `src/ScratchCard.tsx`, `src/ScratchCanvas.tsx`, `src/scratch-progress.ts`.
3. `src/styles.ts`: the CSS injected into the Shadow DOM.
4. The tracking events (`game_open`, `game_reveal`, `game_result`).
5. This README, including the names in the examples above.
