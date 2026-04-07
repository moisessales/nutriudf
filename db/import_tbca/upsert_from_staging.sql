\echo Applying TBCA staging into production tables...

\if :{?batch_id}
\else
\quit 'Use -v batch_id=<uuid> when executing this script.'
\endif

INSERT INTO nutrient (
  slug,
  display_name,
  unit,
  daily_reference_value,
  reference_source
)
SELECT
  s.nutrient_slug,
  s.display_name,
  s.unit,
  s.daily_reference_value,
  s.reference_source
FROM tbca_nutrient_staging s
WHERE s.batch_id = :'batch_id'
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  unit = EXCLUDED.unit,
  daily_reference_value = EXCLUDED.daily_reference_value,
  reference_source = EXCLUDED.reference_source;

INSERT INTO food (
  tbca_code,
  name,
  category,
  default_base_quantity,
  default_base_unit,
  kcal,
  protein_g,
  carbs_g,
  fat_g,
  fiber_g,
  sodium_mg,
  data_source
)
SELECT
  s.tbca_code,
  s.food_name,
  s.category,
  s.default_base_quantity,
  s.default_base_unit,
  s.kcal,
  s.protein_g,
  s.carbs_g,
  s.fat_g,
  s.fiber_g,
  s.sodium_mg,
  'TBCA'
FROM tbca_food_staging s
WHERE s.batch_id = :'batch_id'
ON CONFLICT (tbca_code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  default_base_quantity = EXCLUDED.default_base_quantity,
  default_base_unit = EXCLUDED.default_base_unit,
  kcal = EXCLUDED.kcal,
  protein_g = EXCLUDED.protein_g,
  carbs_g = EXCLUDED.carbs_g,
  fat_g = EXCLUDED.fat_g,
  fiber_g = EXCLUDED.fiber_g,
  sodium_mg = EXCLUDED.sodium_mg,
  data_source = EXCLUDED.data_source,
  updated_at = NOW();

INSERT INTO food_nutrient (
  food_id,
  nutrient_id,
  amount_per_base
)
SELECT
  f.id,
  n.id,
  s.amount_per_base
FROM tbca_food_nutrient_staging s
JOIN food f
  ON f.tbca_code = s.tbca_code
JOIN nutrient n
  ON n.slug = s.nutrient_slug
WHERE s.batch_id = :'batch_id'
ON CONFLICT (food_id, nutrient_id) DO UPDATE SET
  amount_per_base = EXCLUDED.amount_per_base;
