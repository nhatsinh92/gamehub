import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = (rel: string) =>
  readFileSync(new URL(rel, import.meta.url), "utf8");

const specifiers = (rel: string): string[] =>
  [...read(rel).matchAll(/from "([^"]+)"/g)]
    .map((m) => m[1] as string)
    .filter((s) => !s.startsWith("."))
    .sort();

test("[004:FR-016] no runtime dependencies", () => {
  const pkg = JSON.parse(read("../package.json"));
  expect(pkg.dependencies).toEqual(undefined);
  expect(pkg.devDependencies).toEqual({
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/node": "24.19.2",
    eslint: "10.9.1",
    typescript: "7.0.2",
    vitest: "5.1.0",
  });
});

test("[004:FR-016] production files import only Node built-ins", () => {
  expect(specifiers("./generate.ts")).toEqual(["node:fs", "node:path"]);
  expect(specifiers("./cli.ts")).toEqual(["node:url"]);
});
