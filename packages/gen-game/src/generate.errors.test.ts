import { existsSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { generateGame } from "./generate.ts";
import {
  DEFAULT_TEMPLATE,
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

describe("rejections", () => {
  test.each(["LuckyWheel", "lucky_wheel", "-lucky", "lucky--wheel", "1lucky", ""])(
    "[004:FR-004] [004:FR-007] %j is not kebab-case",
    (name) => {
      const before = listTree(repo.root);
      expect(run(name)).toEqual({
        ok: false,
        error: "not-kebab-case",
        message: `"${name}" is not kebab-case (e.g. lucky-wheel)`,
      });
      expect(listTree(repo.root)).toEqual(before);
    },
  );

  test("[004:FR-005] [004:FR-007] template name", () => {
    const before = listTree(repo.root);
    expect(run("scratch-card-example")).toEqual({
      ok: false,
      error: "template-name",
      message: '"scratch-card-example" is the template name; choose another name',
    });
    expect(listTree(repo.root)).toEqual(before);
  });

  test("[004:FR-006] [004:FR-007] name used in packages", () => {
    const before = listTree(repo.root);
    expect(run("game-core")).toEqual({
      ok: false,
      error: "name-taken",
      message: '"game-core" is already used by packages/game-core',
    });
    expect(listTree(repo.root)).toEqual(before);
  });

  test("[004:FR-006] [004:FR-012] existing app is never overwritten", () => {
    writeTree(join(repo.appsDir, "lucky-wheel"), { "keep.txt": "mine" });
    expect(run("lucky-wheel")).toEqual({
      ok: false,
      error: "name-taken",
      message: '"lucky-wheel" is already used by apps/lucky-wheel',
    });
    expect(readTree(join(repo.appsDir, "lucky-wheel"))).toEqual({
      "keep.txt": "mine",
    });
  });
});

describe("failure", () => {
  test.skipIf(process.platform === "win32")(
    "[004:FR-012] partial folder is removed",
    () => {
      symlinkSync(
        join(repo.root, "missing"),
        join(repo.templateDir, "src", "zz-broken.ts"),
      );
      const r = run("lucky-wheel");
      expect({
        ok: r.ok,
        error: r.ok ? undefined : r.error,
        prefix: !r.ok && r.message.startsWith("could not create apps/lucky-wheel: "),
      }).toEqual({ ok: false, error: "write-failed", prefix: true });
      expect(existsSync(join(repo.appsDir, "lucky-wheel"))).toEqual(false);
    },
  );
});
