ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(10) NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro'));

CREATE INDEX IF NOT EXISTS idx_messages_session_created_user
  ON messages(session_id, created_at)
  WHERE role = 'user';
