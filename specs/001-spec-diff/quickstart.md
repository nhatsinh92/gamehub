# Quickstart: Spec Diff Check

How to prove the feature works end to end. Output shape and exit codes: [contracts/cli.md](contracts/cli.md).

## Prerequisites

- Node 24 (`node --version` → `v24.x`), pnpm from `packageManager`.
- `pnpm install` at the repo root.

## Automated checks

```sh
pnpm turbo run lint check-types test --filter=@repo/spec-diff
```

Expected: all pass. Every FR has at least one test tagged `[001:FR-###]` (constitution III):

```sh
grep -rhoE "\[001:FR-[0-9]{3}\]" packages/spec-diff/src | sort -u   # FR-001 .. FR-012
```

## Manual scenarios

Run from the repo root. The old version comes from git, as a CI caller would do it (spec Assumptions).

| # | Setup | Command | Expect |
|---|---|---|---|
| 1 | None | `node packages/spec-diff/src/cli.ts specs/001-spec-diff/spec.md specs/001-spec-diff/spec.md` | `Content changed: no`, all lists `none`, exit 0 |
| 2 | Copy the spec to a scratch file; reword FR-002 only | `node packages/spec-diff/src/cli.ts <spec> <copy>` | `FR changed: FR-002`, `error: ... content changed but Version is still 1.0.0`, exit 1 |
| 3 | Same copy, Version set to `1.0.1` | same | `FR changed: FR-002`, `Result: pass`, exit 0 |
| 4 | Copy with only line wrapping changed | same | `Content changed: no`, exit 0 |
| 5 | Old path does not exist | `node packages/spec-diff/src/cli.ts missing.md <spec>` | `error: missing.md: cannot read file (ENOENT)`, exit 2 |
| 6 | Copy with a second `FR-003` line and no Version line | same | Both `duplicate-id` and `missing-version` errors, exit 2 |
| 7 | Scenario 2 with `--json` | add `--json` | Stdout parses with `JSON.parse`; same IDs and errors as scenario 2; `"result": "rule-violation"` |
| 8 | Against `main` (bash) | `git show main:specs/001-spec-diff/spec.md > /tmp/old.md && node packages/spec-diff/src/cli.ts /tmp/old.md specs/001-spec-diff/spec.md` | Report for the branch's changes to the spec |

Check the exit code with `echo $?` (bash) or `$LASTEXITCODE` (PowerShell). After every scenario, `git status` shows no new or changed files from the tool (FR-011, SC-005).
