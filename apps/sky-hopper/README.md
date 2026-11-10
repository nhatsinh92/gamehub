# sky-hopper

## What this is

A one-tap flapper: a bird falls under gravity and flaps up on each tap or Space press, through pairs of pipes. Each pair passed scores 1; hitting a pipe, the ground or the top edge ends the round. Pipes get faster and the gaps smaller as the score rises, within limits. At game over the score is sent to the server and the outcome, the score and the best score are shown.

It is the first game made with `pnpm gen-game`, and the example of a real game (not a template) that later games follow. The template contract code (SDK, mount, adapters, names) is unchanged; only the gameplay is new.

- `src/game/`: pure, seeded game logic with no DOM (`logic.ts`, `difficulty.ts`, `clock.ts`, `random.ts`, `canvas-size.ts`) and `config.ts`, the one object with every tunable value. `draw.ts` is the only file that touches the canvas.
- The simulation runs in fixed steps (1/120 s), so 60 Hz and 120 Hz screens play the same; it pauses while the page is hidden.
- The canvas bitmap uses a device pixel ratio capped at 2.

It runs in two ways:

- **Standalone**: a normal dev page that uses `LocalAdapter` (no network).
- **Embedded SDK**: built into one script file that a host page loads with a `<script>` tag; it uses `RemoteAdapter`.

All server calls go through `@repo/game-core`. The game renders in a Shadow DOM, so host page CSS does not change it and its CSS does not change the host page.

## Scripts

Run each with `pnpm --filter sky-hopper <script>`.

- `dev`: standalone dev page at http://localhost:5173 (`LocalAdapter`, no network).
- `devSdk`: builds the SDK in development mode (watch) and serves a host page at http://localhost:5174 that loads it with a `<script>` tag, against a local mock API.
- `buildSdk`: production build; writes `dist/sky-hopper-sdk.js`, the only file in `dist/`.
- `lint`: ESLint, no warnings allowed.
- `check-types`: TypeScript, no emit.
- `test`: Vitest, once.

## SDK usage

```html
<div id="game"></div>
<script src="https://cdn.example/sky-hopper-sdk.js"></script>
<script>
  SkyHopperSDK.init("#game", {
    gameId: "sky-hopper",
    baseUrl: "https://api.example",
    getAccessTokenFunc: () => host.getToken(),
    sendTrackingFunc: (event) => host.track(event), // optional
    width: 360, // optional, CSS px
    height: 560, // optional, CSS px
  });
</script>
```

`SkyHopperSDK.destroy()` unmounts the game and empties the container. Calling `init` again replaces the running game. A wrong container or config logs one console error and renders nothing. Tracking events: `game_open`, `game_start`, `game_over` (with `score`).

## Starting a new game from this template

Run `pnpm gen-game <name>` (then `pnpm install`); it copies the template and sets the names. Do not copy a folder by hand. This game is the example of a real game: look at how it replaced the gameplay, then change:

1. The gameplay: the files in `src/` that draw and run the game (here `src/game/`, `src/use-game.ts`, `src/SkyHopper.tsx`).
2. `src/styles.ts`: the CSS injected into the Shadow DOM.
3. The tracking events.
4. This README, including the names in the examples above.
