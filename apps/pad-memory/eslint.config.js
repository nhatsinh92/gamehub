import { config } from "@repo/eslint-config/base";

// the shared config's parser cannot read JSX; add Babel's built-in jsx plugin for .tsx
const base = config.find((c) => c.languageOptions?.parserOptions?.babelOptions);
const babelOptions = base?.languageOptions?.parserOptions?.babelOptions ?? {};

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config,
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          ...babelOptions,
          parserOpts: { plugins: ["jsx"] },
        },
      },
    },
  },
  {
    // a describe() callback wraps many tests and is not a "long function"
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "max-lines-per-function": "off" },
  },
];
