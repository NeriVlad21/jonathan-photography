<?php
/**
 * GET /api/estimator/config.php          — public: active hours + add-ons + visible services
 * GET /api/estimator/config.php?all=1    — admin: everything, including inactive (for settings screen)
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

$hoursSql = 'SELECT * FROM estimator_hours' . ($all ? '' : ' WHERE active = 1') . ' ORDER BY sort_order ASC, id ASC';
$addonsSql = 'SELECT * FROM estimator_addons' . ($all ? '' : ' WHERE active = 1') . ' ORDER BY sort_order ASC, id ASC';
$servicesSql = 'SELECT id, name, slug, category FROM services' . ($all ? '' : ' WHERE visible = 1') . ' ORDER BY category ASC, sort_order ASC';

json_success([
    'hours'    => $pdo->query($hoursSql)->fetchAll(),
    'addons'   => $pdo->query($addonsSql)->fetchAll(),
    'services' => $pdo->query($servicesSql)->fetchAll(),
]);
