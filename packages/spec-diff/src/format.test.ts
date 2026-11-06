import { expect, test } from "vitest";
import type { DiffResult } from "./diff.ts";
import { formatText } from "./format.ts";

const lines = (...l: string[]) => l.join("\n") + "\n";
const none = { added: [], removed: [], changed: [] };

const contractExample: DiffResult = {
  result: "pass",
  files: { old: "old.md", new: "new.md" },
  versions: { old: "1.0.0", new: "1.1.0" },
  contentChanged: true,
  fr: { added: ["FR-004"], removed: [], changed: ["FR-002"] },
  sc: { added: [], removed: ["SC-003"], changed: [] },
  errors: [],
};

test("[001:FR-007] prints the readable report in contract order", () => {
  expect(formatText(contractExample)).toEqual(
    lines(
      "old.md -> new.md",
      "Version: 1.0.0 -> 1.1.0",
      "Content changed: yes",
      "FR added: FR-004",
      "FR removed: none",
      "FR changed: FR-002",
      "SC added: none",
      "SC removed: SC-003",
      "SC changed: none",
      "Result: pass",
    ),
  );
});

test("[001:FR-007] joins list items with a comma and a space", () => {
  const r: DiffResult = {
    ...contractExample,
    fr: { added: ["FR-004", "FR-005", "FR-010"], removed: [], changed: [] },
    sc: { added: [], removed: [], changed: ["SC-001", "SC-002"] },
  };
  expect(formatText(r)).toEqual(
    lines(
      "old.md -> new.md",
      "Version: 1.0.0 -> 1.1.0",
      "Content changed: yes",
      "FR added: FR-004, FR-005, FR-010",
      "FR removed: none",
      "FR changed: none",
      "SC added: none",
      "SC removed: none",
      "SC changed: SC-001, SC-002",
      "Result: pass",
    ),
  );
});

test("[001:FR-007] prints no and none for identical files", () => {
  const r: DiffResult = {
    ...contractExample,
    versions: { old: "1.0.0", new: "1.0.0" },
    contentChanged: false,
    fr: none,
    sc: none,
  };
  expect(formatText(r)).toEqual(
    lines(
      "old.md -> new.md",
      "Version: 1.0.0 -> 1.0.0",
      "Content changed: no",
      "FR added: none",
      "FR removed: none",
      "FR changed: none",
      "SC added: none",
      "SC removed: none",
      "SC changed: none",
      "Result: pass",
    ),
  );
});

test("[001:FR-006] prints each error just before the Result line", () => {
  const r: DiffResult = {
    ...contractExample,
    result: "rule-violation",
    versions: { old: "1.0.0", new: "1.0.0" },
    fr: { added: [], removed: [], changed: ["FR-002"] },
    sc: none,
    errors: [
      {
        code: "version-not-bumped",
        file: "new.md",
        message: "new.md: content changed but Version is still 1.0.0",
      },
    ],
  };
  expect(formatText(r)).toEqual(
    lines(
      "old.md -> new.md",
      "Version: 1.0.0 -> 1.0.0",
      "Content changed: yes",
      "FR added: none",
      "FR removed: none",
      "FR changed: FR-002",
      "SC added: none",
      "SC removed: none",
      "SC changed: none",
      "error: new.md: content changed but Version is still 1.0.0",
      "Result: rule-violation",
    ),
  );
});

test("[001:FR-006] prints the short input-error report with ? for a missing version", () => {
  const r: DiffResult = {
    result: "input-error",
    files: { old: "old.md", new: "new.md" },
    versions: { old: null, new: "1.0.0" },
    contentChanged: null,
    fr: none,
    sc: none,
    errors: [
      {
        code: "missing-version",
        file: "old.md",
        message: 'old.md: no "**Version**: x.y.z" line',
      },
      {
        code: "duplicate-id",
        file: "new.md",
        message: "new.md: FR-003 is defined 2 times",
      },
    ],
  };
  expect(formatText(r)).toEqual(
    lines(
      "old.md -> new.md",
      "Version: ? -> 1.0.0",
      'error: old.md: no "**Version**: x.y.z" line',
      "error: new.md: FR-003 is defined 2 times",
      "Result: input-error",
    ),
  );
});
