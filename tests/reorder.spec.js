const { test, expect, mockBackend, bootApp } = require('./fixtures');

// Hold-and-drag reordering (js/sortable.js) — replaced the old ⋯ → Move up /
// Move down menu. Covers: long-press drag, instant drag from the grip, a quick
// swipe NOT reordering, keyboard reordering, superset handling, the Edit Day
// modal, and a real touch long-press on a phone-sized viewport.

const rowNames = page => page.locator('#ex-tbody .ex-row').evaluateAll(rows =>
  rows.map(r => r.querySelector('.ex-name-cell span:not(.superset-badge)').textContent.trim()));
const draftNames = page => page.evaluate(() => draftSession.exercises.map(e => e.name));

async function centerOf(locator) {
  const b = await locator.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
// Mouse drag: press at `from`, optionally hold, glide to `to`, release.
async function mouseDrag(page, from, to, { holdMs = 0 } = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  if (holdMs) await page.waitForTimeout(holdMs);
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.waitForTimeout(60); // let the rAF layout pass see the final position
  await page.mouse.up();
}

test.describe('drag to reorder exercises', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await bootApp(page);
    await expect(page.locator('#ex-tbody .ex-row').nth(3)).toBeVisible();
  });

  test('press-and-hold a card, drag it down, and it lands there (and is saved)', async ({ page }) => {
    const before = await rowNames(page);
    const rows = page.locator('#ex-tbody .ex-row');
    // Grab the card by its plain-text "Programme" cell, not a control.
    const from = await centerOf(rows.nth(0).locator('.ex-plan-cell'));
    const target = await rows.nth(2).boundingBox();
    await mouseDrag(page, from, { x: from.x, y: target.y + target.height * 0.75 }, { holdMs: 500 });

    const expected = [before[1], before[2], before[0], ...before.slice(3)];
    await expect.poll(() => rowNames(page)).toEqual(expected);
    expect(await draftNames(page)).toEqual(expected);
    const stored = await page.evaluate(() => getDraft(activeDate).exercises.map(e => e.name));
    expect(stored).toEqual(expected);
  });

  test('the grip handle picks a card up instantly — no hold needed', async ({ page }) => {
    const before = await rowNames(page);
    const rows = page.locator('#ex-tbody .ex-row');
    // Row 3's grip starts inside the bottom auto-scroll zone of the 720px
    // viewport — dragging *up* from there must not scroll the page down.
    const from = await centerOf(rows.nth(3).locator('.drag-handle'));
    const first = await rows.nth(0).boundingBox();
    const lifted = await rows.nth(3).boundingBox();
    await mouseDrag(page, from, { x: from.x, y: from.y - (lifted.y - first.y) - 10 });
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect.poll(() => rowNames(page)).toEqual([before[3], before[0], before[1], before[2], ...before.slice(4)]);
  });

  test('a quick drag without holding does not reorder anything', async ({ page }) => {
    const before = await rowNames(page);
    const rows = page.locator('#ex-tbody .ex-row');
    const from = await centerOf(rows.nth(0).locator('.ex-plan-cell'));
    const target = await rows.nth(2).boundingBox();
    await mouseDrag(page, from, { x: from.x, y: target.y + target.height * 0.75 });
    await page.waitForTimeout(450);
    expect(await rowNames(page)).toEqual(before);
  });

  test('keyboard: arrow keys on the grip move the card and keep focus on it', async ({ page }) => {
    const before = await rowNames(page);
    await page.locator('#ex-tbody .ex-row').nth(0).locator('.drag-handle').focus();
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => rowNames(page)).toEqual([before[1], before[0], ...before.slice(2)]);
    const focusedRow = await page.evaluate(() => [...document.querySelectorAll('#ex-tbody .ex-row')].indexOf(document.activeElement.closest('.ex-row')));
    expect(focusedRow).toBe(1);
  });

  test('moving a card into a superset joins it; moving it out closes the gap', async ({ page }) => {
    const links = () => page.evaluate(() => draftSession.exercises.map(e => !!e.linkedToNext));
    await page.evaluate(() => { toggleSuperset(0); }); // A1 = ex0, A2 = ex1
    await page.evaluate(() => reorderExercise(3, 1)); // drop ex3 between them
    expect((await links()).slice(0, 3)).toEqual([true, true, false]); // now A1/A2/A3
    await page.evaluate(() => reorderExercise(1, 4)); // pull it back out to the end region
    const l = await links();
    expect(l[0]).toBe(true);  // the original pair is still linked…
    expect(l[1]).toBe(false); // …and ends there
    expect(l[l.length - 1]).toBe(false);
  });

  test('the old Move up / Move down menu items are gone', async ({ page }) => {
    await page.locator('#ex-tbody .ex-row').nth(0).locator('.ex-kebab-btn').click();
    await expect(page.locator('#ex-menu-0')).not.toContainText('Move up');
  });

  test('Edit Day modal rows reorder by drag and the order is saved', async ({ page }) => {
    await page.evaluate(() => openCustomDayModal(activeDayIdx));
    const rows = page.locator('#custom-day-list .custom-day-row');
    await expect(rows.nth(2)).toBeVisible();
    const names = () => rows.locator('.custom-day-name-txt').allTextContents();
    const before = await names();
    const from = await centerOf(rows.nth(0).locator('.drag-handle'));
    const target = await rows.nth(1).boundingBox();
    await mouseDrag(page, from, { x: from.x, y: target.y + target.height * 0.8 });
    await expect.poll(names).toEqual([before[1], before[0], ...before.slice(2)]);
    await page.click('#custom-day-modal button:has-text("Save")');
    const saved = await page.evaluate(() => getActiveDay(activeDayIdx).exercises.map(e => e.name));
    expect(saved.slice(0, 2)).toEqual([before[1], before[0]]);
  });
});

test.describe('drag to reorder on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('touch long-press lifts the card and dragging reorders without scrolling the page', async ({ page }) => {
    await mockBackend(page);
    await bootApp(page);
    const rows = page.locator('#ex-tbody .ex-row');
    await expect(rows.nth(2)).toBeVisible();
    const before = await rowNames(page);
    await rows.nth(0).scrollIntoViewIfNeeded();
    const from = await centerOf(rows.nth(0).locator('.ex-plan-cell'));
    const target = await rows.nth(1).boundingBox();
    const toY = target.y + target.height * 0.8;
    const scrollBefore = await page.evaluate(() => window.scrollY);

    const cdp = await page.context().newCDPSession(page);
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', from.x, from.y);
    await page.waitForTimeout(500);
    await expect(rows.nth(0)).toHaveClass(/sort-dragging/);
    for (let i = 1; i <= 10; i++) await touch('touchMove', from.x, from.y + (toY - from.y) * i / 10);
    await page.waitForTimeout(60);
    // Finger moved ~a card's height; the page itself must not have scrolled with it
    // (auto-scroll only kicks in at the viewport edge).
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThan(40);
    await touch('touchEnd');

    await expect.poll(() => rowNames(page)).toEqual([before[1], before[0], ...before.slice(2)]);
  });
});
