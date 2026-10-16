-- ============================================================
-- JONATHAN PHOTOGRAPHY — DATABASE SCHEMA
-- MySQL 8+ / utf8mb4
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Run this file against an explicitly selected database, for example:
-- mysql -u root -p jonathan_photography < database/schema.sql
-- Deliberately do not CREATE/USE a hardcoded database here; doing so makes
-- isolated schema verification capable of targeting the wrong environment.

-- ------------------------------------------------------------
-- admins
-- ------------------------------------------------------------
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('OWNER','SUPER_ADMIN') NOT NULL DEFAULT 'OWNER',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  must_change_password TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admins_role_active (role, is_active),
  CONSTRAINT chk_admins_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- support_reports (owner-to-platform support channel)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS support_reports;
CREATE TABLE support_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submitted_by_admin_id INT UNSIGNED NOT NULL,
  subject VARCHAR(160) NOT NULL,
  category ENUM('TECHNICAL','BILLING','ACCOUNT','OTHER') NOT NULL DEFAULT 'TECHNICAL',
  priority ENUM('NORMAL','URGENT') NOT NULL DEFAULT 'NORMAL',
  description TEXT NOT NULL,
  status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  super_admin_reply TEXT NULL,
  resolved_at DATETIME NULL,
  archived_at DATETIME NULL,
  archived_by_admin_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_support_status_created (status, created_at),
  INDEX idx_support_submitter_created (submitted_by_admin_id, created_at),
  INDEX idx_support_archived (archived_at, status),
  CONSTRAINT fk_support_submitter FOREIGN KEY (submitted_by_admin_id) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT fk_support_archived_by FOREIGN KEY (archived_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Security-sensitive Super Admin actions are retained for accountability.
DROP TABLE IF EXISTS admin_audit_log;
CREATE TABLE admin_audit_log (
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

DROP TABLE IF EXISTS content_moderation;
CREATE TABLE content_moderation (
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

-- ------------------------------------------------------------
-- portfolio_categories
-- ------------------------------------------------------------
DROP TABLE IF EXISTS portfolio_categories;
CREATE TABLE portfolio_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NULL,
  cover_image VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_public (visible, sort_order, id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- portfolio_shoots
-- ------------------------------------------------------------
DROP TABLE IF EXISTS portfolio_shoots;
CREATE TABLE portfolio_shoots (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  location VARCHAR(160) NULL,
  shoot_date DATE NULL,
  cover_image_id INT UNSIGNED NULL,
  sort_order INT NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_category_slug (category_id, slug),
  INDEX idx_shoots_category_public (category_id, visible, sort_order, id),
  CONSTRAINT fk_shoot_category FOREIGN KEY (category_id) REFERENCES portfolio_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- portfolio_images
-- ------------------------------------------------------------
DROP TABLE IF EXISTS portfolio_images;
CREATE TABLE portfolio_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  shoot_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  original_path VARCHAR(255) NULL,
  title VARCHAR(160) NULL,
  caption TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_cover TINYINT(1) NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_images_shoot_public (shoot_id, visible, sort_order, id),
  INDEX idx_images_shoot_cover (shoot_id, is_cover),
  CONSTRAINT fk_image_shoot FOREIGN KEY (shoot_id) REFERENCES portfolio_shoots(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE portfolio_shoots
  ADD CONSTRAINT fk_shoot_cover_image FOREIGN KEY (cover_image_id) REFERENCES portfolio_images(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- services
-- ------------------------------------------------------------
DROP TABLE IF EXISTS services;
CREATE TABLE services (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  category VARCHAR(60) NOT NULL DEFAULT 'photography',
  description TEXT NULL,
  -- Package details: one item per line; empty/NULL sections are not shown.
  inclusions TEXT NULL,
  coverage_details TEXT NULL,
  deliverables TEXT NULL,
  package_options TEXT NULL,
  notes TEXT NULL,
  image_path VARCHAR(255) NULL,
  starting_price DECIMAL(10,2) NULL,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_services_public (visible, category, sort_order, id),
  CONSTRAINT chk_services_price CHECK (starting_price IS NULL OR starting_price >= 0),
  CONSTRAINT chk_services_visible CHECK (visible IN (0, 1))
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- estimator_hours
-- ------------------------------------------------------------
DROP TABLE IF EXISTS estimator_hours;
CREATE TABLE estimator_hours (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hours_public (active, sort_order, id),
  CONSTRAINT chk_hours_range CHECK (hours > 0 AND hours <= 24),
  CONSTRAINT chk_hours_price CHECK (price >= 0),
  CONSTRAINT chk_hours_active CHECK (active IN (0, 1))
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- estimator_addons
-- ------------------------------------------------------------
DROP TABLE IF EXISTS estimator_addons;
CREATE TABLE estimator_addons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  price DECIMAL(10,2) NOT NULL,
  is_quantity_based TINYINT(1) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_addons_public (active, sort_order, id),
  CONSTRAINT chk_addons_price CHECK (price >= 0),
  CONSTRAINT chk_addons_flags CHECK (active IN (0, 1) AND is_quantity_based IN (0, 1))
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- contact_platforms
-- ------------------------------------------------------------
DROP TABLE IF EXISTS contact_platforms;
CREATE TABLE contact_platforms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(80) NOT NULL,
  tagline VARCHAR(180) NULL,
  handle VARCHAR(160) NULL,
  link VARCHAR(255) NOT NULL,
  icon VARCHAR(60) NOT NULL DEFAULT 'link',
  visible TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_contacts_public (visible, sort_order, id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- bookings
-- ------------------------------------------------------------
DROP TABLE IF EXISTS bookings;
CREATE TABLE bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  facebook VARCHAR(255) NULL,
  shoot_type VARCHAR(120) NOT NULL,
  preferred_date DATE NULL,
  preferred_time TIME NULL,
  submission_token VARCHAR(64) NULL UNIQUE,
  location VARCHAR(200) NULL,
  guest_count VARCHAR(40) NULL,
  message TEXT NULL,
  estimate_total DECIMAL(10,2) NULL,
  estimate_breakdown JSON NULL,
  agreed_details JSON NULL,
  agreed_details_updated_at DATETIME NULL,
  pass_platform_fee_to_client TINYINT(1) NULL,
  confirmed_details JSON NULL,
  confirmed_details_updated_at DATETIME NULL,
  down_payment_amount DECIMAL(10,2) NULL,
  down_payment_received_at DATE NULL,
  down_payment_note VARCHAR(500) NULL,
  invoice_sent_at DATETIME NULL,
  privacy_agreed TINYINT(1) NOT NULL DEFAULT 0,
  privacy_agreed_at DATETIME NULL,
  status ENUM('NEW','PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NEW',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bookings_email (email),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_preferred_date (preferred_date),
  INDEX idx_bookings_status_created (status, created_at),
  INDEX idx_bookings_date_status (preferred_date, status),
  INDEX idx_bookings_created (created_at),
  CONSTRAINT chk_bookings_privacy CHECK (privacy_agreed IN (0, 1)),
  CONSTRAINT chk_bookings_estimate CHECK (estimate_total IS NULL OR estimate_total >= 0),
  CONSTRAINT chk_bookings_down_payment CHECK (down_payment_amount IS NULL OR down_payment_amount >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- booking_payments (manual records of money received elsewhere)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS booking_payments;
CREATE TABLE booking_payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  payment_type ENUM('DOWN_PAYMENT','FINAL_PAYMENT') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  received_at DATE NOT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_payment_type (booking_id, payment_type),
  INDEX idx_booking_payments_date (received_at),
  CONSTRAINT fk_booking_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT chk_booking_payment_amount CHECK (amount > 0)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS invoice_sequences;
CREATE TABLE invoice_sequences (
  sequence_year SMALLINT UNSIGNED PRIMARY KEY,
  next_number INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Immutable invoice payloads. Revisions create a new row and void the old row.
DROP TABLE IF EXISTS invoices;
CREATE TABLE invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  payment_id INT UNSIGNED NULL,
  invoice_type ENUM('DOWN_PAYMENT','FINAL_PAYMENT') NOT NULL,
  invoice_number VARCHAR(24) NOT NULL UNIQUE,
  revision_of_id INT UNSIGNED NULL,
  snapshot JSON NOT NULL,
  sent_at DATETIME NULL,
  voided_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invoices_booking_created (booking_id, created_at),
  INDEX idx_invoices_sent (sent_at),
  CONSTRAINT fk_invoice_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_payment FOREIGN KEY (payment_id) REFERENCES booking_payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoice_revision FOREIGN KEY (revision_of_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS fee_cycles;
CREATE TABLE fee_cycles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('OPEN','DUE','PAID') NOT NULL DEFAULT 'OPEN',
  paid_at DATE NULL,
  payment_note VARCHAR(500) NULL,
  archived_at DATETIME NULL,
  archived_by_admin_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fee_cycle_dates (cycle_start, cycle_end),
  INDEX idx_fee_cycles_status_due (status, due_date),
  INDEX idx_fee_cycles_archived (archived_at, status),
  CONSTRAINT fk_fee_cycle_archived_by FOREIGN KEY (archived_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS platform_fee_ledger;
CREATE TABLE platform_fee_ledger (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL UNIQUE,
  invoice_id INT UNSIGNED NOT NULL,
  cycle_id INT UNSIGNED NOT NULL,
  agreed_total DECIMAL(10,2) NOT NULL,
  fee_rate DECIMAL(7,6) NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  accrued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided_at DATETIME NULL,
  archived_at DATETIME NULL,
  archived_by_admin_id INT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fee_ledger_cycle_active (cycle_id, voided_at),
  INDEX idx_fee_ledger_archived (archived_at, cycle_id),
  CONSTRAINT fk_fee_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_fee_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
  CONSTRAINT fk_fee_cycle FOREIGN KEY (cycle_id) REFERENCES fee_cycles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_fee_ledger_archived_by FOREIGN KEY (archived_by_admin_id) REFERENCES admins(id) ON DELETE SET NULL,
  CONSTRAINT chk_fee_values CHECK (agreed_total >= 0 AND fee_rate >= 0 AND fee_amount >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- booking_addons  (normalized line items for a booking's estimate)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS booking_addons;
CREATE TABLE booking_addons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  label VARCHAR(120) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_booking_addon_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- calendar_events  (admin-owned confirmed studio schedule)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS calendar_events;
CREATE TABLE calendar_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NULL UNIQUE,
  reference_code VARCHAR(24) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  shoot_type VARCHAR(120) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NULL,
  location VARCHAR(200) NULL,
  notes TEXT NULL,
  status ENUM('REQUESTED','BOOKED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'BOOKED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_calendar_events_date_status (event_date, status),
  INDEX idx_calendar_events_date_created (event_date, created_at),
  CONSTRAINT fk_calendar_event_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Superadmin notices are advisory only. They never alter or hide an entity.
DROP TABLE IF EXISTS entity_flags;
CREATE TABLE entity_flags (
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

DROP TABLE IF EXISTS superadmin_access_log;
CREATE TABLE superadmin_access_log (
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

-- ------------------------------------------------------------
-- estimator_leads
-- ------------------------------------------------------------
DROP TABLE IF EXISTS estimator_leads;
CREATE TABLE estimator_leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL,
  hours DECIMAL(5,2) NULL,
  addons JSON NULL,
  service_type VARCHAR(120) NULL,
  total DECIMAL(10,2) NOT NULL,
  booked TINYINT(1) NOT NULL DEFAULT 0,
  status ENUM('New','Booked','Lost') NOT NULL DEFAULT 'New',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_leads_email (email),
  INDEX idx_leads_status_created (status, created_at),
  INDEX idx_leads_created (created_at),
  CONSTRAINT chk_leads_total CHECK (total >= 0),
  CONSTRAINT chk_leads_booked CHECK (booked IN (0, 1))
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- site_settings (key/value store for small editable bits of copy)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS site_settings;
CREATE TABLE site_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
