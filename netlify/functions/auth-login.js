// POST /api/auth-login  { email, password }
const bcrypt  = require('bcryptjs');
const { getPool }  = require('./_db');
const { createSession, ok, err } = require('./_auth');

// Tracked in the users table (not in-memory) since Netlify Functions can run
// on any of several ephemeral instances — an in-memory counter would reset
// or fail to share state across them and not actually limit anything.
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { email, password } = body;
  if (!email || !password) return err('email and password required');

  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT id, name, password_hash, failed_login_attempts, locked_until FROM users WHERE email=$1',
    [email.toLowerCase().trim()]
  );
  // Same generic message whether the account doesn't exist, the password is
  // wrong, or the account is currently locked out — a distinct "too many
  // attempts" message would let an attacker use lockout state as a signal
  // for which emails have accounts at all.
  if (!rows.length) return err('Invalid email or password', 401);

  const user = rows[0];
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return err('Invalid email or password', 401);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60000) : null;
    await pool.query(
      'UPDATE users SET failed_login_attempts=$1, locked_until=$2 WHERE id=$3',
      [attempts, lockedUntil, user.id]
    );
    return err('Invalid email or password', 401);
  }

  // A real login clears any accumulated lockout state.
  if (user.failed_login_attempts || user.locked_until) {
    await pool.query('UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE id=$1', [user.id]);
  }

  const token = await createSession(user.id);
  return ok({ token, user: { id: user.id, name: user.name, email } });
};
