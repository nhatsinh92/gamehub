/** One side of the comparison. Exactly one of `text` / `readError` is set. */
export type SpecInput =
  | { path: string; text: string }
  | { path: string; readError: string };

export type SpecError = {
  code:
    | "unreadable-file"
    | "missing-version"
    | "invalid-version"
    | "duplicate-id"
    | "version-not-bumped";
  file: string;
  /** Starts with the path (FR-006). */
  message: string;
};

export type IdChanges = { added: string[]; removed: string[]; changed: string[] };

export type ParsedSpec = {
  version: string | null;
  versionLine: number | null;
  entries: Map<string, string>;
  errors: SpecError[];
  body: string;
};

export type DiffResult = {
  result: "pass" | "rule-violation" | "input-error";
  files: { old: string; new: string };
  versions: { old: string | null; new: string | null };
  contentChanged: boolean | null;
  fr: IdChanges;
  sc: IdChanges;
  errors: SpecError[];
};

export function parseSpec(path: string, text: string): ParsedSpec {
  void path;
  void text;
  return { version: null, versionLine: null, entries: new Map(), errors: [], body: "" };
}

export function diffSpecs(oldSpec: SpecInput, newSpec: SpecInput): DiffResult {
  return {
    result: "input-error",
    files: { old: oldSpec.path, new: newSpec.path },
    versions: { old: null, new: null },
    contentChanged: null,
    fr: { added: [], removed: [], changed: [] },
    sc: { added: [], removed: [], changed: [] },
    errors: [],
  };
}
