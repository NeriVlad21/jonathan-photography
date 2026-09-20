<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/upload.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed.', 405);
require_admin();
require_csrf();
if (empty($_FILES['image'])) json_error('Please attach an image.', 422);

try {
    $uploaded = handle_image_upload($_FILES['image'], 'site-content');
    json_success(['path' => $uploaded['public_url']], 201);
} catch (UploadException $e) {
    json_error($e->getMessage(), 422);
}
