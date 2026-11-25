const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Logging a set is supposed to reach the database in the background — this
// was the whole point of removing the old manual Save button. Covers: no
// duplicate session rows across repeated auto-sync ticks, Finish still shows
// the completion summary even though auto-sync usually beat it there, and
// Discard deletes the server-side row instead of leaving it orphaned.
test.describe('auto-sync', () => {
  test('sets auto-sync in the background without ever clicking Finish', async ({ page }) => {
    const state = await mockBackend(page);
    await bootApp(page);

    const status = page.locator('#session-status');
    await expect(status).toHaveText('Draft');

    const weightInput = page.locator('.ex-table input[placeholder="lbs"]').first();
    const repsInput = page.locator('.ex-table input[placeholder="reps"]').first();
    await weightInput.fill('135');
    await repsInput.fill('8');

    await expect(status).toContainText('saving…');
    expect(state.sessions.length).toBe(0);

    // Debounce is 1.5s — give it room to land.
    await expect(status).toContainText('auto-synced', { timeout: 4000 });
    expect(state.sessions.length).toBe(1);
    const sessionId = state.sessions[0].id;

    // A second edit should update the same row, not create another one.
    const weightInput2 = page.locator('.ex-table input[placeholder="lbs"]').nth(1);
    const repsInput2 = page.locator('.ex-table input[placeholder="reps"]').nth(1);
    await weightInput2.fill('140');
    await repsInput2.fill('6');
    await expect.poll(() => state.sessions.length, { timeout: 4000 }).toBe(1);
    expect(state.sessions[0].id).toBe(sessionId);
  });

  test('Finish shows the completion summary even when auto-sync already caught up', async ({ page }) => {
    await mockBackend(page);
    await bootApp(page);

    await page.locator('.ex-table input[placeholder="lbs"]').first().fill('135');
    await page.locator('.ex-table input[placeholder="reps"]').first().fill('8');
    await expect(page.locator('#session-status')).toContainText('auto-synced', { timeout: 4000 });

    await page.click('button:has-text("Finish")');
    await expect(page.locator('#completion-modal')).toBeVisible();
    await page.evaluate(() => closeCompletionModal());
    await expect(page.locator('#session-status')).toContainText('Finished');
  });

  test('Discard deletes the auto-synced session, not just the local draft', async ({ page }) => {
    const state = await mockBackend(page);
    await bootApp(page);

    await page.locator('.ex-table input[placeholder="lbs"]').first().fill('135');
    await page.locator('.ex-table input[placeholder="reps"]').first().fill('8');
    await expect.poll(() => state.sessions.length, { timeout: 4000 }).toBe(1);

    page.once('dialog', d => d.accept());
    await page.click('button:has-text("Discard")');
    await expect.poll(() => state.sessions.length).toBe(0);
    await expect(page.locator('#session-status')).toHaveText('Draft');
  });
});
