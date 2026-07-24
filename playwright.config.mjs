import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 800 }
  },
  webServer: {
    command: 'npx http-server . -p 4173 -c-1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 30_000
  }
});