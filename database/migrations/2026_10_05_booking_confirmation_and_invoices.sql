ALTER TABLE bookings
  ADD COLUMN confirmed_details JSON NULL AFTER estimate_breakdown,
  ADD COLUMN confirmed_details_updated_at DATETIME NULL AFTER confirmed_details,
  ADD COLUMN down_payment_amount DECIMAL(10,2) NULL AFTER confirmed_details_updated_at,
  ADD COLUMN down_payment_received_at DATE NULL AFTER down_payment_amount,
  ADD COLUMN down_payment_note VARCHAR(500) NULL AFTER down_payment_received_at,
  ADD COLUMN invoice_sent_at DATETIME NULL AFTER down_payment_note,
  ADD CONSTRAINT chk_bookings_down_payment
    CHECK (down_payment_amount IS NULL OR down_payment_amount >= 0);
