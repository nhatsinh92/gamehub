# GameHub

A repository of HTML5 mini-games, built spec-first with [Spec Kit](https://github.com/github/spec-kit).

- Project rules: [.specify/memory/constitution.md](.specify/memory/constitution.md)
- AI working rules: [CLAUDE.md](CLAUDE.md)

## Layout

- `apps/scratch-card-example`, `apps/sky-hopper`: games
- `apps/storybook`: Storybook sandbox to play the games in the browser
- `packages/eslint-config`: shared ESLint config (`@repo/eslint-config/base`)
- `packages/typescript-config`: shared `tsconfig` (`@repo/typescript-config/base.json`)

## Commands

Needs Node and pnpm (version pinned in `package.json`).

```sh
pnpm install
pnpm build
pnpm dev
pnpm lint
pnpm check-types
pnpm test
pnpm format
```

## Storybook

A sandbox to play the games in the browser, with no backend and no built SDK bundle (each story uses `LocalAdapter` and its mock data).

- Run it: `pnpm --filter storybook dev` (http://localhost:6006).
- Static build: `pnpm build` (output in `apps/storybook/dist`).
- Add a game: copy `apps/storybook/src/stories/sky-hopper.stories.tsx` to `apps/storybook/src/stories/<game>.stories.tsx` and change the imports to `apps/<game>/src`. Stories are found by the `*.stories.tsx` glob, so no config changes.

Tasks run through [Turborepo](https://turborepo.dev/docs). Run one workspace with a filter: `pnpm exec turbo build --filter=<name>`.
