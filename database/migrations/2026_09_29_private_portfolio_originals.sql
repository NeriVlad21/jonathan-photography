-- Retain full-resolution portfolio sources outside the public asset tree.
-- Public APIs expose image_path only; original_path is admin/private metadata.
ALTER TABLE portfolio_images
  ADD COLUMN IF NOT EXISTS original_path VARCHAR(255) NULL AFTER image_path;
