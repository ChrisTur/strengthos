const { test, expect, mockBackend, bootApp, goToView } = require('./fixtures');

const set = (weight, reps) => ({ weight: String(weight), reps: String(reps), done: true });
const session = (id, date, exercises, dayIdx = 0) => ({ id, date, dayIdx, exercises, notes: '' });

// Mon 2 Nov – Wed 4 Nov 2026, then Mon 9 Nov (twice). Expected XP:
//   S1 Mon  : workout 50 + 2 sets 6                          =  56
//   S2 Tue  : workout 50 + 2 sets 6 + bench PR 25            =  81
//   S3 Wed  : workout 50 + 1 set 3 + hat-trick (3rd day) 75  = 128
//   S4 Mon+1: workout 50 + 1 set 3 + 2-week streak 5         =  58  (110 ties, not a PR)
//   S5 same day as S4: 1 set 3 only (no second "workout" bonus) = 3
//   total 326 → level 3 (100 + 160 to clear levels 1–2, 66 into level 3)
const HISTORY = [
  session(1, '2026-11-02', [{ name: 'Barbell Bench Press', sets: [set(100, 5), set(100, 5)] }]),
  session(2, '2026-11-03', [{ name: 'Barbell Bench Press', sets: [set(110, 5), set(105, 5)] }]),
  session(3, '2026-11-04', [{ name: 'Barbell Back Squat', sets: [set(200, 5)] }]),
  session(4, '2026-11-09', [{ name: 'Barbell Bench Press', sets: [set(110, 5)] }]),
  session(5, '2026-11-09', [{ name: 'Lateral Raises', sets: [set(20, 15)] }], -1),
];

test.describe('XP & levels', () => {
  test('ledger awards workout, sets, PRs, hat-trick and streak XP exactly once each', async ({ page }) => {
    await mockBackend(page);
    await bootApp(page);
    const r = await page.evaluate(h => {
      const l = computeXPLedger(h);
      return { per: l.list.map(e => e.xp), total: l.total, info: levelInfo(l.total),
               firstPR: l.byId[1].items.some(i => i.pr), secondPR: l.byId[2].items.some(i => i.pr) };
    }, HISTORY);
    expect(r.per).toEqual([56, 81, 128, 58, 3]);
    expect(r.total).toBe(326);
    expect(r.info.level).toBe(3);
    expect(r.info.into).toBe(66);
    expect(r.firstPR).toBe(false); // the first time you do a lift isn't a "PR"
    expect(r.secondPR).toBe(true);
  });

  test('XP is derived from history: header badge and Progress card show the level', async ({ page }) => {
    await mockBackend(page, { sessions: HISTORY });
    await bootApp(page);
    await expect(page.locator('#xp-badge')).toContainText('Lv 3');
    await goToView(page, 'dashboard');
    await expect(page.locator('.xp-card-level')).toContainText('Level 3');
    await expect(page.locator('.xp-card')).toContainText('326 XP total');
  });

  test('logging sets shows live XP, and finishing shows the breakdown and a level-up', async ({ page }) => {
    // 56 XP of history → today's first set (50 workout + 3 set, +5 if last
    // week counts as a streak) pushes past level 1's 100.
    const lastWeek = new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10);
    await mockBackend(page, { sessions: [
      session(10, lastWeek, [{ name: 'Lateral Raises', sets: [set(20, 15), set(20, 15)] }], -1),
    ] });
    await bootApp(page);
    await expect(page.locator('#xp-badge')).toContainText('Lv 1');

    await page.locator('.ex-table input[placeholder="lbs"]').first().fill('135');
    await page.locator('.ex-table input[placeholder="reps"]').first().fill('8');
    await expect(page.locator('#session-xp')).toContainText('XP');

    await page.click('button:has-text("Finish")');
    const modal = page.locator('#completion-content');
    await expect(modal.locator('.xp-gain')).toContainText('XP');
    await expect(modal.locator('.xp-item', { hasText: 'Workout complete' })).toContainText('+50');
    await expect(modal.locator('.xp-levelup')).toContainText('LEVEL UP!');
    await expect(page.locator('#xp-badge')).toContainText('Lv 2');
  });
});
