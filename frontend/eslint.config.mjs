import next from "eslint-config-next";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  { ignores: [".next/", "node_modules/", "playwright-report/", "test-results/"] },
  ...tseslint.configs.recommended,
  ...next,
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "react/jsx-key": "error",
    },
  },
];
