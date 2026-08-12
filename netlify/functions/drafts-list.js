// GET /api/drafts-list — returns all in-progress (unsaved) session drafts for the user
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT date, data FROM drafts WHERE user_id = $1',
    [user.id]
  );

  const drafts = {};
  for (const row of rows) {
    const dateStr = row.date.toISOString ? row.date.toISOString().slice(0, 10) : String(row.date);
    drafts[dateStr] = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
  }

  return ok({ drafts });
};
