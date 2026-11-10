# Contract: sky-hopper UI, SDK and events

The SDK (`SkyHopperSDK.init(container, config)`, `destroy()`), the Shadow DOM mount, the adapters, defaults 360×480 and the console/URL rules are the template's (spec 003), unchanged.

## DOM inside `.game` (test selectors)

| Screen | Content |
|---|---|
| loading | `.status` "Loading…" |
| load error | `.status` "Could not load the game. Please try again later."; no canvas |
| ready | `canvas.play` (focus target is the `.game` root, `tabIndex=0`); `.hint` "Tap or press Space to fly"; `.score` "0" |
| playing | `canvas.play`; `.score` current score |
| over, waiting | `canvas.play`; `.over` holding `.final-score` "Score: N" and `.best-score` "Best: B"; no button |
| over, answered | as waiting plus the outcome (`.prize` reward name, or `.status` server message, or `.status` "Something went wrong. Please try again.") and `button` "Play again" |

## Input

- `pointerdown` on `canvas.play` → flap press (and focuses `.game`).
- `keydown` on `.game` with `code === "Space"` and `repeat === false` → flap press; `preventDefault()` for every Space keydown on `.game`. Other keys: ignored.
- Presses in **over** are ignored.

## Server calls

- `initGame()` once on mount (template).
- `submitResult(score)` once per round, when the phase becomes **over** (FR-017).
- `resetResult()` on "Play again" (FR-019).

## Tracking events (FR-020), in order

```text
{ name: "game_open" }                         once, on mount
{ name: "game_start" }                        each ready → playing
{ name: "game_over", params: { score: N } }   each playing → over
```

No other events (the template's `game_reveal` and `game_result` are removed).
