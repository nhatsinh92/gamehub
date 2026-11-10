# Data Model: gen-game

## GameName

- `name: string`: kebab-case (`^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, research R2).
- Derived `sdkGlobal: string = toSdkGlobalName(name)` (`lucky-wheel` → `LuckyWheelSDK`).
- Constants: `TEMPLATE_NAME = "scratch-card-example"`, `TEMPLATE_GLOBAL = "ScratchCardExampleSDK"`.

## GenerateOptions

| Field | Type | Meaning |
|---|---|---|
| `templateDir` | string | template folder (real: `apps/scratch-card-example`) |
| `appsDir` | string | folder the game is created in (real: `apps`) |
| `packagesDir` | string | workspace packages folder checked for name clashes (real: `packages`) |
| `name` | string | the game name as typed |

## GenerateResult

- `{ ok: true, targetDir: string, files: string[] }`: `files` are the created relative paths, `/`-separated, sorted.
- `{ ok: false, error: GenerateError, message: string }`, where `GenerateError` is one of:
  - `not-kebab-case` (FR-004)
  - `template-name` (FR-005)
  - `name-taken` (FR-006; message names the folder, e.g. `packages/game-core`)
  - `write-failed` (FR-012; message holds the underlying error; partial folder removed)
  - `names-left` (FR-010; message lists the files; partial folder removed)

Usage errors (FR-003) are handled by the CLI before the core is called.

## Flow

```text
validate name ──bad──▶ not-kebab-case | template-name | name-taken   (nothing written)
      │ ok
mkdir appsDir/name (non-recursive) ──EEXIST──▶ name-taken             (nothing written)
      │
walk templateDir (skip node_modules/, dist/, .turbo/, *.tsbuildinfo)
  for each file: read bytes → holds a name? replace both forms : keep bytes → write
      │ throw ──▶ rm target ──▶ write-failed
scan target for either name ──found──▶ rm target ──▶ names-left
      │ none
ok { targetDir, files }
```
