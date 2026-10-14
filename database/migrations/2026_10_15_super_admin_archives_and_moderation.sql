ALTER TABLE fee_cycles
  ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL AFTER payment_note,
  ADD COLUMN IF NOT EXISTS archived_by_admin_id INT UNSIGNED NULL AFTER archived_at;

ALTER TABLE platform_fee_ledger
  ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL AFTER voided_at,
  ADD COLUMN IF NOT EXISTS archived_by_admin_id INT UNSIGNED NULL AFTER archived_at;

ALTER TABLE support_reports
  ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL AFTER resolved_at,
  ADD COLUMN IF NOT EXISTS archived_by_admin_id INT UNSIGNED NULL AFTER archived_at;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='fee_cycles' AND index_name='idx_fee_cycles_archived')=0,'ALTER TABLE fee_cycles ADD INDEX idx_fee_cycles_archived (archived_at,status)','SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='platform_fee_ledger' AND index_name='idx_fee_ledger_archived')=0,'ALTER TABLE platform_fee_ledger ADD INDEX idx_fee_ledger_archived (archived_at,cycle_id)','SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='support_reports' AND index_name='idx_support_archived')=0,'ALTER TABLE support_reports ADD INDEX idx_support_archived (archived_at,status)','SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='fee_cycles' AND constraint_name='fk_fee_cycle_archived_by')=0,'ALTER TABLE fee_cycles ADD CONSTRAINT fk_fee_cycle_archived_by FOREIGN KEY (archived_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL','SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='platform_fee_ledger' AND constraint_name='fk_fee_ledger_archived_by')=0,'ALTER TABLE platform_fee_ledger ADD CONSTRAINT fk_fee_ledger_archived_by FOREIGN KEY (archived_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL','SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
SET @sql = IF((SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND table_name='support_reports' AND constraint_name='fk_support_archived_by')=0,'ALTER TABLE support_reports ADD CONSTRAINT fk_support_archived_by FOREIGN KEY (archived_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL','SELECT 1'); PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

CREATE TABLE IF NOT EXISTS content_moderation (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('SERVICE','PORTFOLIO_CATEGORY','PORTFOLIO_SHOOT','PORTFOLIO_IMAGE','CONTACT','SITE_COPY') NOT NULL,
  entity_key VARCHAR(120) NOT NULL,
  status ENUM('FLAGGED','HIDDEN') NOT NULL DEFAULT 'FLAGGED',
  reason VARCHAR(500) NOT NULL,
  moderated_by_admin_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_content_moderation_entity (entity_type, entity_key),
  INDEX idx_content_moderation_status (status, updated_at),
  CONSTRAINT fk_content_moderator FOREIGN KEY (moderated_by_admin_id) REFERENCES admins(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
