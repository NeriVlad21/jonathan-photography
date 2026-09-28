-- Package details for each service. The same services row drives the public
-- Services page, the estimator occasion cards and their info panel, and the
-- admin Services / Estimator settings. Each column is plain text with one item
-- per line; existing rows keep NULL and simply show no extra sections.
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS inclusions TEXT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS coverage_details TEXT NULL AFTER inclusions,
  ADD COLUMN IF NOT EXISTS deliverables TEXT NULL AFTER coverage_details,
  ADD COLUMN IF NOT EXISTS package_options TEXT NULL AFTER deliverables,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER package_options;

-- The estimator's public price-range margin used to live only in the admin's
-- browser (localStorage), so visitors never saw the configured value. Store it
-- with the other site settings, keeping the previous default of 15%.
INSERT INTO site_settings (setting_key, setting_value)
VALUES ('estimator_range_margin', '15')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
