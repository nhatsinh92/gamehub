import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { GAME_ID, SDK_GLOBAL_NAME } from "./game-name.ts";

const srcDir = fileURLToPath(new URL(".", import.meta.url));
const appDir = join(srcDir, "..");
const read = (p: string) => readFileSync(p, "utf8");
const pkg = JSON.parse(read(join(appDir, "package.json")));
// built from parts so this file does not hold the word itself
const OLD = ["scr", "atch"].join("");

test("[005:FR-001] package name, game id and SDK global are sky-hopper", () => {
  expect([pkg.name, GAME_ID, SDK_GLOBAL_NAME]).toEqual([
    "sky-hopper",
    "sky-hopper",
    "SkyHopperSDK",
  ]);
});

test("[005:FR-003] no old gameplay file or word remains in src", () => {
  const files = [
    "ScratchCard.tsx",
    "ScratchCanvas.tsx",
    "ScratchCard.test.tsx",
    "scratch-progress.ts",
    "scratch-progress.test.ts",
  ];
  expect(files.filter((f) => existsSync(join(srcDir, f)))).toEqual([]);
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );
  const offenders = walk(srcDir).filter((f) =>
    read(f).toLowerCase().includes(OLD),
  );
  expect(offenders).toEqual([]);
});

test("[005:FR-022] dependencies equal the template's", () => {
  const template = JSON.parse(
    read(join(appDir, "..", `${OLD}-card-example`, "package.json")),
  );
  expect([pkg.dependencies, pkg.devDependencies]).toEqual([
    template.dependencies,
    template.devDependencies,
  ]);
});

test("[005:FR-002] README describes sky-hopper and names pnpm gen-game", () => {
  const readme = read(join(appDir, "README.md"));
  const section = (name: string): string =>
    readme.split(`## ${name}`)[1]?.split("\n## ")[0] ?? "";
  expect(section("What this is").includes("one-tap flapper")).toEqual(true);
  const last = section("Starting a new game from this template");
  expect([
    last.includes("pnpm gen-game <name>"),
    last.includes("example of a real game"),
  ]).toEqual([true, true]);
});
