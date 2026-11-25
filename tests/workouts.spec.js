const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Program content: no orphaned exercise names, no day repeated within a week,
// goal "extras" not stacked onto days that already are cardio, and the new
// bonus workouts / hybrid frequencies wired through to the UI.

// A date in the current Mon–Sun week whose default assignment is a rest day.
function findRestDate(page) {
  return page.evaluate(() => getWeekDates(0).find(d => getWorkoutForDate(d) === REST_DAY) || null);
}

test.describe('workout programs', () => {
  test('every exercise resolves in the library and no week repeats a day', async ({ page }) => {
    await mockBackend(page);
    await bootApp(page);
    const problems = await page.evaluate(() => {
      const out = [];
      const lib = new Set(Object.values(EXERCISE_LIBRARY).flat().map(e => e.name));
      const weeks = [];
      for (const k in PROGRAMS) weeks.push([`strength ${k}`, PROGRAMS[k]], [`fat-loss ${k}`, [...PROGRAMS[k], CARDIO_DAYS.moderate]]);
      for (const k in CARDIO_PROGRAMS) weeks.push([`cardio ${k}`, CARDIO_PROGRAMS[k]]);
      for (const k in HYBRID_PROGRAMS) weeks.push([`hybrid ${k}`, HYBRID_PROGRAMS[k]]);
      weeks.push(['bonus', BONUS_WORKOUTS]);
      for (const [label, days] of weeks) {
        const sigs = days.map(d => d.exercises.map(e => e.name).sort().join('|'));
        sigs.forEach((s, i) => { if (sigs.indexOf(s) !== i) out.push(`${label}: "${days[i].name}" duplicates "${days[sigs.indexOf(s)].name}"`); });
        days.forEach(d => d.exercises.forEach(e => { if (!lib.has(e.name)) out.push(`${label}: "${d.name}" uses unknown "${e.name}"`); }));
      }
      Object.values(GOAL_EXERCISES).flat().forEach(e => { if (!lib.has(e.name)) out.push(`goal extra "${e.name}" unknown`); });
      return out;
    });
    expect(problems).toEqual([]);
  });

  test('fat-loss finisher goes on lifting days but is not stacked onto the cardio day', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: 'fat_loss', dpw: 4 } });
    await bootApp(page);
    const names = () => page.locator('.ex-row .ex-name-cell').allTextContents();

    await page.evaluate(() => changeWorkoutForDate(0)); // Chest + Triceps
    expect((await names()).join('\n')).toContain('Cardio Finisher (HIIT)');

    await page.evaluate(() => changeWorkoutForDate(4)); // injected cardio day
    await expect(page.locator('#detail-day-title')).toHaveText('Cardio & Conditioning');
    expect((await names()).join('\n')).not.toContain('Cardio Finisher (HIIT)');
  });

  test('recovery moves log minutes, not weight × reps', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: 'cardio', dpw: 7 } });
    await bootApp(page);
    await page.evaluate(() => changeWorkoutForDate(3)); // Active Recovery
    const walk = page.locator('.ex-row', { hasText: 'Brisk Walk' });
    await expect(walk.locator('.cardio-dur-input')).toBeVisible();
    await expect(walk.locator('input[placeholder="reps"]')).toHaveCount(0);
  });

  test('a 6-day hybrid week schedules 6 distinct workouts instead of falling back to 4', async ({ page }) => {
    await mockBackend(page, { settings: { profile: 'Chris', goal: 'hybrid', dpw: 6 } });
    await bootApp(page);
    const { days, scheduled } = await page.evaluate(() => ({
      days: getActiveDays().map(d => d.name),
      scheduled: getGoalWeekDefaults().filter(i => i !== REST_DAY),
    }));
    expect(days).toHaveLength(6);
    expect(new Set(scheduled).size).toBe(6);
  });

  test('a bonus workout can be picked on a rest day without shifting the program rotation', async ({ page }) => {
    // 3-day split → four rest days a week, so the current week always has one.
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await mockBackend(page, {
      settings: { profile: 'Chris', goal: '', dpw: 3 },
      sessions: [{ id: 1, date: yesterday, dayIdx: 0, exercises: [{ name: 'Barbell Bench Press', sets: [{ weight: '135', reps: '8', done: true }] }], notes: '' }],
    });
    await bootApp(page);
    const rest = await findRestDate(page);
    expect(rest).not.toBeNull();
    await page.evaluate(d => { setActiveDate(d); renderWeekGrid(); renderDetail(); }, rest);

    const prompt = page.locator('.bonus-prompt select');
    await expect(prompt).toBeVisible();
    await prompt.selectOption({ label: 'Arm Pump' });
    await expect(page.locator('#detail-day-title')).toHaveText('Arm Pump');
    await expect(page.locator('.info-banner-accent', { hasText: 'Bonus workout' })).toBeVisible();

    // Bonus workouts also appear in the regular "Change workout" picker.
    const groups = await page.locator('#ex-menu-detail select optgroup').evaluateAll(gs => gs.map(g => g.label));
    expect(groups.some(l => l.startsWith('Bonus workouts'))).toBe(true);

    // Logging one must not move "next up" off Day 2 (yesterday was Day 1).
    await page.evaluate(d => {
      const s = loadSessions();
      s.push({ id: 2, date: d, dayIdx: BONUS_BASE + 2, exercises: [{ name: 'Hammer Curls', sets: [{ weight: '30', reps: '12', done: true }] }], notes: '' });
      saveSessions(s);
    }, rest);
    expect(await page.evaluate(() => getNextSuggestedDayIdx())).toBe(1);
  });
});
