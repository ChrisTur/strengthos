// StrengthOS API client — wraps Netlify Functions with JWT auth
// All paths are relative so they work on any Netlify deployment.

const API = '/.netlify/functions';

function getAuthToken()  { return localStorage.getItem('wt_auth_token') || null; }
function setAuthToken(t) { localStorage.setItem('wt_auth_token', t); }
function clearAuthToken(){ localStorage.removeItem('wt_auth_token'); }

function _headers(auth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (auth) { const t = getAuthToken(); if (t) h['Authorization'] = 'Bearer ' + t; }
  return h;
}

async function _fetch(path, opts = {}) {
  const res  = await fetch(API + path, opts);
  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body.error || 'Request failed'), { status: res.status });
  return body;
}

// ── Retry queue for background syncs ────────────────────────────────────────
// Every auto-sync (session, draft, settings, body weight) used to fire once
// and give up silently on failure — fine on solid wifi, but gym wifi/cell
// reception is exactly the environment this app needs to keep working in.
// Keyed so a later call for the same thing (e.g. the next debounce tick, or
// another edit before a retry fires) replaces the queued attempt instead of
// piling up duplicates — the newest attempt already represents everything an
// older queued one would have sent. Flushed when the browser reports it's
// back online, and again on visibility (covers cases where 'online' doesn't
// fire reliably, e.g. flaky wifi that never cleanly drops).
const _pendingSyncs = new Map(); // key -> () => Promise<boolean>

async function _syncWithRetry(key, attempt) {
  let ok = false;
  try { ok = await attempt(); } catch { ok = false; }
  if (ok) _pendingSyncs.delete(key);
  else _pendingSyncs.set(key, attempt);
  return ok;
}
async function _flushPendingSyncs() {
  if (!_pendingSyncs.size || !getAuthToken()) return;
  for (const [key, attempt] of [..._pendingSyncs]) {
    let ok = false;
    try { ok = await attempt(); } catch { ok = false; }
    if (ok) _pendingSyncs.delete(key);
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', _flushPendingSyncs);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') _flushPendingSyncs();
  });
}

async function apiLogin(email, password) {
  const data = await _fetch('/auth-login', {
    method: 'POST', headers: _headers(false),
    body: JSON.stringify({ email, password })
  });
  setAuthToken(data.token);
  return data;
}

async function apiRegister(name, email, password) {
  const data = await _fetch('/auth-register', {
    method: 'POST', headers: _headers(false),
    body: JSON.stringify({ name, email, password })
  });
  setAuthToken(data.token);
  return data;
}

async function apiLoadUserData() {
  const [settings, sessionsBody, draftsBody, bwBody] = await Promise.all([
    _fetch('/settings-get',    { headers: _headers() }),
    _fetch('/sessions-list',   { headers: _headers() }),
    _fetch('/drafts-list',     { headers: _headers() }),
    _fetch('/bodyweight-list', { headers: _headers() }),
  ]);
  return { settings, sessions: sessionsBody.sessions, drafts: draftsBody.drafts, bodyWeight: bwBody.entries };
}

// Never throws (network/HTTP failures resolve to false, not a rejection), so it's
// still safe to fire without awaiting — but callers that care whether the workout
// actually reached the server (saveSession) can await the result and tell the user.
// On failure this queues itself for retry (see _syncWithRetry above), and either
// way — first attempt or a later retry — _onSessionSyncSettled keeps the
// on-screen "auto-synced" / "saved on this device only" status honest, since a
// background retry succeeding doesn't go through the code path that originally
// triggered the sync.
async function apiSyncSession(session) {
  if (!getAuthToken()) return false;
  return _syncWithRetry('session:' + session.id, async () => {
    let ok = false;
    try {
      // keepalive lets this finish even if the page unloads right after (e.g.
      // the service worker's auto-update reload landing moments after a save)
      // instead of the request getting cut off mid-flight.
      const res = await fetch(API + '/sessions-save', {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify({ session }),
        keepalive: true,
      });
      ok = res.ok;
    } catch { ok = false; }
    _onSessionSyncSettled(session.id, ok);
    return ok;
  });
}
function _onSessionSyncSettled(sessionId, ok) {
  if (typeof draftSession === 'undefined' || !draftSession || draftSession.savedSessionId !== sessionId) return;
  draftSession.syncStatus = ok ? 'synced' : 'failed';
  if (typeof saveDraft === 'function' && typeof activeDate !== 'undefined') saveDraft(activeDate, draftSession);
  if (typeof updateSessionStatus === 'function') updateSessionStatus();
}

function apiDeleteSession(id) {
  if (!getAuthToken()) return;
  _syncWithRetry('session-delete:' + id, async () => {
    try {
      const res = await fetch(API + '/sessions-delete', {
        method: 'POST', headers: _headers(), body: JSON.stringify({ id }), keepalive: true,
      });
      return res.ok;
    } catch { return false; }
  });
}

// Settings patches are partial (e.g. {scheduleOverrides} in one call,
// {weekTemplate} in another) and merge server-side via COALESCE, so a naive
// retry keyed just by 'settings' would let a later patch's retry silently
// replace — and lose — an earlier failed one. Accumulate into one pending
// patch instead, so a retry always (re-)sends everything not yet confirmed
// synced, however many separate calls it came from.
let _pendingSettingsPatch = null;
function apiSyncSettings(patch) {
  if (!getAuthToken()) return;
  _pendingSettingsPatch = _pendingSettingsPatch ? { ..._pendingSettingsPatch, ...patch } : { ...patch };
  _syncWithRetry('settings', async () => {
    const toSend = _pendingSettingsPatch;
    if (!toSend) return true;
    let ok = false;
    try {
      const res = await fetch(API + '/settings-save', {
        method: 'POST', headers: _headers(), body: JSON.stringify(toSend), keepalive: true,
      });
      ok = res.ok;
    } catch { ok = false; }
    // Only clear what was actually sent — a newer patch may have merged in
    // while this request was in flight, and still needs to go out.
    if (ok && _pendingSettingsPatch === toSend) _pendingSettingsPatch = null;
    return ok;
  });
}

function apiSyncDraft(date, data) {
  if (!getAuthToken()) return;
  // keepalive matters here specifically: this is what the visibilitychange
  // flush in storage.js calls right as the tab backgrounds/unloads.
  _syncWithRetry('draft:' + date, async () => {
    try {
      const res = await fetch(API + '/drafts-save', {
        method: 'POST', headers: _headers(), body: JSON.stringify({ date, data }), keepalive: true,
      });
      return res.ok;
    } catch { return false; }
  });
}

function apiDeleteDraft(date) {
  if (!getAuthToken()) return;
  _syncWithRetry('draft-delete:' + date, async () => {
    try {
      const res = await fetch(API + '/drafts-delete', {
        method: 'POST', headers: _headers(), body: JSON.stringify({ date }), keepalive: true,
      });
      return res.ok;
    } catch { return false; }
  });
}

function apiSyncBodyWeight(date, weight) {
  if (!getAuthToken()) return;
  _syncWithRetry('bw:' + date, async () => {
    try {
      const res = await fetch(API + '/bodyweight-save', {
        method: 'POST', headers: _headers(), body: JSON.stringify({ date, weight }), keepalive: true,
      });
      return res.ok;
    } catch { return false; }
  });
}

// Fire-and-forget — logout should feel instant regardless of network; this just
// revokes the token server-side in the background so it can't be replayed later.
function apiLogout() {
  if (!getAuthToken()) return;
  fetch(API + '/auth-logout', { method: 'POST', headers: _headers() }).catch(() => {});
}
