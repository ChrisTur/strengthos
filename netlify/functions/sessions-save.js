// POST /api/sessions-save  { session }
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const { session } = body;
  if (!session || !session.id) return err('session required');

  const pool = getPool();
  // The WHERE guard is load-bearing: `id` is a client-generated timestamp, not scoped
  // per-user, so without it any authenticated user could overwrite another user's
  // session by guessing/colliding on an id. This makes a cross-owner conflict a silent
  // no-op instead of an overwrite.
  await pool.query(
    `INSERT INTO workout_sessions
       (id, user_id, date, day_idx, exercises, notes, started_at, ended_at, duration)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO UPDATE SET
       exercises  = EXCLUDED.exercises,
       notes      = EXCLUDED.notes,
       ended_at   = EXCLUDED.ended_at,
       duration   = EXCLUDED.duration
     WHERE workout_sessions.user_id = EXCLUDED.user_id`,
    [
      session.id, user.id, session.date, session.dayIdx ?? 0,
      JSON.stringify(session.exercises ?? []),
      session.notes || '',
      session.startedAt ?? null,
      session.endedAt   ?? null,
      session.duration  ?? null,
    ]
  );

  return ok({ ok: true });
};
