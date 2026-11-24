-- KeepMyProof's first (and only) server tables: Play review access (site/server/review.mjs). Additive only.
-- No raw app user ID, IP or code is stored: id_hash and key are HMACs with REVIEW_HASH_SECRET.
CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS review_grant (window_id TEXT NOT NULL, id_hash TEXT NOT NULL, granted_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, PRIMARY KEY (window_id, id_hash));
CREATE TABLE IF NOT EXISTS review_try (bucket TEXT NOT NULL, key TEXT NOT NULL, tries INTEGER NOT NULL, until INTEGER NOT NULL, PRIMARY KEY (bucket, key));
INSERT OR IGNORE INTO schema_version (version, name, applied_at) VALUES (1, 'review', datetime('now'));
