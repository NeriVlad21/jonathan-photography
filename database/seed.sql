-- ============================================================
-- JONATHAN PHOTOGRAPHY — DEMO / DEVELOPMENT SEED DATA
-- Safe to import repeatedly through phpMyAdmin.
--
-- Why this version is different from the last one:
--   TRUNCATE requires zero references to the table, even
--   temporarily — MySQL/MariaDB won't let you TRUNCATE
--   `bookings` while `booking_addons.booking_id` points at it,
--   which is the #1701 error you hit. The fix is to DELETE
--   (not TRUNCATE) in strict child-before-parent order, so no
--   foreign key is ever violated and FOREIGN_KEY_CHECKS never
--   needs to be touched.
--
--   There's a second, less obvious cycle in this schema:
--   portfolio_shoots.cover_image_id -> portfolio_images.id
--   portfolio_images.shoot_id       -> portfolio_shoots.id
--   Deleting either table first would fail against the other,
--   so cover_image_id is nulled out before portfolio_images is
--   cleared, breaking the cycle without disabling any checks.
--
-- Run after schema.sql. Every table is fully reset and
-- re-seeded on each run, so re-importing this file can never
-- produce duplicate rows.
-- ============================================================

USE jonathan_photography;

-- ------------------------------------------------------------
-- STEP 1 — clear existing data, children before parents
-- ------------------------------------------------------------

-- booking_addons is a child of bookings -> delete first
DELETE FROM booking_addons;
ALTER TABLE booking_addons AUTO_INCREMENT = 1;

-- now bookings has no remaining references against it
DELETE FROM bookings;
ALTER TABLE bookings AUTO_INCREMENT = 1;

-- no FK points at estimator_leads
DELETE FROM estimator_leads;
ALTER TABLE estimator_leads AUTO_INCREMENT = 1;

-- break the shoots <-> images cycle before touching either table
UPDATE portfolio_shoots SET cover_image_id = NULL;

-- portfolio_images is a child of portfolio_shoots -> delete first
DELETE FROM portfolio_images;
ALTER TABLE portfolio_images AUTO_INCREMENT = 1;

-- portfolio_shoots is a child of portfolio_categories -> delete next
DELETE FROM portfolio_shoots;
ALTER TABLE portfolio_shoots AUTO_INCREMENT = 1;

-- now safe: nothing references portfolio_categories anymore
DELETE FROM portfolio_categories;
ALTER TABLE portfolio_categories AUTO_INCREMENT = 1;

-- remaining tables have no incoming foreign keys at all
DELETE FROM services;
ALTER TABLE services AUTO_INCREMENT = 1;

DELETE FROM estimator_hours;
ALTER TABLE estimator_hours AUTO_INCREMENT = 1;

DELETE FROM estimator_addons;
ALTER TABLE estimator_addons AUTO_INCREMENT = 1;

DELETE FROM contact_platforms;
ALTER TABLE contact_platforms AUTO_INCREMENT = 1;

DELETE FROM admins;
ALTER TABLE admins AUTO_INCREMENT = 1;

DELETE FROM site_settings;

-- ------------------------------------------------------------
-- STEP 2 — re-seed, parents before children
-- ------------------------------------------------------------

-- Default admin: username "admin" / password "admin123"
-- CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN.
INSERT INTO admins (id, username, email, password_hash) VALUES
(1, 'admin', 'studio@jonathanphotography.com', '$2b$10$pQilqgGxmNxOSdsUTmAiTOUHHYidu6JvacMg.FUWwkLm8C/IG8wIi');

-- ------------------------------------------------------------
-- Portfolio categories
-- ------------------------------------------------------------
INSERT INTO portfolio_categories (id, name, slug, description, cover_image, sort_order, visible) VALUES
(1, 'Weddings', 'weddings', 'For the moments that only happen once.', '/uploads/portfolio/demo/wedding-cover.jpg', 1, 1),
(2, 'Engagement', 'engagement', 'The quiet before the big yes, in full colour.', '/uploads/portfolio/demo/engagement-cover.jpg', 2, 1),
(3, 'Portraits', 'portraits', 'One face, studied properly.', '/uploads/portfolio/demo/portrait-cover.jpg', 3, 1),
(4, 'Events', 'events', 'Rooms full of people who will want proof they were there.', '/uploads/portfolio/demo/event-cover.jpg', 4, 1);

-- ------------------------------------------------------------
-- Portfolio shoots
-- ------------------------------------------------------------
INSERT INTO portfolio_shoots (id, category_id, title, slug, description, location, shoot_date, sort_order, visible) VALUES
(1, 1, 'John & Maria', 'john-and-maria', 'A full-day wedding coverage from preparation to reception, shot on location in San Carlos City.', 'San Carlos City, Pangasinan', '2026-06-14', 1, 1),
(2, 2, 'Mika & D', 'mika-and-d', 'A golden-hour engagement session at the coast.', 'Bolinao, Pangasinan', '2026-03-02', 1, 1),
(3, 3, 'Studio Sessions Vol. 1', 'studio-sessions-vol-1', 'A set of controlled-light studio portraits.', 'Jonathan Photography Studio', '2026-01-20', 1, 1),
(4, 4, 'Debut — Ysabel Turns 18', 'debut-ysabel-turns-18', 'Full event coverage of an 18th birthday celebration.', 'Sison, Pangasinan', '2025-11-08', 1, 1);

-- ------------------------------------------------------------
-- Portfolio images (demo placeholders — replace via Admin)
-- ------------------------------------------------------------
INSERT INTO portfolio_images (id, shoot_id, image_path, title, caption, sort_order, is_cover, visible) VALUES
(1, 1, '/uploads/portfolio/demo/wedding-01.jpg', 'First Look', 'The first look, seconds before either of them could speak.', 1, 1, 1),
(2, 1, '/uploads/portfolio/demo/wedding-02.jpg', 'The Vows', NULL, 2, 0, 1),
(3, 1, '/uploads/portfolio/demo/wedding-03.jpg', 'Reception', NULL, 3, 0, 1),
(4, 2, '/uploads/portfolio/demo/engagement-01.jpg', 'Coastline', NULL, 1, 1, 1),
(5, 2, '/uploads/portfolio/demo/engagement-02.jpg', 'Golden Hour', NULL, 2, 0, 1),
(6, 3, '/uploads/portfolio/demo/portrait-01.jpg', 'Portrait Study I', NULL, 1, 1, 1),
(7, 3, '/uploads/portfolio/demo/portrait-02.jpg', 'Portrait Study II', NULL, 2, 0, 1),
(8, 4, '/uploads/portfolio/demo/event-01.jpg', 'Grand Entrance', NULL, 1, 1, 1),
(9, 4, '/uploads/portfolio/demo/event-02.jpg', 'The Program', NULL, 2, 0, 1);

-- re-link each shoot to its cover image now that both tables exist
UPDATE portfolio_shoots SET cover_image_id = 1 WHERE id = 1;
UPDATE portfolio_shoots SET cover_image_id = 4 WHERE id = 2;
UPDATE portfolio_shoots SET cover_image_id = 6 WHERE id = 3;
UPDATE portfolio_shoots SET cover_image_id = 8 WHERE id = 4;

-- ------------------------------------------------------------
-- Services
-- ------------------------------------------------------------
INSERT INTO services (name, slug, category, description, starting_price, sort_order, visible) VALUES
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

-- ------------------------------------------------------------
-- Estimator coverage hours
-- ------------------------------------------------------------
INSERT INTO estimator_hours (label, hours, price, active, sort_order) VALUES
('2 Hours', 2, 5000, 1, 1),
('4 Hours', 4, 8000, 1, 2),
('6 Hours', 6, 12000, 1, 3),
('8 Hours', 8, 16000, 1, 4);

-- ------------------------------------------------------------
-- Estimator add-ons
-- ------------------------------------------------------------
INSERT INTO estimator_addons (label, description, price, active, sort_order) VALUES
('Second Photographer', 'An additional shooter for a second angle on every moment.', 3000, 1, 1),
('Videographer', 'Full video coverage alongside your photographer.', 8000, 1, 2),
('Rush Delivery', 'Edited gallery delivered within 72 hours.', 1500, 1, 3),
('Printed Photo Album', 'A 20-page hardbound album of your favorite shots.', 2500, 1, 4),
('Photo Booth', 'An on-site photo booth with instant prints.', 4000, 1, 5),
('Additional Hour', 'One extra hour of coverage.', 1500, 1, 6),
('Tarpaulin', 'A printed tarpaulin for your event.', 500, 1, 7);

-- ------------------------------------------------------------
-- Contact platforms
-- ------------------------------------------------------------
INSERT INTO contact_platforms (label, tagline, handle, link, icon, visible, sort_order) VALUES
('Instagram', 'See what we''re currently obsessed with.', '@jonathanphotography', 'https://instagram.com/jonathanphotography', 'instagram', 1, 1),
('Facebook', 'For the aunties, relatives, and everyone else.', 'Jonathan Photography', 'https://facebook.com/jonathanphotography', 'facebook', 1, 2),
('Phone / Viber', 'When typing feels like too much work.', '0963-332-7847', 'tel:+639633327847', 'phone', 1, 3),
('Email', 'For the serious stuff. Or the not-so-serious stuff.', 'studio@jonathanphotography.com', 'mailto:studio@jonathanphotography.com', 'mail', 1, 4);

-- ------------------------------------------------------------
-- Site settings
-- ------------------------------------------------------------
INSERT INTO site_settings (setting_key, setting_value) VALUES
('business_name', 'Jonathan Photography'),
('business_tagline', 'Digital Photo & Video Coverage'),
('business_address', '0013 Mc Arthur Hi-way, Brgy. Asan Norte, Sison, Pangasinan'),
('business_phone', '0963-332-7847'),
('business_phone_alt', '0927-776-3101'),
('business_email', 'studio@jonathanphotography.com');