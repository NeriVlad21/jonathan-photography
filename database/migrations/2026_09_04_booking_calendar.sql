-- One-time index used by public availability and admin calendar range queries.

USE jonathan_photography;

ALTER TABLE bookings
  ADD INDEX idx_bookings_preferred_date (preferred_date);
