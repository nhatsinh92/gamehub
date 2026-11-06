# CI gates

Workflow: [`.github/workflows/pr.yml`](../../.github/workflows/pr.yml). Runs on every PR to `main` and on every push to `main`.

CI is built code-first: it is tooling with no user-facing behavior, exempt from a spec under [constitution Principle I](../../.specify/memory/constitution.md#i-spec-first) (see [spec-first-vs-code-first.md](spec-first-vs-code-first.md)). Every PR, AI-generated or hand-written, passes the same gates. There is no separate path for AI code.

## Gates

| Job | What it blocks | Principle | Proof (PR made to fail on purpose, closed unmerged) |
|---|---|---|---|
| `verify`: `pnpm turbo run lint check-types test --continue` | Lint violations (`max-lines-per-function` 60, `max-lines` 400), type errors, failing tests | III, AI-code contract | PR #`<5>`: a 61-line function → `max-lines-per-function` error, only problem reported, merge `BLOCKED` |
| `secrets`: gitleaks on every commit of the PR (`fetch-depth: 0`) | Secrets committed to git, **including ones deleted in a later commit** (still in history) | V | PR #`<3>`: fake GitHub PAT added, then deleted → `github-pat` found in the adding commit, merge `BLOCKED` |
| `guard-deps`: `pnpm-lock.yaml` changed and no `deps-approved` label → fail | Dependencies added, upgraded or removed without a recorded reason | IV | PR #`<4>`: `picocolors` added as a direct devDependency (already a transitive one; lockfile changed 3 lines) → fail, merge `BLOCKED`; with the label → `<kết quả bước 7>` |
| `spec-diff`: for each `specs/*/spec.md` changed in the PR and present on the base, compare base vs PR with `packages/spec-diff` (new or deleted specs are skipped) | A spec whose content changed without a Version bump; an unreadable spec, a missing or malformed Version, duplicate FR/SC IDs | I, CLAUDE.md Rule 1 | PR #`11`: one FR edited in `specs/001-spec-diff/spec.md`, Version left at 1.0.1 → `version-not-bumped`, exit 1, merge `BLOCKED` |

`pnpm install --frozen-lockfile` in `verify` also fails when `package.json` changes without the lockfile, so `guard-deps` cannot be bypassed by skipping the lockfile.

**Enforcement:** a ruleset on `main` requires a PR and all four checks to pass. `guard-deps` and `spec-diff` are skipped on push to `main` (job-level `if:`); a skipped job counts as passing, so it never leaves a PR waiting. No approval is required yet: the author cannot approve their own PR in a solo repo. Turn on required Code Owner review when AI opens PRs (the author is then a bot, so the rule can be met).

## Design decisions

| Decision | Why |
|---|---|
| `permissions: contents: read` by default; `secrets` adds only `pull-requests: read` | Least privilege. No job can write to the repo. Gitleaks PR comments are off, so it needs no write permission |
| Actions pinned to a commit SHA, tag in a comment | A tag can be moved to other code (e.g. the `tj-actions/changed-files` compromise, March 2025); a SHA cannot. Cost: no automatic updates → bump with Dependabot/Renovate |
| No `paths:` filter on the workflow | A required check from a workflow that never starts stays pending forever and blocks the PR |
| PR data passed to scripts via `env`, never `${{ }}` inside `run:` | Prevents script injection from PR titles, labels or branch names |
| `--continue` on turbo | Without it, a lint failure stops the run and can hide failing tests until the next push |
| No `--filter=...[origin/main]` yet | One package; filtering saves nothing. Turn on when there are several packages |
| No `pnpm audit` gate yet | A new advisory can fail a PR that changed nothing. Add later as a scheduled job, not a PR gate |

## Known limits

- **Gitleaks runs after the push.** When it fails, the secret is already on GitHub and must be rotated. GitHub push protection did not stop the fake token (off, or it ignores tokens that fail validation). To block before the remote: check push protection in Settings → Code security, or run gitleaks in a pre-commit hook.
- **Gitleaks prints the commit author email** next to each finding. The email is already in commit metadata, but Actions logs of a public repo are public. Use the GitHub `noreply` email for commits if that matters.
- **Explicit `any` is not linted** (`no-explicit-any` was dropped). Only review catches it.
- **AI review is not a gate.** A future AI review step may only comment (`contents: read`, `pull-requests: write`), runs only with the `ai-review` label, never on fork PRs.

## Adding a gate

Follow the constitution Growth rule: when review finds the same defect twice, add a check here, prove it with a PR made to fail on purpose, and add a row to the Gates table.
