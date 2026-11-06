import type { DiffResult } from "./diff.ts";

const list = (ids: string[]) => (ids.length > 0 ? ids.join(", ") : "none");

// Layout: contracts/cli.md › Human-readable output.
export function formatText(r: DiffResult): string {
  const kinds = ["added", "removed", "changed"] as const;
  const idLines = (["fr", "sc"] as const).flatMap((k) =>
    kinds.map((c) => `${k.toUpperCase()} ${c}: ${list(r[k][c])}`),
  );
  return [
    `${r.files.old} -> ${r.files.new}`,
    `Version: ${r.versions.old} -> ${r.versions.new}`,
    `Content changed: ${r.contentChanged ? "yes" : "no"}`,
    ...idLines,
    `Result: ${r.result}`,
    "",
  ].join("\n");
}

export function formatJson(r: DiffResult): string {
  void r;
  return "";
}
