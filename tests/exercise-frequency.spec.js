const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Regression coverage for exercise-picker ordering: the most-used exercise
// (by this user's own logged history) should surface first, ahead of
// alphabetically- or library-order-earlier entries the user has never logged.
test.describe('exercise picker frequency ranking', () => {
  test('a heavily-logged exercise ranks above never-logged ones with the same search term', async ({ page }) => {
    // "Hammer Curls" logged 5 times; "Barbell Curl" and "Bicep Curls" (both
    // alphabetically/library-order earlier) never logged at all.
    const sessions = Array.from({ length: 5 }, (_, i) => ({
      id: 1700000000000 + i,
      date: `2026-0${(i % 6) + 1}-0${i + 1}`,
      dayIdx: 0,
      exercises: [{ name: 'Hammer Curls', sets: [{ weight: '30', reps: '10', done: true }] }],
      notes: '',
    }));
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 }, sessions });
    await bootApp(page);

    await page.click('.add-ex-btn');
    await page.fill('#swap-search', 'curl');
    await page.waitForTimeout(150);

    const names = await page.locator('.swap-card-name').allTextContents();
    expect(names.length).toBeGreaterThan(1);
    expect(names[0]).toBe('Hammer Curls');
  });

  test('with no logged history, results keep their normal (unshuffled) order', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: '', dpw: 7 } });
    await bootApp(page);

    await page.click('.add-ex-btn');
    await page.fill('#swap-search', 'curl');
    await page.waitForTimeout(150);

    const namesA = await page.locator('.swap-card-name').allTextContents();
    await page.fill('#swap-search', '');
    await page.fill('#swap-search', 'curl');
    await page.waitForTimeout(150);
    const namesB = await page.locator('.swap-card-name').allTextContents();

    expect(namesA).toEqual(namesB);
  });
});
