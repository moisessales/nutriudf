-- Schema para MySQL
-- Criado para substituir o schema PostgreSQL

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS app_user (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'NUTRITIONIST',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de pacientes
CREATE TABLE IF NOT EXISTS patient (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nutritionist_id VARCHAR(36) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  birth_date DATE,
  sex VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  goal_summary TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (nutritionist_id) REFERENCES app_user(id) ON DELETE RESTRICT
);

-- Tabela de métricas do paciente
CREATE TABLE IF NOT EXISTS patient_metric (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  patient_id VARCHAR(36) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
  weight_kg DECIMAL(6,2),
  height_cm DECIMAL(6,2),
  bmi DECIMAL(5,2),
  body_fat_pct DECIMAL(5,2),
  lean_mass_kg DECIMAL(6,2),
  waist_cm DECIMAL(6,2),
  hip_cm DECIMAL(6,2),
  observations TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE
);

-- Tabela de consultas
CREATE TABLE IF NOT EXISTS consultation (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nutritionist_id VARCHAR(36) NOT NULL,
  patient_id VARCHAR(36) NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
  title VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (nutritionist_id) REFERENCES app_user(id) ON DELETE RESTRICT,
  FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE
);

-- Tabela de nutrientes
CREATE TABLE IF NOT EXISTS nutrient (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  slug VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  daily_reference_value DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de alimentos
CREATE TABLE IF NOT EXISTS food (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tbca_code VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  kcal DECIMAL(10,2),
  protein_g DECIMAL(10,2),
  carbs_g DECIMAL(10,2),
  fat_g DECIMAL(10,2),
  fiber_g DECIMAL(10,2),
  sodium_mg DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de nutrientes por alimento (N:N)
CREATE TABLE IF NOT EXISTS food_nutrient (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  food_id VARCHAR(36) NOT NULL,
  nutrient_id VARCHAR(36) NOT NULL,
  amount_per_base DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (food_id) REFERENCES food(id) ON DELETE CASCADE,
  FOREIGN KEY (nutrient_id) REFERENCES nutrient(id) ON DELETE CASCADE,
  UNIQUE KEY unique_food_nutrient (food_id, nutrient_id)
);

-- Tabela de planos nutricionais
CREATE TABLE IF NOT EXISTS nutrition_plan (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nutritionist_id VARCHAR(36) NOT NULL,
  patient_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (nutritionist_id) REFERENCES app_user(id) ON DELETE RESTRICT,
  FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE
);

-- Tabela de refeições do plano
CREATE TABLE IF NOT EXISTS meal (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  plan_id VARCHAR(36) NOT NULL,
  meal_type VARCHAR(50) NOT NULL,
  day_of_week INT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES nutrition_plan(id) ON DELETE CASCADE
);

-- Tabela de alimentos na refeição
CREATE TABLE IF NOT EXISTS meal_food (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  meal_id VARCHAR(36) NOT NULL,
  food_id VARCHAR(36) NOT NULL,
  quantity_g DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meal_id) REFERENCES meal(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES food(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_patient_nutritionist ON patient(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_consultation_nutritionist ON consultation(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_consultation_patient ON consultation(patient_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plan_patient ON nutrition_plan(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan ON meal(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_food_meal ON meal_food(meal_id);
CREATE INDEX IF NOT EXISTS idx_patient_metric_patient ON patient_metric(patient_id);

-- Inserts das constraints de dados existentes
INSERT IGNORE INTO nutrient (slug, display_name, unit) VALUES
('calcium', 'Cálcio', 'mg'),
('iron', 'Ferro', 'mg'),
('protein', 'Proteína', 'g'),
('carbohydrate', 'Carboidrato', 'g'),
('fat', 'Gordura', 'g'),
('fiber', 'Fibra', 'g'),
('vitamin-a', 'Vitamina A', 'mcg'),
('vitamin-c', 'Vitamina C', 'mg'),
('vitamin-d', 'Vitamina D', 'mcg'),
('vitamin-e', 'Vitamina E', 'mg'),
('thiamine', 'Tiamina (B1)', 'mg'),
('riboflavin', 'Riboflavina (B2)', 'mg'),
('niacin', 'Niacina (B3)', 'mg'),
('vitamin-b6', 'Vitamina B6', 'mg'),
('vitamin-b12', 'Vitamina B12', 'mcg'),
('folate', 'Folato', 'mcg'),
('potassium', 'Potássio', 'mg'),
('magnesium', 'Magnésio', 'mg'),
('zinc', 'Zinco', 'mg'),
('phosphorus', 'Fósforo', 'mg');
