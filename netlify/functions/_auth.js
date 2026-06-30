// Auth helpers shared across functions
const jwt = require('jsonwebtoken');
const { getPool } = require('./_db');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
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

async function requireAuth(event) {
  const token = tokenFromRequest(event);
  if (!token) throw Object.assign(new Error('Missing token'), { status: 401 });
  let payload;
  try { payload = verifyToken(token); } catch {
    throw Object.assign(new Error('Invalid or expired token'), { status: 401 });
  }
  const pool = getPool();
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

module.exports = { signToken, verifyToken, tokenFromRequest, requireAuth, ok, err };
