import eslintJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

const ignores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/coverage/**",
];

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = tseslint.config(
  { ignores },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
);

/** @type {import('eslint').Linter.Config[]} */
export const nestConfig = tseslint.config(
  { ignores },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  eslintConfigPrettier,
);

/** Browser + JSX (Next.js); add eslint-plugin-react later if needed */
/** @type {import('eslint').Linter.Config[]} */
export const nextConfig = tseslint.config(
  { ignores },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  eslintConfigPrettier,
);
