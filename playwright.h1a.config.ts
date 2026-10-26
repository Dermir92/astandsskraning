import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/h1a", fullyParallel: false, workers: 1, retries: 0,
  timeout: 30_000, reporter: "line", outputDir: "artifacts/h1a/test-results",
  use: { trace: "off", screenshot: "off", video: "off" },
});
