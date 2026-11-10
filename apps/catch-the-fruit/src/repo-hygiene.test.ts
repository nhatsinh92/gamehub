import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const appDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(appDir, "..", "..");
const APP = "apps/catch-the-fruit";
const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" });

describe("scripts", () => {
  test("[003:FR-021] scripts equal the contract and every tool is a dependency", () => {
    expect(pkg.scripts).toEqual({
      dev: "vite",
      devSdk: "node scripts/dev-sdk.ts",
      buildSdk: "vite build",
      lint: "eslint . --max-warnings 0",
      "check-types": "tsc --noEmit",
      test: "vitest run",
    });
    const toolPackage: Record<string, string | null> = {
      vite: "vite",
      node: null, // runtime, not a package
      eslint: "eslint",
      tsc: "typescript",
      vitest: "vitest",
    };
    const missing = Object.values(pkg.scripts as Record<string, string>)
      .map((cmd) => toolPackage[cmd.split(" ")[0] ?? ""])
      .filter((p): p is string => typeof p === "string")
      .filter((p) => !(p in pkg.devDependencies));
    expect(missing).toEqual([]);
  });
});

describe("generated files", () => {
  test("[003:FR-022] dist and tsbuildinfo are ignored and not tracked", () => {
    const ignored = git(
      "check-ignore",
      `${APP}/dist/x.js`,
      `${APP}/x.tsbuildinfo`,
    )
      .trim()
      .split("\n");
    expect(ignored).toEqual([`${APP}/dist/x.js`, `${APP}/x.tsbuildinfo`]);
    const tracked = git("ls-files", APP)
      .trim()
      .split("\n")
      .filter((f) => f.includes("/dist/") || f.endsWith(".tsbuildinfo"));
    expect(tracked).toEqual([]);
    const lines = readFileSync(join(appDir, ".gitignore"), "utf8")
      .split("\n")
      .filter((l) => l !== "");
    expect(lines).toEqual(["dist/", "*.tsbuildinfo"]);
  });
});

describe("README", () => {
  const readme = readFileSync(join(appDir, "README.md"), "utf8");

  test("[003:FR-023] headings and script names", () => {
    const headings = readme
      .split("\n")
      .filter((l) => l.startsWith("## "))
      .map((l) => l.slice(3));
    expect(headings).toEqual([
      "What this is",
      "Scripts",
      "SDK usage",
      "Starting a new game from this template",
    ]);
    const scripts = readme.split("## Scripts")[1]?.split("\n## ")[0] ?? "";
    const named = [...scripts.matchAll(/`([A-Za-z-]+)`/g)].map((m) => m[1]);
    const wanted = Object.keys(pkg.scripts);
    expect(wanted.filter((s) => named.includes(s))).toEqual(wanted);
  });
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    // generated folders, not source
    if ([".turbo", "dist", "node_modules"].includes(name)) return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("one name source", () => {
  test("[003:FR-012] no file but package.json, README and tests holds the names", () => {
    expect(existsSync(join(appDir, "package.json"))).toEqual(true);
    const offenders = walk(appDir)
      .map((f) => relative(appDir, f))
      .filter((f) => f !== "package.json" && f !== "README.md")
      .filter((f) => !/\.test\.tsx?$/.test(f))
      .filter((f) => {
        const text = readFileSync(join(appDir, f), "utf8");
        return (
          text.includes("catch-the-fruit") ||
          text.includes("CatchTheFruitSDK")
        );
      });
    expect(offenders).toEqual([]);
  });
});
