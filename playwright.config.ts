import { defineConfig } from "@playwright/test";

/** Runs against the static export: `npm run build && npm test`. */
export default defineConfig({
  testDir: "tests",
  timeout: 90_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    // Use a preinstalled Chromium when PW_CHROMIUM is set; otherwise `npx playwright install chromium`.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: "npx serve out -l 4173 --no-clipboard",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
