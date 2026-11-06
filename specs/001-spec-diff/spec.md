# Feature Specification: Spec Diff Check

**Feature Branch**: `001-spec-diff`

**Created**: 2026-11-06

**Status**: Implemented

**Version**: 2.0.1

**Input**: User description: "a CLI check that compares two versions of the same spec file. Reviewers and CI need to see exactly which requirements changed, and every change must come with a version bump (CLAUDE.md Rule 1)."

## Clarifications

### Session 2026-11-06

- Q: When an FR or SC is changed, should the report include its old and new text, or only its ID? → A: IDs only, in both forms.
- Q: Should an input problem end with a different failing exit code than "content changed but version not bumped"? → A: Yes: three outcomes (pass, rule violation, input error).
- Q: When there are several problems, should the check report all of them or stop at the first one? → A: Report all of them in one run.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reviewer sees what changed in a spec (Priority: P1)

A person reviewing a spec change on their machine runs the check with the old and the new version of the spec. They see the version before and after, and which FR and SC IDs were added, removed, or changed, without reading a line-by-line text diff.

**Why this priority**: This is the core value: a short, requirement-level summary of a spec change. Everything else (CI, machine-readable output) reuses it.

**Independent Test**: Give the check two spec files that differ by one added FR, one removed SC, and one reworded FR, plus a version bump. Confirm the readable report lists exactly those three IDs under the right headings and shows both versions.

**Acceptance Scenarios**:

1. **Given** an old spec at version 1.0.0 with FR-001..FR-003 and a new spec at 1.1.0 that adds FR-004, **When** the reviewer runs the check, **Then** the report shows `1.0.0 → 1.1.0` and lists FR-004 as added, with nothing removed or changed.
2. **Given** a new spec where the text of SC-002 differs from the old one, **When** the check runs, **Then** SC-002 is listed as changed.
3. **Given** a new spec without SC-003, which the old spec had, **When** the check runs, **Then** SC-003 is listed as removed.
4. **Given** two identical files, **When** the check runs, **Then** the report states that nothing changed and the check passes.

---

### User Story 2 - CI fails a spec change that skipped the version bump (Priority: P2)

On a pull request, CI runs the check on each changed spec (old version from the base branch, new version from the PR). If the spec's content changed but its Version did not, the check fails so the PR cannot pass unnoticed.

**Why this priority**: This enforces CLAUDE.md Rule 1 and constitution Principle I automatically instead of by review memory.

**Independent Test**: Run the check on two files that differ in one FR's text but share the same Version. Confirm it reports the error and ends with a failing result; then bump the version and confirm it passes.

**Acceptance Scenarios**:

1. **Given** the old and new spec both at 1.0.0 and FR-002's text differs, **When** CI runs the check, **Then** the check reports a "content changed but version not bumped" error and ends with a failing result.
2. **Given** the same content change and the new spec at 1.0.1, **When** CI runs the check, **Then** the check passes and reports the change, without judging whether 1.0.1 was the right bump level.
3. **Given** a content change only outside FR and SC (for example an edge case or assumption) and no version change, **When** CI runs the check, **Then** the check still reports the error, because the rule covers the whole spec content.
4. **Given** the old spec at 1.2.0 and the new spec at 1.1.0, **When** CI runs the check, **Then** the check reports a `version-decreased` error and ends with a failing result (rule violation).

---

### User Story 3 - An automated step reads the result (Priority: P3)

A later CI step (for example an AI reviewer) asks for the machine-readable form and reads the versions, the added/removed/changed IDs, and any error, without parsing human-oriented text.

**Why this priority**: Not needed yet, but the output shape must be fixed now so later consumers can rely on it.

**Independent Test**: Run the check on the same input in both forms. Confirm the machine-readable output parses as a structured document and carries the same versions, IDs, and errors as the readable report.

**Acceptance Scenarios**:

1. **Given** any pair of spec files, **When** the check runs once in readable form and once in machine-readable form, **Then** both carry the same versions, the same added/removed/changed ID lists, and the same errors.
2. **Given** the machine-readable form is requested, **When** the check runs, **Then** the standard output contains only the machine-readable document (no extra text mixed in).

---

### Edge Cases

- A file path does not exist or cannot be read: the check reports which path failed and ends with a failing result, distinct from the "version not bumped" failure.
- A file has no `**Version**:` line, or its value is not in `x.y.z` form: the check reports which file is missing a valid version and fails.
- The new version is lower than the old one (for example 1.2.0 → 1.1.0): the check reports a `version-decreased` error and ends with a rule-violation result (FR-010). Whether the bump level fits the change is still for people to judge.
- Only the Version line changed (no other edit): not an error; the report shows the two versions and empty ID lists.
- Only whitespace or line wrapping changed (for example after the repo's formatter reflows the file): ignored. Whitespace and line-wrapping differences are not content changes, so they need no bump and do not mark any FR or SC as changed.
- The old version does not exist because the spec is new in this PR: out of scope. The caller skips new specs; if an old path is given that does not exist, it is the "cannot be read" error above.
- The same ID appears twice in one file (for example two FR-003 lines): the check reports the duplicate ID and file as an error and fails, since the comparison would be ambiguous.
- An ID is renumbered (FR-004 becomes FR-005 with the same text): reported as FR-004 removed and FR-005 added; the check does not try to detect moves.
- Requirements appear in a different order but with identical text: not reported as changed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The check MUST take exactly two file paths: first the old version, then the new version of the same spec. It MUST NOT fetch either version itself (for example from version control).
- **FR-002**: The check MUST read the Version of each file from its `**Version**: x.y.z` header line and report both values.
- **FR-003**: The check MUST identify every functional requirement (`FR-NNN`) and success criterion (`SC-NNN`) in each file by its ID, together with its text (the bullet that starts with the bold ID, including any continuation lines).
- **FR-004**: The check MUST report, separately for FR and SC, the IDs that were added (only in new), removed (only in old), and changed (in both, with different text). Each list MUST be sorted by ID. The report MUST contain IDs only, not requirement text, in both forms.
- **FR-005**: The check MUST report an error and end with a rule-violation result when the content of the two files differs, ignoring only the Version line, while the Version values are equal. Whitespace and line-wrapping differences MUST NOT count as content differences, here or when deciding whether an FR or SC changed (FR-004).
- **FR-006**: The check MUST report an error and end with an input-error result when a file cannot be read, has no valid Version, or contains a duplicate FR or SC ID; the message MUST name the file and the problem. An input error takes precedence over a rule violation.
- **FR-012**: The check MUST report every input error found in both files in one run, not stop at the first. The rule in FR-005 is checked only when both files have no input error.
- **FR-007**: The check MUST produce a human-readable report by default and a machine-readable report when asked; both MUST contain the same versions, the same added/removed/changed lists, and the same errors.
- **FR-008**: In machine-readable mode, standard output MUST contain only the machine-readable document.
- **FR-009**: The check MUST end with a passing result when no error was found, whether or not any requirement changed.
- **FR-010**: The check MUST report an error with code `version-decreased` and end with a rule-violation result when the new Version is lower than the old Version (compared as semver). It MUST NOT judge whether the bump level (MAJOR/MINOR/PATCH) fits the change, and MUST NOT evaluate the content of the spec.
- **FR-011**: The check MUST NOT create, modify, or delete any file.

### Key Entities

- **Spec Version**: the `x.y.z` value from a spec's `**Version**:` line; one per file.
- **Requirement Entry**: one FR or SC in a file, made of its ID (e.g. `FR-003`) and its text.
- **Diff Report**: the result of one comparison: old and new version, added/removed/changed IDs for FR and for SC, a content-changed flag, and the list of errors. Rendered in readable or machine-readable form.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a set of at least 10 prepared old/new spec pairs covering each acceptance scenario and edge case above, the check lists exactly the expected added, removed, and changed IDs in 100% of pairs (no missing and no extra IDs).
- **SC-002**: In 100% of prepared pairs where content changed and the version did not, the check ends with a failing result; in 100% of pairs with no error condition, it ends with a passing result.
- **SC-003**: For every prepared pair, the readable and machine-readable outputs carry identical versions, ID lists, and errors.
- **SC-004**: The check finishes in under 1 second for a spec of 200 requirements on a typical developer machine.
- **SC-005**: After the check runs, both input files are byte-for-byte unchanged and no new files exist.

## Assumptions

- Specs follow the template structure used in `specs/*/spec.md`: requirements written as `- **FR-NNN**: ...` and `- **SC-NNN**: ...` bullets, and a `**Version**: x.y.z` header line (CLAUDE.md Rule 1).
- "Content changed" compares the whole file except the Version line, so a change to user stories, edge cases, assumptions, or the Changelog counts.
- The check does not verify that a Changelog entry was added; the user asked for one rule only (version must change when content changes).
- The machine-readable form is a single structured document (for example JSON); its exact field names are fixed in the plan.
- Each result maps to its own exit status: zero for pass, and two different non-zero values for rule violation and input error. CI fails the job on either non-zero status.
- Choosing which spec files to check in a PR, and obtaining the old version (e.g. with `git show main:<path>`), is the caller's job, done by a CI step outside this feature.
- Line-ending differences (CRLF vs LF) are not content changes, since the repo is edited on Windows and Linux.
- New specs (no old version) are skipped by the caller; the check always compares two existing files.

## Changelog
- 2.0.1 (2026-11-06): Status → Implemented (FR-010 `version-decreased` done in packages/spec-diff).
- 2.0.0 (2026-11-06): FR-010 redefined: a lower new version is now a rule violation (`version-decreased`), reversing the 0.2.0 decision to accept it. Updated the matching edge case and added US2 scenario 4. Status back to Approved until the code follows.
- 1.0.1 (2026-11-06): Status → Implemented.
- 1.0.0 (2026-11-06): approved by the owner. Also records the removal of the former SC-004 (reviewer reads the change in under 1 minute) and the renumbering of SC-005/SC-006 to SC-004/SC-005.
- 0.5.0 (2026-11-06): added FR-012: report all input errors in one run.
- 0.4.0 (2026-11-06): split the failing result into rule violation (FR-005) and input error (FR-006), each with its own exit status.
- 0.3.0 (2026-11-06): clarified that the report lists IDs only, not requirement text (FR-004).
- 0.2.0 (2026-11-06): resolved 3 clarifications: version decrease is accepted; whitespace/line-wrapping changes are ignored (FR-005); new specs are out of scope (caller skips them).
- 0.1.0 (2026-11-06): initial draft.
