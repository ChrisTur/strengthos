// GET /api/settings-get  — returns user settings
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'GET') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT goal, days_per_week AS dpw, weight_unit AS "weightUnit",
            cardio_level AS "cardioLevel", equipment, disliked_exercises AS disliked,
            deload, week_template AS "weekTemplate", ai_plan AS "aiPlan"
     FROM user_settings WHERE user_id = $1`,
    [user.id]
  );

  const settings = rows[0] || {};
  return ok({
    profile: user.name,
    ...settings,
    equipment:    typeof settings.equipment    === 'string' ? JSON.parse(settings.equipment)    : settings.equipment,
    disliked:     typeof settings.disliked     === 'string' ? JSON.parse(settings.disliked)     : settings.disliked,
    weekTemplate: typeof settings.weekTemplate === 'string' ? JSON.parse(settings.weekTemplate) : settings.weekTemplate,
    aiPlan:       typeof settings.aiPlan       === 'string' ? JSON.parse(settings.aiPlan)       : settings.aiPlan,
  });
};
