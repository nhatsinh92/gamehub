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

export function generateGame(_options: GenerateOptions): GenerateResult {
  return { ok: false, error: "write-failed", message: "" };
}

export function findNameLeftovers(_dir: string): string[] {
  return [];
}
