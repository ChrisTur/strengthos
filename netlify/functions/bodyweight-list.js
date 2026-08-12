// GET /api/bodyweight-list — returns the user's full body weight log
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT date, weight FROM body_weight WHERE user_id = $1 ORDER BY date ASC',
    [user.id]
  );

  const entries = rows.map(r => ({
    date: r.date.toISOString ? r.date.toISOString().slice(0, 10) : String(r.date),
    weight: parseFloat(r.weight),
  }));

  return ok({ entries });
};
