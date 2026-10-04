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
    $v->required('label')->string('label', 'Label')->required('price')->maxLength('label', 120)
      ->string('description', 'Description')->maxLength('description', 255)->boolean('is_quantity_based');
    if ($v->fails()) json_error('Please fill in every field.', 422, $v->errors());
    $price = money_input($input['price']);
    if ($price === null) json_error('Price must be a number from 0 to 9,999,999.99.', 422, ['price' => 'Invalid price.']);

    $maxOrder = (int) $pdo->query('SELECT COALESCE(MAX(sort_order),0) FROM estimator_addons')->fetchColumn();
    $stmt = $pdo->prepare('INSERT INTO estimator_addons (label, description, price, active, sort_order, is_quantity_based) VALUES (:l, :d, :p, 1, :s, :q)');
    $stmt->execute([
        'l' => clean_string($input['label']),
        'd' => clean_string($input['description'] ?? ''),
        'p' => $price,
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
    $v->required('id')->positiveInteger('id', 'add-on id')
      ->required('label')->string('label', 'Label')->required('price')->maxLength('label', 120)
      ->string('description', 'Description')->maxLength('description', 255)
      ->boolean('active')->boolean('is_quantity_based')->integer('sort_order', -100000, 100000);
    if ($v->fails()) json_error('Please fix the errors below.', 422, $v->errors());
    $price = money_input($input['price']);
    if ($price === null) json_error('Price must be a number from 0 to 9,999,999.99.', 422, ['price' => 'Invalid price.']);

    $stmt = $pdo->prepare(
        'UPDATE estimator_addons SET label = :l, description = :d, price = :p, active = :a, sort_order = :s, is_quantity_based = :q WHERE id = :id'
    );
    $stmt->execute([
        'l' => clean_string($input['label']),
        'd' => clean_string($input['description'] ?? ''),
        'p' => $price,
        'a' => boolean_input($input['active'] ?? true),
        's' => (int) ($input['sort_order'] ?? 0),
        'q' => boolean_input($input['is_quantity_based'] ?? false),
        'id' => positive_integer_input($input['id']),
    ]);
    $row = $pdo->prepare('SELECT * FROM estimator_addons WHERE id = :id');
    $row->execute(['id' => positive_integer_input($input['id'])]);
    $addon = $row->fetch();
    if (!$addon) json_error('Add-on not found.', 404);
    json_success($addon);
}

if ($method === 'DELETE') {
    require_csrf();
    $id = positive_integer_input($_GET['id'] ?? null);
    if (!$id) json_error('Missing id.', 422);
    $stmt = $pdo->prepare('DELETE FROM estimator_addons WHERE id = :id');
    $stmt->execute(['id' => $id]);
    if ($stmt->rowCount() < 1) json_error('Add-on not found.', 404);
    json_success(['deleted' => true]);
}

json_error('Method not allowed.', 405);
