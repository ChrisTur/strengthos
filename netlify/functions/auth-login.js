// POST /api/auth-login  { email, password }
const bcrypt  = require('bcryptjs');
const { getPool }  = require('./_db');
const { signToken, ok, err } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { email, password } = body;
  if (!email || !password) return err('email and password required');

  const pool = getPool();
  const { rows } = await pool.query('SELECT id, name, password_hash FROM users WHERE email=$1', [email.toLowerCase().trim()]);
  if (!rows.length) return err('Invalid email or password', 401);

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return err('Invalid email or password', 401);

  const token = signToken(user.id);
  return ok({ token, user: { id: user.id, name: user.name, email } });
};
