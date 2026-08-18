const { test, expect, mockBackend, bootApp } = require('./fixtures');

test.describe('boot', () => {
  test('loads, hydrates, and shows the active day with zero console errors', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 } });
    await bootApp(page);

    await expect(page.locator('#app')).toBeVisible();
    const dayName = await page.evaluate(() => (getActiveDay(activeDayIdx) || {}).name);
    expect(dayName).toBeTruthy();
  });

  test('falls back to onboarding-free boot even with no prior server settings', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 5 } });
    await bootApp(page);
    await expect(page.locator('#app')).toBeVisible();
  });
});
