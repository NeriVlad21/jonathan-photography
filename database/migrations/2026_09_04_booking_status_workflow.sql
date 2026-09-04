-- One-time migration for the final booking status workflow.
-- Run this against an existing jonathan_photography database before deploying
-- the matching API update.

USE jonathan_photography;

-- Temporarily support old and new values while existing rows are normalized.
ALTER TABLE bookings
  MODIFY status ENUM('NEW','CONTACTED','CONFIRMED','DECLINED','CANCELLED')
  NOT NULL DEFAULT 'NEW';

-- Contacting a client is no longer a status change; declined is now cancelled.
UPDATE bookings SET status = 'NEW' WHERE status = 'CONTACTED';
UPDATE bookings SET status = 'CANCELLED' WHERE status = 'DECLINED';

-- Keep only the three statuses supported by the new workflow.
ALTER TABLE bookings
  MODIFY status ENUM('NEW','CONFIRMED','CANCELLED')
  NOT NULL DEFAULT 'NEW';
