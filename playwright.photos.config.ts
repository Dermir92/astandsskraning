import { defineConfig } from "@playwright/test";
import base from "./playwright.ux4.config";

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: "http://127.0.0.1:3106" },
  webServer: {
    command: process.env.UX4_PRODUCTION_TEST ? "npm run start -- --port 3106" : "npm run dev -- --port 3106 --webpack",
    url: "http://127.0.0.1:3106",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
