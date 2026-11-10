# Quickstart: validate the fly hint

1. `pnpm --filter sky-hopper test` — all tests pass; the ready-screen assertions expect "Tap or press Space to fly".
2. `pnpm --filter sky-hopper dev`, open http://localhost:5173 — the ready screen shows "Tap or press Space to fly"; tap or Space starts the round; "Play again" shows the same hint.
3. Search the app and the 005 UI contract for "to start": no hint match remains (see [contract delta](contracts/game-ui.md)).
