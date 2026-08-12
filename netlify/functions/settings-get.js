// GET /api/settings-get  — returns user settings
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  const pool = getPool();
  const [{ rows }, { rows: cdRows }, { rows: schedRows }] = await Promise.all([
    pool.query(
      `SELECT goal, days_per_week AS dpw, weight_unit AS "weightUnit",
              cardio_level AS "cardioLevel", equipment, disliked_exercises AS disliked,
              deload, week_template AS "weekTemplate", ai_plan AS "aiPlan"
       FROM user_settings WHERE user_id = $1`,
      [user.id]
    ),
    pool.query(
      'SELECT day_idx, day_data FROM custom_days WHERE user_id = $1',
      [user.id]
    ),
    pool.query(
      'SELECT date, day_idx AS "dayIdx" FROM schedule_overrides WHERE user_id = $1',
      [user.id]
    ),
  ]);

  const settings = rows[0] || {};

  const customDays = {};
  for (const row of cdRows) {
    customDays[String(row.day_idx)] = typeof row.day_data === 'string'
      ? JSON.parse(row.day_data) : row.day_data;
  }

  const scheduleOverrides = {};
  for (const row of schedRows) {
    const dateStr = row.date.toISOString ? row.date.toISOString().slice(0, 10) : String(row.date);
    scheduleOverrides[dateStr] = row.dayIdx;
  }

  function parse(v) { return typeof v === 'string' ? JSON.parse(v) : v; }

  return ok({
    profile: user.name,
    ...settings,
    equipment:    parse(settings.equipment),
    disliked:     parse(settings.disliked),
    weekTemplate: parse(settings.weekTemplate),
    aiPlan:       parse(settings.aiPlan),
    customDays,
    scheduleOverrides,
  });
};
