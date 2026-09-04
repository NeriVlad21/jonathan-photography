USE jonathan_photography;

CREATE TABLE IF NOT EXISTS calendar_events (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NULL UNIQUE,
  reference_code VARCHAR(24) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  shoot_type VARCHAR(120) NOT NULL,
  event_date DATE NOT NULL,
  location VARCHAR(200) NULL,
  notes TEXT NULL,
  status ENUM('BOOKED','CANCELLED') NOT NULL DEFAULT 'BOOKED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_calendar_events_date_status (event_date, status),
  CONSTRAINT fk_calendar_event_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO calendar_events (
  booking_id, reference_code, name, email, phone, shoot_type,
  event_date, location, notes, status, created_at, updated_at
)
SELECT
  id, CONCAT('CAL-', reference_code), name, email, phone, shoot_type,
  preferred_date, location, message,
  CASE WHEN status = 'CANCELLED' THEN 'CANCELLED' ELSE 'BOOKED' END,
  created_at, updated_at
FROM bookings
WHERE status IN ('CONFIRMED', 'CANCELLED')
  AND preferred_date IS NOT NULL;
