// GET /api/sessions-list  — returns all workout sessions for the authenticated user
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, date, day_idx AS "dayIdx", exercises, notes,
            started_at AS "startedAt", ended_at AS "endedAt", duration
     FROM workout_sessions
     WHERE user_id = $1
     ORDER BY date ASC, id ASC`,
    [user.id]
  );

  const sessions = rows.map(r => ({
    ...r,
    date: r.date.toISOString ? r.date.toISOString().slice(0, 10) : String(r.date),
    exercises: typeof r.exercises === 'string' ? JSON.parse(r.exercises) : r.exercises,
  }));

  return ok({ sessions });
};
