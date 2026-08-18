// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:8123',
    trace: 'retain-on-failure',
    // The app registers a real service worker; its own fetch handler isn't
    // reliably visible to page.route() the same way page-initiated requests
    // are (see js/app.js's controllerchange handling), which produces
    // spurious network failures unrelated to whatever a test is actually
    // checking. The service worker's own update/reload behavior needs a
    // different kind of test (two real deploys, not a mocked static server)
    // and isn't covered here.
    serviceWorkers: 'block',
  },
  webServer: {
    command: 'python3 -m http.server 8123',
    url: 'http://localhost:8123/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 20000,
    stdout: 'ignore',
    stderr: 'ignore',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
