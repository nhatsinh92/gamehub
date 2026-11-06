/** One side of the comparison. Exactly one of `text` / `readError` is set. */
export type SpecInput =
  { path: string; text: string } | { path: string; readError: string };

export type SpecError = {
  code:
    | "unreadable-file"
    | "missing-version"
    | "invalid-version"
    | "duplicate-id"
    | "version-not-bumped"
    | "version-decreased";
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
const SEMVER = /^\d+\.\d+\.\d+$/;

const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

// Semver order on validated x.y.z: each part compared as an integer (1.10.0 > 1.9.0).
const semverCmp = (a: string, b: string) => {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  return x.reduce((d, n, i) => d || n - (y[i] ?? 0), 0);
};

// Sorted by prefix, then by the number as an integer (FR-002 before FR-010).
const byId = (a: string, b: string) =>
  a.slice(0, 2).localeCompare(b.slice(0, 2)) ||
  Number(a.slice(3)) - Number(b.slice(3));

// Order within a file: the Version error first, then duplicate-id errors by ID.
function specErrors(
  path: string,
  version: string | null,
  counts: Map<string, number>,
): SpecError[] {
  const errors: SpecError[] = [];
  const add = (code: SpecError["code"], problem: string) =>
    errors.push({ code, file: path, message: `${path}: ${problem}` });
  if (version === null) add("missing-version", 'no "**Version**: x.y.z" line');
  else if (!SEMVER.test(version))
    add("invalid-version", `Version "${version}" is not in x.y.z form`);
  const dups = [...counts].filter(([, n]) => n > 1);
  for (const [id, n] of dups.sort(([a], [b]) => byId(a, b)))
    add("duplicate-id", `${id} is defined ${n} times`);
  return errors;
}

// Rules: research.md R1.
export function parseSpec(path: string, text: string): ParsedSpec {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let version: string | null = null;
  let versionLine: number | null = null;
  const entries = new Map<string, string>();
  const counts = new Map<string, number>();
  let current: { id: string; parts: string[] } | null = null;
  let inFence = false;
  const addEntry = (e: { id: string; parts: string[] }) => {
    counts.set(e.id, (counts.get(e.id) ?? 0) + 1);
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
  const errors = specErrors(path, version, counts);
  if (version !== null && !SEMVER.test(version)) version = null;
  return { version, versionLine, entries, errors, body };
}

function idChanges(
  a: Map<string, string>,
  b: Map<string, string>,
  prefix: "FR" | "SC",
): IdChanges {
  const ids = (m: Map<string, string>) =>
    [...m.keys()].filter((id) => id.startsWith(`${prefix}-`)).sort(byId);
  return {
    added: ids(b).filter((id) => !a.has(id)),
    removed: ids(a).filter((id) => !b.has(id)),
    changed: ids(a).filter((id) => b.has(id) && a.get(id) !== b.get(id)),
  };
}

function parseInput(s: SpecInput): ParsedSpec {
  if ("text" in s) return parseSpec(s.path, s.text);
  const message = `${s.path}: cannot read file (${s.readError})`;
  return {
    version: null,
    versionLine: null,
    entries: new Map(),
    errors: [{ code: "unreadable-file", file: s.path, message }],
    body: "",
  };
}

// Decision flow: data-model.md.
export function diffSpecs(oldSpec: SpecInput, newSpec: SpecInput): DiffResult {
  const files = { old: oldSpec.path, new: newSpec.path };
  const a = parseInput(oldSpec);
  const b = parseInput(newSpec);
  const versions = { old: a.version, new: b.version };
  const errors = [...a.errors, ...b.errors];
  if (errors.length > 0) {
    const empty = () => ({ added: [], removed: [], changed: [] });
    return {
      result: "input-error",
      files,
      versions,
      contentChanged: null,
      fr: empty(),
      sc: empty(),
      errors,
    };
  }
  const contentChanged = a.body !== b.body;
  const av = a.version ?? "";
  const bv = b.version ?? "";
  // FR-010: a lower version is an error; bump level is never judged.
  if (semverCmp(bv, av) < 0) {
    errors.push({
      code: "version-decreased",
      file: newSpec.path,
      message: `${newSpec.path}: Version decreased from ${av} to ${bv}`,
    });
  }
  if (contentChanged && av === bv) {
    errors.push({
      code: "version-not-bumped",
      file: newSpec.path,
      message: `${newSpec.path}: content changed but Version is still ${b.version}`,
    });
  }
  return {
    result: errors.length > 0 ? "rule-violation" : "pass",
    files,
    versions,
    contentChanged,
    fr: idChanges(a.entries, b.entries, "FR"),
    sc: idChanges(a.entries, b.entries, "SC"),
    errors,
  };
}
