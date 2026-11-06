import { expect, test } from "vitest";
import { diffSpecs } from "./diff.ts";
import type { DiffResult, SpecError, SpecInput } from "./diff.ts";
import { makeSpec } from "./fixtures.ts";

type Opts = Parameters<typeof makeSpec>[0];
const none = { added: [], removed: [], changed: [] };
const files = { old: "old.md", new: "new.md" };
const fr3 = { "FR-001": "A.", "FR-002": "B.", "FR-003": "C." };

const oldIn = (o: Opts): SpecInput => ({ path: "old.md", text: makeSpec(o) });
const newIn = (o: Opts): SpecInput => ({ path: "new.md", text: makeSpec(o) });

function inputError(
  versions: [string | null, string | null],
  errors: SpecError[],
): DiffResult {
  return {
    result: "input-error",
    files,
    versions: { old: versions[0], new: versions[1] },
    contentChanged: null,
    fr: none,
    sc: none,
    errors,
  };
}

const notBumped: SpecError = {
  code: "version-not-bumped",
  file: "new.md",
  message: "new.md: content changed but Version is still 1.0.0",
};

test("[001:FR-005] a changed FR without a version bump is a rule violation", () => {
  const r = diffSpecs(
    oldIn({ fr: fr3 }),
    newIn({ fr: { ...fr3, "FR-002": "B, reworded." } }),
  );
  expect(r).toEqual({
    result: "rule-violation",
    files,
    versions: { old: "1.0.0", new: "1.0.0" },
    contentChanged: true,
    fr: { ...none, changed: ["FR-002"] },
    sc: none,
    errors: [notBumped],
  });
});

test("[001:FR-005] a change outside FR and SC without a bump is a rule violation", () => {
  const r = diffSpecs(
    oldIn({ fr: fr3, extra: "## Assumptions\n\n- Old assumption." }),
    newIn({ fr: fr3, extra: "## Assumptions\n\n- New assumption." }),
  );
  expect(r).toEqual({
    result: "rule-violation",
    files,
    versions: { old: "1.0.0", new: "1.0.0" },
    contentChanged: true,
    fr: none,
    sc: none,
    errors: [notBumped],
  });
});

test("[001:FR-006] an unreadable file is an input error naming the path", () => {
  const r = diffSpecs(
    { path: "old.md", readError: "ENOENT" },
    newIn({ fr: fr3 }),
  );
  expect(r).toEqual(
    inputError(
      [null, "1.0.0"],
      [
        {
          code: "unreadable-file",
          file: "old.md",
          message: "old.md: cannot read file (ENOENT)",
        },
      ],
    ),
  );
});

test("[001:FR-006] a file with no Version line is an input error", () => {
  const r = diffSpecs(oldIn({ fr: fr3 }), newIn({ version: null, fr: fr3 }));
  expect(r).toEqual(
    inputError(
      ["1.0.0", null],
      [
        {
          code: "missing-version",
          file: "new.md",
          message: 'new.md: no "**Version**: x.y.z" line',
        },
      ],
    ),
  );
});

test("[001:FR-006] a Version not in x.y.z form is an input error", () => {
  const r = diffSpecs(oldIn({ version: "1.0", fr: fr3 }), newIn({ fr: fr3 }));
  expect(r).toEqual(
    inputError(
      [null, "1.0.0"],
      [
        {
          code: "invalid-version",
          file: "old.md",
          message: 'old.md: Version "1.0" is not in x.y.z form',
        },
      ],
    ),
  );
});

test("[001:FR-006] a duplicated ID is one input error giving the count", () => {
  const r = diffSpecs(
    oldIn({ fr: fr3 }),
    newIn({ version: "1.0.1", fr: fr3, extra: "- **FR-003**: C again." }),
  );
  expect(r).toEqual(
    inputError(
      ["1.0.0", "1.0.1"],
      [
        {
          code: "duplicate-id",
          file: "new.md",
          message: "new.md: FR-003 is defined 2 times",
        },
      ],
    ),
  );
});

test("[001:FR-006] an input error takes precedence over a missing bump", () => {
  const r = diffSpecs(
    oldIn({ fr: fr3 }),
    newIn({
      fr: { ...fr3, "FR-002": "B, reworded." },
      extra: "- **FR-001**: A again.",
    }),
  );
  expect(r).toEqual(
    inputError(
      ["1.0.0", "1.0.0"],
      [
        {
          code: "duplicate-id",
          file: "new.md",
          message: "new.md: FR-001 is defined 2 times",
        },
      ],
    ),
  );
});

test("[001:FR-012] reports every input error, old file first, Version error before sorted duplicates", () => {
  const r = diffSpecs(
    oldIn({
      version: null,
      fr: { "FR-005": "E.", "FR-002": "B." },
      extra: "- **FR-005**: E again.\n- **FR-002**: B again.\n- **FR-005**: E 3.",
    }),
    newIn({
      version: "v2",
      sc: { "SC-001": "X." },
      extra: "- **SC-001**: X again.",
    }),
  );
  expect(r).toEqual(
    inputError(
      [null, null],
      [
        {
          code: "missing-version",
          file: "old.md",
          message: 'old.md: no "**Version**: x.y.z" line',
        },
        {
          code: "duplicate-id",
          file: "old.md",
          message: "old.md: FR-002 is defined 2 times",
        },
        {
          code: "duplicate-id",
          file: "old.md",
          message: "old.md: FR-005 is defined 3 times",
        },
        {
          code: "invalid-version",
          file: "new.md",
          message: 'new.md: Version "v2" is not in x.y.z form',
        },
        {
          code: "duplicate-id",
          file: "new.md",
          message: "new.md: SC-001 is defined 2 times",
        },
      ],
    ),
  );
});

test("[001:FR-012] reports an unreadable old file together with errors in the new file", () => {
  const r = diffSpecs(
    { path: "old.md", readError: "EACCES" },
    newIn({ version: null, fr: fr3, extra: "- **FR-002**: B again." }),
  );
  expect(r).toEqual(
    inputError(
      [null, null],
      [
        {
          code: "unreadable-file",
          file: "old.md",
          message: "old.md: cannot read file (EACCES)",
        },
        {
          code: "missing-version",
          file: "new.md",
          message: 'new.md: no "**Version**: x.y.z" line',
        },
        {
          code: "duplicate-id",
          file: "new.md",
          message: "new.md: FR-002 is defined 2 times",
        },
      ],
    ),
  );
});
