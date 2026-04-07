-- Fix patient table schema
-- Adicionar colunas faltantes para o fluxo atual da aplicacao

ALTER TABLE patient
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(6,2) NULL AFTER sex,
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(6,2) NULL AFTER weight_kg,
ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER goal_summary;

-- Popular dados atuais a partir da ultima medicao, quando existir
UPDATE patient p
JOIN (
	SELECT pm.patient_id, pm.weight_kg, pm.height_cm
	FROM patient_metric pm
	JOIN (
		SELECT patient_id, MAX(recorded_at) AS last_recorded_at
		FROM patient_metric
		GROUP BY patient_id
	) latest ON latest.patient_id = pm.patient_id AND latest.last_recorded_at = pm.recorded_at
) metric ON metric.patient_id = p.id
SET p.weight_kg = COALESCE(p.weight_kg, metric.weight_kg),
		p.height_cm = COALESCE(p.height_cm, metric.height_cm)
WHERE p.weight_kg IS NULL OR p.height_cm IS NULL;

ALTER TABLE patient ADD INDEX IF NOT EXISTS idx_patient_email (email);
