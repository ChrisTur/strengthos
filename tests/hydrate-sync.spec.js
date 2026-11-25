const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Regression coverage for the class of bug that caused duplicate sessions and
// vanishing drafts: hydrate() used to blindly overwrite local state with
// whatever the server had, which loses anything saved locally but not yet
// synced (a real risk once a reload can land mid-sync, e.g. the service
// worker's auto-update).
test.describe('hydrate does not clobber unsynced local state', () => {
  test('a local draft with a newer savedSessionId survives a stale server draft', async ({ page }) => {
    await mockBackend(page, {
      drafts: {
        '2026-08-15': { date: '2026-08-15', dayIdx: 5, exercises: [{ name: 'Lat Pulldown', sets: [] }], notes: '' },
      },
    });
    await bootApp(page, {
      preSeed: () => {
        localStorage.setItem('wt_draft_2026-08-15_Chris', JSON.stringify({
          date: '2026-08-15', dayIdx: 5,
          exercises: [{ name: 'Lat Pulldown', sets: [{ weight: '100', reps: '10', done: true }] }],
          notes: '', savedSessionId: 999888777, syncStatus: 'synced',
        }));
      },
    });

    const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('wt_draft_2026-08-15_Chris')));
    expect(draft.savedSessionId).toBe(999888777);
    expect(draft.exercises[0].sets[0].weight).toBe('100');
  });

  test('a session saved locally but not yet on the server survives the merge', async ({ page }) => {
    await mockBackend(page, {
      sessions: [{ id: 111, date: '2026-08-14', dayIdx: 4, exercises: [], notes: '' }],
    });
    await bootApp(page, {
      preSeed: () => {
        localStorage.setItem('wt_sessions_v2_Chris', JSON.stringify([
          { id: 222, date: '2026-08-13', dayIdx: 3, exercises: [], notes: '' },
        ]));
      },
    });

    const ids = await page.evaluate(() => loadSessions().map(s => s.id).sort());
    expect(ids).toEqual([111, 222]);
  });

  test('schedule, week template, draft, and body weight all survive a full local wipe', async ({ page }) => {
    const state = await mockBackend(page);
    await bootApp(page);

    await page.evaluate(() => {
      setWorkoutForDate('2026-08-20', 2);
      setWeekTemplate([0, 1, 2, 3, 4, -1, -1]);
      saveDraft('2026-08-11', { date: '2026-08-11', dayIdx: 0, exercises: [], notes: 'test draft' });
      saveBW2([{ date: '2026-08-11', weight: 180.5 }]);
    });

    await expect.poll(() => state.settings.scheduleOverrides['2026-08-20']).toBe(2);
    await expect.poll(() => state.settings.weekTemplate).toEqual([0, 1, 2, 3, 4, -1, -1]);
    await expect.poll(() => state.drafts['2026-08-11']).toBeTruthy();
    await expect.poll(() => state.bodyweight.length).toBe(1);

    // Simulate exactly what clearing Safari site data does.
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('wt_auth_token', 'test-token');
    });
    await page.reload({ waitUntil: 'networkidle' });

    const restored = await page.evaluate(() => ({
      profiles: loadProfiles(),
      schedule: getWorkoutForDate('2026-08-20'),
      weekTemplate: getWeekTemplate(),
      draft: getDraft('2026-08-11'),
      bw: loadBW(),
    }));
    expect(restored.profiles).toEqual(['Chris']);
    expect(restored.schedule).toBe(2);
    expect(restored.weekTemplate).toEqual([0, 1, 2, 3, 4, -1, -1]);
    expect(restored.draft.notes).toBe('test draft');
    expect(restored.bw).toEqual([{ date: '2026-08-11', weight: 180.5 }]);
  });
});
