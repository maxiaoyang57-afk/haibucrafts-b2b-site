import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 150_000,
  workers: 2,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  reporter: [['list']],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    port: 4173,
    reuseExistingServer: false
  },
  projects: [360, 375, 390, 414].map((width) => ({
    name: `phone-${width}`,
    use: { browserName: 'chromium', viewport: { width, height: 844 }, isMobile: true, hasTouch: true }
  }))
});
