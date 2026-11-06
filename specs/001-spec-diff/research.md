# Research: Spec Diff Check

**Feature**: [spec.md](spec.md) (v1.0.0) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-06

Each topic lists at least two options and a decision. Constitution IV: any new dependency is weighed against a no-dependency option.

## R1. Finding the Version line and FR/SC entries

**Options**

| Option | What it is | Dependency | Pros | Cons |
|---|---|---|---|---|
| A. Line-based matching | Split on line breaks; match `**Version**:` and `- **FR-NNN**:` / `- **SC-NNN**:` at line start with regular expressions; skip lines inside fenced code blocks | None | ~40 lines; matches exactly the syntax the spec template and CLAUDE.md Rule 1 define; easy to test with string fixtures | Must handle continuation lines and code fences by hand |
| B. Markdown parser (`mdast-util-from-markdown`, or `remark`) | Parse to a syntax tree; walk list items whose first child is `strong` with an ID | New runtime dependency (plus ~10 transitive packages) | Correct for every Markdown corner case (nested lists, setext headings, HTML) | The input is one fixed template, so those corners do not occur; adds a dependency, a lockfile change and a `deps-approved` review for no tested benefit; the tree loses the raw text we normalize and compare |

**Decision: A, line-based matching.**

Rules (exact, so tests can be written from them):

- Line endings: `\r\n` and `\r` are turned into `\n` before anything else (spec Assumptions: CRLF is not a change).
- Fenced code: a line starting with ` ``` ` or `~~~` toggles "inside fence"; nothing inside a fence is matched (keeps examples in a spec from being read as requirements).
- Version line: `^\*\*Version\*\*:\s*(\S+)\s*$`. The value is valid when it matches `^\d+\.\d+\.\d+$`. The first Version line outside code fences is used, with no error for later ones (owner decision, plan.md Resolved Questions 2).
- Entry start: `^- \*\*(FR|SC)-(\d+)\*\*:` at column 0. The ID is `FR-` / `SC-` plus the digits as written (so `FR-001`, not `FR-1`).
- Entry text: the start line plus every following line up to (not including) the next blank line, the next line starting with `- ` / `* ` / `#` at column 0, or the end of the file. This is "the bullet including continuation lines" (FR-003).
- Normalization (FR-005): every run of whitespace, line breaks included, becomes one space, and leading/trailing whitespace is dropped. Entry texts are compared after normalization; so is the whole file with the Version line removed.
- Sorting (FR-004): by prefix, then by the number as an integer (`FR-002` before `FR-010`).

## R2. Machine-readable format

**Options**

| Option | Pros | Cons |
|---|---|---|
| A. One JSON object on stdout, with a top-level `schemaVersion` | Built into the platform (`JSON.stringify`, `JSON.parse`); every CI tool and AI step reads it; one document satisfies FR-008 | None that matter here |
| B. JSON Lines (one event per line: version, each ID, each error) | Streamable | Nothing to stream (files are small); the reader has to rebuild the object; harder to compare with the readable form (SC-003) |
| C. YAML | Easier for humans to read | Needs a dependency to write; the readable form already serves humans |

**Decision: A, one JSON object.** Exact shape: [contracts/cli.md](contracts/cli.md#machine-readable-output---json). Notes:

- `schemaVersion: 1` lets later consumers (the AI step) detect a breaking change in the shape; adding a field does not bump it.
- Errors carry a stable `code` (for programs) plus a `message` (for people) and the `file` path (FR-006).
- IDs only, never requirement text (Clarification Q1, FR-004).
- When `result` is `input-error`, the ID lists are empty and `contentChanged` is `null`: the comparison is not run (FR-012) because its output would not be reliable.

## R3. How the CLI is run

**Options**

| Option | How | Dependency | Pros | Cons |
|---|---|---|---|---|
| A. Compile to `dist/` with `tsc`, run `node dist/cli.js` | `build` script, `bin` → `dist/cli.js` | None | Runs on any Node version; standard | A build step before every run and every CI use; `dist/` can be stale against `src/`; turbo `test` already depends on `^build`, so callers must build first |
| B. Run the TypeScript source with Node 24's built-in type stripping: `node src/cli.ts` | `bin` → `src/cli.ts`; `tsconfig`: `erasableSyntaxOnly`, `allowImportingTsExtensions`, `noEmit` | None | No build, no `dist/`, nothing stale; Node 24 is already required (`engines.node >=24`, CI uses 24) | Source must use erasable syntax only (no `enum`, no `namespace`, no parameter properties); relative imports must say `.ts`; Node does not strip types for files whose real path is inside `node_modules` (not our case: workspace packages are symlinks to `packages/`) |
| C. Run with `tsx` | `tsx src/cli.ts` | New dependency | Accepts all TypeScript syntax | Adds a dependency only to do what Node 24 already does (Constitution IV) |

**Decision: B, run from source with Node 24.** `tsc --noEmit` (the existing `check-types` script pattern) still type-checks; Vitest runs the same `.ts` files. Option A stays available if the tool ever must run on an older Node.

## R4. Exit code values

**Options**

| Option | Pass | Rule violation | Input error | Notes |
|---|---|---|---|---|
| A. `0 / 1 / 2` | 0 | 1 | 2 | Same convention as `diff`, `cmp` and `grep` (0 = ok, 1 = found a difference/problem, 2 = trouble running) |
| B. `sysexits.h` | 0 | 65 (`EX_DATAERR`) | 64 (`EX_USAGE`) / 66 (`EX_NOINPUT`) | More codes than the spec has outcomes (Clarification Q2 asks for three); few CI users know them |

**Decision: A, `0 / 1 / 2`.**

- Bad command-line usage (wrong number of paths, unknown flag) is an input error: exit 2, usage text on stderr.
- Risk: Node exits with 1 on an uncaught exception, which would look like a rule violation. The CLI wraps its run in one `try/catch` that prints `internal error: <message>` to stderr and exits 2, so 1 only ever means "content changed but version not bumped".

## R5. Type definitions for Node (`@types/node`)

The CLI wrapper uses `node:fs` and `process`. `@types/node` is not installed in the repo today (it appears in the lockfile only as an optional peer of Vite).

| Option | Pros | Cons |
|---|---|---|
| A. Add `@types/node` (24.x, exact pin) as a devDependency of `packages/spec-diff` | Correct, maintained types; types only, nothing runs | Lockfile changes → PR needs the `deps-approved` label |
| B. Hand-write a small `declare module "node:fs"` / `declare const process` file | No dependency | Wrong or incomplete types we must maintain; hides real API mistakes from `tsc` |
| C. Leave `cli.ts` out of type checking | No dependency | The only file that does I/O would be unchecked |

**Decision: A, add `@types/node` as a devDependency** (types only, dev only), pinned to an exact 24.x release at least two weeks old at implementation time. This is the only new package. The package's other devDependencies (`eslint`, `typescript`, `vitest`, `@repo/*`) use the versions already in the lockfile; adding them to a new workspace package still changes `pnpm-lock.yaml`, so the PR needs `deps-approved` regardless (see [docs/sdd/ci.md](../../docs/sdd/ci.md)).
