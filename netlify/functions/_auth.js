// Auth helpers shared across functions
const jwt = require('jsonwebtoken');
const { getPool } = require('./_db');

// No insecure fallback: a misconfigured deployment must fail loudly at cold start
// rather than silently sign/verify tokens with a secret that's sitting in this
// (presumably public) repo's source.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is not set — refusing to start.');
}
const TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

function signToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET); // throws on invalid/expired
}

function tokenFromRequest(event) {
  const header = event.headers['authorization'] || event.headers['Authorization'] || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Signs a JWT and records it in auth_sessions so it can be revoked (logout, or a
// future "log out everywhere") instead of remaining valid, stateless, for the full
// 30-day TTL regardless of what happens to the account afterward.
async function createSession(userId) {
  const token = jwt.sign({ sub: userId }, SECRET, { expiresIn: TOKEN_TTL });
  const pool = getPool();
  const expiresAt = new Date(Date.now() + TOKEN_TTL * 1000);
  await pool.query(
    'INSERT INTO auth_sessions (user_id, token, expires_at) VALUES ($1,$2,$3)',
    [userId, token, expiresAt]
  );
  return token;
}

async function requireAuth(event) {
  const token = tokenFromRequest(event);
  if (!token) throw Object.assign(new Error('Missing token'), { status: 401 });
  let payload;
  try { payload = verifyToken(token); } catch {
    throw Object.assign(new Error('Invalid or expired token'), { status: 401 });
  }
  const pool = getPool();
  const { rows: sessionRows } = await pool.query(
    'SELECT 1 FROM auth_sessions WHERE token=$1 AND expires_at > NOW()',
    [token]
  );
  if (!sessionRows.length) throw Object.assign(new Error('Session revoked or expired'), { status: 401 });
  const { rows } = await pool.query('SELECT id, email, name FROM users WHERE id=$1', [payload.sub]);
  if (!rows.length) throw Object.assign(new Error('User not found'), { status: 401 });
  return rows[0];
}

function ok(body, status = 200) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function err(message, status = 400) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: message }) };
}

module.exports = { signToken, verifyToken, createSession, tokenFromRequest, requireAuth, ok, err };
