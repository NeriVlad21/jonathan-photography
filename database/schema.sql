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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
  confirmed_details JSON NULL,
  confirmed_details_updated_at DATETIME NULL,
  down_payment_amount DECIMAL(10,2) NULL,
  down_payment_received_at DATE NULL,
  down_payment_note VARCHAR(500) NULL,
  invoice_sent_at DATETIME NULL,
  privacy_agreed TINYINT(1) NOT NULL DEFAULT 0,
  privacy_agreed_at DATETIME NULL,
  status ENUM('NEW','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'NEW',
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
  status ENUM('REQUESTED','BOOKED','CANCELLED') NOT NULL DEFAULT 'BOOKED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_calendar_events_date_status (event_date, status),
  INDEX idx_calendar_events_date_created (event_date, created_at),
  CONSTRAINT fk_calendar_event_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
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
