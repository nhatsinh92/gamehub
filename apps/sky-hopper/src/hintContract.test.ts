import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const contract = fileURLToPath(
  new URL("../../../specs/005-sky-hopper/contracts/game-ui.md", import.meta.url),
);

test("[007:FR-003] the UI contract ready row names the fly hint", () => {
  const row = readFileSync(contract, "utf8")
    .split("\n")
    .find((line) => line.startsWith("| ready |"));
  expect(row).toEqual(
    '| ready | `canvas.play` (focus target is the `.game` root, `tabIndex=0`); `.hint` "Tap or press Space to fly"; `.score` "0" |',
  );
});
