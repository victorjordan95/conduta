-- 'partial' foi adicionado à API (routes/feedback.js) sem atualizar o CHECK → POST /feedback 500.
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_feedback_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_feedback_check
  CHECK (feedback IN ('positive', 'negative', 'partial'));
