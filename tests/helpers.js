// Shared test helpers — mock the Netlify Functions backend with an in-memory
// store (matching the real endpoints' request/response shapes) so specs never
// touch a real database, and seed a logged-in, onboarded local profile.

const DEFAULT_SETTINGS = { profile: 'Chris', goal: '', dpw: 7, customDays: {}, scheduleOverrides: {}, weekTemplate: null };

async function mockBackend(page, overrides = {}) {
  const state = {
    settings: { ...DEFAULT_SETTINGS, ...(overrides.settings || {}) },
    sessions: overrides.sessions ? [...overrides.sessions] : [],
    drafts: overrides.drafts ? { ...overrides.drafts } : {},
    bodyweight: overrides.bodyweight ? [...overrides.bodyweight] : [],
  };

  await page.route('**/settings-get', route => route.fulfill({ json: state.settings }));
  await page.route('**/settings-save', (route, request) => {
    Object.assign(state.settings, request.postDataJSON());
    route.fulfill({ json: { ok: true } });
  });

  await page.route('**/sessions-list', route => route.fulfill({ json: { sessions: state.sessions } }));
  await page.route('**/sessions-save', (route, request) => {
    const { session } = request.postDataJSON();
    state.sessions = state.sessions.filter(s => s.id !== session.id).concat(session);
    route.fulfill({ json: { ok: true } });
  });
  await page.route('**/sessions-delete', (route, request) => {
    const { id } = request.postDataJSON();
    state.sessions = state.sessions.filter(s => s.id !== id);
    route.fulfill({ json: { ok: true } });
  });

  await page.route('**/drafts-list', route => route.fulfill({ json: { drafts: state.drafts } }));
  await page.route('**/drafts-save', (route, request) => {
    const { date, data } = request.postDataJSON();
    state.drafts[date] = data;
    route.fulfill({ json: { ok: true } });
  });
  await page.route('**/drafts-delete', (route, request) => {
    const { date } = request.postDataJSON();
    delete state.drafts[date];
    route.fulfill({ json: { ok: true } });
  });

  await page.route('**/bodyweight-list', route => route.fulfill({ json: { entries: state.bodyweight } }));
  await page.route('**/bodyweight-save', (route, request) => {
    const { date, weight } = request.postDataJSON();
    state.bodyweight = state.bodyweight.filter(e => e.date !== date).concat({ date, weight });
    route.fulfill({ json: { ok: true } });
  });

  return state;
}

// Seeds localStorage for a logged-in, onboarded profile and loads the app
// past onboarding. `preSeed(page)` runs after the token is set but before the
// reload that actually boots the app, for anything a test needs present at
// hydrate time (e.g. a stale local draft, to test hydrate's merge behavior).
async function bootApp(page, { profile = 'Chris', preSeed } = {}) {
  await page.addInitScript(() => localStorage.setItem('wt_auth_token', 'test-token'));
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(p => {
    localStorage.setItem('wt_onboarded', '1');
    localStorage.setItem('wt_profiles', JSON.stringify([p]));
    localStorage.setItem('wt_active_profile', p);
  }, profile);
  if (preSeed) await page.evaluate(preSeed);
  await page.reload({ waitUntil: 'networkidle' });
}

// Opens the header's hamburger menu and clicks through to a named view
// ('dashboard' | 'history') — those buttons live behind #btn-log's sibling
// overflow menu, not as standing header buttons.
async function goToView(page, view) {
  const btnId = view === 'dashboard' ? '#btn-dash' : '#btn-hist';
  await page.click(".ex-kebab-btn[title='More views']");
  await page.click(btnId);
}

module.exports = { mockBackend, bootApp, goToView };
