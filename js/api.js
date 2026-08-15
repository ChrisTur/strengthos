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
async function apiSyncSession(session) {
  if (!getAuthToken()) return false;
  try {
    // keepalive lets this finish even if the page unloads right after (e.g. the
    // service worker's auto-update reload landing moments after a save) instead
    // of the request getting cut off mid-flight.
    const res = await fetch(API + '/sessions-save', {
      method: 'POST',
      headers: _headers(),
      body: JSON.stringify({ session }),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

function apiDeleteSession(id) {
  if (!getAuthToken()) return;
  fetch(API + '/sessions-delete', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ id }),
    keepalive: true,
  }).catch(() => {});
}

function apiSyncSettings(patch) {
  if (!getAuthToken()) return;
  fetch(API + '/settings-save', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify(patch),
  }).catch(() => {});
}

function apiSyncDraft(date, data) {
  if (!getAuthToken()) return;
  // keepalive matters here specifically: this is what the visibilitychange
  // flush in storage.js calls right as the tab backgrounds/unloads.
  fetch(API + '/drafts-save', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ date, data }),
    keepalive: true,
  }).catch(() => {});
}

function apiDeleteDraft(date) {
  if (!getAuthToken()) return;
  fetch(API + '/drafts-delete', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ date }),
  }).catch(() => {});
}

function apiSyncBodyWeight(date, weight) {
  if (!getAuthToken()) return;
  fetch(API + '/bodyweight-save', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ date, weight }),
  }).catch(() => {});
}

// Fire-and-forget — logout should feel instant regardless of network; this just
// revokes the token server-side in the background so it can't be replayed later.
function apiLogout() {
  if (!getAuthToken()) return;
  fetch(API + '/auth-logout', { method: 'POST', headers: _headers() }).catch(() => {});
}
