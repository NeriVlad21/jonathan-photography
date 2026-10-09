ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS agreed_details JSON NULL AFTER estimate_breakdown,
  ADD COLUMN IF NOT EXISTS agreed_details_updated_at DATETIME NULL AFTER agreed_details;

UPDATE bookings
SET agreed_details = confirmed_details,
    agreed_details_updated_at = confirmed_details_updated_at
WHERE agreed_details IS NULL AND confirmed_details IS NOT NULL;

CREATE TABLE IF NOT EXISTS booking_payments (
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

CREATE TABLE IF NOT EXISTS invoice_sequences (
  sequence_year SMALLINT UNSIGNED PRIMARY KEY,
  next_number INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoices (
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

CREATE TABLE IF NOT EXISTS fee_cycles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('OPEN','DUE','PAID') NOT NULL DEFAULT 'OPEN',
  paid_at DATE NULL,
  payment_note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fee_cycle_dates (cycle_start, cycle_end),
  INDEX idx_fee_cycles_status_due (status, due_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS platform_fee_ledger (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL UNIQUE,
  invoice_id INT UNSIGNED NOT NULL,
  cycle_id INT UNSIGNED NOT NULL,
  agreed_total DECIMAL(10,2) NOT NULL,
  fee_rate DECIMAL(7,6) NOT NULL,
  fee_amount DECIMAL(10,2) NOT NULL,
  accrued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fee_ledger_cycle_active (cycle_id, voided_at),
  CONSTRAINT fk_fee_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_fee_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
  CONSTRAINT fk_fee_cycle FOREIGN KEY (cycle_id) REFERENCES fee_cycles(id) ON DELETE RESTRICT,
  CONSTRAINT chk_fee_values CHECK (agreed_total >= 0 AND fee_rate >= 0 AND fee_amount >= 0)
) ENGINE=InnoDB;

INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('platform_fee_threshold', '10000'),
  ('platform_fee_low_rate', '0.005'),
  ('platform_fee_high_rate', '0.01'),
  ('platform_fee_cycle_start_date', '2026-01-01'),
  ('platform_fee_due_days', '7')
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);

INSERT IGNORE INTO booking_payments (booking_id, payment_type, amount, received_at, note, created_at)
SELECT id, 'DOWN_PAYMENT', down_payment_amount, down_payment_received_at, down_payment_note,
       COALESCE(down_payment_received_at, created_at)
FROM bookings
WHERE down_payment_amount > 0 AND down_payment_received_at IS NOT NULL;
