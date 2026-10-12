<?php
/**
 * GET /api/bookings/list.php
 * Admin only. Supports status, broad booking search, and timeframe filters.
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
    if (!in_array($_GET['status'], ['NEW', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], true)) {
        json_error('Invalid booking status.', 422);
    }
    $where[] = 'b.status = :status';
    $params['status'] = $_GET['status'];
}

// Filter by client, reference, service type, or event date.
if (!empty($_GET['search'])) {
    if (mb_strlen((string) $_GET['search']) > 100) {
        json_error('Search text is too long.', 422);
    }
    // Native prepares cannot safely reuse one named placeholder.
    $needle = '%' . trim((string) $_GET['search']) . '%';
    $where[] = '(b.name LIKE :search_name
        OR b.email LIKE :search_email
        OR b.reference_code LIKE :search_reference
        OR b.shoot_type LIKE :search_service
        OR DATE_FORMAT(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(b.agreed_details,\'$.date\')), b.preferred_date), \'%Y-%m-%d\') LIKE :search_date)';
    $params['search_name'] = $needle;
    $params['search_email'] = $needle;
    $params['search_reference'] = $needle;
    $params['search_service'] = $needle;
    $params['search_date'] = $needle;
}

// Filter by Timeframe (Archive / Date Range)
if (!empty($_GET['timeframe']) && $_GET['timeframe'] !== 'all') {
    $timeframe = $_GET['timeframe'];
    if ($timeframe === 'today') {
        $where[] = 'b.created_at >= CURDATE()';
    } elseif ($timeframe === 'last_week') {
        $where[] = 'b.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
    } elseif ($timeframe === 'last_month') {
        $where[] = 'b.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    } elseif ($timeframe === 'last_3_months') {
        $where[] = 'b.created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
    } elseif ($timeframe === 'last_quarter') {
        $where[] = 'b.created_at >= DATE_SUB(NOW(), INTERVAL 1 QUARTER)';
    } elseif ($timeframe === 'last_year') {
        $where[] = 'b.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
    }
}

$sql = "SELECT b.id,b.reference_code,b.name,b.email,b.phone,b.shoot_type,b.preferred_date,b.preferred_time,b.location,b.estimate_total,b.status,b.created_at,
        CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(b.agreed_details,'$.client_total')),JSON_UNQUOTE(JSON_EXTRACT(b.agreed_details,'$.total'))) AS DECIMAL(10,2)) agreed_total,
        JSON_UNQUOTE(JSON_EXTRACT(b.agreed_details,'$.date')) agreed_date,
        COALESCE(p.total_paid,0) total_paid,
        GREATEST(COALESCE(CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(b.agreed_details,'$.client_total')),JSON_UNQUOTE(JSON_EXTRACT(b.agreed_details,'$.total'))) AS DECIMAL(10,2)),0)-COALESCE(p.total_paid,0),0) balance_due,
        (SELECT sent_at FROM invoices i WHERE i.booking_id=b.id AND i.voided_at IS NULL ORDER BY i.id DESC LIMIT 1) latest_invoice_sent_at
        FROM bookings b LEFT JOIN (SELECT booking_id,SUM(amount) total_paid FROM booking_payments GROUP BY booking_id) p ON p.booking_id=b.id";

if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY b.created_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
json_success($stmt->fetchAll());
