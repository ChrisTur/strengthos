// POST /api/bodyweight-save  { date, weight }
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { date, weight } = body;
  if (!date || typeof weight !== 'number' || !(weight > 0)) return err('date and a positive weight required');

  const pool = getPool();
  await pool.query(
    `INSERT INTO body_weight (user_id, date, weight)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id, date) DO UPDATE SET weight = EXCLUDED.weight`,
    [user.id, date, weight]
  );

  return ok({ ok: true });
};
