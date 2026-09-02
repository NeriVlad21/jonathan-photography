<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$input = json_input();

$allowedStatuses = [
    'NEW',
    'CONTACTED',
    'CONFIRMED',
    'DECLINED'
];

$v = new Validator($input);
$v->required('id')->required('status')->inList('status', $allowedStatuses);

if ($v->fails()) {
    json_error('Please choose a valid status.', 422, $v->errors());
}

$bookingId = (int) $input['id'];
$newStatus = strtoupper(trim((string) $input['status']));

$pdo = Database::connect();

try {

    // Check that booking exists
    $check = $pdo->prepare(
        'SELECT id FROM bookings WHERE id = :id LIMIT 1'
    );

    $check->execute([
        'id' => $bookingId
    ]);

    if (!$check->fetch(PDO::FETCH_ASSOC)) {
        json_error('Booking not found.', 404);
    }

    // Update status directly
    $stmt = $pdo->prepare(
        'UPDATE bookings
         SET status = :status
         WHERE id = :id'
    );

    $stmt->execute([
        'status' => $newStatus,
        'id' => $bookingId
    ]);

    // Return updated record
    $result = $pdo->prepare(
        'SELECT id, status
         FROM bookings
         WHERE id = :id
         LIMIT 1'
    );

    $result->execute([
        'id' => $bookingId
    ]);

    $booking = $result->fetch(PDO::FETCH_ASSOC);

    $pdo = null;

    json_success([
        'id' => (int) $booking['id'],
        'status' => $booking['status'],
        'message' => 'Booking status updated successfully.'
    ]);

} catch (Throwable $e) {

    $pdo = null;

    json_error(
        'Unable to update booking status.',
        500,
        [
            'error' => $e->getMessage()
        ]
    );
}