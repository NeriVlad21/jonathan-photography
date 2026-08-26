<?php
/**
 * POST /api/services/create.php
 * Body: { name, category, description, starting_price }
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
$v->required('name', 'a service name')->maxLength('name', 160);
if ($v->fails()) json_error('Please fix the errors below.', 422, $v->errors());

$name = clean_string($input['name']);
$slugBase = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $name), '-'));
$slug = $slugBase !== '' ? $slugBase : 'service-' . bin2hex(random_bytes(3));
$i = 1;
$check = $pdo->prepare('SELECT COUNT(*) FROM services WHERE slug = :s');
do {
    $check->execute(['s' => $slug]);
    if ((int) $check->fetchColumn() === 0) break;
    $slug = $slugBase . '-' . (++$i);
} while (true);

$maxOrder = (int) $pdo->query('SELECT COALESCE(MAX(sort_order),0) FROM services')->fetchColumn();

$stmt = $pdo->prepare(
    'INSERT INTO services (name, slug, category, description, starting_price, sort_order, visible)
     VALUES (:name, :slug, :cat, :desc, :price, :sort, 1)'
);
$stmt->execute([
    'name'  => $name,
    'slug'  => $slug,
    'cat'   => clean_string($input['category'] ?? 'photography'),
    'desc'  => clean_string($input['description'] ?? ''),
    'price' => isset($input['starting_price']) && $input['starting_price'] !== '' ? (float) $input['starting_price'] : null,
    'sort'  => $maxOrder + 1,
]);

$id = (int) $pdo->lastInsertId();
$row = $pdo->prepare('SELECT * FROM services WHERE id = :id');
$row->execute(['id' => $id]);
json_success($row->fetch(), 201);
