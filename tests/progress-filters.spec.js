const { test, expect, mockBackend, bootApp, goToView } = require('./fixtures');

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// 150 days of synthetic sessions on Mon/Tue/Thu/Sat, ending today, so every
// preset window has real, countable data to filter.
function buildSessions() {
  const sessions = [];
  for (let i = 150; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (![1, 2, 4, 6].includes(dow)) continue;
    sessions.push({
      id: 1700000000000 + i,
      date: d.toISOString().slice(0, 10),
      dayIdx: dow,
      exercises: [{ name: 'Chest Press (machine)', sets: [{ weight: '135', reps: '8', done: true }] }],
      notes: '',
    });
  }
  return sessions;
}

function statValue(page, label) {
  return page.evaluate((l) => {
    const card = [...document.querySelectorAll('.stat-card')]
      .find(c => c.querySelector('.stat-label')?.textContent.trim() === l);
    return card ? card.querySelector('.stat-value').textContent.trim() : null;
  }, label);
}

test.describe('Progress date-range filter', () => {
  test('presets filter Sessions in Range to the correct count', async ({ page }) => {
    const sessions = buildSessions();
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 }, sessions });
    await bootApp(page, { preSeed: () => localStorage.removeItem('wt_progress_range') });
    await goToView(page, 'dashboard');

    const weekAgo = isoDaysAgo(6), today = isoDaysAgo(0);
    const expect7d = sessions.filter(s => s.date >= weekAgo && s.date <= today).length;

    await page.locator('.progress-range-bar button:has-text("7D")').click();
    expect(await statValue(page, 'Sessions in Range')).toBe(String(expect7d));

    await page.locator('.progress-range-bar button:has-text("All")').click();
    expect(await statValue(page, 'Sessions in Range')).toBe(String(sessions.length));
  });

  test('"All Time" spans the actual earliest session, not a fixed fallback', async ({ page }) => {
    const sessions = buildSessions();
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 }, sessions });
    await bootApp(page, { preSeed: () => localStorage.removeItem('wt_progress_range') });
    await goToView(page, 'dashboard');

    await page.locator('.progress-range-bar button:has-text("All")').click();
    const range = await page.evaluate(() => getProgressRange());
    const earliest = sessions.reduce((min, s) => (s.date < min ? s.date : min), sessions[0].date);
    expect(range.start).toBe(earliest);
  });

  test('a custom range filters to exactly the sessions inside it', async ({ page }) => {
    const sessions = buildSessions();
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 }, sessions });
    await bootApp(page, {
      preSeed: () => {
        localStorage.removeItem('wt_progress_range');
        localStorage.removeItem('wt_progress_range_start');
        localStorage.removeItem('wt_progress_range_end');
      },
    });
    await goToView(page, 'dashboard');

    const start = isoDaysAgo(120), end = isoDaysAgo(90);
    const expected = sessions.filter(s => s.date >= start && s.date <= end).length;

    await page.locator('.progress-range-bar button:has-text("Custom")').click();
    const inputs = page.locator('.progress-range-custom input');
    await inputs.nth(0).fill(start);
    await inputs.nth(1).fill(end);
    await page.waitForTimeout(300);

    expect(await statValue(page, 'Sessions in Range')).toBe(String(expected));
  });

  test('export range button downloads a CSV named for the selected window', async ({ page }) => {
    const sessions = buildSessions();
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 }, sessions });
    await bootApp(page, { preSeed: () => localStorage.removeItem('wt_progress_range') });
    await goToView(page, 'dashboard');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export range")'),
    ]);
    expect(download.suggestedFilename()).toMatch(/^workout-data-.*\.csv$/);
  });
});
