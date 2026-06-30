// POST /api/settings-save  { goal, dpw, weightUnit, cardioLevel, equipment, disliked, deload, weekTemplate, aiPlan }
const { requireAuth, ok, err } = require('./_auth');
const { getPool } = require('./_db');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' };
  if (event.httpMethod !== 'POST') return err('Method not allowed', 405);

  let user;
  try { user = await requireAuth(event); } catch (e) { return err(e.message, e.status || 401); }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return err('Invalid JSON'); }

  const pool = getPool();
  await pool.query(
    `INSERT INTO user_settings
       (user_id, goal, days_per_week, weight_unit, cardio_level,
        equipment, disliked_exercises, deload, week_template, ai_plan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (user_id) DO UPDATE SET
       goal               = COALESCE(EXCLUDED.goal,               user_settings.goal),
       days_per_week      = COALESCE(EXCLUDED.days_per_week,      user_settings.days_per_week),
       weight_unit        = COALESCE(EXCLUDED.weight_unit,        user_settings.weight_unit),
       cardio_level       = COALESCE(EXCLUDED.cardio_level,       user_settings.cardio_level),
       equipment          = COALESCE(EXCLUDED.equipment,          user_settings.equipment),
       disliked_exercises = COALESCE(EXCLUDED.disliked_exercises, user_settings.disliked_exercises),
       deload             = COALESCE(EXCLUDED.deload,             user_settings.deload),
       week_template      = COALESCE(EXCLUDED.week_template,      user_settings.week_template),
       ai_plan            = COALESCE(EXCLUDED.ai_plan,            user_settings.ai_plan),
       updated_at         = NOW()`,
    [
      user.id,
      body.goal        ?? null,
      body.dpw         ?? null,
      body.weightUnit  ?? null,
      body.cardioLevel ?? null,
      body.equipment   != null ? JSON.stringify(body.equipment)   : null,
      body.disliked    != null ? JSON.stringify(body.disliked)    : null,
      body.deload      ?? null,
      body.weekTemplate != null ? JSON.stringify(body.weekTemplate) : null,
      body.aiPlan       != null ? JSON.stringify(body.aiPlan)       : null,
    ]
  );

  return ok({ ok: true });
};
