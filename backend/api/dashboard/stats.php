<?php
/**
 * GET /api/dashboard/stats.php
 * Admin only. Overview cards + recent activity feed + chart data (with timeframe filter).
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

// Get timeframe from query params
$timeframe = $_GET['timeframe'] ?? 'all';
$timeCondition = '1=1';

// Apply Date Filters
if ($timeframe === 'today') {
    $timeCondition = 'created_at >= CURDATE()';
} elseif ($timeframe === 'last_week') {
    $timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
} elseif ($timeframe === 'last_month') {
    $timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
} elseif ($timeframe === 'last_3_months') {
    $timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)';
} elseif ($timeframe === 'last_quarter') {
    $timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 QUARTER)';
} elseif ($timeframe === 'last_year') {
    $timeCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
}

// 1. Fetch Stat Cards
$totalBookings = (int) $pdo->query("SELECT COUNT(*) FROM bookings WHERE $timeCondition")->fetchColumn();
$newBookings = (int) $pdo->query("SELECT COUNT(*) FROM bookings WHERE $timeCondition AND status = 'NEW'")->fetchColumn();
$estimatorUses = (int) $pdo->query("SELECT COUNT(*) FROM estimator_leads WHERE $timeCondition")->fetchColumn();
$avgEstimate = (float) $pdo->query("SELECT COALESCE(AVG(total),0) FROM estimator_leads WHERE $timeCondition")->fetchColumn();

// Conversion Rate
$lCondition = str_replace('created_at', 'l.created_at', $timeCondition);
$bookedLeads = (int) $pdo->query(
    "SELECT COUNT(*) FROM estimator_leads l WHERE $lCondition AND EXISTS (SELECT 1 FROM bookings b WHERE b.email = l.email)"
)->fetchColumn();
$conversionRate = $estimatorUses > 0 ? round(($bookedLeads / $estimatorUses) * 100, 1) : 0.0;

// 2. Fetch and format Chart Data
$bDates = $pdo->query("SELECT created_at FROM bookings WHERE $timeCondition")->fetchAll(PDO::FETCH_COLUMN);
$lDates = $pdo->query("SELECT created_at FROM estimator_leads WHERE $timeCondition")->fetchAll(PDO::FETCH_COLUMN);

$buckets = [];
$format = ($timeframe === 'last_year' || $timeframe === 'all' || $timeframe === 'last_quarter' || $timeframe === 'last_3_months') ? 'Y-m' : 'Y-m-d';
if ($timeframe === 'today') $format = 'Y-m-d H:00:00';

foreach($lDates as $d) {
    $k = date($format, strtotime($d));
    if(!isset($buckets[$k])) $buckets[$k] = ['leads'=>0, 'bookings'=>0];
    $buckets[$k]['leads']++;
}
foreach($bDates as $d) {
    $k = date($format, strtotime($d));
    if(!isset($buckets[$k])) $buckets[$k] = ['leads'=>0, 'bookings'=>0];
    $buckets[$k]['bookings']++;
}

ksort($buckets); // Sort dates chronologically
$chartData = [];
foreach($buckets as $k => $v) {
    $displayFormat = ($format === 'Y-m') ? 'M Y' : (($format === 'Y-m-d') ? 'M j' : 'g A');
    $chartData[] = [
        'name' => date($displayFormat, strtotime($k)),
        'leads' => $v['leads'],
        'bookings' => $v['bookings']
    ];
}

// 3. Fetch Recent Activity Feed
$recentBookings = $pdo->query(
    "SELECT id, name, shoot_type, status, created_at, 'booking' AS type FROM bookings WHERE $timeCondition ORDER BY created_at DESC LIMIT 8"
)->fetchAll();

$recentLeads = $pdo->query(
    "SELECT id, name, total, created_at, 'lead' AS type FROM estimator_leads WHERE $timeCondition ORDER BY created_at DESC LIMIT 8"
)->fetchAll();

$recentActivity = array_merge($recentBookings, $recentLeads);
usort($recentActivity, fn($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));
$recentActivity = array_slice($recentActivity, 0, 10);

// 4. Send Response
json_success([
    'cards' => [
        'total_bookings'            => $totalBookings,
        'new_bookings'              => $newBookings,
        'estimator_uses'            => $estimatorUses,
        'average_estimate'          => round($avgEstimate, 2),
        'estimator_to_booking_rate' => $conversionRate,
    ],
    'recent_activity' => $recentActivity,
    'chart_data'      => $chartData
]);