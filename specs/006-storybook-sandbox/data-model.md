# Data Model

No stored data. Entities:

- **Story**: a module with a default `meta` (title = game name) and a `Default` story. It renders a `<style>` with the game's `GAME_CSS` and the game's `App` with `gameId`, `adapter: LocalAdapter`, an empty `httpConfig` and the game's default width and height.
- **Sandbox**: the `.storybook/main.ts` config with the stories glob and the React + Vite framework.
