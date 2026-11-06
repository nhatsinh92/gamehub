import { ESLint } from "eslint";
import { describe, expect, test } from "vitest";
import { config } from "./base.js";

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });

async function ruleIds(code: string): Promise<(string | null)[]> {
  const [result] = await eslint.lintText(code, { filePath: "sample.ts" });
  return result!.messages.map((m) => m.ruleId);
}

// A function that spans exactly `lines` lines, braces included.
function fn(lines: number): string {
  return `export function f() {\n${"  f();\n".repeat(lines - 2)}}\n`;
}

describe("max-lines-per-function: 60", () => {
  test("allows a 60-line function", async () => {
    expect(await ruleIds(fn(60))).toEqual([]);
  });

  test("rejects a 61-line function", async () => {
    expect(await ruleIds(fn(61))).toContain("max-lines-per-function");
  });
});

describe("max-lines: 400", () => {
  test("allows a 400-line file", async () => {
    expect(await ruleIds("export {};\n".repeat(400))).toEqual([]);
  });

  test("rejects a 401-line file", async () => {
    expect(await ruleIds("export {};\n".repeat(401))).toContain("max-lines");
  });
});

describe("TypeScript files", () => {
  test("accepts type aliases, interfaces and functions using them", async () => {
    const code = [
      'export type Kind = "a" | "b";',
      "export interface Item { kind: Kind; files: { old: string; new: string } }",
      "export function label(item: Item): Kind {",
      "  return item.kind;",
      "}",
      "",
    ].join("\n");
    expect(await ruleIds(code)).toEqual([]);
  });

  test("accepts a type imported and used only in annotations", async () => {
    const code = [
      'import type { Item } from "./item.ts";',
      "export function name(item: Item): string {",
      "  return String(item);",
      "}",
      "",
    ].join("\n");
    expect(await ruleIds(code)).toEqual([]);
  });
});
