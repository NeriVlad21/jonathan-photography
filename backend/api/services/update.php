<?php
/**
 * PUT /api/services/update.php
 * Body: { id, ...any of name, category, description, starting_price, visible,
 *         sort_order, inclusions, coverage_details, deliverables, package_options, notes }
 * Fields that are omitted keep their saved value, so a quick price or
 * visibility change from Estimator settings never wipes the package details.
 * Admin only.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/services.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$input = json_input();
$id = positive_id($input['id'] ?? null);
if ($id < 1) json_error('A valid service id is required.', 422, ['id' => 'Missing or invalid service id.']);

[$clean, $errors] = normalize_service_input($input, false);
if ($errors) json_error('Please fix the errors below.', 422, $errors);

$pdo = Database::connect();
$pdo->beginTransaction();

try {
    $existing = $pdo->prepare('SELECT ' . SERVICE_COLUMNS . ' FROM services WHERE id = :id FOR UPDATE');
    $existing->execute(['id' => $id]);
    if (!$existing->fetch(PDO::FETCH_ASSOC)) {
        $pdo->rollBack();
        json_error('Service not found.', 404);
    }

    if ($clean) {
        // Column names come from the fixed allow-list in normalize_service_input().
        $sets = [];
        $params = ['id' => $id];
        foreach ($clean as $column => $value) {
            $sets[] = "{$column} = :{$column}";
            $params[$column] = $value;
        }
        $pdo->prepare('UPDATE services SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
    }

    $row = $pdo->prepare('SELECT ' . SERVICE_COLUMNS . ' FROM services WHERE id = :id');
    $row->execute(['id' => $id]);
    $service = $row->fetch(PDO::FETCH_ASSOC);
    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    log_server_error('SERVICE_UPDATE', $e);
    json_error('Unable to save the service. Please try again.', 500);
}

json_success(present_service($service));
