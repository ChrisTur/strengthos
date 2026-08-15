// POST /api/sessions-delete  { id }
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { id } = body;
  if (id == null) return err('id required');

  const pool = getPool();
  await pool.query('DELETE FROM workout_sessions WHERE id=$1 AND user_id=$2', [id, user.id]);

  return ok({ ok: true });
};
