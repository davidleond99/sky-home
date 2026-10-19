import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // En local cada consulta a Neon (us-east-2) cuesta ~0,5 s de red: timeouts holgados.
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "es-ES",
    timezoneId: "America/Havana",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // PW_CHROME=1 usa el Google Chrome instalado en vez del Chromium de Playwright.
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PW_CHROME ? { channel: "chrome" } : {}),
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
