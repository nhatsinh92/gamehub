import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, expect, test } from "vitest";
import { makeSpec } from "./fixtures.ts";

const cli = join(import.meta.dirname, "cli.ts");
const usage = "usage: spec-diff [--json] <old-spec> <new-spec>\n";
const dirs: string[] = [];

afterAll(() =>
  dirs.forEach((d) => rmSync(d, { recursive: true, force: true })),
);

function run(...args: string[]) {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

// Writes the US1 independent-test pair: one FR added, one SC removed, one FR reworded, version bumped.
function writePair() {
  const dir = mkdtempSync(join(tmpdir(), "spec-diff-"));
  dirs.push(dir);
  const oldPath = join(dir, "old.md");
  const newPath = join(dir, "new.md");
  const fr = { "FR-001": "A.", "FR-002": "B.", "FR-003": "C." };
  const sc = { "SC-001": "X.", "SC-002": "Y.", "SC-003": "Z." };
  writeFileSync(oldPath, makeSpec({ version: "1.0.0", fr, sc }));
  writeFileSync(
    newPath,
    makeSpec({
      version: "1.1.0",
      fr: { ...fr, "FR-002": "B, reworded.", "FR-004": "D." },
      sc: { "SC-001": "X.", "SC-002": "Y." },
    }),
  );
  const report = [
    `${oldPath} -> ${newPath}`,
    "Version: 1.0.0 -> 1.1.0",
    "Content changed: yes",
    "FR added: FR-004",
    "FR removed: none",
    "FR changed: FR-002",
    "SC added: none",
    "SC removed: SC-003",
    "SC changed: none",
    "Result: pass",
    "",
  ].join("\n");
  return { dir, oldPath, newPath, report };
}

test("[001:FR-001] prints the readable report for two paths and exits 0", () => {
  const p = writePair();
  expect(run(p.oldPath, p.newPath)).toEqual({
    status: 0,
    stdout: p.report,
    stderr: "",
  });
});

test("[001:FR-001] rejects one path with usage on stderr and exit 2", () => {
  const p = writePair();
  expect(run(p.oldPath)).toEqual({ status: 2, stdout: "", stderr: usage });
});

test("[001:FR-001] rejects three paths with usage on stderr and exit 2", () => {
  const p = writePair();
  expect(run(p.oldPath, p.newPath, p.newPath)).toEqual({
    status: 2,
    stdout: "",
    stderr: usage,
  });
});

test("[001:FR-011] leaves both input files and the directory unchanged", () => {
  const p = writePair();
  const snapshot = () => ({
    old: readFileSync(p.oldPath),
    new: readFileSync(p.newPath),
    files: readdirSync(p.dir).sort(),
  });
  const before = snapshot();
  const r = run(p.oldPath, p.newPath);
  expect({ status: r.status, stdout: r.stdout, after: snapshot() }).toEqual({
    status: 0,
    stdout: p.report,
    after: before,
  });
});

function writeFiles(oldText: string, newText: string) {
  const dir = mkdtempSync(join(tmpdir(), "spec-diff-"));
  dirs.push(dir);
  const oldPath = join(dir, "old.md");
  const newPath = join(dir, "new.md");
  writeFileSync(oldPath, oldText);
  writeFileSync(newPath, newText);
  return { dir, oldPath, newPath };
}

const fr3 = { "FR-001": "A.", "FR-002": "B.", "FR-003": "C." };

test("[001:FR-005] exits 1 with the rule-violation report for a change without a bump", () => {
  const p = writeFiles(
    makeSpec({ fr: fr3 }),
    makeSpec({ fr: { ...fr3, "FR-002": "B, reworded." } }),
  );
  expect(run(p.oldPath, p.newPath)).toEqual({
    status: 1,
    stdout: [
      `${p.oldPath} -> ${p.newPath}`,
      "Version: 1.0.0 -> 1.0.0",
      "Content changed: yes",
      "FR added: none",
      "FR removed: none",
      "FR changed: FR-002",
      "SC added: none",
      "SC removed: none",
      "SC changed: none",
      `error: ${p.newPath}: content changed but Version is still 1.0.0`,
      "Result: rule-violation",
      "",
    ].join("\n"),
    stderr: "",
  });
});

test("[001:FR-006] exits 2 with the input-error report for a missing old path", () => {
  const p = writeFiles(makeSpec({ fr: fr3 }), makeSpec({ fr: fr3 }));
  const missing = join(p.dir, "missing.md");
  expect(run(missing, p.newPath)).toEqual({
    status: 2,
    stdout: [
      `${missing} -> ${p.newPath}`,
      "Version: ? -> 1.0.0",
      `error: ${missing}: cannot read file (ENOENT)`,
      "Result: input-error",
      "",
    ].join("\n"),
    stderr: "",
  });
});

test("[001:FR-012] exits 2 and reports both a missing Version and a duplicate ID", () => {
  const p = writeFiles(
    makeSpec({ fr: fr3 }),
    makeSpec({ version: null, fr: fr3, extra: "- **FR-003**: C again." }),
  );
  expect(run(p.oldPath, p.newPath)).toEqual({
    status: 2,
    stdout: [
      `${p.oldPath} -> ${p.newPath}`,
      "Version: 1.0.0 -> ?",
      `error: ${p.newPath}: no "**Version**: x.y.z" line`,
      `error: ${p.newPath}: FR-003 is defined 2 times`,
      "Result: input-error",
      "",
    ].join("\n"),
    stderr: "",
  });
});

// Returns the raw text when it is not JSON, so extra stdout text fails on toEqual, not on a throw.
const parse = (s: string): unknown => {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return s;
  }
};

function runJson(...args: string[]) {
  const r = run(...args);
  return { status: r.status, json: parse(r.stdout), stderr: r.stderr };
}

const passJson = (p: { oldPath: string; newPath: string }) => ({
  schemaVersion: 1,
  result: "pass",
  files: { old: p.oldPath, new: p.newPath },
  versions: { old: "1.0.0", new: "1.1.0" },
  contentChanged: true,
  fr: { added: ["FR-004"], removed: [], changed: ["FR-002"] },
  sc: { added: [], removed: ["SC-003"], changed: [] },
  errors: [],
});

test("[001:FR-008] prints only the JSON with --json first, between or last", () => {
  const p = writePair();
  const expected = { status: 0, json: passJson(p), stderr: "" };
  expect([
    runJson("--json", p.oldPath, p.newPath),
    runJson(p.oldPath, "--json", p.newPath),
    runJson(p.oldPath, p.newPath, "--json"),
  ]).toEqual([expected, expected, expected]);
});

test("[001:FR-008] exits 1 with the rule-violation JSON for a missed bump", () => {
  const p = writeFiles(
    makeSpec({ fr: fr3 }),
    makeSpec({ fr: { ...fr3, "FR-002": "B, reworded." } }),
  );
  expect(runJson("--json", p.oldPath, p.newPath)).toEqual({
    status: 1,
    json: {
      schemaVersion: 1,
      result: "rule-violation",
      files: { old: p.oldPath, new: p.newPath },
      versions: { old: "1.0.0", new: "1.0.0" },
      contentChanged: true,
      fr: { added: [], removed: [], changed: ["FR-002"] },
      sc: { added: [], removed: [], changed: [] },
      errors: [
        {
          code: "version-not-bumped",
          file: p.newPath,
          message: `${p.newPath}: content changed but Version is still 1.0.0`,
        },
      ],
    },
    stderr: "",
  });
});

test("[001:FR-008] rejects --json with one path: usage on stderr, exit 2", () => {
  const p = writePair();
  expect(run("--json", p.oldPath)).toEqual({
    status: 2,
    stdout: "",
    stderr: usage,
  });
});

test("[001:FR-008] rejects an unknown flag: usage on stderr, exit 2", () => {
  const p = writePair();
  expect(run("--yaml", p.oldPath)).toEqual({
    status: 2,
    stdout: "",
    stderr: usage,
  });
});
