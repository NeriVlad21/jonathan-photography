-- Query-supporting indexes and domain constraints for production traffic.
-- Index creation is repeatable; named CHECK constraints make this a one-time migration.

CREATE INDEX IF NOT EXISTS idx_categories_public
  ON portfolio_categories (visible, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_shoots_category_public
  ON portfolio_shoots (category_id, visible, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_images_shoot_public
  ON portfolio_images (shoot_id, visible, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_images_shoot_cover
  ON portfolio_images (shoot_id, is_cover);
CREATE INDEX IF NOT EXISTS idx_services_public
  ON services (visible, category, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_hours_public
  ON estimator_hours (active, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_addons_public
  ON estimator_addons (active, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_contacts_public
  ON contact_platforms (visible, sort_order, id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created
  ON bookings (status, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status
  ON bookings (preferred_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created
  ON bookings (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status_created
  ON estimator_leads (status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_created
  ON estimator_leads (created_at);

ALTER TABLE services
  ADD CONSTRAINT chk_services_price CHECK (starting_price IS NULL OR starting_price >= 0),
  ADD CONSTRAINT chk_services_visible CHECK (visible IN (0, 1));
ALTER TABLE estimator_hours
  ADD CONSTRAINT chk_hours_range CHECK (hours > 0 AND hours <= 24),
  ADD CONSTRAINT chk_hours_price CHECK (price >= 0),
  ADD CONSTRAINT chk_hours_active CHECK (active IN (0, 1));
ALTER TABLE estimator_addons
  ADD CONSTRAINT chk_addons_price CHECK (price >= 0),
  ADD CONSTRAINT chk_addons_flags CHECK (active IN (0, 1) AND is_quantity_based IN (0, 1));
ALTER TABLE bookings
  ADD CONSTRAINT chk_bookings_privacy CHECK (privacy_agreed IN (0, 1)),
  ADD CONSTRAINT chk_bookings_estimate CHECK (estimate_total IS NULL OR estimate_total >= 0);
ALTER TABLE estimator_leads
  ADD CONSTRAINT chk_leads_total CHECK (total >= 0),
  ADD CONSTRAINT chk_leads_booked CHECK (booked IN (0, 1));
