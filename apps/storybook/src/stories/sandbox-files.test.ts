import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = (rel: string): string =>
  readFileSync(new URL(rel, import.meta.url), "utf8");
const readPkg = (rel: string): Record<string, unknown> =>
  JSON.parse(read(rel)) as Record<string, unknown>;

test("[006:FR-001] [006:FR-004] [006:FR-005] workspace scripts", () => {
  const pkg = readPkg("../../package.json");
  expect(pkg.name).toEqual("storybook");
  expect(pkg.scripts).toEqual({
    dev: "storybook dev -p 6006",
    build: "storybook build -o dist",
    lint: "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit",
    test: "vitest run",
  });
});

test("[006:FR-009] storybook packages are exact and only in apps/storybook", () => {
  const pkg = readPkg("../../package.json");
  const deps = {
    ...(pkg.dependencies as Record<string, string>),
    ...(pkg.devDependencies as Record<string, string>),
  };
  const sb = Object.fromEntries(
    Object.entries(deps).filter(([name]) => name.includes("storybook")),
  );
  expect(sb).toEqual({
    storybook: "10.6.6",
    "@storybook/react-vite": "10.6.6",
  });
  for (const rel of [
    "../../../sky-hopper/package.json",
    "../../../scratch-card-example/package.json",
    "../../../../packages/game-core/package.json",
  ]) {
    expect(read(rel).includes("storybook")).toEqual(false);
  }
});

test("[006:FR-007] stories are found by a glob, with no per-game path", () => {
  const main = read("../../.storybook/main.ts");
  expect(main.match(/stories: \[.*\]/)?.[0]).toEqual(
    'stories: ["../src/stories/*.stories.tsx"]',
  );
  expect(main.includes("sky-hopper")).toEqual(false);
  expect(main.includes("scratch-card")).toEqual(false);
});

test("[006:FR-008] README explains how to run and add a story", () => {
  const readme = read("../../../../README.md");
  const section = readme.split("## Storybook")[1] ?? "";
  expect(section.includes("pnpm --filter storybook dev")).toEqual(true);
  expect(section.includes("pnpm build")).toEqual(true);
  expect(section.includes("apps/storybook/src/stories/")).toEqual(true);
  expect(section.includes(".stories.tsx")).toEqual(true);
});
