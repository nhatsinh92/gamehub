# UI contract delta: ready screen hint

Amends `specs/005-sky-hopper/contracts/game-ui.md`; all other rows are unchanged.

| State | Change |
|-------|--------|
| ready | `.hint` text is "Tap or press Space to fly" (was "Tap or press Space to start") |

The hint is shown on every ready screen, including after "Play again". Loading, playing, game-over and load-error screens are unchanged.
