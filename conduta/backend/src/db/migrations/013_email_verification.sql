ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

-- Usuários existentes já são considerados verificados
UPDATE users SET email_verified = TRUE
WHERE email_verified IS FALSE OR email_verified IS NULL;
