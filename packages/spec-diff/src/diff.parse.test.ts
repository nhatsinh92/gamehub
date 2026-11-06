import { expect, test } from "vitest";
import { parseSpec } from "./diff.ts";
import type { ParsedSpec } from "./diff.ts";

const lines = (...l: string[]) => l.join("\n");

function parsed(
  version: string,
  versionLine: number,
  entries: [string, string][],
  body: string,
): ParsedSpec {
  return { version, versionLine, entries: new Map(entries), errors: [], body };
}

test("[001:FR-002] reads the Version from the header line", () => {
  const text = lines(
    "# T",
    "",
    "**Version**: 1.2.3",
    "",
    "- **FR-001**: Do x.",
  );
  expect(parseSpec("a.md", text)).toEqual(
    parsed("1.2.3", 2, [["FR-001", "Do x."]], "# T - **FR-001**: Do x."),
  );
});

test("[001:FR-002] uses the first of two Version lines", () => {
  const text = lines(
    "**Version**: 1.0.0",
    "**Version**: 2.0.0",
    "- **FR-001**: A",
  );
  expect(parseSpec("a.md", text)).toEqual(
    parsed("1.0.0", 0, [["FR-001", "A"]], "**Version**: 2.0.0 - **FR-001**: A"),
  );
});

test("[001:FR-002] skips a Version line inside a code fence", () => {
  const text = lines(
    "```",
    "**Version**: 9.9.9",
    "```",
    "**Version**: 1.0.0",
    "",
    "- **FR-001**: A",
  );
  expect(parseSpec("a.md", text)).toEqual(
    parsed(
      "1.0.0",
      3,
      [["FR-001", "A"]],
      "``` **Version**: 9.9.9 ``` - **FR-001**: A",
    ),
  );
});

test("[001:FR-003] reads FR and SC entries with normalized text", () => {
  const text = lines(
    "**Version**: 1.0.0",
    "",
    "- **FR-001**: Do   x.  ",
    "- **SC-001**: Measure y.",
  );
  expect(parseSpec("a.md", text)).toEqual(
    parsed(
      "1.0.0",
      0,
      [
        ["FR-001", "Do x."],
        ["SC-001", "Measure y."],
      ],
      "- **FR-001**: Do x. - **SC-001**: Measure y.",
    ),
  );
});

const continued = lines(
  "**Version**: 1.0.0",
  "",
  "- **FR-001**: First part",
  "  second part",
  "third part",
  "",
  "After.",
);
const continuedParsed = parsed(
  "1.0.0",
  0,
  [["FR-001", "First part second part third part"]],
  "- **FR-001**: First part second part third part After.",
);

test("[001:FR-003] joins continuation lines into the entry text", () => {
  expect(parseSpec("a.md", continued)).toEqual(continuedParsed);
});

test("[001:FR-003] ends an entry at a blank line, a bullet or a heading", () => {
  const text = lines(
    "**Version**: 1.0.0",
    "",
    "- **FR-001**: One",
    "",
    "Not one.",
    "- **FR-002**: Two",
    "- other bullet",
    "- **FR-003**: Three",
    "* star bullet",
    "- **FR-004**: Four",
    "# Heading",
    "tail",
  );
  expect(parseSpec("a.md", text)).toEqual(
    parsed(
      "1.0.0",
      0,
      [
        ["FR-001", "One"],
        ["FR-002", "Two"],
        ["FR-003", "Three"],
        ["FR-004", "Four"],
      ],
      "- **FR-001**: One Not one. - **FR-002**: Two - other bullet - **FR-003**: Three * star bullet - **FR-004**: Four # Heading tail",
    ),
  );
});

test("[001:FR-003] ignores entries inside ``` and ~~~ fences", () => {
  const text = lines(
    "**Version**: 1.0.0",
    "",
    "- **FR-001**: A",
    "",
    "```",
    "- **FR-002**: B",
    "```",
    "",
    "~~~",
    "- **FR-002**: C",
    "~~~",
  );
  expect(parseSpec("a.md", text)).toEqual(
    parsed(
      "1.0.0",
      0,
      [["FR-001", "A"]],
      "- **FR-001**: A ``` - **FR-002**: B ``` ~~~ - **FR-002**: C ~~~",
    ),
  );
});

test("[001:FR-003] lists only IDs in the - **FR-NNN**: form at column 0", () => {
  const text = lines(
    "**Version**: 1.0.0",
    "",
    "- **FR-001**: A",
    "",
    "- **FR-006a**: B",
    "",
    "  - **FR-007**: C",
  );
  expect(parseSpec("a.md", text)).toEqual(
    parsed(
      "1.0.0",
      0,
      [["FR-001", "A"]],
      "- **FR-001**: A - **FR-006a**: B - **FR-007**: C",
    ),
  );
});

test("[001:FR-003] parses CRLF and LF versions of a spec the same", () => {
  const crlf = continued.replaceAll("\n", "\r\n");
  expect([parseSpec("a.md", crlf), parseSpec("a.md", continued)]).toEqual([
    continuedParsed,
    continuedParsed,
  ]);
});
