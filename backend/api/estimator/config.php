<?php
/**
 * GET /api/estimator/config.php
 * Public: active hours + add-ons + visible services + range margin
 *
 * GET /api/estimator/config.php?all=1
 * Admin: everything, including inactive items
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/services.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed.', 405);
}

$pdo = Database::connect();
$all = isset($_GET['all']);

if ($all) {
    require_admin();
}

$hoursSql =
    'SELECT * FROM estimator_hours' .
    ($all ? '' : ' WHERE active = 1') .
    ' ORDER BY sort_order ASC, id ASC';

$addonsSql =
    'SELECT * FROM estimator_addons' .
    ($all ? '' : ' WHERE active = 1') .
    ' ORDER BY sort_order ASC, id ASC';

// Same columns and shape as /api/services/list.php — one source of truth.
$servicesSql =
    'SELECT ' . SERVICE_COLUMNS . ' FROM services' .
    ($all ? '' : ' WHERE visible = 1') .
    ' ORDER BY category ASC, sort_order ASC, id ASC';

$hours = $pdo
    ->query($hoursSql)
    ->fetchAll(PDO::FETCH_ASSOC);

$addons = $pdo
    ->query($addonsSql)
    ->fetchAll(PDO::FETCH_ASSOC);

$services = array_map('present_service', $pdo
    ->query($servicesSql)
    ->fetchAll(PDO::FETCH_ASSOC));

foreach ($hours as &$hour) {
    $hour['id'] = (int) $hour['id'];
    $hour['hours'] = (float) $hour['hours'];
    $hour['price'] = (float) $hour['price'];
}
unset($hour);

// Safely cast addon variables for the frontend
foreach ($addons as &$addon) {
    $addon['id'] = (int) $addon['id'];
    $addon['price'] = (float) $addon['price'];
    $addon['is_quantity_based'] = !empty($addon['is_quantity_based']) ? 1 : 0;
}
unset($addon);

json_success([
    'hours' => $hours,
    'addons' => $addons,
    'services' => $services,
    'range_margin' => read_estimator_margin($pdo),
]);
