# CI gates

Workflow: [`.github/workflows/pr.yml`](../../.github/workflows/pr.yml). Runs on every PR to `main` and on every push to `main`.

CI is built code-first: it is tooling with no user-facing behavior, exempt from a spec under [constitution Principle I](../../.specify/memory/constitution.md#i-spec-first) (see [spec-first-vs-code-first.md](spec-first-vs-code-first.md)). Every PR, AI-generated or hand-written, passes the same gates. There is no separate path for AI code.

## Gates

| Job | What it blocks | Principle | Proof (PR made to fail on purpose, closed unmerged) |
|---|---|---|---|
| `verify`: `pnpm turbo run lint check-types test --continue` | Lint violations (`max-lines-per-function` 60, `max-lines` 400), type errors, failing tests | III, AI-code contract | PR #5: a 61-line function → `max-lines-per-function` error, only problem reported, merge `BLOCKED` |
| `secrets`: gitleaks on every commit of the PR (`fetch-depth: 0`) | Secrets committed to git, **including ones deleted in a later commit** (still in history) | V | PR #3: fake GitHub PAT added, then deleted → `github-pat` found in the adding commit, merge `BLOCKED` |
| `guard-deps`: `pnpm-lock.yaml` changed and no `deps-approved` label → fail | Dependencies added, upgraded or removed without a recorded reason | IV | PR #4: `picocolors` added as a direct devDependency (already a transitive one; lockfile changed 3 lines) → fail, merge `BLOCKED`; with the `deps-approved` label → re-run passes |
| `spec-diff`: for each `specs/*/spec.md` changed in the PR and present on the base, compare base vs PR with `packages/spec-diff` (new or deleted specs are skipped) | A spec whose content changed without a Version bump; an unreadable spec, a missing or malformed Version, duplicate FR/SC IDs | I, CLAUDE.md Rule 1 | PR #11: one FR edited in `specs/001-spec-diff/spec.md`, Version left at 1.0.1 → `version-not-bumped`, exit 1, merge `BLOCKED` |

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

## AI pipeline: issue-to-pr

Workflow: [`.github/workflows/issue-to-pr.yml`](../../.github/workflows/issue-to-pr.yml). Prompts: [`prompts/issue-to-pr/`](../../prompts/issue-to-pr/).

Add the `ai-build` label to an issue → speckit specify → plan → tasks → analyze → implement (one Claude session) → loop: gates (lint, types, tests) + a fresh read-only AI review; on fail, a fix session; at most 3 fixes → push `ai/issue-N`, open a PR (`Closes #N`) → comment on the issue with an @mention of whoever added the label. Review still failing after 3 fixes, or Claude printed `ABORT` → draft PR or no PR, issue labelled `ai-needs-human`. A human always merges (Principle II); the PR still passes every gate above.

**Setup (once):**
- Secret `AI_BOT_TOKEN`: fine-grained PAT (or GitHub App token) on this repo only, Contents + Pull requests + Issues: read/write. A PR opened with `GITHUB_TOKEN` does not trigger `pr.yml`, so the required checks would never run.
- Secret `CLAUDE_CODE_OAUTH_TOKEN` (already used by `spec-impact`).
- Labels `ai-build` and `ai-needs-human`.

| Decision | Why |
|---|---|
| Starts only on a label | Adding a label needs triage rights; opening an issue does not. A stranger's issue cannot spend tokens or open PRs |
| Checkout without credentials; tokens only in the steps that push/comment; Claude has no `git push`, `gh` or network tools | The issue text is untrusted; a prompt injection in it cannot push or read a GitHub token |
| Reviewer is a new read-only session each round | It does not grade its own fix and cannot edit to pass |
| Existing `ai/issue-N` branch → fail | A re-run never overwrites a branch a human may have edited |
| `ABORT` instead of guessing when the issue is vague or needs a protected path | CODEOWNERS paths need the owner first |
| New dependencies allowed, with the reason in `plan.md`; PR body and issue comment flag them; `guard-deps` blocks merge until the owner adds `deps-approved` | Principle IV (reason in the plan, owner approves) without throwing away a whole run; the reviewer fails a dependency with no reason or one the standard library covers |

**Known limits:** the spec is still Draft (0.1.0) when code is written. Principle I asks for an approved spec first, so the owner approves spec and code together in the PR; split into two runs (stop after `speckit-analyze`, continue on a `spec-approved` label) if that is not acceptable. `Bash(pnpm:*)` can run any package script, so `CLAUDE_CODE_OAUTH_TOKEN` is reachable from code Claude writes or from a package it adds (when that code runs in tests).

## Adding a gate

Follow the constitution Growth rule: when review finds the same defect twice, add a check here, prove it with a PR made to fail on purpose, and add a row to the Gates table.
