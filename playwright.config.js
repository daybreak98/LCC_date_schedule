import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 6_000,
  },
  use: {
    baseURL: "http://127.0.0.1:8000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-test-server.ps1",
    reuseExistingServer: true,
    timeout: 30_000,
    url: "http://127.0.0.1:8000",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
