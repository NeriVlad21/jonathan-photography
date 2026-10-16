-- Platform oversight, accountability, and client-fee pass-through controls.

-- These role columns were introduced by the earlier Super Admin migration.
-- Repeating them with IF NOT EXISTS keeps this migration safe on installations
-- that skipped that release, while preserving every existing Owner account.
ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS role ENUM('OWNER','SUPER_ADMIN') NOT NULL DEFAULT 'OWNER' AFTER password_hash,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role,
  ADD COLUMN IF NOT EXISTS session_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER is_active,
  ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER session_version;

SET @has_role_active_index = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'admins' AND index_name = 'idx_admins_role_active'
);
SET @role_active_index_sql = IF(@has_role_active_index = 0,
  'ALTER TABLE admins ADD INDEX idx_admins_role_active (role, is_active)',
  'SELECT 1'
);
PREPARE role_active_index_statement FROM @role_active_index_sql;
EXECUTE role_active_index_statement;
DEALLOCATE PREPARE role_active_index_statement;

UPDATE admins SET role = 'OWNER' WHERE role IS NULL OR role = '';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS pass_platform_fee_to_client TINYINT(1) NULL AFTER agreed_details_updated_at;

INSERT INTO site_settings (setting_key, setting_value)
VALUES ('pass_platform_fee_to_client_default', '0')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

CREATE TABLE IF NOT EXISTS entity_flags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('BOOKING','CALENDAR_EVENT','PORTFOLIO_SHOOT','PORTFOLIO_IMAGE') NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  reason VARCHAR(500) NOT NULL,
  flagged_by INT UNSIGNED NOT NULL,
  status ENUM('OPEN','RESOLVED') NOT NULL DEFAULT 'OPEN',
  resolution_note VARCHAR(1000) NULL,
  resolved_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_flags_entity (entity_type, entity_id),
  INDEX idx_flags_status (status, created_at),
  CONSTRAINT fk_flags_flagged_by FOREIGN KEY (flagged_by) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT fk_flags_resolved_by FOREIGN KEY (resolved_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS superadmin_access_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  superadmin_id INT UNSIGNED NOT NULL,
  resource_type ENUM('BOOKING','CALENDAR','CALENDAR_EVENT','PORTFOLIO','PORTFOLIO_SHOOT','PORTFOLIO_IMAGE','LEDGER','LEDGER_EXPORT','CONTACT_REVEAL') NOT NULL,
  resource_id VARCHAR(120) NULL,
  action ENUM('VIEW','EXPORT','REVEAL') NOT NULL DEFAULT 'VIEW',
  metadata JSON NULL,
  ip_hash CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_superadmin_access_created (created_at),
  INDEX idx_superadmin_access_resource (resource_type, resource_id, created_at),
  INDEX idx_superadmin_access_actor (superadmin_id, created_at),
  CONSTRAINT fk_superadmin_access_actor FOREIGN KEY (superadmin_id) REFERENCES admins(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
