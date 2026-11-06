import { expect, test } from "vitest";
import type { DiffResult } from "./diff.ts";
import { formatJson, formatText } from "./format.ts";

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

const ruleViolation: DiffResult = {
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

const inputError: DiffResult = {
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

test("[001:FR-006] prints each error just before the Result line", () => {
  expect(formatText(ruleViolation)).toEqual(
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
  expect(formatText(inputError)).toEqual(
    lines(
      "old.md -> new.md",
      "Version: ? -> 1.0.0",
      'error: old.md: no "**Version**: x.y.z" line',
      "error: new.md: FR-003 is defined 2 times",
      "Result: input-error",
    ),
  );
});

// Returns the raw text when it is not JSON, so a bad output fails on toEqual, not on a throw.
const parse = (s: string): unknown => {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return s;
  }
};

test("[001:FR-007] prints the contract JSON object for a pass", () => {
  expect(parse(formatJson(contractExample))).toEqual({
    schemaVersion: 1,
    result: "pass",
    files: { old: "old.md", new: "new.md" },
    versions: { old: "1.0.0", new: "1.1.0" },
    contentChanged: true,
    fr: { added: ["FR-004"], removed: [], changed: ["FR-002"] },
    sc: { added: [], removed: ["SC-003"], changed: [] },
    errors: [],
  });
});

test("[001:FR-007] prints null versions and contentChanged for an input error", () => {
  expect(parse(formatJson(inputError))).toEqual({
    schemaVersion: 1,
    result: "input-error",
    files: { old: "old.md", new: "new.md" },
    versions: { old: null, new: "1.0.0" },
    contentChanged: null,
    fr: { added: [], removed: [], changed: [] },
    sc: { added: [], removed: [], changed: [] },
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
  });
});

test("[001:FR-007] ends the JSON with exactly one newline", () => {
  expect(formatJson(contractExample).slice(-2)).toEqual("}\n");
});

// SC-003: every version, ID and error message in the JSON also appears in the readable report.
function sharedValues(r: DiffResult) {
  const j = parse(formatJson(r)) as DiffResult;
  const ids = (c: DiffResult["fr"] | undefined) =>
    c ? [...c.added, ...c.removed, ...c.changed] : [];
  const values = [
    j.versions?.old,
    j.versions?.new,
    ...ids(j.fr),
    ...ids(j.sc),
    ...(j.errors ?? []).map((e) => e.message),
  ].filter((v): v is string => typeof v === "string");
  const text = formatText(r);
  return { values, missing: values.filter((v) => !text.includes(v)) };
}

test("[001:FR-007] the JSON and the readable report carry the same values", () => {
  expect([contractExample, ruleViolation, inputError].map(sharedValues)).toEqual(
    [
      {
        values: ["1.0.0", "1.1.0", "FR-004", "FR-002", "SC-003"],
        missing: [],
      },
      {
        values: [
          "1.0.0",
          "1.0.0",
          "FR-002",
          "new.md: content changed but Version is still 1.0.0",
        ],
        missing: [],
      },
      {
        values: [
          "1.0.0",
          'old.md: no "**Version**: x.y.z" line',
          "new.md: FR-003 is defined 2 times",
        ],
        missing: [],
      },
    ],
  );
});
