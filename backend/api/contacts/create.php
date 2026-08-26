<?php
/**
 * POST /api/contacts/create.php
 * Body: { label, tagline, handle, link, icon }
 * Admin only.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$pdo = Database::connect();
$input = json_input();

$v = new Validator($input);
$v->required('label', 'a platform name')->required('link', 'a link or contact value');
if ($v->fails()) json_error('Please fix the errors below.', 422, $v->errors());

$maxOrder = (int) $pdo->query('SELECT COALESCE(MAX(sort_order),0) FROM contact_platforms')->fetchColumn();

$stmt = $pdo->prepare(
    'INSERT INTO contact_platforms (label, tagline, handle, link, icon, sort_order, visible)
     VALUES (:label, :tagline, :handle, :link, :icon, :sort, 1)'
);
$stmt->execute([
    'label'   => clean_string($input['label']),
    'tagline' => clean_string($input['tagline'] ?? ''),
    'handle'  => clean_string($input['handle'] ?? ''),
    'link'    => clean_string($input['link']),
    'icon'    => clean_string($input['icon'] ?? 'link'),
    'sort'    => $maxOrder + 1,
]);

$id = (int) $pdo->lastInsertId();
$row = $pdo->prepare('SELECT * FROM contact_platforms WHERE id = :id');
$row->execute(['id' => $id]);
json_success($row->fetch(), 201);
