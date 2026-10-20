-- Jonathan Photography — optional baseline catalog
--
-- This seed is additive and safe to re-import. It never deletes or replaces
-- bookings, client records, administrator accounts, portfolio uploads, or
-- existing owner-managed settings/content. Run after schema.sql only when
-- setting up a new database. Use migrations for an existing installation.

-- Public portfolio starts empty. Upload authentic images from Admin > Portfolio.
-- No sample customers, demo images, or administrator credentials are seeded.

-- Services: slug is unique, so existing owner edits are left untouched.
INSERT IGNORE INTO services (name, slug, category, description, starting_price, sort_order, visible) VALUES
('Wedding Photography', 'wedding-photography', 'photography', 'Full-day coverage from preparation to reception, delivered as an edited story.', 16000, 1, 1),
('Engagement Photography', 'engagement-photography', 'photography', 'A relaxed on-location session for the two of you, before the big one.', 6000, 2, 1),
('Birthday Photography', 'birthday-photography', 'photography', 'Coverage for birthday celebrations of any scale.', 5000, 3, 1),
('Christening Photography', 'christening-photography', 'photography', 'Documentation of the ceremony and the celebration that follows.', 5000, 4, 1),
('Debut Photography', 'debut-photography', 'photography', 'Full coverage for the 18th birthday program, from prep to the last dance.', 8000, 5, 1),
('Burial Photography', 'burial-photography', 'photography', 'Respectful, discreet documentation for memorial services.', 5000, 6, 1),
('Event Photography', 'event-photography', 'photography', 'General coverage for corporate events, reunions, and gatherings.', 6000, 7, 1),
('Portrait Photography', 'portrait-photography', 'photography', 'Studio or on-location portraits, individual or family.', 3000, 8, 1),
('Photo Booth', 'photo-booth', 'additional', 'An on-site photo booth with instant prints for your guests.', 4000, 9, 1),
('Picture Frames', 'picture-frames', 'additional', 'Custom-printed frames for your favorite shots.', 350, 10, 1),
('Tarpaulin', 'tarpaulin', 'additional', 'Printed tarpaulins for events, streamers, and welcome signage.', 500, 11, 1),
('Invitations', 'invitations', 'additional', 'Designed and printed invitations to match your event.', 15, 12, 1),
('Souvenirs', 'souvenirs', 'additional', 'Printed souvenir items for guests to take home.', 20, 13, 1),
('ID PVC', 'id-pvc', 'additional', 'Durable PVC ID printing.', 150, 14, 1),
('Digital Photo Printing', 'digital-photo-printing', 'additional', 'Standard and large-format photo prints.', 15, 15, 1),
('Photo & Video Coverage', 'photo-video-coverage', 'additional', 'Combined photo and video documentation for any occasion.', 18000, 16, 1);

-- Seed estimator defaults only when that label does not already exist.
INSERT INTO estimator_hours (label, hours, price, active, sort_order)
SELECT defaults.label, defaults.hours, defaults.price, defaults.active, defaults.sort_order
FROM (
  SELECT '2 Hours' label, 2 hours, 5000 price, 1 active, 1 sort_order UNION ALL
  SELECT '4 Hours', 4, 8000, 1, 2 UNION ALL
  SELECT '6 Hours', 6, 12000, 1, 3 UNION ALL
  SELECT '8 Hours', 8, 16000, 1, 4
) AS defaults
WHERE NOT EXISTS (SELECT 1 FROM estimator_hours existing WHERE existing.label = defaults.label);

INSERT INTO estimator_addons (label, description, price, active, sort_order)
SELECT defaults.label, defaults.description, defaults.price, defaults.active, defaults.sort_order
FROM (
  SELECT 'Second Photographer' label, 'An additional shooter for a second angle on every moment.' description, 3000 price, 1 active, 1 sort_order UNION ALL
  SELECT 'Videographer', 'Full video coverage alongside your photographer.', 8000, 1, 2 UNION ALL
  SELECT 'Rush Delivery', 'Edited gallery delivered within 72 hours.', 1500, 1, 3 UNION ALL
  SELECT 'Printed Photo Album', 'A 20-page hardbound album of your favorite shots.', 2500, 1, 4 UNION ALL
  SELECT 'Photo Booth', 'An on-site photo booth with instant prints.', 4000, 1, 5 UNION ALL
  SELECT 'Additional Hour', 'One extra hour of coverage.', 1500, 1, 6 UNION ALL
  SELECT 'Tarpaulin', 'A printed tarpaulin for your event.', 500, 1, 7 UNION ALL
  SELECT 'Equipment Upgrade', 'Additional lighting, lenses, or specialty equipment based on the shoot requirements.', 0, 0, 8
) AS defaults
WHERE NOT EXISTS (SELECT 1 FROM estimator_addons existing WHERE existing.label = defaults.label);

INSERT INTO contact_platforms (label, tagline, handle, link, icon, visible, sort_order)
SELECT defaults.label, defaults.tagline, defaults.handle, defaults.link, defaults.icon, defaults.visible, defaults.sort_order
FROM (
  SELECT 'Instagram' label, 'See what we''re currently obsessed with.' tagline, '@jonathanphotography' handle, 'https://instagram.com/jonathanphotography' link, 'instagram' icon, 1 visible, 1 sort_order UNION ALL
  SELECT 'Facebook', 'For the aunties, relatives, and everyone else.', 'Jonathan Photography', 'https://facebook.com/jonathanphotography', 'facebook', 1, 2 UNION ALL
  SELECT 'Phone / Viber', 'When typing feels like too much work.', '0963-332-7847', 'tel:+639633327847', 'phone', 1, 3 UNION ALL
  SELECT 'Email', 'For the serious stuff. Or the not-so-serious stuff.', 'mereziko@gmail.com', 'mailto:mereziko@gmail.com', 'mail', 1, 4
) AS defaults
WHERE NOT EXISTS (SELECT 1 FROM contact_platforms existing WHERE existing.link = defaults.link);

-- Defaults are inserted only when a setting is absent, never overwritten.
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
('business_name', 'Jonathan Photography'),
('business_tagline', 'Digital Photo + Video Coverage'),
('business_address', '0013 Mc Arthur Hi-way, Brgy. Asan Norte, Sison, Pangasinan'),
('business_phone', '0963-332-7847'),
('business_phone_alt', '0927-776-3101'),
('business_email', 'mereziko@gmail.com'),
('booking_notification_email', 'mereziko@gmail.com'),
('estimator_range_margin', '15'),
('platform_fee_threshold', '10000'),
('platform_fee_low_rate', '0.005'),
('platform_fee_high_rate', '0.01'),
('platform_fee_cycle_start_date', '2026-01-01'),
('platform_fee_due_days', '7'),
('pass_platform_fee_to_client_default', '0');

-- Create the first administrator separately with backend/scripts/create_admin.php.
