import babelParser from "@babel/eslint-parser";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-typescript"],
        },
      },
    },
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "max-lines-per-function": ["error", 60],
      "max-lines": ["error", 400],
    },
  },
  {
    // flat config lints only .js/.mjs/.cjs unless another extension is listed
    files: ["**/*.ts", "**/*.tsx"],
    // babel's scope analysis doesn't see TS type names; tsc (check-types) reports undefined names
    rules: { "no-undef": "off" },
  },
  {
    ignores: ["dist/**"],
  },
];
