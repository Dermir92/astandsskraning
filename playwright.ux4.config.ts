import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: "http://127.0.0.1:3104" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "mobile-320", use: { viewport: { width: 320, height: 740 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: process.env.UX4_PRODUCTION_TEST ? "npm run start -- --port 3104" : "npm run dev -- --port 3104 --webpack",
    url: "http://127.0.0.1:3104",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
