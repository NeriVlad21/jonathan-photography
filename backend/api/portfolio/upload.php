<?php
/**
 * POST /api/portfolio/upload.php  (multipart/form-data)
 * Fields: image (file, required), shoot_id (required), title, caption
 *
 * Admin-only. Uploads the file via the secure upload helper, then
 * creates the matching portfolio_images row in one step so the
 * gallery is unlimited and fully database-driven, per spec.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/upload.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$pdo = Database::connect();

$shootId = (int) ($_POST['shoot_id'] ?? 0);
if (!$shootId) {
    json_error('Missing shoot_id.', 422);
}

$shootCheck = $pdo->prepare('SELECT id FROM portfolio_shoots WHERE id = :id');
$shootCheck->execute(['id' => $shootId]);
if (!$shootCheck->fetch()) {
    json_error('That shoot does not exist.', 404);
}

if (empty($_FILES['image'])) {
    json_error('Please attach an image.', 422);
}

try {
    $uploaded = handle_image_upload($_FILES['image'], 'shoot-' . $shootId);
} catch (UploadException $e) {
    json_error($e->getMessage(), 422);
}

$orderStmt = $pdo->prepare('SELECT COALESCE(MAX(sort_order), 0) FROM portfolio_images WHERE shoot_id = :sid');
$orderStmt->execute(['sid' => $shootId]);
$nextOrder = (int) $orderStmt->fetchColumn() + 1;

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM portfolio_images WHERE shoot_id = :sid');
$countStmt->execute(['sid' => $shootId]);
$isFirstImage = (int) $countStmt->fetchColumn() === 0;

$stmt = $pdo->prepare(
    'INSERT INTO portfolio_images (shoot_id, image_path, title, caption, sort_order, is_cover, visible)
     VALUES (:sid, :path, :title, :caption, :sort, :cover, 1)'
);
$stmt->execute([
    'sid'     => $shootId,
    'path'    => $uploaded['public_url'],
    'title'   => clean_string($_POST['title'] ?? ''),
    'caption' => clean_string($_POST['caption'] ?? ''),
    'sort'    => $nextOrder,
    'cover'   => $isFirstImage ? 1 : 0,
]);

$imageId = (int) $pdo->lastInsertId();

if ($isFirstImage) {
    $pdo->prepare('UPDATE portfolio_shoots SET cover_image_id = :img WHERE id = :sid')
        ->execute(['img' => $imageId, 'sid' => $shootId]);
}

$row = $pdo->prepare('SELECT * FROM portfolio_images WHERE id = :id');
$row->execute(['id' => $imageId]);
json_success($row->fetch(), 201);
