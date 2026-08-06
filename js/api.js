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
  const [settings, sessionsBody] = await Promise.all([
    _fetch('/settings-get',   { headers: _headers() }),
    _fetch('/sessions-list',  { headers: _headers() }),
  ]);
  return { settings, sessions: sessionsBody.sessions };
}

// Fire-and-forget — never blocks the UI
function apiSyncSession(session) {
  if (!getAuthToken()) return;
  fetch(API + '/sessions-save', {
    method: 'POST',
    headers: _headers(),
    body: JSON.stringify({ session }),
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

// Fire-and-forget — logout should feel instant regardless of network; this just
// revokes the token server-side in the background so it can't be replayed later.
function apiLogout() {
  if (!getAuthToken()) return;
  fetch(API + '/auth-logout', { method: 'POST', headers: _headers() }).catch(() => {});
}
