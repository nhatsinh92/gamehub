import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  GAME_ID,
  PACKAGE_NAME,
  SDK_GLOBAL_NAME,
  toSdkGlobalName,
} from "./game-name.ts";

const pkgName: string = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).name;

describe("names", () => {
  test("[003:FR-012] PACKAGE_NAME is the name in package.json", () => {
    expect(PACKAGE_NAME).toEqual(pkgName);
  });

  test("[003:FR-012] GAME_ID equals PACKAGE_NAME", () => {
    expect(GAME_ID).toEqual(PACKAGE_NAME);
  });

  test("[003:FR-012] SDK_GLOBAL_NAME is derived from PACKAGE_NAME", () => {
    expect(SDK_GLOBAL_NAME).toEqual(toSdkGlobalName(PACKAGE_NAME));
    expect(SDK_GLOBAL_NAME).toEqual("RallyAiSDK");
  });

  test("[003:FR-012] toSdkGlobalName table", () => {
    const table = [
      "rally-ai",
      "foo-bar",
      "quiz",
      "a--b",
    ].map((n) => [n, toSdkGlobalName(n)]);
    expect(table).toEqual([
      ["rally-ai", "RallyAiSDK"],
      ["foo-bar", "FooBarSDK"],
      ["quiz", "QuizSDK"],
      ["a--b", "ABSDK"],
    ]);
  });
});
