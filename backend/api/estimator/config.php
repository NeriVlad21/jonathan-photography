<?php
/**
 * GET /api/estimator/config.php
 * Public: active hours + add-ons + visible services
 *
 * GET /api/estimator/config.php?all=1
 * Admin: everything, including inactive items
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
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

$servicesSql =
    'SELECT
        id,
        name,
        slug,
        category,
        description,
        starting_price,
        visible,
        sort_order
     FROM services' .
    ($all ? '' : ' WHERE visible = 1') .
    ' ORDER BY category ASC, sort_order ASC';

$hours = $pdo
    ->query($hoursSql)
    ->fetchAll(PDO::FETCH_ASSOC);

$addons = $pdo
    ->query($addonsSql)
    ->fetchAll(PDO::FETCH_ASSOC);

$services = $pdo
    ->query($servicesSql)
    ->fetchAll(PDO::FETCH_ASSOC);

foreach ($services as &$service) {
    $service['id'] = (int) $service['id'];
    $service['starting_price'] = $service['starting_price'] !== null
        ? (float) $service['starting_price']
        : 0;
}

unset($service);

json_success([
    'hours' => $hours,
    'addons' => $addons,
    'services' => $services,
]);