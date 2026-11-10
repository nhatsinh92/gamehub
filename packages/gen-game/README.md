# @repo/gen-game

Creates a new game as a copy of `apps/scratch-card-example`.

```sh
pnpm gen-game <name>
```

- `<name>` is kebab-case (`lucky-wheel`). The name `scratch-card-example` and any name already used by a folder in `apps/` or `packages/` are rejected (exit code 1).
- Not copied: `node_modules/`, `dist/`, `.turbo/`, `*.tsbuildinfo`.
- Replaced in every file that holds them: `scratch-card-example` → `<name>` and `ScratchCardExampleSDK` → `<Pascal>SDK`.
- Never overwrites an existing folder. If anything fails half-way, the partial folder is removed.
- Prints the next steps: `pnpm install`, then `pnpm --filter <name> dev`.

Contract: [specs/004-gen-game/contracts/cli.md](../../specs/004-gen-game/contracts/cli.md).
