# Quickstart

1. `pnpm install`
2. `pnpm --filter storybook dev`: open the printed URL, pick a game, play it.
3. `pnpm build`: succeeds and produces `apps/storybook/dist`.
4. `pnpm turbo run lint check-types test --continue`: all pass.
5. Add a story file under `apps/storybook/src/stories/`; it is listed with no config change.
