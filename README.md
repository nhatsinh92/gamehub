# GameHub

A repository of HTML5 mini-games, built spec-first with [Spec Kit](https://github.com/github/spec-kit).

- Project rules: [.specify/memory/constitution.md](.specify/memory/constitution.md)
- AI working rules: [CLAUDE.md](CLAUDE.md)

## Layout

- `apps/`: games and apps (none yet)
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

Tasks run through [Turborepo](https://turborepo.dev/docs). Run one workspace with a filter: `pnpm exec turbo build --filter=<name>`.
