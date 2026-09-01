<?php
/**
 * Admin CRUD for estimator add-ons.
 * POST   { label, description, price, is_quantity_based }
 * PUT    { id, label, description, price, active, sort_order, is_quantity_based }
 * DELETE ?id=1
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_admin();
$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    require_csrf();
    $input = json_input();
    $v = new Validator($input);
    $v->required('label')->required('price');
    if ($v->fails()) json_error('Please fill in every field.', 422, $v->errors());

    $maxOrder = (int) $pdo->query('SELECT COALESCE(MAX(sort_order),0) FROM estimator_addons')->fetchColumn();
    $stmt = $pdo->prepare('INSERT INTO estimator_addons (label, description, price, active, sort_order, is_quantity_based) VALUES (:l, :d, :p, 1, :s, :q)');
    $stmt->execute([
        'l' => clean_string($input['label']),
        'd' => clean_string($input['description'] ?? ''),
        'p' => (float) $input['price'],
        's' => $maxOrder + 1,
        'q' => !empty($input['is_quantity_based']) ? 1 : 0,
    ]);
    $id = (int) $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM estimator_addons WHERE id = :id');
    $row->execute(['id' => $id]);
    json_success($row->fetch(), 201);
}

if ($method === 'PUT') {
    require_csrf();
    $input = json_input();
    $v = new Validator($input);
    $v->required('id')->required('label');
    if ($v->fails()) json_error('Please fix the errors below.', 422, $v->errors());

    $stmt = $pdo->prepare(
        'UPDATE estimator_addons SET label = :l, description = :d, price = :p, active = :a, sort_order = :s, is_quantity_based = :q WHERE id = :id'
    );
    $stmt->execute([
        'l' => clean_string($input['label']),
        'd' => clean_string($input['description'] ?? ''),
        'p' => (float) $input['price'],
        'a' => !empty($input['active']) ? 1 : 0,
        's' => (int) ($input['sort_order'] ?? 0),
        'q' => !empty($input['is_quantity_based']) ? 1 : 0,
        'id' => (int) $input['id'],
    ]);
    $row = $pdo->prepare('SELECT * FROM estimator_addons WHERE id = :id');
    $row->execute(['id' => (int) $input['id']]);
    $addon = $row->fetch();
    if (!$addon) json_error('Add-on not found.', 404);
    json_success($addon);
}

if ($method === 'DELETE') {
    require_csrf();
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) json_error('Missing id.', 422);
    $pdo->prepare('DELETE FROM estimator_addons WHERE id = :id')->execute(['id' => $id]);
    json_success(['deleted' => true]);
}

json_error('Method not allowed.', 405);