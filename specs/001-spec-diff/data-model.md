# Data Model: Spec Diff Check

**Feature**: [spec.md](spec.md) (v1.0.0) | Parsing rules: [research.md R1](research.md#r1-finding-the-version-line-and-frsc-entries) | Output: [contracts/cli.md](contracts/cli.md)

Types live in `packages/spec-diff/src/`. Plain object types and string unions only (no `enum`; Node type stripping needs erasable syntax, research R3).

## SpecInput (core input)

One side of the comparison, built by the CLI wrapper. The core never touches the file system.

| Field | Type | Notes |
|---|---|---|
| `path` | string | Used in error messages and `files` (FR-006) |
| `text` | string | File contents; present when the read succeeded |
| `readError` | string | Present instead of `text` when the read failed (e.g. `ENOENT`) |

Exactly one of `text` / `readError` is set: `{ path, text } | { path, readError }`.

## ParsedSpec (internal, one per readable file)

| Field | Type | Rule |
|---|---|---|
| `version` | string \| null | Value of the first `**Version**:` line outside code fences; `null` if absent |
| `versionLine` | number \| null | Index of that line; removed before the whole-file comparison |
| `entries` | `Map<string, string>` | ID → normalized text, for FR and SC (FR-003) |
| `errors` | `SpecError[]` | `missing-version`, `invalid-version`, `duplicate-id` |
| `body` | string | Normalized file text without the Version line (FR-005) |

Validation:

- No Version line → `missing-version`. Value not `^\d+\.\d+\.\d+$` → `invalid-version`, and `version` is set to `null` in the result.
- An ID seen more than once → one `duplicate-id` error per ID, giving the count.

## SpecError

| Field | Type |
|---|---|
| `code` | `"unreadable-file" \| "missing-version" \| "invalid-version" \| "duplicate-id" \| "version-not-bumped"` |
| `file` | string (path) |
| `message` | string; starts with the path (FR-006) |

## IdChanges

`{ added: string[]; removed: string[]; changed: string[] }`, each sorted by prefix then number (FR-004).

- `added`: ID in new, not in old.
- `removed`: ID in old, not in new.
- `changed`: ID in both, normalized texts differ. Order of entries in the file does not matter.

## DiffResult (core output)

The single value the core returns; both output forms render it (FR-007).

| Field | Type |
|---|---|
| `result` | `"pass" \| "rule-violation" \| "input-error"` |
| `files` | `{ old: string; new: string }` |
| `versions` | `{ old: string \| null; new: string \| null }` |
| `contentChanged` | boolean \| null |
| `fr`, `sc` | `IdChanges` |
| `errors` | `SpecError[]` |

## Decision flow

```text
read errors + parse errors of both files (all collected, FR-012)
  any?  -> result = input-error, contentChanged = null, lists empty      (exit 2)
  none  -> compare: contentChanged = old.body != new.body; build fr/sc lists
           contentChanged and versions equal -> add version-not-bumped,
                                                result = rule-violation  (exit 1)
           otherwise                         -> result = pass           (exit 0)
```

Version direction and bump level are never compared (FR-010).
