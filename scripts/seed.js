#!/usr/bin/env node
/**
 * StrengthOS — Database Seed Script
 *
 * Usage:
 *   node scripts/seed.js <export-file.json> <email> <password>
 *
 * Example:
 *   node scripts/seed.js strengthos-export-Me.json me@example.com mypassword
 *
 * Requires DATABASE_URL in .env (or environment).
 * Generate the export file by running scripts/export-localstorage.js in the browser console.
 */

require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws     = require('ws');
neonConfig.webSocketConstructor = ws;
const bcrypt = require('bcryptjs');
const fs     = require('fs');
const path   = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL not set. Add it to .env');
  process.exit(1);
}

const [,, filePath, email, password] = process.argv;
if (!filePath || !email || !password) {
  console.error('Usage: node scripts/seed.js <export.json> <email> <password>');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const q    = (text, params) => pool.query(text, params);

  const data = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));

  console.log(`\nSeeding profile "${data.profile}" → ${email}`);
  console.log(`  Sessions   : ${(data.sessions || []).length}`);
  console.log(`  BW entries : ${(data.bodyWeight || []).length}`);
  console.log(`  Custom days: ${Object.keys(data.customDays || {}).length}`);
  console.log('');

  // ── 1. Upsert user ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows: [user] } = await q(
    `INSERT INTO users (email, name, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [email, data.profile, passwordHash]
  );
  const userId = user.id;
  console.log(`✅ User: ${data.profile} (${email}) — id ${userId}`);

  // ── 2. Upsert settings ───────────────────────────────────────────────────────
  await q(
    `INSERT INTO user_settings
       (user_id, goal, days_per_week, weight_unit, cardio_level,
        equipment, disliked_exercises, deload, week_template, ai_plan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (user_id) DO UPDATE SET
       goal               = EXCLUDED.goal,
       days_per_week      = EXCLUDED.days_per_week,
       weight_unit        = EXCLUDED.weight_unit,
       cardio_level       = EXCLUDED.cardio_level,
       equipment          = EXCLUDED.equipment,
       disliked_exercises = EXCLUDED.disliked_exercises,
       deload             = EXCLUDED.deload,
       week_template      = EXCLUDED.week_template,
       ai_plan            = EXCLUDED.ai_plan,
       updated_at         = NOW()`,
    [
      userId,
      data.goal || '',
      data.dpw || 5,
      data.weightUnit || 'lbs',
      data.cardioLevel || 'moderate',
      JSON.stringify(data.equipment ?? null),
      JSON.stringify(data.disliked ?? []),
      !!data.deload,
      JSON.stringify(data.weekTemplate ?? null),
      JSON.stringify(data.aiPlan ?? null),
    ]
  );
  console.log('✅ Settings saved');

  // ── 3. Workout sessions ──────────────────────────────────────────────────────
  let sessionCount = 0;
  for (const s of (data.sessions || [])) {
    await q(
      `INSERT INTO workout_sessions
         (id, user_id, date, day_idx, exercises, notes, started_at, ended_at, duration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [
        s.id, userId, s.date, s.dayIdx ?? 0,
        JSON.stringify(s.exercises ?? []),
        s.notes || '',
        s.startedAt ?? null, s.endedAt ?? null, s.duration ?? null,
      ]
    );
    sessionCount++;
  }
  console.log(`✅ ${sessionCount} workout sessions`);

  // ── 4. Custom days ───────────────────────────────────────────────────────────
  let cdCount = 0;
  for (const [idx, dayData] of Object.entries(data.customDays || {})) {
    await q(
      `INSERT INTO custom_days (user_id, day_idx, day_data)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, day_idx) DO UPDATE SET day_data = EXCLUDED.day_data`,
      [userId, parseInt(idx, 10), JSON.stringify(dayData)]
    );
    cdCount++;
  }
  if (cdCount) console.log(`✅ ${cdCount} custom day templates`);

  // ── 5. Schedule overrides ────────────────────────────────────────────────────
  let schedCount = 0;
  for (const [date, dayIdx] of Object.entries(data.schedule || {})) {
    await q(
      `INSERT INTO schedule_overrides (user_id, date, day_idx)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, date) DO UPDATE SET day_idx = EXCLUDED.day_idx`,
      [userId, date, dayIdx]
    );
    schedCount++;
  }
  if (schedCount) console.log(`✅ ${schedCount} schedule overrides`);

  // ── 6. Body weight ───────────────────────────────────────────────────────────
  let bwCount = 0;
  for (const entry of (data.bodyWeight || [])) {
    await q(
      `INSERT INTO body_weight (user_id, date, weight)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, date) DO UPDATE SET weight = EXCLUDED.weight`,
      [userId, entry.date, parseFloat(entry.weight)]
    );
    bwCount++;
  }
  if (bwCount) console.log(`✅ ${bwCount} body weight entries`);

  console.log('\n🎉 Seed complete.\n');
  await pool.end();
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
