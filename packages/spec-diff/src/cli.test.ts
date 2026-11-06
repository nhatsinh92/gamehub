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
