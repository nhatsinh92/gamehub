import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { generateGame, findNameLeftovers } from "./generate.ts";
import {
  DEFAULT_TEMPLATE,
  hashTree,
  listTree,
  makeTempRepo,
  readTree,
  writeTree,
  type TempRepo,
} from "./fixtures.ts";

let repo: TempRepo;

beforeEach(() => {
  repo = makeTempRepo();
  writeTree(repo.templateDir, DEFAULT_TEMPLATE);
});
afterEach(() => repo.cleanup());

const run = (name: string) =>
  generateGame({
    templateDir: repo.templateDir,
    appsDir: repo.appsDir,
    packagesDir: repo.packagesDir,
    name,
  });

const FILES = [
  ".gitignore",
  "README.md",
  "assets/blob.bin",
  "package.json",
  "src/game-name.test.ts",
  "src/main.ts",
];

describe("copy", () => {
  test("[004:FR-002] [004:FR-008] copies all but skipped paths", () => {
    const target = join(repo.appsDir, "lucky-wheel");
    expect(run("lucky-wheel")).toEqual({
      ok: true,
      targetDir: target,
      files: FILES,
    });
    expect(listTree(target)).toEqual(FILES);
  });

  test("[004:FR-009] replaces both name forms", () => {
    run("lucky-wheel");
    const tree = readTree(join(repo.appsDir, "lucky-wheel"));
    delete tree["assets/blob.bin"];
    expect(tree).toEqual({
      "package.json": '{"name":"lucky-wheel","private":true}\n',
      "README.md":
        "# lucky-wheel\n\nUse LuckyWheelSDK.init; file lucky-wheel-sdk.js; apps/lucky-wheel\n",
      "src/game-name.test.ts":
        'expect(SDK).toEqual("LuckyWheelSDK"); // [003:FR-012] lucky-wheel\n',
      "src/main.ts": "export const x = 1;\n",
      ".gitignore": "dist/\n*.tsbuildinfo\n",
    });
  });

  test("[004:FR-009] other files are byte-identical", () => {
    run("lucky-wheel");
    expect(
      readFileSync(join(repo.appsDir, "lucky-wheel", "assets/blob.bin")),
    ).toEqual(readFileSync(join(repo.templateDir, "assets/blob.bin")));
  });
});

describe("leftovers", () => {
  test.each(["lucky-wheel", "quiz"])(
    "[004:FR-010] no template name left for %s",
    (name) => {
      run(name);
      const target = join(repo.appsDir, name);
      const bad = listTree(target).filter((f) =>
        /scratch-card-example|ScratchCardExampleSDK/.test(
          readFileSync(join(target, f), "utf8"),
        ),
      );
      expect(bad).toEqual([]);
    },
  );

  test("[004:FR-010] findNameLeftovers lists files holding a name", () => {
    writeTree(join(repo.root, "scan"), {
      "a.txt": "x scratch-card-example",
      "sub/b.txt": "ScratchCardExampleSDK",
      "c.txt": "clean",
    });
    expect(findNameLeftovers(join(repo.root, "scan"))).toEqual([
      "a.txt",
      "sub/b.txt",
    ]);
  });
});

describe("template", () => {
  test("[004:FR-011] template is unchanged", () => {
    const before = hashTree(repo.templateDir);
    run("lucky-wheel");
    expect(hashTree(repo.templateDir)).toEqual(before);
  });

  test("[004:FR-015] [003:FR-###] tags are kept", () => {
    run("lucky-wheel");
    const tags = (dir: string) =>
      readFileSync(join(dir, "src/game-name.test.ts"), "utf8").match(
        /\[003:FR-\d{3}\]/g,
      );
    expect(tags(join(repo.appsDir, "lucky-wheel"))).toEqual(
      tags(repo.templateDir),
    );
  });
});
