import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/c1", fullyParallel: true, workers: 2, retries: 0,
  timeout: 60_000, expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "artifacts/c1-local/report", open: "never" }], ["json", { outputFile: "artifacts/c1-local/results.json" }]],
  outputDir: "artifacts/c1-local/test-results",
  use: { baseURL: "http://127.0.0.1:3101", actionTimeout: 15_000, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "database", testMatch: "database.spec.ts" },
    { name: "state", testMatch: "store.spec.ts" },
    ...[320, 360, 390, 768, 1440].map(width => ({ name: `ui-${width}`, testMatch: "ui.spec.ts", use: { viewport: { width, height: 900 } } })),
  ],
  webServer: { command: "npm run dev:c1", url: "http://127.0.0.1:3101/api/c1/config", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
