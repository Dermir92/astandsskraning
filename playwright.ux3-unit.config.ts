import { defineConfig } from "@playwright/test";
import baseline from "./playwright.config";

// Offline store contracts only: no browser fixture, server, auth or database.
export default defineConfig({
  ...baseline,
  testIgnore: [],
  testMatch: [
    "**/demo-concurrency-contract.spec.ts", "**/fire-observations-compatibility.spec.ts",
    "**/heating-compatibility.spec.ts", "**/inspection-comparison-contract.spec.ts",
    "**/inspection-core-compatibility.spec.ts", "**/meter-readings-compatibility.spec.ts",
    "**/rental-information-compatibility.spec.ts", "**/report-preview-contract.spec.ts",
    "**/c1/store.spec.ts",
  ],
  projects: [{ name: "contracts" }],
  use: {},
  webServer: undefined,
  outputDir: "artifacts/ux3-contract-test-results",
  reporter: [["list"], ["json", { outputFile: "artifacts/ux3-contract-results.json" }]],
});
