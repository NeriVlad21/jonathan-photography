-- Calendar reads filter by date and order events chronologically.
-- Keep this migration idempotent for existing XAMPP databases.
SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'calendar_events'
    AND index_name = 'idx_calendar_events_date_created'
);

SET @statement = IF(
  @index_exists = 0,
  'ALTER TABLE calendar_events ADD INDEX idx_calendar_events_date_created (event_date, created_at)',
  'SELECT 1'
);

PREPARE calendar_index_statement FROM @statement;
EXECUTE calendar_index_statement;
DEALLOCATE PREPARE calendar_index_statement;
