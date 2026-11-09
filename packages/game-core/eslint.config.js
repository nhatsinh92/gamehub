import { config } from "@repo/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    // a describe() callback wraps many tests and is not a "long function"
    files: ["**/*.test.ts"],
    rules: { "max-lines-per-function": "off" },
  },
];
