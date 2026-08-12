// POST /api/drafts-delete  { date }
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { date } = body;
  if (!date) return err('date required');

  const pool = getPool();
  await pool.query('DELETE FROM drafts WHERE user_id = $1 AND date = $2', [user.id, date]);

  return ok({ ok: true });
};
