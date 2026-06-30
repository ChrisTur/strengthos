-- StrengthOS Database Schema
-- Run once against your Netlify Postgres (Neon) database.
-- psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users & Auth ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  name          TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token   ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);

-- ── User Settings (one row per user) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id             UUID    PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goal                TEXT    DEFAULT '',
  days_per_week       INTEGER DEFAULT 5,
  weight_unit         TEXT    DEFAULT 'lbs',
  cardio_level        TEXT    DEFAULT 'moderate',
  equipment           JSONB,
  disliked_exercises  JSONB   DEFAULT '[]',
  deload              BOOLEAN DEFAULT FALSE,
  week_template       JSONB,
  ai_plan             JSONB,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Workout Sessions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_sessions (
  id         BIGINT      PRIMARY KEY,  -- timestamp-based id from client
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  day_idx    INTEGER     NOT NULL,
  exercises  JSONB       NOT NULL DEFAULT '[]',
  notes      TEXT        DEFAULT '',
  started_at BIGINT,
  ended_at   BIGINT,
  duration   INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_dayidx ON workout_sessions(user_id, day_idx);

-- ── Drafts (in-progress sessions, one per date per user) ─────────────────────
CREATE TABLE IF NOT EXISTS drafts (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, date)
);

-- ── Custom Day Templates ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_days (
  user_id  UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_idx  INTEGER NOT NULL,
  day_data JSONB   NOT NULL,
  PRIMARY KEY (user_id, day_idx)
);

-- ── Schedule Overrides (date → dayIdx assignments) ────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_overrides (
  user_id UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date    DATE    NOT NULL,
  day_idx INTEGER NOT NULL,
  PRIMARY KEY (user_id, date)
);

-- ── Body Weight Log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_weight (
  id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date    DATE        NOT NULL,
  weight  NUMERIC(6,2) NOT NULL,
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_body_weight_user ON body_weight(user_id, date);
