import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 1. Never lint these
  {
    ignores: ["node_modules", "dist", "build", "coverage"],
  },

  // 2. Recommended baselines
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,

  // 2b. Stylistic rules — apply to EVERY file (config files included), not
  // just src/. This is what makes `vite.config.mts`, `eslint.config.js`,
  // etc. also get formatting rules fixed.
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,mts,cjs,cts}"],
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
    },
  },

  // 3. App source (React + TS)
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      // "detect" triggers eslint-plugin-react's internal version-detection
      // code, which currently crashes on ESLint 10 (contextOrFilename.getFilename
      // is not a function). Pin the actual installed React version instead.
      react: { version: "18.2.0" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      "react/react-in-jsx-scope": "off", // Vite's JSX runtime handles this
      "react/prop-types": "off", // using TS for prop typing instead

      // Disabled: eslint-plugin-react@7.37.5's implementation calls
      // sourceCode.isSpaceBetweenTokens, which doesn't exist in ESLint 10's
      // SourceCode API and crashes the linter. Re-enable once
      // eslint-plugin-react ships an ESLint-10-compatible release, or move
      // this concern to Prettier's jsxBracketSameLine-equivalent handling.
      "react/jsx-tag-spacing": "off",

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },

  // 4. Node-side config files (vite.config.mts, eslint.config.js, etc.)
  {
    files: ["*.config.{js,ts,mjs,mts,cjs,cts}"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },
);