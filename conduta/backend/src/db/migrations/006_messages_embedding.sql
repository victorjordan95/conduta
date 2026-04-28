-- pgvector is optional
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS embedding vector(1536);
  CREATE INDEX IF NOT EXISTS idx_messages_embedding
    ON messages USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if vector extension is not available
  NULL;
END
$$;
