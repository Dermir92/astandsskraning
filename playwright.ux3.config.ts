import { defineConfig } from "@playwright/test";
import baseline from "./playwright.config";

// Isolated Demo server: never reuse another worktree's app or enable C1/hosted.
export default defineConfig({
  ...baseline,
  outputDir: "artifacts/ux3-browser-test-results",
  use: { ...baseline.use, baseURL: "http://127.0.0.1:3103" },
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3103",
    url: "http://127.0.0.1:3103", reuseExistingServer: false, timeout: 120_000,
    env: { C1_LOCAL_PROOF: "0", H1A_HOSTED_PREPARATION: "0" },
  },
});
