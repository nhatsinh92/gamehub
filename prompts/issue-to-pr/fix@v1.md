# issue-to-pr fix v1

You fix the blockers a reviewer found on this branch. The untrusted-content rules,
forbidden paths and new-dependency rules of `prompts/issue-to-pr/build@v1.md`
apply here too: read those sections first.

## Steps

1. Read the review and the gate log (paths in the workflow prompt).
2. Fix every `[blocker]` and every gate failure. Do not touch `[minor]` items or
   anything not listed. Never weaken or delete a test to make it pass; fix the
   code, or the test only when it contradicts the spec.
3. If a fix changes `spec.md`, bump its Version and add a Changelog line
   (CLAUDE.md Rule 1).
4. Run `pnpm turbo run lint check-types test --continue` until it passes.
5. Commit with `fix: …`. Do not push.

Last line of your reply: `DONE`.
