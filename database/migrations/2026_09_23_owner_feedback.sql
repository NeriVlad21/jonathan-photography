-- Owner validation updates: requested event time, reliable idempotent submissions,
-- and a configurable equipment-upgrade add-on.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS preferred_time TIME NULL AFTER preferred_date,
  ADD COLUMN IF NOT EXISTS submission_token VARCHAR(64) NULL AFTER preferred_time;

SET @submission_token_index = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'bookings'
    AND index_name = 'uq_bookings_submission_token'
);
SET @submission_token_sql = IF(
  @submission_token_index = 0,
  'ALTER TABLE bookings ADD UNIQUE INDEX uq_bookings_submission_token (submission_token)',
  'SELECT 1'
);
PREPARE submission_token_stmt FROM @submission_token_sql;
EXECUTE submission_token_stmt;
DEALLOCATE PREPARE submission_token_stmt;

ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS event_time TIME NULL AFTER event_date;

INSERT INTO estimator_addons (label, description, price, active, sort_order, is_quantity_based)
SELECT
  'Equipment Upgrade',
  'Additional lighting, lenses, or specialty equipment based on the shoot requirements.',
  0,
  0,
  COALESCE(MAX(sort_order), 0) + 1,
  0
FROM estimator_addons
WHERE NOT EXISTS (
  SELECT 1 FROM estimator_addons existing
  WHERE LOWER(existing.label) = LOWER('Equipment Upgrade')
);
