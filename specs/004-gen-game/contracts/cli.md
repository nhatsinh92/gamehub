# Contract: gen-game CLI and core

## Invocation

```text
pnpm gen-game <name>          # from the repository root
node packages/gen-game/src/cli.ts <name>
```

Exactly one argument. The repository root is found from the CLI file's location, not the working directory.

## Exit codes

| Code | When |
|---|---|
| 0 | game created |
| 1 | usage error, rejected name, write failure or leftover names (nothing left behind) |

## Output

Success (stdout), for `lucky-wheel`:

```text
Created apps/lucky-wheel

Next steps:
  pnpm install
  pnpm --filter lucky-wheel dev
```

Failure (stderr, one line, prefixed `gen-game: `):

| Case | Message |
|---|---|
| no argument / extra arguments | `gen-game: usage: pnpm gen-game <name>` |
| `not-kebab-case` | `gen-game: "<name>" is not kebab-case (e.g. lucky-wheel)` |
| `template-name` | `gen-game: "scratch-card-example" is the template name; choose another name` |
| `name-taken` | `gen-game: "<name>" is already used by <apps|packages>/<name>` |
| `write-failed` | `gen-game: could not create apps/<name>: <error>; nothing was left behind` |
| `names-left` | `gen-game: template names left in <files>; nothing was left behind` |

## Core function

```ts
generateGame(options: GenerateOptions): GenerateResult   // see data-model.md
formatNextSteps(name: string): string                     // the success text above
```

`generateGame` never prints and never exits; it writes only inside `options.appsDir/<name>` and never writes inside `options.templateDir`.
