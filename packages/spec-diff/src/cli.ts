#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { diffSpecs } from "./diff.ts";
import type { SpecInput } from "./diff.ts";
import { formatText } from "./format.ts";

const USAGE = "usage: spec-diff [--json] <old-spec> <new-spec>\n";
const EXIT = { pass: 0, "rule-violation": 1, "input-error": 2 } as const;

function read(path: string): SpecInput {
  try {
    return { path, text: readFileSync(path, "utf8") };
  } catch (err) {
    return {
      path,
      readError: String((err as NodeJS.ErrnoException).code ?? err),
    };
  }
}

// Exit codes: contracts/cli.md. Any throw exits 2, so 1 only ever means a rule violation (research R4).
try {
  const [oldPath, newPath, ...rest] = process.argv.slice(2);
  if (oldPath === undefined || newPath === undefined || rest.length > 0) {
    process.stderr.write(USAGE);
    process.exitCode = 2;
  } else {
    const r = diffSpecs(read(oldPath), read(newPath));
    process.stdout.write(formatText(r));
    process.exitCode = EXIT[r.result];
  }
} catch (err) {
  process.stderr.write(
    `internal error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exitCode = 2;
}
