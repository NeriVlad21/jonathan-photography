<?php
/**
 * Public recovery endpoint for an interrupted booking response. The random
 * token exposes only whether the request was saved and its public reference.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed.', 405);
}

$token = trim((string) ($_GET['token'] ?? ''));
if (!preg_match('/^(?:[a-f0-9]{32,64}|[a-f0-9-]{36})$/i', $token)) {
    json_error('Invalid request token.', 422);
}

$pdo = Database::connect();
$stmt = $pdo->prepare(
    'SELECT id, reference_code FROM bookings WHERE submission_token = :token LIMIT 1'
);
$stmt->execute(['token' => $token]);
$booking = $stmt->fetch(PDO::FETCH_ASSOC);

json_success($booking ? [
    'saved' => true,
    'id' => (int) $booking['id'],
    'reference' => $booking['reference_code'],
] : ['saved' => false]);
