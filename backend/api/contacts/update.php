<?php
/**
 * PUT /api/contacts/update.php
 * Body: { id, label, tagline, handle, link, icon, visible, sort_order }
 * Admin only.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$pdo = Database::connect();
$input = json_input();

$v = new Validator($input);
$v->required('id')->required('label')->required('link');
if ($v->fails()) json_error('Please fix the errors below.', 422, $v->errors());

$stmt = $pdo->prepare(
    'UPDATE contact_platforms
     SET label = :label, tagline = :tagline, handle = :handle, link = :link,
         icon = :icon, visible = :visible, sort_order = :sort
     WHERE id = :id'
);
$stmt->execute([
    'label'   => clean_string($input['label']),
    'tagline' => clean_string($input['tagline'] ?? ''),
    'handle'  => clean_string($input['handle'] ?? ''),
    'link'    => clean_string($input['link']),
    'icon'    => clean_string($input['icon'] ?? 'link'),
    'visible' => !empty($input['visible']) ? 1 : 0,
    'sort'    => (int) ($input['sort_order'] ?? 0),
    'id'      => (int) $input['id'],
]);

$row = $pdo->prepare('SELECT * FROM contact_platforms WHERE id = :id');
$row->execute(['id' => (int) $input['id']]);
$platform = $row->fetch();
if (!$platform) json_error('Contact platform not found.', 404);
json_success($platform);
