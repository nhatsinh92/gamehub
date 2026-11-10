import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const dir = fileURLToPath(new URL(".", import.meta.url));
const FORBIDDEN = [
  "react",
  "document",
  "window",
  "Math.random",
  "Date",
  "performance",
  "requestAnimationFrame",
];

test("[005:FR-004] game modules use no DOM, React, time or Math.random", () => {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .filter((f) => f !== "draw.ts");
  expect(files.length > 0).toEqual(true);
  const offenders = files.filter((f) => {
    const text = readFileSync(join(dir, f), "utf8");
    return FORBIDDEN.some((word) => text.includes(word));
  });
  expect(offenders).toEqual([]);
});
