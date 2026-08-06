// POST /api/auth-logout — revokes the current token so it can't be replayed
// (e.g. if it was stolen) instead of remaining valid for the rest of its 30-day TTL.
const { tokenFromRequest, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  const token = tokenFromRequest(event);
  if (token) {
    const pool = getPool();
    await pool.query('DELETE FROM auth_sessions WHERE token=$1', [token]);
  }

  return ok({ ok: true });
};
