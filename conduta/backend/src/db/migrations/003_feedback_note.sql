ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS feedback_note TEXT;
