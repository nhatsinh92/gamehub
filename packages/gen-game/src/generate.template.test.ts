import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { generateGame, type GenerateResult } from "./generate.ts";

const templateDir = fileURLToPath(
  new URL("../../../apps/scratch-card-example", import.meta.url),
);
let tmp: string;
let result: GenerateResult;
let target: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "gen-game-"));
  result = generateGame({
    templateDir,
    appsDir: tmp,
    packagesDir: join(tmp, "packages-none"),
    name: "lucky-wheel",
  });
  target = join(tmp, "lucky-wheel");
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

function files(dir: string): string[] {
  const out: string[] = [];
  const walk = (sub: string): void => {
    for (const e of readdirSync(join(dir, sub))) {
      const rel = sub === "" ? e : `${sub}/${e}`;
      if (statSync(join(dir, rel)).isDirectory()) walk(rel);
      else out.push(rel);
    }
  };
  walk("");
  return out.sort();
}

const text = (dir: string, rel: string) =>
  readFileSync(join(dir, rel), "utf8");
const tags = (dir: string) =>
  files(dir)
    .filter((f) => /\.test\.tsx?$/.test(f))
    .flatMap((f) => text(dir, f).match(/\[003:FR-\d{3}\]/g) ?? [])
    .sort();

describe("real template", () => {
  test("[004:FR-008] copies the git-tracked files", () => {
    const tracked = execFileSync("git", ["ls-files"], {
      cwd: templateDir,
      encoding: "utf8",
    })
      .split("\n")
      .filter((l) => l !== "")
      .sort();
    expect(result).toEqual({ ok: true, targetDir: target, files: tracked });
  });

  test("[004:FR-009] package.json differs only in name", () => {
    expect(JSON.parse(text(target, "package.json"))).toEqual({
      ...JSON.parse(text(templateDir, "package.json")),
      name: "lucky-wheel",
    });
  });

  test("[004:FR-010] no name form is left", () => {
    const bad = files(target).filter((f) =>
      /scratch-card-example|ScratchCardExampleSDK/.test(text(target, f)),
    );
    expect(bad).toEqual([]);
  });

  test("[004:FR-014] name-derived files are identical", () => {
    for (const f of ["vite.config.ts", "src/game-name.ts", "src/sdk.ts"]) {
      expect(text(target, f)).toEqual(text(templateDir, f));
    }
    expect(text(target, "src/game-name.test.ts")).toEqual(
      text(templateDir, "src/game-name.test.ts")
        .replaceAll("ScratchCardExampleSDK", "LuckyWheelSDK")
        .replaceAll("scratch-card-example", "lucky-wheel"),
    );
  });

  test("[004:FR-015] contract tags are kept", () => {
    expect(tags(target)).toEqual(tags(templateDir));
  });
});
