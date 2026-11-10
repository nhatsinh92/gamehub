# Story contract

A story file for a game `<name>`:

- Path: `apps/storybook/src/stories/<name>.stories.tsx` (matched by the glob; no config change).
- Default export: story meta with `title` set to the game name.
- Named export `Default`: renders the game's `App` with `LocalAdapter`, the game's id, an empty HTTP config (`baseUrl: ""`, token getter returning `""`) and the game's default size, plus the game's `GAME_CSS` in a `<style>` element.
- No network access and no SDK bundle.
