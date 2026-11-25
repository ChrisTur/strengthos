const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Regression coverage for two related "rest day is a dead end" bugs: you
// couldn't add exercises on a rest day at all, and the Plan modal had no
// control to reassign one to an actual workout.
test.describe('rest days', () => {
  test('a rest day in the Plan modal can be assigned a real workout', async ({ page }) => {
    // fat_loss + 4-day split reliably produces real rest days in the week.
    await mockBackend(page, { settings: { profile: 'Chris', goal: 'fat_loss', dpw: 4 } });
    await bootApp(page);

    await page.click("button[title='Plan exercises for the whole week']");
    const cards = page.locator('#week-plan-days .wp-day-card');
    const restCard = cards.filter({ hasText: 'Rest Day' }).first();
    await expect(restCard).toBeVisible();
    // assignWeekPlanDay() fully re-renders #week-plan-days, so re-locating by
    // "Rest Day" text afterward would find nothing — identify this card by
    // its (stable) weekday label instead of content the action itself changes.
    const dow = await restCard.locator('.wp-dow').textContent();

    const select = restCard.locator('select');
    await expect(select).toBeVisible();
    const options = await select.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(1); // Rest/Off plus real workouts

    await select.selectOption({ index: 1 });

    // The card should now render as a real workout, not the inert rest label.
    const sameCard = cards.filter({ has: page.locator('.wp-dow', { hasText: dow }) });
    await expect(sameCard.locator('button:has-text("Edit")')).toBeVisible();
    await expect(sameCard).not.toContainText('Rest Day');
  });
});
