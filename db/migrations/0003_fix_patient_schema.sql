-- Fix patient table schema
-- Adicionar colunas faltantes se não existirem

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Se a coluna 'name' existe e full_name está vazia, copiar dados
UPDATE patients SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- Adicionar índices para melhor performance
ALTER TABLE patients ADD INDEX IF NOT EXISTS idx_nutritionist_active (nutritionist_id, is_active);
ALTER TABLE patients ADD INDEX IF NOT EXISTS idx_email (email);
ALTER TABLE patients ADD UNIQUE INDEX IF NOT EXISTS idx_email_nutritionist ON email(email);
