#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { generateGame } from "./generate.ts";

export function formatNextSteps(name: string): string {
  return `Created apps/${name}\n\nNext steps:\n  pnpm install\n  pnpm --filter ${name} dev\n`;
}

function main(args: string[]): number {
  if (args.length !== 1) {
    process.stderr.write("gen-game: usage: pnpm gen-game <name>\n");
    return 1;
  }
  const name = args[0] as string;
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const result = generateGame({
    templateDir: root + "apps/scratch-card-example",
    appsDir: root + "apps",
    packagesDir: root + "packages",
    name,
  });
  if (result.ok) {
    process.stdout.write(formatNextSteps(name));
    return 0;
  }
  const suffix =
    result.error === "write-failed" || result.error === "names-left"
      ? "; nothing was left behind"
      : "";
  process.stderr.write(`gen-game: ${result.message}${suffix}\n`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `gen-game: internal error: ${(error as Error).message}\n`,
    );
    process.exitCode = 1;
  }
}
