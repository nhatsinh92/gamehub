import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { build } from "vite";
import { afterAll, expect, test } from "vitest";
import { GAME_ID, SDK_GLOBAL_NAME } from "./game-name.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const outDir = mkdtempSync(join(tmpdir(), "sdk-build-"));
afterAll(() => rmSync(outDir, { recursive: true, force: true }));

test(
  "[003:FR-002] [003:FR-013] [003:FR-004] one file defining one global",
  async () => {
    await build({
      configFile: join(root, "vite.config.ts"),
      root,
      build: { outDir, emptyOutDir: true },
      logLevel: "silent",
    });
    expect(readdirSync(outDir)).toEqual([`${GAME_ID}-sdk.js`]);
    const code = readFileSync(join(outDir, `${GAME_ID}-sdk.js`), "utf8");
    const sandbox: Record<string, Record<string, unknown>> = {};
    vm.runInNewContext(code, sandbox);
    expect(Object.keys(sandbox)).toEqual([SDK_GLOBAL_NAME]);
    const api = sandbox[SDK_GLOBAL_NAME] ?? {};
    expect(Object.keys(api).sort()).toEqual(["destroy", "init"]);
    expect([typeof api["init"], typeof api["destroy"]]).toEqual([
      "function",
      "function",
    ]);
  },
  60_000,
);
