import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const DEFAULT_TEMPLATE: Record<string, string | Buffer> = {
  "package.json": '{"name":"scratch-card-example","private":true}\n',
  "README.md":
    "# scratch-card-example\n\nUse ScratchCardExampleSDK.init; file scratch-card-example-sdk.js; apps/scratch-card-example\n",
  "src/game-name.test.ts":
    'expect(SDK).toEqual("ScratchCardExampleSDK"); // [003:FR-012] scratch-card-example\n',
  "src/main.ts": "export const x = 1;\n",
  ".gitignore": "dist/\n*.tsbuildinfo\n",
  "assets/blob.bin": Buffer.from([0, 255, 1, 254]),
  "node_modules/a/index.js": "module.exports = 1;\n",
  "dist/x.js": "x\n",
  "src/.turbo/log.txt": "log\n",
  "src/dist/y.js": "y\n",
  "tsconfig.tsbuildinfo": "{}\n",
};

export type TempRepo = {
  root: string;
  templateDir: string;
  appsDir: string;
  packagesDir: string;
  cleanup: () => void;
};

export function makeTempRepo(): TempRepo {
  const root = mkdtempSync(join(tmpdir(), "gen-game-"));
  const templateDir = join(root, "apps", "scratch-card-example");
  const appsDir = join(root, "apps");
  const packagesDir = join(root, "packages");
  mkdirSync(templateDir, { recursive: true });
  mkdirSync(join(packagesDir, "game-core"), { recursive: true });
  return {
    root,
    templateDir,
    appsDir,
    packagesDir,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

export function writeTree(
  dir: string,
  files: Record<string, string | Buffer>,
): void {
  for (const [rel, content] of Object.entries(files)) {
    const file = join(dir, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
}

export function listTree(dir: string): string[] {
  const out: string[] = [];
  const walk = (sub: string): void => {
    for (const entry of readdirSync(join(dir, sub), { withFileTypes: true })) {
      const rel = sub === "" ? entry.name : `${sub}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else out.push(rel);
    }
  };
  walk("");
  return out.sort();
}

export function readTree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of listTree(dir)) {
    out[rel] = readFileSync(join(dir, rel), "utf8");
  }
  return out;
}

export function hashTree(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of listTree(dir)) {
    out[rel] = createHash("sha256")
      .update(readFileSync(join(dir, rel)))
      .digest("hex");
  }
  return out;
}
