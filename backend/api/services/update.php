<?php
/**
 * PUT /api/services/update.php
 * Body: { id, name, category, description, starting_price, visible, sort_order }
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
$v->required('id')->required('name', 'a service name');
if ($v->fails()) json_error('Please fix the errors below.', 422, $v->errors());

$stmt = $pdo->prepare(
    'UPDATE services
     SET name = :name, category = :cat, description = :desc, starting_price = :price,
         visible = :visible, sort_order = :sort
     WHERE id = :id'
);
$stmt->execute([
    'name'    => clean_string($input['name']),
    'cat'     => clean_string($input['category'] ?? 'photography'),
    'desc'    => clean_string($input['description'] ?? ''),
    'price'   => isset($input['starting_price']) && $input['starting_price'] !== '' ? (float) $input['starting_price'] : null,
    'visible' => !empty($input['visible']) ? 1 : 0,
    'sort'    => (int) ($input['sort_order'] ?? 0),
    'id'      => (int) $input['id'],
]);

$row = $pdo->prepare('SELECT * FROM services WHERE id = :id');
$row->execute(['id' => (int) $input['id']]);
$service = $row->fetch();
if (!$service) json_error('Service not found.', 404);
json_success($service);
