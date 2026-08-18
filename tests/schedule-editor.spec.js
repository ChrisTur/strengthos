const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Regression coverage for the schedule editor's row-mislabeling bug: it used
// to label each row by loop position ('Mon','Tue',...) instead of that row's
// actual date, which only happened to be correct if TODAY was a Monday.
test.describe('schedule editor', () => {
  test.use({ timezoneId: 'America/Chicago' });

  test('row labels match each row\'s real weekday, and editing a row updates the right date', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 } });
    await page.clock.install({ time: new Date('2026-08-11T10:00:00') }); // a real Tuesday
    await bootApp(page);
    await page.clock.resume();

    await page.getByTitle("Edit this week's workout schedule").click();
    const rows = page.locator('#sched-rows .sched-row');
    await expect(rows).toHaveCount(7);

    const labelToDate = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll('#sched-rows .sched-row').forEach(row => {
        out[row.querySelector('.sched-dow').textContent] = row.querySelector('.sched-date').textContent;
      });
      return out;
    });
    // Real Tuesday's row must say "Tue," not "Mon" (loop-position labeling
    // would put "Mon" on whatever date TODAY actually is, if TODAY isn't
    // really a Monday).
    expect(labelToDate['Tue']).toBe('8/11');
    expect(labelToDate['Wed']).toBe('8/12');

    // Changing Wednesday's row must land on the real Wednesday date, not
    // whatever date a mislabeled row would have pointed at.
    const wedRow = rows.filter({ has: page.locator('.sched-dow', { hasText: 'Wed' }) });
    const before = await page.evaluate(() => getWorkoutForDate('2026-08-12'));
    const currentValue = await wedRow.locator('select').inputValue();
    const pickIndex = currentValue === '1' ? 2 : 1;
    await wedRow.locator('select').selectOption({ index: pickIndex });
    await page.click('#sched-apply-btn');

    const after = await page.evaluate(() => getWorkoutForDate('2026-08-12'));
    expect(after).not.toBe(before);
  });
});
