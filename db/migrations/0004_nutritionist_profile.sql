-- Migration: Add nutritionist_profile table for MySQL/TiDB
CREATE TABLE IF NOT EXISTS nutritionist_profile (
  user_id VARCHAR(36) PRIMARY KEY,
  crn VARCHAR(50),
  phone VARCHAR(20),
  bio TEXT,
  profession VARCHAR(100),
  experience_years INT,
  education VARCHAR(255),
  specialties TEXT,
  city VARCHAR(100),
  modality VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);
