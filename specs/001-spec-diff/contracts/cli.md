# Contract: `spec-diff` CLI

**Feature**: [../spec.md](../spec.md) (v1.0.0) | Decisions: [../research.md](../research.md)

## Invocation

```text
node packages/spec-diff/src/cli.ts [--json] <old-spec-path> <new-spec-path>
```

- Exactly two paths, old first (FR-001). Paths are used as given; the CLI never runs git or fetches anything.
- `--json` may appear anywhere among the arguments. It selects the machine-readable form (FR-007).
- Any other argument starting with `-`, or a path count other than two: usage text on stderr, nothing on stdout, exit 2.
- The CLI only reads the two files (FR-011).

## Exit codes

| Code | `result` | When |
|---|---|---|
| 0 | `pass` | No error, whether or not anything changed (FR-009) |
| 1 | `rule-violation` | Content changed but the Version did not (FR-005) |
| 2 | `input-error` | A file cannot be read, has no valid Version, or has a duplicate ID (FR-006); bad usage; or an internal error. Takes precedence over 1 |

## Error codes

| `code` | `file` | Message (example) |
|---|---|---|
| `unreadable-file` | the path | `old.md: cannot read file (ENOENT)` |
| `missing-version` | the path | `new.md: no "**Version**: x.y.z" line` |
| `invalid-version` | the path | `new.md: Version "1.0" is not in x.y.z form` |
| `duplicate-id` | the path | `new.md: FR-003 is defined 2 times` (one error per duplicated ID) |
| `version-not-bumped` | the new path | `new.md: content changed but Version is still 1.0.0` |

All input errors from both files are reported in one run (FR-012). `version-not-bumped` is reported only when there is no input error.

## Machine-readable output (`--json`)

Stdout holds exactly one JSON object followed by a newline, and nothing else (FR-008). Same content as the readable form (FR-007, SC-003).

```json
{
  "schemaVersion": 1,
  "result": "pass",
  "files": { "old": "old.md", "new": "new.md" },
  "versions": { "old": "1.0.0", "new": "1.1.0" },
  "contentChanged": true,
  "fr": { "added": ["FR-004"], "removed": [], "changed": ["FR-002"] },
  "sc": { "added": [], "removed": ["SC-003"], "changed": [] },
  "errors": []
}
```

| Field | Type | Notes |
|---|---|---|
| `schemaVersion` | `1` | Bumped only on a breaking change to this shape |
| `result` | `"pass" \| "rule-violation" \| "input-error"` | Matches the exit code |
| `files.old`, `files.new` | string | Paths as given |
| `versions.old`, `versions.new` | string \| `null` | `null` when the file has no valid Version or cannot be read |
| `contentChanged` | boolean \| `null` | `null` on `input-error` (comparison not run) |
| `fr`, `sc` | `{ added, removed, changed }`, each `string[]` | IDs only, sorted (FR-004); all empty on `input-error` |
| `errors` | `{ code, file, message }[]` | Order: old-file errors, then new-file errors, then `version-not-bumped` |

On a usage error, there is no JSON output (stdout is empty) and the exit code is 2.

## Human-readable output (default)

Written to stdout. Lists are comma-separated; an empty list prints `none`.

```text
old.md -> new.md
Version: 1.0.0 -> 1.1.0
Content changed: yes
FR added: FR-004
FR removed: none
FR changed: FR-002
SC added: none
SC removed: SC-003
SC changed: none
Result: pass
```

- Identical files print `Content changed: no` and `none` on every list line (acceptance US1-4).
- Each error adds a line `error: <message>` before `Result:`.
- On `input-error`, a missing version prints as `?`, and the `Content changed` and list lines are omitted.
