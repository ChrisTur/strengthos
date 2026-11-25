const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Regression coverage for the "auto-sync fires once and gives up silently"
// gap: a failed sync (offline, gym wifi, whatever) has to actually reach the
// server once connectivity comes back, not sit there forever until an
// unrelated edit happens to retry it.
test.describe('retry on reconnect', () => {
  test('a session sync that fails retries automatically once the browser reports it is back online', async ({ page }) => {
    const state = await mockBackend(page);
    await bootApp(page);

    // Force the next sessions-save calls to fail, standing in for "offline" —
    // context.setOffline() doesn't actually block requests page.route() has
    // already claimed, so this is the reliable way to simulate a failure with
    // a mocked backend.
    await page.unroute('**/sessions-save');
    await page.route('**/sessions-save', route => route.abort('failed'));

    await page.locator('.ex-table input[placeholder="lbs"]').first().fill('135');
    await page.locator('.ex-table input[placeholder="reps"]').first().fill('8');

    await expect(page.locator('#session-status')).toContainText('saved on this device only', { timeout: 4000 });
    expect(state.sessions.length).toBe(0);

    // Restore the real (mocked) endpoint, then fire the same signal the
    // browser sends when connectivity actually returns.
    await page.unroute('**/sessions-save');
    await page.route('**/sessions-save', (route, request) => {
      const { session } = request.postDataJSON();
      state.sessions = state.sessions.filter(s => s.id !== session.id).concat(session);
      route.fulfill({ json: { ok: true } });
    });
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    await expect.poll(() => state.sessions.length, { timeout: 4000 }).toBe(1);
    await expect(page.locator('#session-status')).toContainText('auto-synced');
  });
});
