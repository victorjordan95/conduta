ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS feedback VARCHAR(10)
  CHECK (feedback IN ('positive', 'negative'));
