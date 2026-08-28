<?php
/**
 * GET /api/bookings/list.php
 * Admin only. Supports ?status=NEW, ?search=name-or-email, and ?timeframe=date-range
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed.', 405);
}

require_admin();
$pdo = Database::connect();

$where = [];
$params = [];

// Filter by Status
if (!empty($_GET['status'])) {
    $where[] = 'status = :status';
    $params['status'] = $_GET['status'];
}

// Filter by Search (Name or Email)
if (!empty($_GET['search'])) {
    $where[] = '(name LIKE :search OR email LIKE :search)';
    $params['search'] = '%' . $_GET['search'] . '%';
}

// Filter by Timeframe (Archive / Date Range)
if (!empty($_GET['timeframe']) && $_GET['timeframe'] !== 'all') {
    $timeframe = $_GET['timeframe'];
    if ($timeframe === 'today') {
        $where[] = 'created_at >= CURDATE()';
    } elseif ($timeframe === 'last_week') {
        $where[] = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    } elseif ($timeframe === 'last_month') {
        $where[] = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    } elseif ($timeframe === 'last_3_months') {
        $where[] = 'created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
    } elseif ($timeframe === 'last_quarter') {
        $where[] = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 QUARTER)';
    } elseif ($timeframe === 'last_year') {
        $where[] = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    }
}

$sql = 'SELECT id, reference_code, name, email, phone, shoot_type, preferred_date, location, estimate_total, status, created_at
        FROM bookings';

if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY created_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
json_success($stmt->fetchAll());