<?php
/**
 * GET /api/bookings/details.php?id=1
 * Admin only. Full booking record including add-on line items.
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
$id = (int) ($_GET['id'] ?? 0);
if (!$id) json_error('Missing booking id.', 422);

$pdo = Database::connect();

$stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id');
$stmt->execute(['id' => $id]);
$booking = $stmt->fetch();
if (!$booking) json_error('Booking not found.', 404);

$addons = $pdo->prepare('SELECT label, price FROM booking_addons WHERE booking_id = :id');
$addons->execute(['id' => $id]);
$booking['addons'] = $addons->fetchAll();

if ($booking['estimate_breakdown']) {
    $booking['estimate_breakdown'] = json_decode($booking['estimate_breakdown'], true);
}

json_success($booking);
