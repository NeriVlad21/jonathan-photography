<?php
/**
 * GET /api/dashboard/stats.php
 * Admin only. Overview cards + recent activity feed.
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

$totalBookings = (int) $pdo->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
$newBookings = (int) $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'NEW'")->fetchColumn();
$estimatorUses = (int) $pdo->query('SELECT COUNT(*) FROM estimator_leads')->fetchColumn();
$avgEstimate = (float) $pdo->query('SELECT COALESCE(AVG(total),0) FROM estimator_leads')->fetchColumn();

$bookedLeads = (int) $pdo->query(
    'SELECT COUNT(*) FROM estimator_leads l WHERE EXISTS (SELECT 1 FROM bookings b WHERE b.email = l.email)'
)->fetchColumn();
$conversionRate = $estimatorUses > 0 ? round(($bookedLeads / $estimatorUses) * 100, 1) : 0.0;

$recentBookings = $pdo->query(
    "SELECT id, name, shoot_type, status, created_at, 'booking' AS type FROM bookings ORDER BY created_at DESC LIMIT 8"
)->fetchAll();

$recentLeads = $pdo->query(
    "SELECT id, name, total, created_at, 'lead' AS type FROM estimator_leads ORDER BY created_at DESC LIMIT 8"
)->fetchAll();

$recentActivity = array_merge($recentBookings, $recentLeads);
usort($recentActivity, fn($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));
$recentActivity = array_slice($recentActivity, 0, 10);

json_success([
    'cards' => [
        'total_bookings'         => $totalBookings,
        'new_bookings'           => $newBookings,
        'estimator_uses'         => $estimatorUses,
        'average_estimate'       => round($avgEstimate, 2),
        'estimator_to_booking_rate' => $conversionRate,
    ],
    'recent_activity' => $recentActivity,
]);
