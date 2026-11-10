# Quickstart: sky-hopper

## Prerequisites

Node 24, pnpm, repository installed (`pnpm install`).

## Create (once, already done in the implementing PR)

```sh
pnpm gen-game sky-hopper
pnpm install
```

## Checks (spec FR-002, SC-006)

```sh
pnpm turbo run lint check-types test buildSdk --filter=sky-hopper
```

Expected: all pass; `apps/sky-hopper/dist/sky-hopper-sdk.js` is the only file in `dist/` and defines `window.SkyHopperSDK` (template `sdk-build` test).

## Play

- `pnpm --filter sky-hopper dev` → http://localhost:5173 (LocalAdapter). Tap or press Space (after clicking the game) to start; flap through the gaps; on game over the LocalAdapter reward, the score and the best score appear; "Play again" returns to ready.
- `pnpm --filter sky-hopper devSdk` → http://localhost:5174, the embedded SDK against the mock API.

## Manual checks (behaviour that unit tests cover through pure functions)

1. 60 Hz vs 120 Hz: the same round feels the same speed on both screens (unit: `clock.test.ts`).
2. Switch tab mid-round for 10 s and return: the bird is where it was (unit: `SkyHopper.test.tsx` hidden test, `clock.test.ts`).
3. On a phone (device pixel ratio 3), the canvas `width` attribute is 900 (inspect the element).
4. Holding Space flaps once.
