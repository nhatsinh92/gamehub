<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1 (PATCH)
- Modified principles: III. Verified Against the Spec — fixed missing backtick in tag example `[006:FR-001]`; no change in meaning
- Added sections: none
- Removed sections: none
- Templates: no update needed
- Deferred TODOs: none
-->

# GameHub Constitution

## Core Principles

### I. Spec-First

- Every behavior change MUST start from an approved spec.
- Every spec change MUST bump the spec's Version and add a Changelog entry.
- Exempt: tooling/infra changes with no user-facing behavior, and spikes. Spike code MUST be discarded before merge.

Rationale: the spec is the source of truth; code without a spec cannot be reviewed for intent.

### II. Humans Decide, AI Proposes

- AI MAY draft specs, plans, tasks and code when asked.
- A change takes effect only after the owner approves it in a PR.
- AI MUST NOT approve PRs, merge PRs, or amend this constitution.

Rationale: accountability stays with people.

### III. Verified Against the Spec

- Every functional requirement MUST have at least one test tagged with its feature and requirement ID (e.g. `[006:FR-001]`) before merge.
- Logic is test-first: its test MUST be seen failing before the code that satisfies it exists.

Rationale: tests written from the spec check intent, not just what the AI happened to write.

### IV. Simplicity

- No new dependency, service, or abstraction is added unless the reason is recorded in the plan and approved by the owner.

Rationale: AI adds complexity cheaply; removing it is expensive.

### V. No Secrets or Personal Data

- Secrets, tokens and personal data MUST NOT appear in code, logs, URLs, or test fixtures.

Rationale: leaks are irreversible.

## Project Context

GameHub is a repository of HTML5 mini-games.

- A contributor starts a new game by running the generator script, which copies the standard template. The template provides the shared parts; the contributor writes the game logic and gameplay, by hand or with AI assistance.
- Marketing picks games from the catalog for campaigns, or embeds them in a web/app game center to drive engagement and traffic.

## Governance

- This constitution supersedes other project practices where they conflict.
- Amendments are proposed in a PR and take effect only after owner approval
  (Principle II). Each amendment bumps the version using semantic versioning:
  - MAJOR: a principle or governance rule is removed or redefined incompatibly.
  - MINOR: a principle, section or rule is added, or guidance is materially expanded.
  - PATCH: clarifications, wording and typo fixes with no change in meaning.
- A deviation from any principle is allowed only if it is recorded in the plan's Complexity Tracking table.
- Growth rule: when the same defect type is found twice in review, or the same instruction has to be given to the AI twice, it MUST be turned into a rule (a lint or CI check preferred over prose) and the MINOR version bumped.

**Version**: 1.0.1 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-05
