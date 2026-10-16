-- Adds role separation, owner support reports, and a Super Admin audit trail.
-- Existing administrators remain active owners. Create the first Super Admin
-- with backend/scripts/create_superadmin.php after applying the latest migrations.

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS role ENUM('OWNER','SUPER_ADMIN') NOT NULL DEFAULT 'OWNER' AFTER password_hash,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role,
  ADD COLUMN IF NOT EXISTS session_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER is_active;

SET @has_role_index = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'admins' AND index_name = 'idx_admins_role_active'
);
SET @role_index_sql = IF(@has_role_index = 0,
  'ALTER TABLE admins ADD INDEX idx_admins_role_active (role, is_active)',
  'SELECT 1'
);
PREPARE role_index_statement FROM @role_index_sql;
EXECUTE role_index_statement;
DEALLOCATE PREPARE role_index_statement;

UPDATE admins SET role = 'OWNER', is_active = 1 WHERE role IS NULL OR role = '';

CREATE TABLE IF NOT EXISTS support_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submitted_by_admin_id INT UNSIGNED NOT NULL,
  subject VARCHAR(160) NOT NULL,
  category ENUM('TECHNICAL','BILLING','ACCOUNT','OTHER') NOT NULL DEFAULT 'TECHNICAL',
  priority ENUM('NORMAL','URGENT') NOT NULL DEFAULT 'NORMAL',
  description TEXT NOT NULL,
  status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  super_admin_reply TEXT NULL,
  resolved_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_support_status_created (status, created_at),
  INDEX idx_support_submitter_created (submitted_by_admin_id, created_at),
  CONSTRAINT fk_support_submitter FOREIGN KEY (submitted_by_admin_id) REFERENCES admins(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_admin_id INT UNSIGNED NULL,
  target_admin_id INT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_audit_created (created_at),
  INDEX idx_admin_audit_actor (actor_admin_id, created_at),
  CONSTRAINT fk_admin_audit_actor FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT fk_admin_audit_target FOREIGN KEY (target_admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO site_settings (setting_key, setting_value)
SELECT 'booking_notification_email', email
FROM admins
WHERE role = 'OWNER' AND is_active = 1
ORDER BY updated_at DESC, id ASC
LIMIT 1
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);
