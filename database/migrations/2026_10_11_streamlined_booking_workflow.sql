-- Add the intermediate review state and the closed completed state without
-- changing existing booking records or their calendar relationships.
ALTER TABLE bookings
  MODIFY status ENUM('NEW','PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NEW';

ALTER TABLE calendar_events
  MODIFY status ENUM('REQUESTED','BOOKED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'BOOKED';
