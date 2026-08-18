// Every spec should import { test, expect } from here instead of from
// '@playwright/test' directly — it wires up an automatic zero-console-errors
// assertion (the single most common way regressions in this app have shown
// up: a stale hydrate, a bad merge, an undefined helper) so a test doesn't
// have to remember to check for it explicitly.
const base = require('@playwright/test');
const { mockBackend, bootApp, goToView } = require('./helpers');

const test = base.test.extend({
  consoleErrors: async ({ page }, use) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('404')) errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(`PAGEERROR: ${err}`));
    await use(errors);
  },
});

test.afterEach(async ({ consoleErrors }) => {
  base.expect(consoleErrors, `Unexpected console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
});

module.exports = { test, expect: base.expect, mockBackend, bootApp, goToView };
