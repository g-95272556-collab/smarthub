CREATE TABLE IF NOT EXISTS letter_cache (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_letter_cache_expires_at ON letter_cache(expires_at);
