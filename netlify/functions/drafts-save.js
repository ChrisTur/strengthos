// POST /api/drafts-save  { date, data }
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { date, data } = body;
  if (!date || !data) return err('date and data required');

  const pool = getPool();
  await pool.query(
    `INSERT INTO drafts (user_id, date, data)
     VALUES ($1,$2,$3)
     ON CONFLICT (user_id, date) DO UPDATE SET
       data = EXCLUDED.data, updated_at = NOW()`,
    [user.id, date, JSON.stringify(data)]
  );

  return ok({ ok: true });
};
