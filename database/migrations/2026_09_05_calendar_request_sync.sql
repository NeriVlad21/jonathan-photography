ALTER TABLE calendar_events
  MODIFY status ENUM('REQUESTED','BOOKED','CANCELLED') NOT NULL DEFAULT 'BOOKED';

INSERT INTO calendar_events
  (booking_id, reference_code, name, email, phone, shoot_type, event_date, location, notes, status)
SELECT
  b.id,
  CONCAT('REQ-', b.reference_code),
  b.name,
  b.email,
  b.phone,
  b.shoot_type,
  b.preferred_date,
  b.location,
  b.message,
  'REQUESTED'
FROM bookings b
LEFT JOIN calendar_events ce ON ce.booking_id = b.id
WHERE b.status = 'NEW'
  AND b.preferred_date IS NOT NULL
  AND ce.id IS NULL;

UPDATE calendar_events ce
JOIN bookings b ON b.id = ce.booking_id
SET ce.status = CASE
  WHEN b.status = 'CONFIRMED' THEN 'BOOKED'
  WHEN b.status = 'CANCELLED' THEN 'CANCELLED'
  ELSE 'REQUESTED'
END;
