-- Keep editable public content safe for all Unicode characters on shared hosts.
-- This is an idempotent column conversion and preserves existing setting values.
ALTER TABLE site_settings
  MODIFY setting_value TEXT
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  NULL;
