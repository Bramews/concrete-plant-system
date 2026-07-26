import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "react/no-unknown-property": ["error", { ignore: ["css"] }],
      // Add rules to block inline styles explicitly
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "backups/**",
    "scripts/**",
    "tmp/**",
    "tmp_extract_correct/**",
    "scratch/**",
    "artifacts/**",
    "tests/**",
    "*.js",
    "*.mjs",
    "*.ts",
    "!middleware.ts",
  ]),
]);

export default eslintConfig;
