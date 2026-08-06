// POST /api/auth-register  { name, email, password }
const bcrypt = require('bcryptjs');
const { getPool }  = require('./_db');
const { createSession, ok, err } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { name, email, password } = body;
  if (!name || !email || !password) return err('name, email and password required');
  if (password.length < 8) return err('Password must be at least 8 characters');

  const pool = getPool();
  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase().trim()]);
  if (existing.length) return err('An account with that email already exists', 409);

  const hash = await bcrypt.hash(password, 12);
  const { rows: [user] } = await pool.query(
    'INSERT INTO users (email, name, password_hash) VALUES ($1,$2,$3) RETURNING id',
    [email.toLowerCase().trim(), name.trim(), hash]
  );
  await pool.query(
    'INSERT INTO user_settings (user_id) VALUES ($1)',
    [user.id]
  );

  const token = await createSession(user.id);
  return ok({ token, user: { id: user.id, name: name.trim(), email: email.toLowerCase().trim() } }, 201);
};
