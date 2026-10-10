import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "@next/next/no-img-element": "off" } },
  // Approved arbitrary media uses native images; local uploads are optimized at ingestion.
  globalIgnores([
    ".next/**",
    ".next-test/**",
    "next-env.d.ts",
    ".npm-cache/**",
    ".vercel/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
