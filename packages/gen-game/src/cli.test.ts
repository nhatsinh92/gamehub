import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { formatNextSteps } from "./cli.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const cli = fileURLToPath(new URL("./cli.ts", import.meta.url));

function runCli(args: string[]) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    cwd: root,
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe("next steps", () => {
  test("[004:FR-013] formatNextSteps text", () => {
    expect(formatNextSteps("lucky-wheel")).toEqual(
      "Created apps/lucky-wheel\n\nNext steps:\n  pnpm install\n  pnpm --filter lucky-wheel dev\n",
    );
  });
});

describe("root script", () => {
  test("[004:FR-001] root package.json has the gen-game script", () => {
    const pkg = JSON.parse(readFileSync(root + "package.json", "utf8"));
    expect(pkg.scripts["gen-game"]).toEqual("node packages/gen-game/src/cli.ts");
  });
});

describe("rejections", () => {
  const fail = (stderr: string) => ({ status: 1, stdout: "", stderr });

  test("[004:FR-003] wrong argument count", () => {
    const usage = fail("gen-game: usage: pnpm gen-game <name>\n");
    expect([runCli([]), runCli(["a", "b"])]).toEqual([usage, usage]);
  });

  test("[004:FR-004] not kebab-case", () => {
    expect(runCli(["LuckyWheel"])).toEqual(
      fail('gen-game: "LuckyWheel" is not kebab-case (e.g. lucky-wheel)\n'),
    );
  });

  test("[004:FR-005] template name", () => {
    expect(runCli(["scratch-card-example"])).toEqual(
      fail(
        'gen-game: "scratch-card-example" is the template name; choose another name\n',
      ),
    );
  });

  test("[004:FR-006] name already used", () => {
    expect(runCli(["game-core"])).toEqual(
      fail('gen-game: "game-core" is already used by packages/game-core\n'),
    );
  });

  test("[004:FR-007] rejections write nothing", () => {
    const list = () => [
      readdirSync(root + "apps").sort(),
      readdirSync(root + "packages").sort(),
    ];
    const before = list();
    runCli(["LuckyWheel"]);
    runCli(["game-core"]);
    runCli([]);
    expect(list()).toEqual(before);
  });
});
