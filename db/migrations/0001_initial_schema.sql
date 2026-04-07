CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'NUTRITIONIST', 'ASSISTANT');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_status') THEN
    CREATE TYPE patient_status AS ENUM ('ACTIVE', 'ATTENTION', 'INACTIVE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consultation_status') THEN
    CREATE TYPE consultation_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_status') THEN
    CREATE TYPE plan_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meal_type') THEN
    CREATE TYPE meal_type AS ENUM (
      'BREAKFAST',
      'MORNING_SNACK',
      'LUNCH',
      'AFTERNOON_SNACK',
      'DINNER',
      'SUPPER',
      'CUSTOM'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metric_source') THEN
    CREATE TYPE metric_source AS ENUM ('CONSULTATION', 'MANUAL', 'IMPORT');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'NUTRITIONIST',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutritionist_profile (
  user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  crn TEXT,
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  birth_date DATE,
  sex TEXT,
  phone TEXT,
  email TEXT,
  status patient_status NOT NULL DEFAULT 'ACTIVE',
  goal_summary TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_metric (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source metric_source NOT NULL DEFAULT 'MANUAL',
  weight_kg NUMERIC(6,2),
  height_cm NUMERIC(6,2),
  bmi NUMERIC(5,2),
  body_fat_pct NUMERIC(5,2),
  lean_mass_kg NUMERIC(6,2),
  waist_cm NUMERIC(6,2),
  hip_cm NUMERIC(6,2),
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (weight_kg IS NULL OR weight_kg > 0),
  CHECK (height_cm IS NULL OR height_cm > 0)
);

CREATE TABLE IF NOT EXISTS consultation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  status consultation_status NOT NULL DEFAULT 'SCHEDULED',
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS food (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tbca_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  default_base_quantity NUMERIC(10,2) NOT NULL DEFAULT 100,
  default_base_unit TEXT NOT NULL DEFAULT 'g',
  kcal NUMERIC(10,2),
  protein_g NUMERIC(10,2),
  carbs_g NUMERIC(10,2),
  fat_g NUMERIC(10,2),
  fiber_g NUMERIC(10,2),
  sodium_mg NUMERIC(10,2),
  data_source TEXT NOT NULL DEFAULT 'TBCA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  daily_reference_value NUMERIC(12,4),
  reference_source TEXT
);

CREATE TABLE IF NOT EXISTS food_nutrient (
  food_id UUID NOT NULL REFERENCES food(id) ON DELETE CASCADE,
  nutrient_id UUID NOT NULL REFERENCES nutrient(id) ON DELETE CASCADE,
  amount_per_base NUMERIC(12,4) NOT NULL,
  PRIMARY KEY (food_id, nutrient_id),
  CHECK (amount_per_base >= 0)
);

CREATE TABLE IF NOT EXISTS diet_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  goal_summary TEXT,
  status plan_status NOT NULL DEFAULT 'DRAFT',
  starts_on DATE,
  ends_on DATE,
  target_kcal NUMERIC(10,2),
  target_protein_g NUMERIC(10,2),
  target_carbs_g NUMERIC(10,2),
  target_fat_g NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS diet_plan_meal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_plan_id UUID NOT NULL REFERENCES diet_plan(id) ON DELETE CASCADE,
  meal_type meal_type NOT NULL,
  custom_name TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  target_kcal NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (meal_type <> 'CUSTOM' OR custom_name IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS diet_plan_meal_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES diet_plan_meal(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES food(id) ON DELETE RESTRICT,
  portion_quantity NUMERIC(10,2) NOT NULL,
  portion_unit TEXT NOT NULL DEFAULT 'g',
  household_measure TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (portion_quantity > 0)
);

CREATE TABLE IF NOT EXISTS hydration_goal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  daily_goal_ml INT NOT NULL,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (daily_goal_ml > 0),
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS hydration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount_ml INT NOT NULL,
  source TEXT NOT NULL DEFAULT 'APP',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_ml <> 0)
);

CREATE INDEX IF NOT EXISTS idx_patient_nutritionist
  ON patient (nutritionist_id, status, full_name);

CREATE INDEX IF NOT EXISTS idx_patient_metric_patient_recorded
  ON patient_metric (patient_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_patient_start
  ON consultation (patient_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_nutritionist_start
  ON consultation (nutritionist_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_food_name
  ON food (name);

CREATE INDEX IF NOT EXISTS idx_diet_plan_patient_status
  ON diet_plan (patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diet_plan_meal_plan_order
  ON diet_plan_meal (diet_plan_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_diet_plan_meal_item_meal_order
  ON diet_plan_meal_item (meal_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_hydration_goal_patient_starts
  ON hydration_goal (patient_id, starts_on DESC);

CREATE INDEX IF NOT EXISTS idx_hydration_log_patient_logged
  ON hydration_log (patient_id, logged_at DESC);
