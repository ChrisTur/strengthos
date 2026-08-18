const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Regression coverage for the UTC-vs-local-date class of bug: anywhere the
// app used `date.toISOString().slice(0,10)` for "today," anyone west of UTC
// got tomorrow's date for several hours every evening — e.g. a Monday-night
// workout showing under Tuesday.
test.describe('local date handling', () => {
  test.use({ timezoneId: 'America/Chicago' });

  test('TODAY and the active day reflect the local date, not UTC', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 } });
    // Monday 9pm CDT (UTC-5) is already Tuesday 02:00 UTC — the exact window
    // where the old toISOString()-based date code broke.
    await page.clock.install({ time: new Date('2026-08-10T21:00:00') });
    await bootApp(page);
    await page.clock.resume();

    const result = await page.evaluate(() => ({
      localDateStr: localDateStr(),
      today: TODAY,
      dow: new Date().getDay(), // 1 = Monday
    }));
    expect(result.dow).toBe(1);
    expect(result.localDateStr).toBe('2026-08-10');
    expect(result.today).toBe('2026-08-10');
  });

  test('TODAY refreshes on a real day rollover without a page reload', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 } });
    await page.clock.install({ time: new Date('2026-08-11T10:00:00') }); // Tuesday
    await bootApp(page);
    await page.clock.resume();

    expect(await page.evaluate(() => TODAY)).toBe('2026-08-11');

    // Advance two days without reloading — simulates the app staying open (or
    // an installed PWA resumed from background) across midnight — then fire
    // the same wake signal the fix listens for.
    await page.clock.setFixedTime(new Date('2026-08-13T09:00:00'));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect.poll(() => page.evaluate(() => TODAY)).toBe('2026-08-13');
    expect(await page.evaluate(() => activeDate)).toBe('2026-08-13');
  });
});
