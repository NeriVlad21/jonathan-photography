<?php
/**
 * GET /api/services/list.php            — public, visible services only
 * GET /api/services/list.php?all=1      — admin, every service
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

if (isset($_GET['all'])) {
    require_admin();
    $stmt = $pdo->query('SELECT * FROM services ORDER BY category ASC, sort_order ASC, id ASC');
} else {
    $stmt = $pdo->query('SELECT * FROM services WHERE visible = 1 ORDER BY category ASC, sort_order ASC, id ASC');
}

json_success($stmt->fetchAll());
