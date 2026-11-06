/** One side of the comparison. Exactly one of `text` / `readError` is set. */
export type SpecInput =
  { path: string; text: string } | { path: string; readError: string };

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

export type IdChanges = {
  added: string[];
  removed: string[];
  changed: string[];
};

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

const VERSION = /^\*\*Version\*\*:\s*(\S+)\s*$/;
const ENTRY = /^- \*\*(FR|SC)-(\d+)\*\*:/;
const FENCE = /^(```|~~~)/;
const ENTRY_END = /^(- |\* |#)/;

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

// Rules: research.md R1.
export function parseSpec(path: string, text: string): ParsedSpec {
  void path; // used by the error messages added in US2
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let version: string | null = null;
  let versionLine: number | null = null;
  const entries = new Map<string, string>();
  let current: { id: string; parts: string[] } | null = null;
  let inFence = false;
  const addEntry = (e: { id: string; parts: string[] }) => {
    // shortcut: a repeated ID keeps its first text; US2 reports it as duplicate-id
    if (!entries.has(e.id)) entries.set(e.id, normalize(e.parts.join("\n")));
  };
  for (const [i, line] of lines.entries()) {
    if (current && (line.trim() === "" || ENTRY_END.test(line))) {
      addEntry(current);
      current = null;
    }
    const isFence = FENCE.test(line);
    if (isFence) inFence = !inFence;
    const v = isFence || inFence ? null : VERSION.exec(line);
    const e = isFence || inFence ? null : ENTRY.exec(line);
    if (v && version === null) {
      version = v[1] ?? null;
      versionLine = i;
    } else if (e) {
      current = { id: `${e[1]}-${e[2]}`, parts: [line.slice(e[0].length)] };
    } else {
      current?.parts.push(line);
    }
  }
  if (current) addEntry(current);
  const body = normalize(lines.filter((_, i) => i !== versionLine).join("\n"));
  return { version, versionLine, entries, errors: [], body };
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
