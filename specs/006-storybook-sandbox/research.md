# Research: Storybook sandbox

- **Decision**: Storybook 10.6.6 with `@storybook/react-vite`, exact versions. Rationale: required by the issue; same Vite toolchain as the games. Alternative: a hand-made Vite playground page (no story catalog; rejected by the issue).
- **Decision**: import each game's `App` by relative path. Rationale: games are private apps without exports; changing them is out of scope. Alternative: `workspace:*` dependency plus an `exports` field in each game (touches games; rejected).
- **Decision**: each story renders a `<style>` with the game's `GAME_CSS` next to the game. Rationale: games get their CSS from `mountGame` (Shadow DOM), so `App` alone is unstyled. Shadow DOM embedding stays out of scope.
- **Decision**: `.storybook/main.ts` uses the glob `../src/stories/*.stories.tsx`. Rationale: FR-007.
- **Decision**: `build` runs `storybook build -o dist`. Rationale: turbo caches `dist/**`.
- **Decision**: the test renders the story component with `createRoot` under happy-dom and checks the game's root element (selector fixed from the game sources during implement). Rationale: light, matches the games' own tests.
- **Risk**: the workspace name `storybook` equals the dependency name `storybook`, and the issue uses `pnpm --filter storybook dev`. Verify in implement that pnpm installs the registry package. If not, name the workspace `@repo/storybook`, and record it in the spec Changelog and README.
