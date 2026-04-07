-- Migration: Add email verification and password reset support
-- Date: 2026-04-06

-- Add email_verified column to app_user
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64) DEFAULT NULL;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS verification_expires DATETIME DEFAULT NULL;

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_token (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires_at)
);

-- Mark existing users as verified (they were created before this feature)
UPDATE app_user SET email_verified = TRUE WHERE email_verified = FALSE;
