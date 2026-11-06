import { expect, test } from "vitest";
import { diffSpecs } from "./diff.ts";
import type { DiffResult, IdChanges } from "./diff.ts";
import { makeSpec } from "./fixtures.ts";

type Opts = Parameters<typeof makeSpec>[0];
const none: IdChanges = { added: [], removed: [], changed: [] };

function run(oldOpts: Opts, newOpts: Opts): DiffResult {
  return diffSpecs(
    { path: "old.md", text: makeSpec(oldOpts) },
    { path: "new.md", text: makeSpec(newOpts) },
  );
}

function pass(o: {
  versions: [string, string];
  contentChanged: boolean;
  fr?: Partial<IdChanges>;
  sc?: Partial<IdChanges>;
}): DiffResult {
  return {
    result: "pass",
    files: { old: "old.md", new: "new.md" },
    versions: { old: o.versions[0], new: o.versions[1] },
    contentChanged: o.contentChanged,
    fr: { ...none, ...o.fr },
    sc: { ...none, ...o.sc },
    errors: [],
  };
}

const fr3 = { "FR-001": "A.", "FR-002": "B.", "FR-003": "C." };
const sc3 = { "SC-001": "X.", "SC-002": "Y.", "SC-003": "Z." };

test("[001:FR-004] lists an FR only in new as added", () => {
  const r = run(
    { version: "1.0.0", fr: fr3, sc: sc3 },
    { version: "1.1.0", fr: { ...fr3, "FR-004": "D." }, sc: sc3 },
  );
  expect(r).toEqual(
    pass({
      versions: ["1.0.0", "1.1.0"],
      contentChanged: true,
      fr: { added: ["FR-004"] },
    }),
  );
});

test("[001:FR-004] lists an SC with different text as changed", () => {
  const r = run(
    { version: "1.0.0", fr: fr3, sc: sc3 },
    { version: "1.0.1", fr: fr3, sc: { ...sc3, "SC-002": "Y, reworded." } },
  );
  expect(r).toEqual(
    pass({
      versions: ["1.0.0", "1.0.1"],
      contentChanged: true,
      sc: { changed: ["SC-002"] },
    }),
  );
});

test("[001:FR-004] lists an SC only in old as removed", () => {
  const { "SC-003": _gone, ...sc2 } = sc3;
  const r = run(
    { version: "1.0.0", fr: fr3, sc: sc3 },
    { version: "2.0.0", fr: fr3, sc: sc2 },
  );
  expect(r).toEqual(
    pass({
      versions: ["1.0.0", "2.0.0"],
      contentChanged: true,
      sc: { removed: ["SC-003"] },
    }),
  );
});

test("[001:FR-004] reports FR and SC changes separately", () => {
  const r = run(
    { version: "1.0.0", fr: fr3, sc: sc3 },
    {
      version: "1.1.0",
      fr: { "FR-001": "A.", "FR-002": "B2.", "FR-004": "D." },
      sc: { "SC-001": "X.", "SC-002": "Y.", "SC-004": "W." },
    },
  );
  expect(r).toEqual(
    pass({
      versions: ["1.0.0", "1.1.0"],
      contentChanged: true,
      fr: { added: ["FR-004"], removed: ["FR-003"], changed: ["FR-002"] },
      sc: { added: ["SC-004"], removed: ["SC-003"] },
    }),
  );
});

test("[001:FR-004] sorts each list by the ID number", () => {
  const r = run(
    { version: "1.0.0", fr: { "FR-001": "A." } },
    {
      version: "1.1.0",
      fr: { "FR-001": "A.", "FR-010": "J.", "FR-002": "B.", "FR-9": "I." },
    },
  );
  expect(r).toEqual(
    pass({
      versions: ["1.0.0", "1.1.0"],
      contentChanged: true,
      fr: { added: ["FR-002", "FR-9", "FR-010"] },
    }),
  );
});

test("[001:FR-004] does not report reordered entries with the same text", () => {
  const r = run(
    { version: "1.0.0", fr: fr3 },
    {
      version: "1.0.1",
      fr: { "FR-003": "C.", "FR-001": "A.", "FR-002": "B." },
    },
  );
  expect(r).toEqual(
    pass({ versions: ["1.0.0", "1.0.1"], contentChanged: true }),
  );
});

test("[001:FR-004] reports a renumbered entry as removed and added", () => {
  const r = run(
    { version: "1.0.0", fr: { "FR-004": "Same text." } },
    { version: "1.0.1", fr: { "FR-005": "Same text." } },
  );
  expect(r).toEqual(
    pass({
      versions: ["1.0.0", "1.0.1"],
      contentChanged: true,
      fr: { added: ["FR-005"], removed: ["FR-004"] },
    }),
  );
});

// Shared by the FR-004 large-input test and the SC-004 timing test.
function bigPair(): { oldText: string; newText: string; expected: DiffResult } {
  const ids = (p: string, n: number) =>
    Array.from(
      { length: n },
      (_, i) => `${p}-${String(i + 1).padStart(3, "0")}`,
    );
  const texts = (p: string) =>
    Object.fromEntries(
      ids(p, 200).map((id) => [id, `Requirement ${id} text.`]),
    );
  const oldFr = texts("FR");
  const oldSc = texts("SC");
  const { "FR-010": _a, "FR-020": _b, ...newFr } = oldFr;
  const { "SC-007": _c, ...newSc } = oldSc;
  Object.assign(newFr, {
    "FR-050": "Changed.",
    "FR-150": "Changed.",
    "FR-201": "New.",
    "FR-202": "New.",
  });
  Object.assign(newSc, { "SC-100": "Changed.", "SC-201": "New." });
  return {
    oldText: makeSpec({ version: "1.0.0", fr: oldFr, sc: oldSc }),
    newText: makeSpec({ version: "1.1.0", fr: newFr, sc: newSc }),
    expected: pass({
      versions: ["1.0.0", "1.1.0"],
      contentChanged: true,
      fr: {
        added: ["FR-201", "FR-202"],
        removed: ["FR-010", "FR-020"],
        changed: ["FR-050", "FR-150"],
      },
      sc: { added: ["SC-201"], removed: ["SC-007"], changed: ["SC-100"] },
    }),
  };
}

const diffBig = (p: ReturnType<typeof bigPair>) =>
  diffSpecs(
    { path: "old.md", text: p.oldText },
    { path: "new.md", text: p.newText },
  );

test("[001:FR-004] lists exactly the changed IDs in two 200-entry specs", () => {
  const p = bigPair();
  expect(diffBig(p)).toEqual(p.expected);
});

test("[001:SC-004] diffs two 200-entry specs in under 1 second", () => {
  const p = bigPair();
  diffBig(p);
  const start = performance.now();
  const r = diffBig(p);
  const elapsed = performance.now() - start;
  expect({ r, fast: elapsed < 1000 }).toEqual({ r: p.expected, fast: true });
});

test("[001:FR-005] ignores re-wrapping and spacing changes", () => {
  const r = run(
    { fr: { "FR-001": "alpha beta gamma delta" } },
    { fr: { "FR-001": "alpha   beta\n  gamma\ndelta" } },
  );
  expect(r).toEqual(
    pass({ versions: ["1.0.0", "1.0.0"], contentChanged: false }),
  );
});

test("[001:FR-005] ignores CRLF vs LF line endings", () => {
  const text = makeSpec({ fr: fr3, sc: sc3 });
  const r = diffSpecs(
    { path: "old.md", text: text.replaceAll("\n", "\r\n") },
    { path: "new.md", text },
  );
  expect(r).toEqual(
    pass({ versions: ["1.0.0", "1.0.0"], contentChanged: false }),
  );
});

test("[001:FR-005] a change to only the Version line is not a content change", () => {
  const r = run({ version: "1.0.0", fr: fr3 }, { version: "1.0.1", fr: fr3 });
  expect(r).toEqual(
    pass({ versions: ["1.0.0", "1.0.1"], contentChanged: false }),
  );
});

test("[001:FR-009] passes on identical files", () => {
  const r = run({ fr: fr3, sc: sc3 }, { fr: fr3, sc: sc3 });
  expect(r).toEqual(
    pass({ versions: ["1.0.0", "1.0.0"], contentChanged: false }),
  );
});

test("[001:FR-009] passes on a change with a version bump", () => {
  const r = run(
    { version: "1.0.0", fr: fr3 },
    { version: "1.0.1", fr: { ...fr3, "FR-002": "B, reworded." } },
  );
  expect(r).toEqual(
    pass({
      versions: ["1.0.0", "1.0.1"],
      contentChanged: true,
      fr: { changed: ["FR-002"] },
    }),
  );
});

test("[001:FR-010] a lower new version with a content change is a rule violation", () => {
  const r = run(
    { version: "1.2.0", fr: fr3 },
    { version: "1.1.0", fr: { ...fr3, "FR-001": "A, reworded." } },
  );
  expect(r).toEqual({
    ...pass({
      versions: ["1.2.0", "1.1.0"],
      contentChanged: true,
      fr: { changed: ["FR-001"] },
    }),
    result: "rule-violation",
    errors: [
      {
        code: "version-decreased",
        file: "new.md",
        message: "new.md: Version decreased from 1.2.0 to 1.1.0",
      },
    ],
  });
});
