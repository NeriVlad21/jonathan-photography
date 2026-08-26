<?php
/**
 * GET /api/bookings/list.php
 * Admin only. Supports ?status=NEW and ?search=name-or-email
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

if (!empty($_GET['status'])) {
    $where[] = 'status = :status';
    $params['status'] = $_GET['status'];
}
if (!empty($_GET['search'])) {
    $where[] = '(name LIKE :search OR email LIKE :search)';
    $params['search'] = '%' . $_GET['search'] . '%';
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
