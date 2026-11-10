import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import {
  TEMPLATE_GLOBAL,
  TEMPLATE_NAME,
  isKebabCase,
  toSdkGlobalName,
} from "./names.ts";

export type GenerateOptions = {
  templateDir: string;
  appsDir: string;
  packagesDir: string;
  name: string;
};

export type GenerateError =
  | "not-kebab-case"
  | "template-name"
  | "name-taken"
  | "write-failed"
  | "names-left";

export type GenerateResult =
  | { ok: true; targetDir: string; files: string[] }
  | { ok: false; error: GenerateError; message: string };

const SKIPPED_DIRS = new Set(["node_modules", "dist", ".turbo"]);

function fail(error: GenerateError, message: string): GenerateResult {
  return { ok: false, error, message };
}

/** Sorted `/`-separated relative paths of all files under `dir`, minus skipped ones. */
function listFiles(dir: string, skip: boolean, sub = ""): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(dir, sub), { withFileTypes: true })) {
    const rel = sub === "" ? entry.name : `${sub}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!(skip && SKIPPED_DIRS.has(entry.name))) {
        out.push(...listFiles(dir, skip, rel));
      }
    } else if (!(skip && entry.name.endsWith(".tsbuildinfo"))) {
      out.push(rel);
    }
  }
  return out.sort();
}

function holdsName(data: Buffer): boolean {
  return data.includes(TEMPLATE_GLOBAL) || data.includes(TEMPLATE_NAME);
}

function copyFile(from: string, to: string, name: string): void {
  const data = readFileSync(from);
  mkdirSync(dirname(to), { recursive: true });
  if (holdsName(data)) {
    writeFileSync(
      to,
      data
        .toString("utf8")
        .replaceAll(TEMPLATE_GLOBAL, toSdkGlobalName(name))
        .replaceAll(TEMPLATE_NAME, name),
    );
  } else {
    writeFileSync(to, data);
  }
}

export function findNameLeftovers(dir: string): string[] {
  return listFiles(dir, false).filter((rel) =>
    holdsName(readFileSync(join(dir, rel))),
  );
}

function validate(options: GenerateOptions): GenerateResult | undefined {
  const { name, appsDir, packagesDir } = options;
  if (!isKebabCase(name)) {
    return fail(
      "not-kebab-case",
      `"${name}" is not kebab-case (e.g. lucky-wheel)`,
    );
  }
  if (name === TEMPLATE_NAME) {
    return fail(
      "template-name",
      `"${name}" is the template name; choose another name`,
    );
  }
  if (existsSync(join(appsDir, name))) {
    return fail("name-taken", `"${name}" is already used by apps/${name}`);
  }
  if (existsSync(join(packagesDir, name))) {
    return fail("name-taken", `"${name}" is already used by packages/${name}`);
  }
  return undefined;
}

function writeFailed(name: string, error: unknown): GenerateResult {
  return fail(
    "write-failed",
    `could not create apps/${name}: ${(error as Error).message}`,
  );
}

export function generateGame(options: GenerateOptions): GenerateResult {
  const rejected = validate(options);
  if (rejected) return rejected;
  const { name, templateDir, appsDir } = options;
  const target = join(appsDir, name);
  try {
    mkdirSync(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return fail("name-taken", `"${name}" is already used by apps/${name}`);
    }
    return writeFailed(name, error);
  }
  try {
    const files = listFiles(templateDir, true);
    for (const rel of files) {
      copyFile(join(templateDir, rel), join(target, rel), name);
    }
    const left = findNameLeftovers(target);
    if (left.length > 0) {
      rmSync(target, { recursive: true, force: true });
      return fail("names-left", `template names left in ${left.join(", ")}`);
    }
    return { ok: true, targetDir: target, files };
  } catch (error) {
    rmSync(target, { recursive: true, force: true });
    return writeFailed(name, error);
  }
}
