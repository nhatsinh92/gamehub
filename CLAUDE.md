# CLAUDE.md

Working rules for AI agents in this repo. Project rules live in `.specify/memory/constitution.md`; this file only adds how to work. Add a rule here when the same instruction has to be given twice (constitution Growth rule).

## Rules

1. **Spec Version and Changelog.** Every `specs/*/spec.md` MUST have a `**Version**: x.y.z` line in its header (below `**Status**`) and a `## Changelog` section at the end (constitution Principle I). A new spec starts at `0.1.0` (Draft) and becomes `1.0.0` when Approved. Every change bumps the version (MAJOR: an FR or SC is removed or redefined, or a contract breaks; MINOR: an FR, SC or edge case is added; PATCH: wording only) and adds a Changelog line, newest first: `- x.y.z (YYYY-MM-DD): what changed and why`.
2. Tests assert the whole expected value. Compare the entire result (e.g. toEqual(expected)), not just the absence of something. A test that passes on an empty or stub result proves nothing; every new test must be seen failing on the stub first.