CREATE TABLE IF NOT EXISTS tbca_import_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_label TEXT NOT NULL,
  source_version TEXT,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tbca_food_staging (
  batch_id UUID NOT NULL REFERENCES tbca_import_batch(id) ON DELETE CASCADE,
  tbca_code TEXT NOT NULL,
  food_name TEXT NOT NULL,
  category TEXT,
  default_base_quantity NUMERIC(10,2) NOT NULL DEFAULT 100,
  default_base_unit TEXT NOT NULL DEFAULT 'g',
  kcal NUMERIC(10,2),
  protein_g NUMERIC(10,2),
  carbs_g NUMERIC(10,2),
  fat_g NUMERIC(10,2),
  fiber_g NUMERIC(10,2),
  sodium_mg NUMERIC(10,2),
  raw_payload JSONB,
  PRIMARY KEY (batch_id, tbca_code)
);

CREATE TABLE IF NOT EXISTS tbca_nutrient_staging (
  batch_id UUID NOT NULL REFERENCES tbca_import_batch(id) ON DELETE CASCADE,
  nutrient_slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  daily_reference_value NUMERIC(12,4),
  reference_source TEXT,
  raw_payload JSONB,
  PRIMARY KEY (batch_id, nutrient_slug)
);

CREATE TABLE IF NOT EXISTS tbca_food_nutrient_staging (
  batch_id UUID NOT NULL REFERENCES tbca_import_batch(id) ON DELETE CASCADE,
  tbca_code TEXT NOT NULL,
  nutrient_slug TEXT NOT NULL,
  amount_per_base NUMERIC(12,4) NOT NULL,
  raw_payload JSONB,
  PRIMARY KEY (batch_id, tbca_code, nutrient_slug),
  CHECK (amount_per_base >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tbca_food_staging_code
  ON tbca_food_staging (tbca_code);

CREATE INDEX IF NOT EXISTS idx_tbca_food_nutrient_staging_food
  ON tbca_food_nutrient_staging (tbca_code);

CREATE INDEX IF NOT EXISTS idx_tbca_food_nutrient_staging_nutrient
  ON tbca_food_nutrient_staging (nutrient_slug);
