import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Same complete demo suite, isolated from any other worktree's port 3000.
export default defineConfig({
  ...base,
  outputDir: process.env.UI2A_OUTPUT ?? "artifacts/ui2a/test-results",
  use: { ...base.use, baseURL: process.env.UI2A_BASE_URL ?? "http://127.0.0.1:3222" },
  reporter: [["list"], ["json", { outputFile: process.env.UI2A_RESULTS ?? "artifacts/ui2a/results.json" }]],
  webServer: {
    command: "npm run start -- --port 3222",
    url: "http://127.0.0.1:3222",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
